import { BridgeRequestError } from "../errors.js";
import { validateClipTargetPayload } from "../midi-payload.js";
import { clone, isFiniteNumber } from "./utils.js";
import { getTrack } from "./mixer.js";

const MAX_HUMANIZE_TIMING_BEATS = 0.25;
const MAX_HUMANIZE_DURATION_BEATS = 0.5;
const MAX_HUMANIZE_VELOCITY = 64;
const MIN_DURATION_BEATS = 0.01;
const EPSILON = 0.000001;

export function humanizeClipNotes(state, payload = {}) {
  const { track, clip } = editableMidiClip(state, payload);
  const options = validateHumanizePayload(payload);
  const rng = seededRandom(options.seed);
  const originalNotes = clone(clip.notes);

  clip.notes = clip.notes.map((note) => {
    const timingOffset = randomSigned(rng) * options.timingAmountBeats;
    const durationOffset = randomSigned(rng) * options.durationAmountBeats;
    const velocityOffset = Math.round(randomSigned(rng) * options.velocityAmount);
    return boundedNote({
      ...note,
      start: roundBeat(note.start + timingOffset),
      duration: roundBeat(note.duration + durationOffset),
      velocity: Math.round((note.velocity ?? 100) + velocityOffset)
    }, clip.lengthBeats);
  });
  clip.noteCount = clip.notes.length;

  return rewriteResult("humanize", track, clip, originalNotes, clip.notes, {
    seed: options.seed,
    timingAmountBeats: options.timingAmountBeats,
    durationAmountBeats: options.durationAmountBeats,
    velocityAmount: options.velocityAmount
  });
}

export function quantizeClipNotes(state, payload = {}) {
  const { track, clip } = editableMidiClip(state, payload);
  const options = validateQuantizePayload(payload);
  const originalNotes = clone(clip.notes);

  clip.notes = clip.notes.map((note) => {
    const targetStart = Math.round(note.start / options.gridBeats) * options.gridBeats;
    const start = note.start + ((targetStart - note.start) * options.strength);
    return boundedNote({ ...note, start: roundBeat(start) }, clip.lengthBeats);
  });
  clip.noteCount = clip.notes.length;

  return rewriteResult("quantize", track, clip, originalNotes, clip.notes, {
    grid: options.grid,
    gridBeats: options.gridBeats,
    strength: options.strength
  });
}

export function applyGrooveToClipNotes(state, payload = {}) {
  const { track, clip } = editableMidiClip(state, payload);
  const options = validateGroovePayload(payload);
  const originalNotes = clone(clip.notes);

  clip.notes = clip.notes.map((note) => {
    const subdivision = Math.floor((note.start / options.gridBeats) + EPSILON);
    if (subdivision % 2 === 0) {
      return boundedNote({ ...note }, clip.lengthBeats);
    }
    const delay = options.gridBeats * options.swing * options.amount;
    return boundedNote({ ...note, start: roundBeat(note.start + delay) }, clip.lengthBeats);
  });
  clip.noteCount = clip.notes.length;

  return rewriteResult("groove", track, clip, originalNotes, clip.notes, {
    grid: options.grid,
    gridBeats: options.gridBeats,
    amount: options.amount,
    swing: options.swing
  });
}

function editableMidiClip(state, payload) {
  validateClipTargetPayload(payload);
  const track = getTrack(state, payload.trackIndex);
  if (track.type !== "midi") {
    throw new BridgeRequestError("trackIndex must point to a MIDI track");
  }
  const clip = track.clips.find((candidate) => candidate.slot === payload.clipSlotIndex);
  if (!clip) {
    throw new BridgeRequestError("clipSlotIndex does not contain a clip", 404);
  }
  if (!Array.isArray(clip.notes)) {
    throw new BridgeRequestError("clip does not expose editable MIDI notes", 501);
  }
  return { track, clip };
}

function validateHumanizePayload(payload) {
  const timingAmountBeats = optionalNumberInRange(payload.timingAmountBeats, "timingAmountBeats", 0, MAX_HUMANIZE_TIMING_BEATS, 0);
  const durationAmountBeats = optionalNumberInRange(payload.durationAmountBeats, "durationAmountBeats", 0, MAX_HUMANIZE_DURATION_BEATS, 0);
  const velocityAmount = optionalIntegerInRange(payload.velocityAmount, "velocityAmount", 0, MAX_HUMANIZE_VELOCITY, 0);
  const seed = payload.seed === undefined || payload.seed === null ? "ableton-mcp" : String(payload.seed);
  if (seed.trim() === "") {
    throw new BridgeRequestError("seed must not be blank when provided");
  }
  return { timingAmountBeats, durationAmountBeats, velocityAmount, seed };
}

function validateQuantizePayload(payload) {
  const grid = payload.grid ?? "1/16";
  return {
    grid,
    gridBeats: parseGridBeats(grid),
    strength: optionalNumberInRange(payload.strength, "strength", 0, 1, 1)
  };
}

function validateGroovePayload(payload) {
  const grid = payload.grid ?? "1/16";
  return {
    grid,
    gridBeats: parseGridBeats(grid),
    amount: optionalNumberInRange(payload.amount, "amount", 0, 1, 1),
    swing: optionalNumberInRange(payload.swing, "swing", 0, 1, 0.5)
  };
}

function parseGridBeats(grid) {
  if (typeof grid !== "string") {
    throw new BridgeRequestError("grid must be one of 1/4, 1/8, 1/16, 1/32, or 1/64");
  }
  const match = /^1\/(4|8|16|32|64)$/.exec(grid.trim());
  if (!match) {
    throw new BridgeRequestError("grid must be one of 1/4, 1/8, 1/16, 1/32, or 1/64");
  }
  return 4 / Number.parseInt(match[1], 10);
}

function optionalNumberInRange(value, name, min, max, defaultValue) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (!isFiniteNumber(value) || value < min || value > max) {
    throw new BridgeRequestError(`${name} must be a number between ${min} and ${max}`);
  }
  return value;
}

function optionalIntegerInRange(value, name, min, max, defaultValue) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new BridgeRequestError(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function rewriteResult(operation, track, clip, before, after, parameters) {
  const changedNoteCount = before.filter((note, index) => !notesEqual(note, after[index])).length;
  return {
    ok: true,
    operation,
    changedNoteCount,
    clip: {
      slot: clip.slot,
      name: clip.name ?? "",
      lengthBeats: clip.lengthBeats,
      noteCount: clip.notes.length
    },
    track: { index: track.index, name: track.name },
    parameters,
    notes: clone(after)
  };
}

function boundedNote(note, lengthBeats) {
  const startMax = isFiniteNumber(lengthBeats) ? Math.max(0, lengthBeats - MIN_DURATION_BEATS) : Number.POSITIVE_INFINITY;
  const start = clamp(note.start, 0, startMax);
  const maxDuration = isFiniteNumber(lengthBeats) ? Math.max(MIN_DURATION_BEATS, lengthBeats - start) : Number.POSITIVE_INFINITY;
  return {
    ...note,
    start: roundBeat(start),
    duration: roundBeat(clamp(note.duration, MIN_DURATION_BEATS, maxDuration)),
    velocity: clamp(Math.round(note.velocity ?? 100), 1, 127)
  };
}

function randomSigned(rng) {
  return (rng() * 2) - 1;
}

function seededRandom(seed) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function notesEqual(left, right) {
  return left.pitch === right.pitch
    && Math.abs(left.start - right.start) < EPSILON
    && Math.abs(left.duration - right.duration) < EPSILON
    && (left.velocity ?? 100) === (right.velocity ?? 100)
    && Boolean(left.muted ?? left.mute ?? false) === Boolean(right.muted ?? right.mute ?? false);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundBeat(value) {
  return Math.round(value * 1000000) / 1000000;
}
