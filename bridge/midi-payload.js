import { BridgeRequestError } from "./errors.js";

export function validateMidiClipPayload(payload) {
  if (!Number.isInteger(payload.trackIndex) || payload.trackIndex < 0) {
    throw new BridgeRequestError("trackIndex must be a non-negative integer");
  }
  if (!Number.isInteger(payload.clipSlotIndex) || payload.clipSlotIndex < 0) {
    throw new BridgeRequestError("clipSlotIndex must be a non-negative integer");
  }
  if (typeof payload.lengthBeats !== "number" || !Number.isFinite(payload.lengthBeats) || payload.lengthBeats < 0.25) {
    throw new BridgeRequestError("lengthBeats must be at least 0.25");
  }
  if (!Array.isArray(payload.notes) || payload.notes.length === 0) {
    throw new BridgeRequestError("notes must be a non-empty array");
  }
  payload.notes.forEach(validateMidiNote);
}

export function validateMidiImportPayload(payload) {
  if (typeof payload.path !== "string" || !/\.(mid|midi)$/i.test(payload.path)) {
    throw new BridgeRequestError("path must point to a .mid or .midi file");
  }
  if (payload.trackIndex !== undefined && (!Number.isInteger(payload.trackIndex) || payload.trackIndex < 0)) {
    throw new BridgeRequestError("trackIndex must be a non-negative integer");
  }
  if (payload.clipSlotIndex !== undefined && (!Number.isInteger(payload.clipSlotIndex) || payload.clipSlotIndex < 0)) {
    throw new BridgeRequestError("clipSlotIndex must be a non-negative integer");
  }
}

export function validateClipTargetPayload(payload) {
  if (!Number.isInteger(payload.trackIndex) || payload.trackIndex < 0) {
    throw new BridgeRequestError("trackIndex must be a non-negative integer");
  }
  if (!Number.isInteger(payload.clipSlotIndex) || payload.clipSlotIndex < 0) {
    throw new BridgeRequestError("clipSlotIndex must be a non-negative integer");
  }
}

function validateMidiNote(note, index) {
  if (!note || typeof note !== "object" || Array.isArray(note)) {
    throw new BridgeRequestError(`notes[${index}] must be an object`);
  }
  if (!Number.isInteger(note.pitch) || note.pitch < 0 || note.pitch > 127) {
    throw new BridgeRequestError(`notes[${index}].pitch must be an integer between 0 and 127`);
  }
  if (typeof note.start !== "number" || !Number.isFinite(note.start) || note.start < 0) {
    throw new BridgeRequestError(`notes[${index}].start must be a non-negative number`);
  }
  if (typeof note.duration !== "number" || !Number.isFinite(note.duration) || note.duration <= 0) {
    throw new BridgeRequestError(`notes[${index}].duration must be greater than 0`);
  }
  if (!Number.isInteger(note.velocity) || note.velocity < 1 || note.velocity > 127) {
    throw new BridgeRequestError(`notes[${index}].velocity must be an integer between 1 and 127`);
  }
}
