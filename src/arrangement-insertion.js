import { MAX_MIDI_CLIP_NOTES } from "./midi-constants.js";

export const ARRANGEMENT_INSERTION_MODES = Object.freeze(["midi_notes", "session_clip", "audio_file"]);

const noteSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pitch: { type: "integer", minimum: 0, maximum: 127 },
    start: { type: "number", minimum: 0 },
    duration: { type: "number", exclusiveMinimum: 0 },
    velocity: { type: "integer", minimum: 1, maximum: 127 }
  },
  required: ["pitch", "start", "duration"]
};

export const arrangementInsertionTools = [
  {
    name: "ableton_get_arrangement_insertion_capabilities",
    description: "Read exact-track Arrangement insertion callability without changing the Live Set.",
    inputSchema: objectSchema({ trackIndex: nonNegativeInteger() }, ["trackIndex"])
  },
  {
    name: "ableton_insert_arrangement_clip",
    description: "Insert exactly one verified MIDI, Session, or audio clip into Arrangement View.",
    inputSchema: {
      oneOf: [
        objectSchema({
          mode: { const: "midi_notes" },
          trackIndex: nonNegativeInteger(),
          startBeat: nonNegativeNumber(),
          lengthBeats: positiveNumber(),
          notes: { type: "array", minItems: 1, maxItems: MAX_MIDI_CLIP_NOTES, items: noteSchema },
          name: { type: "string", minLength: 1 },
          expectedFingerprint: { type: "string", minLength: 1 }
        }, ["mode", "trackIndex", "startBeat", "lengthBeats", "notes"]),
        objectSchema({
          mode: { const: "session_clip" },
          trackIndex: nonNegativeInteger(),
          startBeat: nonNegativeNumber(),
          sourceTrackIndex: nonNegativeInteger(),
          sourceClipSlotIndex: nonNegativeInteger(),
          expectedFingerprint: { type: "string", minLength: 1 }
        }, ["mode", "trackIndex", "startBeat", "sourceTrackIndex", "sourceClipSlotIndex"]),
        objectSchema({
          mode: { const: "audio_file" },
          trackIndex: nonNegativeInteger(),
          startBeat: nonNegativeNumber(),
          sourcePath: { type: "string", minLength: 1 },
          expectedFingerprint: { type: "string", minLength: 1 }
        }, ["mode", "trackIndex", "startBeat", "sourcePath"])
      ]
    }
  }
];

export function createArrangementInsertionDispatch(bridge) {
  return {
    ableton_get_arrangement_insertion_capabilities: ({ trackIndex }) => bridge.invoke("get_arrangement_insertion_capabilities", { trackIndex }),
    ableton_insert_arrangement_clip: (args) => bridge.invoke("insert_arrangement_clip", args)
  };
}

export function validateArrangementInsertionToolInput(toolName, args) {
  if (toolName === "ableton_get_arrangement_insertion_capabilities") {
    requireNonNegativeInteger(args.trackIndex, "trackIndex");
    assertExactFields(args, ["trackIndex"]);
    return true;
  }
  if (toolName !== "ableton_insert_arrangement_clip") {
    return false;
  }
  if (!ARRANGEMENT_INSERTION_MODES.includes(args.mode)) {
    invalid(args.mode === undefined ? "legacy_payload_unsupported" : "mode must be midi_notes, session_clip, or audio_file");
  }
  requireNonNegativeInteger(args.trackIndex, "trackIndex");
  requireNonNegativeNumber(args.startBeat, "startBeat");
  if (args.expectedFingerprint !== undefined) {
    requireNonEmptyString(args.expectedFingerprint, "expectedFingerprint");
  }
  if (args.mode === "midi_notes") {
    assertExactFields(args, ["mode", "trackIndex", "startBeat", "lengthBeats", "notes", "name", "expectedFingerprint"]);
    requirePositiveNumber(args.lengthBeats, "lengthBeats");
    validateNotes(args.notes, args.lengthBeats);
    if (args.name !== undefined) requireNonEmptyString(args.name, "name");
  } else if (args.mode === "session_clip") {
    assertExactFields(args, ["mode", "trackIndex", "startBeat", "sourceTrackIndex", "sourceClipSlotIndex", "expectedFingerprint"]);
    requireNonNegativeInteger(args.sourceTrackIndex, "sourceTrackIndex");
    requireNonNegativeInteger(args.sourceClipSlotIndex, "sourceClipSlotIndex");
    if (args.sourceTrackIndex !== args.trackIndex) invalid("cross_track_session_copy_unsupported");
  } else {
    assertExactFields(args, ["mode", "trackIndex", "startBeat", "sourcePath", "expectedFingerprint"]);
    requireNonEmptyString(args.sourcePath, "sourcePath");
  }
  return true;
}

function validateNotes(notes, lengthBeats) {
  if (!Array.isArray(notes) || notes.length === 0 || notes.length > MAX_MIDI_CLIP_NOTES) {
    invalid(`notes must contain between 1 and ${MAX_MIDI_CLIP_NOTES} items`);
  }
  notes.forEach((note, index) => {
    if (!note || typeof note !== "object" || Array.isArray(note)) invalid(`notes[${index}] must be an object`);
    assertExactFields(note, ["pitch", "start", "duration", "velocity"], `notes[${index}]`);
    requireIntegerInRange(note.pitch, `notes[${index}].pitch`, 0, 127);
    requireNonNegativeNumber(note.start, `notes[${index}].start`);
    requirePositiveNumber(note.duration, `notes[${index}].duration`);
    requireIntegerInRange(note.velocity ?? 100, `notes[${index}].velocity`, 1, 127);
    if (note.start + note.duration > lengthBeats + Number.EPSILON) invalid(`notes[${index}] extends beyond lengthBeats`);
  });
}

function assertExactFields(value, allowed, prefix = "request") {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) invalid(`${prefix} contains unsupported fields: ${unexpected.join(", ")}`);
}

function requireNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) invalid(`${name} must be a non-negative integer`);
}

function requireIntegerInRange(value, name, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) invalid(`${name} must be an integer between ${minimum} and ${maximum}`);
}

function requireNonNegativeNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) invalid(`${name} must be a finite number greater than or equal to 0`);
}

function requirePositiveNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) invalid(`${name} must be a finite number greater than 0`);
}

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") invalid(`${name} must be a non-empty string`);
}

function invalid(message) {
  const error = new Error(message);
  error.code = -32602;
  throw error;
}

function objectSchema(properties, required = []) {
  return { type: "object", additionalProperties: false, properties, required };
}

function nonNegativeInteger() {
  return { type: "integer", minimum: 0 };
}

function nonNegativeNumber() {
  return { type: "number", minimum: 0 };
}

function positiveNumber() {
  return { type: "number", exclusiveMinimum: 0 };
}
