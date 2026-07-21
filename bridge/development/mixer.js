import { BridgeRequestError } from "../errors.js";
import { isNumberInRange, isValidDb, requireBoolean } from "./utils.js";

export function getTrack(state, trackIndex) {
  const track = state.tracks[trackIndex];
  if (!track) {
    throw new BridgeRequestError("trackIndex is outside the available track range", 404);
  }
  return track;
}

export function getReturnTrack(state, returnIndex) {
  const returnTrack = state.returns[returnIndex];
  if (!returnTrack) {
    throw new BridgeRequestError("returnIndex is outside the available return track range", 404);
  }
  return returnTrack;
}

export function applyTrackPatch(track, payload, returns) {
  const applied = {};
  if (typeof payload.name === "string" && payload.name.trim()) {
    track.name = payload.name.trim();
    applied.name = track.name;
  }
  if (typeof payload.color === "string" && payload.color.trim()) {
    track.color = payload.color.trim();
    applied.color = track.color;
  }
  applyMixerPatch(track, payload, applied);
  if (payload.armed !== undefined) {
    track.armed = requireBoolean(payload.armed, "armed");
    applied.armed = track.armed;
  }
  if (payload.sends !== undefined) {
    if (typeof payload.sends !== "object" || payload.sends === null || Array.isArray(payload.sends)) {
      throw new BridgeRequestError("sends must be an object");
    }
    track.sends = track.sends ?? {};
    applied.sends = {};
    for (const [sendName, sendValue] of Object.entries(payload.sends)) {
      const returnTrack = returns.find((candidate) => candidate.name === sendName || String(candidate.index) === sendName);
      if (!returnTrack) {
        throw new BridgeRequestError(`Unknown return send: ${sendName}`, 404);
      }
      if (!isValidDb(sendValue)) {
        throw new BridgeRequestError(`sends.${sendName} must be a number between -70 and 12`);
      }
      track.sends[returnTrack.name] = sendValue;
      applied.sends[returnTrack.name] = sendValue;
    }
  }
  if (typeof payload.inputRouting === "string" && payload.inputRouting.trim()) {
    track.inputRouting = payload.inputRouting.trim();
    applied.inputRouting = track.inputRouting;
  }
  if (typeof payload.outputRouting === "string" && payload.outputRouting.trim()) {
    track.outputRouting = payload.outputRouting.trim();
    applied.outputRouting = track.outputRouting;
  }
  return applied;
}

export function applyReturnPatch(returnTrack, payload) {
  const applied = {};
  if (typeof payload.name === "string" && payload.name.trim()) {
    returnTrack.name = payload.name.trim();
    applied.name = returnTrack.name;
  }
  applyMixerPatch(returnTrack, payload, applied);
  return applied;
}

export function applyMasterPatch(master, payload) {
  const applied = {};
  const warnings = [];
  if (payload.volumeDb !== undefined) {
    if (!isValidDb(payload.volumeDb)) {
      throw new BridgeRequestError("volumeDb must be a number between -70 and 12");
    }
    master.volumeDb = payload.volumeDb;
    applied.volumeDb = payload.volumeDb;
  }
  if (payload.pan !== undefined) {
    if (!isNumberInRange(payload.pan, -1, 1)) {
      throw new BridgeRequestError("pan must be a number between -1 and 1");
    }
    master.pan = payload.pan;
    applied.pan = payload.pan;
  }
  if (payload.cueVolumeDb !== undefined) {
    if (!isValidDb(payload.cueVolumeDb)) {
      throw new BridgeRequestError("cueVolumeDb must be a number between -70 and 12");
    }
    master.cueVolumeDb = payload.cueVolumeDb;
    applied.cueVolumeDb = payload.cueVolumeDb;
  }
  if (payload.muted !== undefined) {
    requireBoolean(payload.muted, "muted");
    warnings.push("Master mute is not supported by the development adapter");
  }
  if (payload.solo !== undefined) {
    requireBoolean(payload.solo, "solo");
    warnings.push("Master solo is not supported by the development adapter");
  }
  return { applied, warnings };
}

function applyMixerPatch(target, payload, applied) {
  if (payload.volumeDb !== undefined) {
    if (!isValidDb(payload.volumeDb)) {
      throw new BridgeRequestError("volumeDb must be a number between -70 and 12");
    }
    target.volumeDb = payload.volumeDb;
    applied.volumeDb = payload.volumeDb;
  }
  if (payload.pan !== undefined) {
    if (!isNumberInRange(payload.pan, -1, 1)) {
      throw new BridgeRequestError("pan must be a number between -1 and 1");
    }
    target.pan = payload.pan;
    applied.pan = payload.pan;
  }
  if (payload.muted !== undefined) {
    target.muted = requireBoolean(payload.muted, "muted");
    applied.muted = target.muted;
  }
  if (payload.solo !== undefined) {
    target.solo = requireBoolean(payload.solo, "solo");
    applied.solo = target.solo;
  }
}
