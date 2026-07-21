import { BridgeRequestError } from "../errors.js";
import { clone, isFiniteNumber, requireNonNegativeInteger } from "./utils.js";
import { getTrack } from "./mixer.js";

const DEFAULT_LENGTH_BEATS = 16;

export function arrangementSnapshot(state) {
  const clips = arrangementClips(state);
  const locators = sortedLocators(state.locators);
  const lengthBeats = arrangementLength(state, clips, locators);

  return {
    ok: true,
    lengthBeats,
    sections: arrangementSections(state, locators, lengthBeats),
    locators: clone(locators),
    clips: clone(clips)
  };
}

export function insertArrangementClip(state, payload = {}) {
  const trackIndex = requireNonNegativeInteger(payload.trackIndex, "trackIndex");
  const track = getTrack(state, trackIndex);
  const startBeat = requireNonNegativeNumber(payload.startBeat, "startBeat");
  const source = arrangementSource(track, payload);
  const lengthBeats = arrangementClipLength(payload, source);

  const clip = {
    id: `arr-${state.arrangement.clips.length + 1}`,
    trackIndex,
    trackName: track.name,
    startBeat,
    lengthBeats,
    endBeat: startBeat + lengthBeats,
    name: clipName(payload, source),
    source
  };

  if (payload.kind !== undefined) {
    clip.kind = validateKind(payload.kind);
  } else if (source.type === "sourcePath") {
    clip.kind = /\.wav$|\.aif$|\.aiff$|\.flac$|\.mp3$/i.test(source.path) ? "audio" : "midi";
  } else {
    clip.kind = track.type === "audio" ? "audio" : "midi";
  }

  state.arrangement.clips.push(clip);
  state.arrangement.clips.sort((a, b) => a.startBeat - b.startBeat || a.trackIndex - b.trackIndex);
  state.arrangement.lengthBeats = Math.max(state.arrangement.lengthBeats ?? 0, clip.endBeat);

  return {
    ok: true,
    inserted: true,
    clip: clone(clip),
    arrangement: arrangementSnapshot(state)
  };
}

export function addOrUpdateLocator(state, payload = {}) {
  const beat = requireNonNegativeNumber(payload.beat, "beat");
  const name = requireNonEmptyString(payload.name, "name");
  const locators = state.locators;
  const existingIndex = locators.findIndex((candidate) => candidate.name === name || candidate.beat === beat);
  const locator = { beat, name };

  if (existingIndex >= 0) {
    locators[existingIndex] = locator;
  } else {
    locators.push(locator);
  }
  locators.sort((a, b) => a.beat - b.beat || a.name.localeCompare(b.name));

  return {
    ok: true,
    locator: clone(locator),
    locators: clone(locators),
    arrangement: arrangementSnapshot(state)
  };
}

function arrangementClips(state) {
  return clone(state.arrangement?.clips ?? []).map((clip) => ({
    ...clip,
    endBeat: clip.endBeat ?? clip.startBeat + clip.lengthBeats
  }));
}

function arrangementLength(state, clips, locators) {
  const explicitLength = state.arrangement?.lengthBeats;
  const clipEnd = clips.reduce((max, clip) => Math.max(max, clip.endBeat ?? 0), 0);
  const locatorEnd = locators.reduce((max, locator) => Math.max(max, locator.beat ?? 0), 0);
  return Math.max(
    isFiniteNumber(explicitLength) ? explicitLength : 0,
    clipEnd,
    locatorEnd,
    DEFAULT_LENGTH_BEATS
  );
}

function arrangementSections(state, locators, lengthBeats) {
  if (Array.isArray(state.arrangement?.sections) && state.arrangement.sections.length > 0) {
    return clone(state.arrangement.sections);
  }

  return locators.map((locator, index) => {
    const next = locators[index + 1];
    const endBeat = next?.beat ?? lengthBeats;
    return {
      name: locator.name,
      startBeat: locator.beat,
      endBeat,
      lengthBeats: Math.max(0, endBeat - locator.beat)
    };
  });
}

function sortedLocators(locators) {
  return clone(locators ?? []).sort((a, b) => a.beat - b.beat || a.name.localeCompare(b.name));
}

function arrangementSource(track, payload) {
  const clipSlotIndex = payload.sourceClipSlotIndex ?? payload.clipSlotIndex;
  if (clipSlotIndex !== undefined) {
    const slot = requireNonNegativeInteger(clipSlotIndex, "clipSlotIndex");
    const clip = track.clips.find((candidate) => candidate.slot === slot);
    if (!clip) {
      throw new BridgeRequestError("clipSlotIndex does not contain a clip", 404);
    }
    return {
      type: "sessionClip",
      trackIndex: track.index,
      clipSlotIndex: slot,
      name: clip.name ?? "",
      lengthBeats: clip.lengthBeats
    };
  }

  if (payload.sourcePath !== undefined) {
    return { type: "sourcePath", path: requireNonEmptyString(payload.sourcePath, "sourcePath") };
  }

  if (payload.sourceRef !== undefined) {
    return { type: "sourceRef", ref: requireNonEmptyString(payload.sourceRef, "sourceRef") };
  }

  throw new BridgeRequestError("clipSlotIndex, sourcePath, or sourceRef is required");
}

function arrangementClipLength(payload, source) {
  if (payload.lengthBeats !== undefined) {
    return requirePositiveNumber(payload.lengthBeats, "lengthBeats");
  }
  if (isFiniteNumber(source.lengthBeats) && source.lengthBeats > 0) {
    return source.lengthBeats;
  }
  throw new BridgeRequestError("lengthBeats must be a number greater than 0");
}

function clipName(payload, source) {
  if (payload.name !== undefined) {
    return requireNonEmptyString(payload.name, "name");
  }
  return source.name ?? source.ref ?? source.path?.split(/[\\/]/).pop() ?? "Arrangement Clip";
}

function validateKind(kind) {
  if (!["audio", "midi", "clip"].includes(kind)) {
    throw new BridgeRequestError("kind must be audio, midi, or clip");
  }
  return kind;
}

function requireNonNegativeNumber(value, name) {
  if (!isFiniteNumber(value) || value < 0) {
    throw new BridgeRequestError(`${name} must be a number greater than or equal to 0`);
  }
  return value;
}

function requirePositiveNumber(value, name) {
  if (!isFiniteNumber(value) || value <= 0) {
    throw new BridgeRequestError(`${name} must be a number greater than 0`);
  }
  return value;
}

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BridgeRequestError(`${name} must be a non-empty string`);
  }
  return value.trim();
}
