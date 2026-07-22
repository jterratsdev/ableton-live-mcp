import { BridgeRequestError } from "../errors.js";
import { validateClipTargetPayload, validateMidiClipPayload, validateMidiImportPayload } from "../midi-payload.js";
import { getTrack } from "./mixer.js";
import { clone, coerceClipTargetPayload, midiClipName, nextClipSlot } from "./utils.js";

export function createMidiClip(state, payload = {}) {
  validateMidiClipPayload(payload);

  const track = getTrack(state, payload.trackIndex);
  if (track.type !== "midi") {
    throw new BridgeRequestError("trackIndex must point to a MIDI track");
  }

  const clip = {
    slot: payload.clipSlotIndex,
    name: payload.name ?? `MIDI Clip ${payload.clipSlotIndex + 1}`,
    lengthBeats: payload.lengthBeats,
    noteCount: payload.notes.length,
    notes: clone(payload.notes)
  };
  upsertClip(track, clip);

  return { ok: true, clip: clone(clip), track: { index: track.index, name: track.name } };
}

export function deleteClip(state, payload = {}) {
  validateClipTargetPayload(payload);

  const track = getTrack(state, payload.trackIndex);
  const existingIndex = track.clips.findIndex((candidate) => candidate.slot === payload.clipSlotIndex);
  if (existingIndex < 0) {
    return {
      ok: true,
      deleted: false,
      clip: { slot: payload.clipSlotIndex },
      track: { index: track.index, name: track.name }
    };
  }

  const [deletedClip] = track.clips.splice(existingIndex, 1);
  return {
    ok: true,
    deleted: true,
    clip: {
      slot: deletedClip.slot,
      name: deletedClip.name ?? "",
      lengthBeats: deletedClip.lengthBeats
    },
    track: { index: track.index, name: track.name }
  };
}

export function getClipNotes(state, payload = {}) {
  const target = coerceClipTargetPayload(payload);
  validateClipTargetPayload(target);

  const track = getTrack(state, target.trackIndex);
  const clip = track.clips.find((candidate) => candidate.slot === target.clipSlotIndex);
  if (!clip) {
    throw new BridgeRequestError("clipSlotIndex does not contain a clip", 404);
  }

  return {
    ok: true,
    clip: {
      slot: clip.slot,
      name: clip.name ?? "",
      lengthBeats: clip.lengthBeats,
      noteCount: clip.notes?.length ?? clip.noteCount ?? 0
    },
    track: { index: track.index, name: track.name },
    notes: clone(clip.notes ?? [])
  };
}

export function launchClip(state, payload = {}) {
  validateClipTargetPayload(payload);
  const track = getTrack(state, payload.trackIndex);
  const clip = track.clips.find((candidate) => candidate.slot === payload.clipSlotIndex);
  if (!clip) {
    throw new BridgeRequestError("clipSlotIndex does not contain a clip", 404);
  }
  for (const candidate of track.clips) {
    candidate.isPlaying = false;
    candidate.isTriggered = false;
  }
  clip.isPlaying = true;
  state.playing = true;
  track.meter = { level: 0.5, left: 0.45, right: 0.46 };
  state.master.meter = { level: 0.5, left: 0.45, right: 0.46 };
  return {
    ok: true,
    launched: true,
    clip: { slot: clip.slot, name: clip.name ?? "", lengthBeats: clip.lengthBeats ?? null },
    track: { index: track.index, name: track.name }
  };
}

export function launchScene(state, payload = {}) {
  const sceneIndex = Number.parseInt(String(payload.sceneIndex), 10);
  if (!Number.isInteger(sceneIndex) || sceneIndex < 0) {
    throw new BridgeRequestError("sceneIndex must be a non-negative integer");
  }
  const launched = [];
  for (const track of state.tracks) {
    const clip = track.clips.find((candidate) => candidate.slot === sceneIndex);
    if (!clip) {
      continue;
    }
    for (const candidate of track.clips) {
      candidate.isPlaying = false;
      candidate.isTriggered = false;
    }
    clip.isPlaying = true;
    track.meter = { level: 0.5, left: 0.45, right: 0.46 };
    launched.push({ trackIndex: track.index, trackName: track.name, clipSlotIndex: clip.slot, name: clip.name ?? "" });
  }
  if (launched.length === 0) {
    throw new BridgeRequestError("sceneIndex does not contain any clips", 404);
  }
  state.playing = true;
  state.master.meter = { level: 0.5, left: 0.45, right: 0.46 };
  return { ok: true, launched: true, sceneIndex, clips: launched };
}

export function importMidiFile(state, payload = {}) {
  validateMidiImportPayload(payload);

  const imported = {
    path: payload.path,
    trackIndex: payload.trackIndex,
    clipSlotIndex: payload.clipSlotIndex,
    createTracks: payload.createTracks ?? false,
    quantize: payload.quantize,
    mode: "deterministic-development-import"
  };
  state.importedMidi.push(imported);

  if (Number.isInteger(payload.trackIndex)) {
    const track = getTrack(state, payload.trackIndex);
    if (track.type !== "midi") {
      throw new BridgeRequestError("trackIndex must point to a MIDI track");
    }
    const slot = payload.clipSlotIndex ?? nextClipSlot(track);
    const clip = {
      slot,
      name: midiClipName(payload.path),
      lengthBeats: 0,
      noteCount: 0,
      sourcePath: payload.path,
      imported: true
    };
    upsertClip(track, clip);
    imported.clip = { trackIndex: payload.trackIndex, clipSlotIndex: slot, name: clip.name };
  }

  return { ok: true, imported };
}

function upsertClip(track, clip) {
  const existingIndex = track.clips.findIndex((candidate) => candidate.slot === clip.slot);
  if (existingIndex >= 0) {
    track.clips[existingIndex] = clip;
  } else {
    track.clips.push(clip);
  }
  track.clips.sort((a, b) => a.slot - b.slot);
}
