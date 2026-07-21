import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { BridgeRequestError } from "../errors.js";
import { clone, requireNonNegativeInteger } from "./utils.js";

const RENDER_SCOPES = new Set(["master", "selected_tracks", "all_tracks", "stems"]);
const SAMPLE_RATES = new Set([44100, 48000, 88200, 96000, 192000]);
const BIT_DEPTHS = new Set([16, 24, 32]);
const REMOTE_SCRIPT_RENDER_LIMITATION = {
  supported: false,
  statusCode: 501,
  reason: "Ableton Remote Script render/export is disabled until a safe cross-version Live export API is confirmed."
};

export async function exportDevelopmentRender(state, payload = {}) {
  const request = validateRenderPayload(payload);
  const target = resolveRenderTarget(state, request);
  const startBeat = payload.startBeat ?? 0;
  const lengthBeats = payload.lengthBeats ?? 4;
  if (!Number.isFinite(startBeat) || startBeat < 0) {
    throw new BridgeRequestError("startBeat must be a non-negative number");
  }
  if (!Number.isFinite(lengthBeats) || lengthBeats <= 0) {
    throw new BridgeRequestError("lengthBeats must be a positive number");
  }

  const seconds = beatsToSeconds(lengthBeats, state.tempo);
  if (request.scope === "stems") {
    await mkdir(request.outputPath, { recursive: true });
    const files = [];
    for (const renderTarget of target.targets) {
      const path = join(request.outputPath, stemFileName(renderTarget, files.length));
      await writeFile(path, silentWav(request.sampleRate, request.bitDepth, seconds));
      files.push({ path, ...renderTarget });
    }
    return renderResult(request, target, startBeat, lengthBeats, seconds, files);
  }

  if (!request.outputPath.toLowerCase().endsWith(".wav")) {
    throw new BridgeRequestError("outputPath must end with .wav for non-stem development renders");
  }
  await mkdir(dirname(request.outputPath), { recursive: true });
  await writeFile(request.outputPath, silentWav(request.sampleRate, request.bitDepth, seconds));
  return renderResult(request, target, startBeat, lengthBeats, seconds, [{ path: request.outputPath, scope: request.scope }]);
}

function validateRenderPayload(payload) {
  if (typeof payload.outputPath !== "string" || payload.outputPath.trim() === "") {
    throw new BridgeRequestError("outputPath must be a non-empty absolute path");
  }
  const outputPath = payload.outputPath.trim();
  if (!isAbsolute(outputPath)) {
    throw new BridgeRequestError("outputPath must be an absolute path");
  }
  if (!RENDER_SCOPES.has(payload.scope)) {
    throw new BridgeRequestError("scope must be master, selected_tracks, all_tracks, or stems");
  }
  const sampleRate = payload.sampleRate ?? 48000;
  if (!SAMPLE_RATES.has(sampleRate)) {
    throw new BridgeRequestError("sampleRate must be one of 44100, 48000, 88200, 96000, or 192000");
  }
  const bitDepth = payload.bitDepth ?? 24;
  if (!BIT_DEPTHS.has(bitDepth)) {
    throw new BridgeRequestError("bitDepth must be one of 16, 24, or 32");
  }
  const trackIndices = payload.trackIndices === undefined
    ? undefined
    : validateTrackIndices(payload.trackIndices);
  return {
    outputPath,
    scope: payload.scope,
    sampleRate,
    bitDepth,
    normalize: payload.normalize === true,
    includeReturnTracks: payload.includeReturnTracks === true,
    trackIndices
  };
}

function validateTrackIndices(trackIndices) {
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
    return trackIndex;
  });
}

function resolveRenderTarget(state, request) {
  if (request.scope === "master") {
    return {
      artifact: "single_wav",
      selectionSource: "master_output",
      targets: [{ targetType: "master", name: state.master?.name ?? "Master" }]
    };
  }

  if (request.scope === "selected_tracks") {
    const trackIndices = request.trackIndices ?? state.selectedTrackIndices;
    if (!Array.isArray(trackIndices) || trackIndices.length === 0) {
      throw new BridgeRequestError("selected_tracks render requires trackIndices[] or selected tracks in bridge state");
    }
    return {
      artifact: "single_wav",
      selectionSource: request.trackIndices ? "payload.trackIndices" : "bridge.selectedTrackIndices",
      targets: trackIndices.map((trackIndex) => trackTarget(state, trackIndex))
    };
  }

  if (request.scope === "all_tracks") {
    return {
      artifact: "single_wav",
      selectionSource: request.includeReturnTracks ? "all_tracks_and_returns" : "all_tracks",
      targets: trackTargets(state, state.tracks.map((track) => track.index), request.includeReturnTracks)
    };
  }

  const stemTrackIndices = request.trackIndices ?? state.tracks.map((track) => track.index);
  return {
    artifact: "stem_wavs",
    selectionSource: request.trackIndices ? "payload.trackIndices" : "all_tracks",
    targets: trackTargets(state, stemTrackIndices, request.includeReturnTracks)
  };
}

function trackTargets(state, trackIndices, includeReturnTracks) {
  const targets = trackIndices.map((trackIndex) => trackTarget(state, trackIndex));
  if (includeReturnTracks) {
    targets.push(...state.returns.map((track) => ({
      targetType: "return",
      returnIndex: track.index,
      name: track.name,
      type: track.type ?? "return"
    })));
  }
  return targets;
}

function trackTarget(state, trackIndex) {
  const track = state.tracks[trackIndex];
  if (!track) {
    throw new BridgeRequestError("trackIndices[] is outside the available track range", 404);
  }
  return {
    targetType: "track",
    trackIndex,
    name: track.name,
    type: track.type ?? "track"
  };
}

function renderResult(request, target, startBeat, lengthBeats, durationSeconds, files) {
  return {
    ok: true,
    rendered: true,
    mode: "deterministic-development-render",
    request: clone(request),
    contract: {
      product: "render-export",
      scope: request.scope,
      artifact: target.artifact,
      selectionSource: target.selectionSource,
      developmentBridge: {
        supported: true,
        behavior: "writes deterministic silent WAV artifacts for local tests and downstream audio analysis"
      },
      remoteScript: REMOTE_SCRIPT_RENDER_LIMITATION
    },
    targets: clone(target.targets),
    range: {
      startBeat,
      lengthBeats,
      durationSeconds
    },
    files
  };
}

function beatsToSeconds(beats, tempo) {
  return Math.max(0.001, Math.round(((beats * 60) / tempo) * 1000) / 1000);
}

function silentWav(sampleRate, bitDepth, seconds) {
  const bytesPerSample = bitDepth / 8;
  const sampleCount = Math.max(1, Math.ceil(sampleRate * seconds));
  const dataSize = sampleCount * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

function safeFileName(value) {
  const name = String(value).trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return name || "track";
}

function stemFileName(target, index) {
  const prefix = String(index + 1).padStart(2, "0");
  const targetName = target.targetType === "return"
    ? `return-${target.returnIndex}-${target.name}`
    : `track-${target.trackIndex}-${target.name}`;
  return `${prefix}-${safeFileName(targetName)}.wav`;
}
