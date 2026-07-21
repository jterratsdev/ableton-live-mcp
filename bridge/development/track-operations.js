import { BridgeRequestError } from "../errors.js";
import { getTrack } from "./mixer.js";
import { clone, isFiniteNumber, nextClipSlot, requireNonNegativeInteger, reindexDevices } from "./utils.js";

export function createMidiTrack(state, payload = {}) {
  const index = state.tracks.length;
  const track = {
    index,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name : `MIDI ${index + 1}`,
    type: "midi",
    volumeDb: 0,
    pan: 0,
    muted: false,
    solo: false,
    armed: false,
    sends: Object.fromEntries(state.returns.map((returnTrack) => [returnTrack.name, 0])),
    inputRouting: "All Ins",
    outputRouting: "Master",
    devices: [],
    clips: []
  };
  state.tracks.push(track);
  return { ok: true, track: clone(track) };
}

export function duplicateTrack(state, payload = {}) {
  const sourceTrackIndex = requireNonNegativeInteger(payload.trackIndex, "trackIndex");
  const source = getTrack(state, sourceTrackIndex);
  const newTrackIndex = sourceTrackIndex + 1;
  const track = clone(source);
  track.index = newTrackIndex;
  track.name = validateOptionalName(payload.name) ?? `${source.name} Copy`;
  track.devices = clone(track.devices ?? []);
  track.clips = clone(track.clips ?? []);
  track.sends = clone(track.sends ?? {});
  reindexDevices(track.devices);

  state.tracks.splice(newTrackIndex, 0, track);
  reindexTracks(state.tracks);

  return {
    ok: true,
    duplicated: true,
    sourceTrackIndex,
    newTrackIndex,
    track: clone(state.tracks[newTrackIndex])
  };
}

export function consolidateClip(state, payload = {}) {
  const trackIndex = requireNonNegativeInteger(payload.trackIndex, "trackIndex");
  const track = getTrack(state, trackIndex);
  const startBeat = requireNumber(payload.startBeat, "startBeat", { minimum: 0 });
  const lengthBeats = requireNumber(payload.lengthBeats, "lengthBeats", { exclusiveMinimum: 0 });
  const targetSlot = payload.clipSlotIndex === undefined || payload.clipSlotIndex === null
    ? nextClipSlot(track)
    : requireNonNegativeInteger(payload.clipSlotIndex, "clipSlotIndex");
  const endBeat = startBeat + lengthBeats;
  const sourceClips = (track.clips ?? []).filter((clip) => {
    const clipStart = clipStartBeat(clip);
    const clipEnd = clipStart + (clip.lengthBeats ?? 0);
    return clipEnd > startBeat && clipStart < endBeat;
  });

  const range = { startBeat, lengthBeats, endBeat };
  if (sourceClips.length === 0) {
    return {
      ok: true,
      consolidated: false,
      reason: "No clips overlap the requested range",
      range,
      clip: null,
      track: { index: track.index, name: track.name }
    };
  }

  const notes = [];
  for (const clip of sourceClips) {
    const clipStart = clipStartBeat(clip);
    for (const note of clip.notes ?? []) {
      const absoluteStart = clipStart + note.start;
      if (absoluteStart >= startBeat && absoluteStart < endBeat) {
        notes.push({
          ...clone(note),
          start: roundBeat(absoluteStart - startBeat)
        });
      }
    }
  }
  notes.sort((a, b) => a.start - b.start || a.pitch - b.pitch);

  const clip = {
    slot: targetSlot,
    name: validateOptionalName(payload.name) ?? `Consolidated ${startBeat}-${endBeat}`,
    lengthBeats,
    consolidated: true,
    sourceRange: range,
    sourceClipSlots: sourceClips.map((sourceClip) => sourceClip.slot),
    noteCount: notes.length
  };
  if (notes.length > 0 || track.type === "midi") {
    clip.notes = notes;
  }

  const existingIndex = track.clips.findIndex((candidate) => candidate.slot === targetSlot);
  if (existingIndex >= 0) {
    track.clips[existingIndex] = clip;
  } else {
    track.clips.push(clip);
  }
  track.clips.sort((a, b) => a.slot - b.slot);

  return {
    ok: true,
    consolidated: true,
    range,
    sourceClipSlots: clip.sourceClipSlots,
    clip: clone(clip),
    track: { index: track.index, name: track.name }
  };
}

export function freezeTrack(state, payload = {}) {
  const trackIndex = requireNonNegativeInteger(payload.trackIndex, "trackIndex");
  const track = getTrack(state, trackIndex);
  track.frozen = true;
  track.freezeMode = "deterministic-development-freeze";
  return {
    ok: true,
    frozen: true,
    flattened: Boolean(track.flattened),
    track: clone(track)
  };
}

export function flattenTrack(state, payload = {}) {
  const trackIndex = requireNonNegativeInteger(payload.trackIndex, "trackIndex");
  const track = getTrack(state, trackIndex);
  track.frozen = true;
  track.flattened = true;
  track.type = "audio";
  track.devices = [];
  track.flattenMode = "deterministic-development-flatten";
  return {
    ok: true,
    frozen: true,
    flattened: true,
    audio: true,
    track: clone(track)
  };
}

function reindexTracks(tracks) {
  tracks.forEach((track, index) => {
    track.index = index;
  });
}

function validateOptionalName(name) {
  if (name === undefined || name === null) {
    return null;
  }
  if (typeof name !== "string" || name.trim() === "") {
    throw new BridgeRequestError("name must be a non-empty string when provided");
  }
  return name.trim();
}

function requireNumber(value, name, options) {
  if (!isFiniteNumber(value)) {
    throw new BridgeRequestError(`${name} must be a finite number`);
  }
  if (options.minimum !== undefined && value < options.minimum) {
    throw new BridgeRequestError(`${name} must be at least ${options.minimum}`);
  }
  if (options.exclusiveMinimum !== undefined && value <= options.exclusiveMinimum) {
    throw new BridgeRequestError(`${name} must be greater than ${options.exclusiveMinimum}`);
  }
  return value;
}

function clipStartBeat(clip) {
  return isFiniteNumber(clip.startBeat) ? clip.startBeat : 0;
}

function roundBeat(value) {
  return Math.round(value * 1000000) / 1000000;
}
