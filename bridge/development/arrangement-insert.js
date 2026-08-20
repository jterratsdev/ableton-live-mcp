import { existsSync, realpathSync, statSync } from "node:fs";
import { extname, basename } from "node:path";
import { createHash } from "node:crypto";
import { BridgeRequestError } from "../errors.js";
import { validateArrangementInsertionToolInput } from "../../src/arrangement-insertion.js";
import { clone } from "./utils.js";
import { getTrack } from "./mixer.js";

const AUDIO_EXTENSIONS = new Set([".wav", ".aif", ".aiff", ".flac", ".mp3"]);

export function arrangementInsertionCapabilities(state, trackIndex) {
  const track = getTrack(state, trackIndex);
  const before = fingerprint(state);
  const isMidi = track.type === "midi";
  const methods = {
    create_midi_clip: capability(true, isMidi),
    duplicate_clip_to_arrangement: capability(true, true),
    create_audio_clip: capability(true, track.type === "audio")
  };
  const after = fingerprint(state);
  if (after !== before) fail("unexpected_post_state", "Read-only capability discovery changed Arrangement state", 500);
  return {
    ok: true,
    readOnly: true,
    target: targetIdentity(trackIndex, track),
    songUndoCallable: true,
    methods,
    arrangementFingerprint: before
  };
}

export function insertArrangementClip(state, payload) {
  validateInsertionRequest(payload);
  const track = getTrack(state, payload.trackIndex);
  const beforeState = clone(state.arrangement);
  const beforeFingerprint = fingerprint(state);
  if (payload.expectedFingerprint !== undefined && payload.expectedFingerprint !== beforeFingerprint) {
    fail("precondition_stale", "Arrangement insertion precondition is stale", 409);
  }
  const clip = createClip(track, payload);
  state.arrangement.clips.push(clip);
  state.arrangement.clips.sort((left, right) => left.trackIndex - right.trackIndex || left.startBeat - right.startBeat);
  state.arrangement.lengthBeats = Math.max(state.arrangement.lengthBeats ?? 0, clip.endBeat);
  try {
    const delta = verifiedDelta(beforeState.clips ?? [], state.arrangement.clips, payload, clip);
    return {
      ok: true,
      mode: payload.mode,
      target: targetIdentity(payload.trackIndex, track),
      clip: clone(delta),
      beforeFingerprint,
      afterFingerprint: fingerprint(state),
      deltaCount: 1,
      capability: { method: methodForMode(payload.mode), callable: true, executable: true },
      ...(payload.mode === "midi_notes" ? { noteCount: payload.notes.length, noteWriteMethod: "add_new_notes" } : {})
    };
  } catch (error) {
    state.arrangement = beforeState;
    throw new BridgeRequestError("Arrangement insertion failed; rollback restored the complete pre-state", error.statusCode ?? 500, {
      errorCode: error.details?.errorCode ?? "unexpected_post_state",
      rollbackVerified: fingerprint(state) === beforeFingerprint
    });
  }
}

function validateInsertionRequest(payload) {
  try {
    validateArrangementInsertionToolInput("ableton_insert_arrangement_clip", payload);
  } catch (error) {
    const isLegacyPayload = error.message === "legacy_payload_unsupported";
    throw new BridgeRequestError(
      isLegacyPayload ? "An explicit Arrangement insertion mode is required" : error.message,
      400,
      { errorCode: isLegacyPayload ? "legacy_payload_unsupported" : "invalid_request" }
    );
  }
}

function createClip(track, payload) {
  if (payload.mode === "midi_notes") {
    if (track.type !== "midi") fail("wrong_track_kind", "midi_notes requires a MIDI track", 409);
    return clipRecord(track, payload, payload.name ?? "MIDI Clip", payload.lengthBeats, "midi", { type: "midiNotes" }, clone(payload.notes));
  }
  if (payload.mode === "session_clip") {
    if (payload.sourceTrackIndex !== payload.trackIndex) fail("invalid_request", "Cross-track Session copy is unsupported");
    const source = track.clips.find(({ slot }) => slot === payload.sourceClipSlotIndex);
    if (!source) fail("source_slot_empty", "sourceClipSlotIndex does not contain a Session clip", 404);
    return clipRecord(track, payload, source.name, source.lengthBeats, source.kind ?? track.type, {
      type: "sessionClip", trackIndex: track.index, clipSlotIndex: source.slot
    });
  }
  if (payload.mode !== "audio_file") fail("legacy_payload_unsupported", "An explicit Arrangement insertion mode is required");
  if (track.type !== "audio") fail("wrong_track_kind", "audio_file requires an audio track", 409);
  const source = audioSource(payload.sourcePath);
  const lengthBeats = 4;
  return clipRecord(track, payload, source.basename, lengthBeats, "audio", {
    type: "audioFile", basename: source.basename, extension: source.extension
  });
}

function clipRecord(track, payload, name, lengthBeats, kind, source, notes) {
  return {
    id: `arr-${Date.now()}-${track.index}-${payload.startBeat}`,
    trackIndex: track.index,
    trackName: track.name,
    startBeat: payload.startBeat,
    lengthBeats,
    endBeat: payload.startBeat + lengthBeats,
    name,
    kind,
    source,
    ...(notes ? { notes } : {})
  };
}

function audioSource(sourcePath) {
  if (typeof sourcePath !== "string" || !existsSync(sourcePath)) fail("file_not_permitted", "sourcePath must be a readable supported audio file");
  const path = realpathSync(sourcePath);
  if (!statSync(path).isFile() || !AUDIO_EXTENSIONS.has(extname(path).toLowerCase())) fail("file_not_permitted", "sourcePath must be a readable supported audio file");
  return { path, basename: basename(path), extension: extname(path).slice(1).toLowerCase() };
}

function verifiedDelta(before, after, payload, expected) {
  const previousIds = new Set(before.map(({ id }) => id));
  const delta = after.filter(({ id }) => !previousIds.has(id));
  if (delta.length !== 1) fail(delta.length === 0 ? "mutation_noop" : "ambiguous_readback", "Arrangement insertion did not produce exactly one clip", 500);
  const observed = delta[0];
  if (observed.trackIndex !== payload.trackIndex || observed.startBeat !== payload.startBeat || observed.name !== expected.name) {
    fail("readback_mismatch", "Inserted clip readback did not match the request", 500);
  }
  return observed;
}

function capability(callable, applicable) {
  return { callable, applicable, executable: callable && applicable };
}

function methodForMode(mode) {
  return { midi_notes: "create_midi_clip", session_clip: "duplicate_clip_to_arrangement", audio_file: "create_audio_clip" }[mode];
}

function targetIdentity(trackIndex, track) {
  return { trackIndex, trackName: track.name, trackIdentity: digest([trackIndex, track.name]) };
}

function fingerprint(state) {
  return digest((state.arrangement?.clips ?? []).map(({ trackIndex, trackName, name, startBeat, lengthBeats, endBeat, kind }) => [trackIndex, trackName, name, startBeat, lengthBeats, endBeat, kind]));
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function fail(errorCode, message, statusCode = 400) {
  throw new BridgeRequestError(message, statusCode, { errorCode });
}
