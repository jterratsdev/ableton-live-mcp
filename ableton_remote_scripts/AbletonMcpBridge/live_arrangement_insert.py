from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_arrangement_contract import (
    INSERTION_METHODS, arrangement_state, exact_track, fail, mode_applicable,
    non_negative_integer, session_source_fingerprint, track_identity,
    validate_mode_source, validate_request, validate_target, verify_single_delta
)


def arrangement_insertion_capabilities(song, track_index):
    track_index = non_negative_integer(track_index, "trackIndex")
    track = exact_track(song, track_index)
    before = arrangement_state(song)
    has_undo = callable_attribute(song, "undo")
    methods = {}
    for mode, method_name in INSERTION_METHODS:
        is_callable = callable_attribute(track, method_name)
        is_applicable = mode_applicable(track, mode)
        methods[method_name] = {
            "callable": is_callable,
            "applicable": is_applicable,
            "executable": is_callable and is_applicable and has_undo
        }
    if arrangement_state(song)["fingerprint"] != before["fingerprint"]:
        fail("unexpected_post_state", "Read-only Arrangement capability discovery changed observable state", 500)
    return {
        "ok": True, "readOnly": True, "target": track_identity(track_index, track),
        "songUndoCallable": has_undo, "methods": methods,
        "arrangementFingerprint": before["fingerprint"]
    }


def insert_arrangement_clip(song, payload):
    request = validate_request(payload)
    track = exact_track(song, request["trackIndex"])
    validate_target(track, request["mode"])
    method_name = dict(INSERTION_METHODS)[request["mode"]]
    method = callable_method(track, method_name)
    undo = callable_method(song, "undo", "undo_unavailable")
    source = validate_mode_source(track, request)
    before = arrangement_state(song)
    expected = request.get("expectedFingerprint")
    if expected is not None and expected != before["fingerprint"]:
        fail("precondition_stale", "Arrangement insertion precondition is stale", 409)
    if arrangement_state(song)["fingerprint"] != before["fingerprint"]:
        fail("precondition_stale", "Arrangement changed during insertion preflight", 409)

    mutation_stages = 0
    note_write_method = None
    try:
        if request["mode"] == "midi_notes":
            created = invoke_host_mutation(song, method, (request["startBeat"], request["lengthBeats"]), before, undo)
            mutation_stages = 1
            clip = created or exact_new_clip(song, before, request, source)
            if request.get("name") is not None:
                clip.name = request["name"]
            mutation_stages = 2
            note_write_method = write_midi_notes(clip, request["notes"])
        elif request["mode"] == "session_clip":
            invoke_host_mutation(song, method, (source["clip"], request["startBeat"]), before, undo)
            mutation_stages = 1
        else:
            invoke_host_mutation(song, method, (source["normalizedPath"], request["startBeat"]), before, undo)
            mutation_stages = 1

        after = arrangement_state(song)
        inserted = verify_single_delta(before, after, request, source)
        note_count = arrangement_note_count(song, inserted) if request["mode"] == "midi_notes" else None
        if note_count is not None and note_count != len(request["notes"]):
            fail("readback_mismatch", "Inserted MIDI note count did not match the request", 500)
        if request["mode"] == "session_clip" and session_source_fingerprint(track, request["sourceClipSlotIndex"]) != source["fingerprint"]:
            fail("source_stale", "Session source changed during Arrangement duplication", 409)
    except Exception as error:
        if mutation_stages:
            source_check = None
            if request["mode"] == "session_clip":
                source_check = lambda: session_source_fingerprint(
                    exact_track(song, request["trackIndex"]), request["sourceClipSlotIndex"]
                ) == source["fingerprint"]
            rollback_failure(song, undo, mutation_stages, before["fingerprint"], error, source_check)
        raise

    result = {
        "ok": True, "mode": request["mode"], "target": track_identity(request["trackIndex"], track),
        "clip": inserted, "beforeFingerprint": before["fingerprint"], "afterFingerprint": after["fingerprint"],
        "deltaCount": 1, "capability": {"method": method_name, "callable": True, "executable": True}
    }
    if note_count is not None:
        result.update({"noteCount": note_count, "noteWriteMethod": note_write_method})
    return result


def exact_new_clip(song, before, request, source):
    summary = verify_single_delta(before, arrangement_state(song), request, source)
    track = exact_track(song, summary["trackIndex"])
    return list(track.arrangement_clips)[summary["arrangementIndex"]]


def invoke_host_mutation(song, method, args, before, undo):
    try:
        return method(*args)
    except Exception as error:
        try:
            has_observable_mutation = arrangement_state(song)["fingerprint"] != before["fingerprint"]
        except Exception:
            has_observable_mutation = True
        if has_observable_mutation:
            rollback_failure(song, undo, 1, before["fingerprint"], error)
        fail("unexpected_post_state", "Live host rejected Arrangement insertion before an observable clip delta", 500)


def write_midi_notes(clip, notes):
    modern = getattr(clip, "add_new_notes", None)
    if callable(modern):
        modern(tuple(modern_note(note) for note in notes))
        return "add_new_notes"
    legacy = getattr(clip, "set_notes", None)
    if not callable(legacy):
        fail("unsupported_method", "Inserted MIDI clip exposes no callable note-write method", 501)
    legacy(tuple((note["pitch"], note["start"], note["duration"], note["velocity"], False) for note in notes))
    return "set_notes"


def modern_note(note):
    try:
        import Live
        specification = Live.Clip.MidiNoteSpecification
        return specification(
            pitch=note["pitch"], start_time=note["start"], duration=note["duration"],
            velocity=note["velocity"], mute=False
        )
    except ImportError:
        return ArrangementMidiNote(note)


class ArrangementMidiNote(object):
    def __init__(self, note):
        self.pitch = note["pitch"]
        self.start_time = note["start"]
        self.duration = note["duration"]
        self.velocity = note["velocity"]
        self.mute = False


def arrangement_note_count(song, summary):
    track = exact_track(song, summary["trackIndex"])
    clips = list(track.arrangement_clips or [])
    if summary["arrangementIndex"] >= len(clips):
        fail("ambiguous_readback", "Inserted MIDI clip could not be resolved for note readback", 500)
    clip = clips[summary["arrangementIndex"]]
    modern = getattr(clip, "get_notes_extended", None)
    if callable(modern):
        return len(list(modern(0, 128, 0.0, float(summary["lengthBeats"]))))
    legacy = getattr(clip, "get_notes", None)
    if callable(legacy):
        return len(list(legacy(0.0, 0, float(summary["lengthBeats"]), 128)))
    fail("ambiguous_readback", "Inserted MIDI note count is not observable", 500)


def rollback_failure(song, undo, stages, original_fingerprint, original_error, additional_restoration_check=None):
    undo_errors = []
    restored = False
    for index in range(stages):
        try:
            undo()
        except Exception as error:
            undo_errors.append("undo %s: %s" % (index + 1, error))
        try:
            arrangement_restored = arrangement_state(song)["fingerprint"] == original_fingerprint
            additional_restored = additional_restoration_check is None or additional_restoration_check()
            if arrangement_restored and additional_restored:
                restored = True
                break
        except Exception as error:
            undo_errors.append("readback: %s" % error)
            break
    if not restored or undo_errors:
        fail("rollback_failed", "Arrangement insertion failed and rollback did not restore the complete pre-state", 500, {"originalErrorCode": error_code(original_error)})
    status = original_error.status_code if isinstance(original_error, BridgeHttpError) else 500
    fail(error_code(original_error), "Arrangement insertion failed; rollback restored the complete pre-state", status, {"rollbackVerified": True})


def callable_method(owner, name, code="unsupported_method"):
    method = getattr(owner, name, None)
    if not callable(method):
        fail(code, "%s is not callable on the selected Live surface" % name, 501)
    return method


def callable_attribute(owner, name):
    try:
        return callable(getattr(owner, name, None))
    except Exception:
        return False


def error_code(error):
    if isinstance(error, BridgeHttpError):
        return error.details.get("errorCode", "unexpected_post_state")
    return "unexpected_post_state"
