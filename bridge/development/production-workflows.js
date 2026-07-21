import { join } from "node:path";
import { BridgeRequestError } from "../errors.js";
import { analyzeAudioFile } from "./audio-analysis.js";
import { arrangementSnapshot } from "./arrangement.js";
import { exportDevelopmentRender } from "./render.js";
import { clone, isValidLoudness, isValidTruePeak, requireNonNegativeInteger } from "./utils.js";
import { meterSnapshot } from "./metering.js";
import { matchesPlugin } from "./plugins.js";

export async function bounceTracks(state, payload = {}) {
  const scope = payload.scope ?? "stems";
  const trackIndices = validateTrackIndices(state, payload.trackIndices, scope);
  const outputPath = requireOutputPath(payload.outputPath);
  const render = await exportDevelopmentRender(state, {
    outputPath,
    scope,
    trackIndices: scope === "all_tracks" ? undefined : trackIndices,
    startBeat: payload.startBeat,
    lengthBeats: payload.lengthBeats,
    sampleRate: payload.sampleRate,
    bitDepth: payload.bitDepth,
    normalize: payload.normalize,
    includeReturnTracks: payload.includeReturnTracks
  });

  return {
    ok: true,
    bounced: true,
    mode: "deterministic-development-bounce",
    targetTracks: render.targets.filter((target) => target.targetType === "track"),
    render
  };
}

export function productionSessionReport(state) {
  const trackMeters = state.tracks.map((track) => ({ trackIndex: track.index, ...meterSnapshot(track, `tracks[${track.index}]`) }));
  const returnMeters = state.returns.map((track) => ({ returnIndex: track.index, ...meterSnapshot(track, `returns[${track.index}]`) }));
  const masterMeter = meterSnapshot(state.master, "master");
  const arrangement = arrangementSnapshot(state);
  const risks = [];
  if (state.master.devices.length === 0) {
    risks.push("Master chain has no devices loaded");
  }
  if (trackMeters.some((entry) => entry.warnings.length > 0) || masterMeter.warnings.length > 0) {
    risks.push("Some meter values are unavailable; production decisions may need a live playback pass");
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      tempo: state.tempo,
      timeSignature: state.timeSignature,
      trackCount: state.tracks.length,
      returnCount: state.returns.length,
      masterDeviceCount: state.master.devices.length,
      arrangementClipCount: arrangement.clips.length,
      locatorCount: state.locators.length
    },
    tracks: state.tracks.map((track) => ({
      index: track.index,
      name: track.name,
      type: track.type,
      volumeDb: track.volumeDb,
      pan: track.pan,
      muted: track.muted,
      solo: track.solo,
      armed: track.armed,
      outputRouting: track.outputRouting,
      sendCount: Object.keys(track.sends ?? {}).length,
      deviceCount: track.devices?.length ?? 0,
      clipCount: track.clips?.length ?? 0
    })),
    returns: clone(state.returns),
    master: clone(state.master),
    meters: {
      tracks: trackMeters,
      returns: returnMeters,
      master: masterMeter
    },
    arrangement,
    risks
  };
}

export async function analyzeAndApplyMastering(state, payload = {}) {
  const outputPath = requireOutputPath(payload.outputPath ?? join("/tmp", "ableton-mastering-analysis.wav"));
  if (!isValidLoudness(payload.targetLufs)) {
    throw new BridgeRequestError("targetLufs must be a number between -24 and -5");
  }
  if (!isValidTruePeak(payload.truePeakDb)) {
    throw new BridgeRequestError("truePeakDb must be a number between -6 and 0");
  }

  const render = await exportDevelopmentRender(state, {
    outputPath,
    scope: "master",
    startBeat: payload.startBeat,
    lengthBeats: payload.lengthBeats,
    sampleRate: payload.sampleRate,
    bitDepth: payload.bitDepth,
    normalize: false
  });
  const analysis = await analyzeAudioFile({ path: render.files[0].path });
  const adjustments = [];
  const warnings = [];
  const integrated = analysis.lufs;
  if (Number.isFinite(integrated)) {
    const gainDb = Math.max(-12, Math.min(12, payload.targetLufs - integrated));
    state.master.volumeDb = Math.max(-70, Math.min(12, (state.master.volumeDb ?? 0) + gainDb));
    adjustments.push({ target: "master.volumeDb", gainDb, resultingVolumeDb: state.master.volumeDb });
  } else {
    warnings.push("Integrated LUFS is not finite; skipped automatic master gain adjustment");
  }

  if (Array.isArray(payload.chain) && payload.chain.length > 0) {
    for (const step of payload.chain) {
      if (!step || typeof step.device !== "string" || step.device.trim() === "") {
        warnings.push("Skipped mastering step without device name");
        continue;
      }
      state.master.devices.push({
        index: state.master.devices.length,
        name: step.device.trim(),
        kind: "audio_effect",
        parameters: clone(step.settings ?? {})
      });
      adjustments.push({ target: "master.devices", loadedDevice: step.device.trim() });
    }
  }

  return {
    ok: true,
    mode: "deterministic-development-mastering-analysis",
    render,
    analysis,
    target: {
      lufs: payload.targetLufs,
      truePeakDb: payload.truePeakDb
    },
    adjustments,
    master: clone(state.master),
    warnings
  };
}

export function applyMasteringChain(state, payload = {}) {
  if (typeof payload.style !== "string" || payload.style.trim() === "") {
    throw new BridgeRequestError("style must be a non-empty string");
  }
  if (!isValidLoudness(payload.targetLufs)) {
    throw new BridgeRequestError("targetLufs must be a number between -24 and -5");
  }
  if (!isValidTruePeak(payload.truePeakDb)) {
    throw new BridgeRequestError("truePeakDb must be a number between -6 and 0");
  }

  const chain = Array.isArray(payload.chain) ? payload.chain : [];
  const loadedDevices = [];
  const warnings = [];
  for (const step of chain) {
    if (!step || typeof step.device !== "string" || step.device.trim() === "") {
      warnings.push("Skipped mastering step without device name");
      continue;
    }
    const plugin = state.plugins.find((candidate) => matchesPlugin(candidate, { kind: "audio_effect", query: step.device }));
    if (!plugin) {
      warnings.push(`No matching audio effect found for mastering device: ${step.device}`);
      continue;
    }
    const device = {
      index: state.master.devices.length,
      name: plugin.name,
      kind: plugin.kind,
      parameters: clone(step.settings ?? {})
    };
    state.master.devices.push(device);
    loadedDevices.push(clone(device));
  }
  if (loadedDevices.length === 0) {
    throw new BridgeRequestError(`No mastering devices were loaded. ${warnings.join("; ")}`.trim(), 404);
  }

  state.masteringChain = { ...clone(payload), loadedDevices };
  return {
    ok: true,
    mastering: clone(state.masteringChain),
    loadedDevices,
    warnings
  };
}

function validateTrackIndices(state, trackIndices, scope) {
  if (trackIndices === undefined) {
    if (scope === "selected_tracks") {
      throw new BridgeRequestError("trackIndices must include at least one track for selected_tracks bounce");
    }
    return state.tracks.map((track) => track.index);
  }
  if (!Array.isArray(trackIndices) || trackIndices.length === 0) {
    throw new BridgeRequestError("trackIndices must include at least one track index");
  }
  const seen = new Set();
  return trackIndices.map((value) => {
    const trackIndex = requireNonNegativeInteger(value, "trackIndices[]");
    if (seen.has(trackIndex)) {
      throw new BridgeRequestError("trackIndices[] contains a duplicate track index");
    }
    seen.add(trackIndex);
    if (!state.tracks[trackIndex]) {
      throw new BridgeRequestError("trackIndices[] is outside the available track range", 404);
    }
    return trackIndex;
  });
}

function requireOutputPath(outputPath) {
  if (typeof outputPath !== "string" || outputPath.trim() === "") {
    throw new BridgeRequestError("outputPath must be a non-empty absolute path");
  }
  return outputPath.trim();
}
