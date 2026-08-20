from __future__ import absolute_import, print_function

import hashlib
import json
import os

from .http_bridge import BridgeHttpError

EPSILON = 0.000001
MAX_BEAT = 1000000
MAX_NOTES = 8192
AUDIO_EXTENSIONS = (".wav", ".aif", ".aiff", ".flac", ".mp3")
INSERTION_METHODS = (
    ("midi_notes", "create_midi_clip"),
    ("session_clip", "duplicate_clip_to_arrangement"),
    ("audio_file", "create_audio_clip")
)


def validate_request(payload):
    if not isinstance(payload, dict):
        fail("invalid_request", "Arrangement insertion payload must be an object")
    mode = payload.get("mode")
    if mode not in dict(INSERTION_METHODS):
        fail("legacy_payload_unsupported" if mode is None else "invalid_request", "mode must be midi_notes, session_clip, or audio_file")
    common = set(("mode", "trackIndex", "startBeat", "expectedFingerprint"))
    allowed = {
        "midi_notes": common | set(("lengthBeats", "notes", "name")),
        "session_clip": common | set(("sourceTrackIndex", "sourceClipSlotIndex")),
        "audio_file": common | set(("sourcePath",))
    }[mode]
    unexpected = sorted(set(payload.keys()) - allowed)
    if unexpected:
        fail("invalid_request", "Fields are not valid for %s: %s" % (mode, ", ".join(unexpected)))
    request = dict(payload)
    request["trackIndex"] = non_negative_integer(payload.get("trackIndex"), "trackIndex")
    request["startBeat"] = number_between(payload.get("startBeat"), "startBeat", 0, MAX_BEAT)
    expected = payload.get("expectedFingerprint")
    if expected is not None and (not isinstance(expected, str) or not expected):
        fail("invalid_request", "expectedFingerprint must be a non-empty string when provided")
    if mode == "midi_notes":
        request["lengthBeats"] = number_between(payload.get("lengthBeats"), "lengthBeats", EPSILON, MAX_BEAT)
        request["notes"] = validate_notes(payload.get("notes"), request["lengthBeats"])
        if payload.get("name") is not None:
            request["name"] = non_empty_string(payload.get("name"), "name")
    elif mode == "session_clip":
        request["sourceTrackIndex"] = non_negative_integer(payload.get("sourceTrackIndex"), "sourceTrackIndex")
        request["sourceClipSlotIndex"] = non_negative_integer(payload.get("sourceClipSlotIndex"), "sourceClipSlotIndex")
        if request["sourceTrackIndex"] != request["trackIndex"]:
            fail("invalid_request", "Cross-track Session clip duplication is not supported")
    else:
        request["sourcePath"] = non_empty_string(payload.get("sourcePath"), "sourcePath")
    return request


def validate_notes(notes, length_beats):
    if not isinstance(notes, list) or not notes or len(notes) > MAX_NOTES:
        fail("invalid_request", "notes must be a non-empty array with at most %s items" % MAX_NOTES)
    validated = []
    for index, note in enumerate(notes):
        if not isinstance(note, dict) or set(note.keys()) - set(("pitch", "start", "duration", "velocity")):
            fail("invalid_request", "notes[%s] must contain only supported note fields" % index)
        pitch = integer_between(note.get("pitch"), "notes[%s].pitch" % index, 0, 127)
        start = number_between(note.get("start"), "notes[%s].start" % index, 0, length_beats)
        duration = number_between(note.get("duration"), "notes[%s].duration" % index, EPSILON, length_beats)
        velocity = integer_between(note.get("velocity", 100), "notes[%s].velocity" % index, 1, 127)
        if start + duration > length_beats + EPSILON:
            fail("invalid_request", "notes[%s] extends beyond lengthBeats" % index)
        validated.append({"pitch": pitch, "start": start, "duration": duration, "velocity": velocity})
    return validated


def validate_target(track, mode):
    if not mode_applicable(track, mode):
        fail("wrong_track_kind", "%s is not applicable to the selected track" % mode, 409)


def mode_applicable(track, mode):
    is_midi = bool(getattr(track, "has_midi_input", False))
    is_audio = bool(getattr(track, "has_audio_input", False)) or not is_midi
    if mode == "midi_notes":
        return is_midi
    if mode == "audio_file":
        return is_audio and not is_midi
    return True


def validate_mode_source(track, request):
    if request["mode"] == "session_clip":
        slots = list(getattr(track, "clip_slots", []) or [])
        slot_index = request["sourceClipSlotIndex"]
        if slot_index >= len(slots) or not getattr(slots[slot_index], "has_clip", False):
            fail("source_slot_empty", "sourceClipSlotIndex does not contain a Session clip", 404)
        clip = slots[slot_index].clip
        return {
            "clip": clip, "fingerprint": session_source_fingerprint(track, slot_index),
            "name": getattr(clip, "name", ""), "kind": clip_kind(clip), "lengthBeats": clip_length(clip)
        }
    if request["mode"] == "audio_file":
        normalized = os.path.realpath(request["sourcePath"])
        extension = os.path.splitext(normalized)[1].lower()
        if extension not in AUDIO_EXTENSIONS or not os.path.isfile(normalized) or not os.access(normalized, os.R_OK):
            fail("file_not_permitted", "sourcePath must be a readable supported audio file")
        return {"normalizedPath": normalized, "extension": extension.lstrip("."), "basename": os.path.basename(normalized)}
    return {"name": request.get("name", ""), "kind": "midi", "lengthBeats": request["lengthBeats"]}


def arrangement_state(song):
    clips = []
    for track_index, track in enumerate(list(getattr(song, "tracks", []) or [])):
        try:
            observed = list(track.arrangement_clips or [])
        except Exception:
            fail("unsupported_method", "Arrangement clips are not readable on track %s" % track_index, 501)
        for arrangement_index, clip in enumerate(observed):
            clips.append(clip_summary(track_index, track, arrangement_index, clip))
    return {"clips": clips, "fingerprint": fingerprint(clips)}


def clip_summary(track_index, track, arrangement_index, clip):
    start = getattr(clip, "start_time", None)
    end = getattr(clip, "end_time", None)
    length = getattr(clip, "length", None)
    if not is_number(length) and is_number(start) and is_number(end):
        length = end - start
    if not is_number(start) or not is_number(length):
        fail("ambiguous_readback", "Arrangement clip timing is not observable", 500)
    return {
        "trackIndex": track_index, "trackName": getattr(track, "name", ""), "arrangementIndex": arrangement_index,
        "name": getattr(clip, "name", ""), "startBeat": start, "lengthBeats": length,
        "endBeat": start + length, "kind": clip_kind(clip)
    }


def verify_single_delta(before, after, request, source):
    delta = list(after["clips"])
    for key in [clip_content_key(clip) for clip in before["clips"]]:
        for index, candidate in enumerate(delta):
            if clip_content_key(candidate) == key:
                delta.pop(index)
                break
        else:
            fail("unexpected_post_state", "Arrangement content changed outside the requested insertion", 500)
    if not delta:
        fail("mutation_noop", "Ableton Live did not expose an inserted Arrangement clip", 500)
    if len(delta) != 1:
        fail("ambiguous_readback", "Arrangement insertion produced an ambiguous clip delta", 500)
    clip = delta[0]
    if clip["trackIndex"] != request["trackIndex"] or not close(clip["startBeat"], request["startBeat"]):
        fail("readback_mismatch", "Inserted clip appeared on the wrong track or beat", 500)
    if request["mode"] == "midi_notes":
        if clip["kind"] != "midi" or not close(clip["lengthBeats"], request["lengthBeats"]):
            fail("readback_mismatch", "Inserted MIDI clip timing or kind did not match the request", 500)
        if request.get("name") is not None and clip["name"] != request["name"]:
            fail("readback_mismatch", "Inserted MIDI clip name did not match the request", 500)
    elif request["mode"] == "session_clip":
        if clip["name"] != source["name"] or clip["kind"] != source["kind"] or not close(clip["lengthBeats"], source["lengthBeats"]):
            fail("readback_mismatch", "Duplicated Session clip fingerprint did not match the source", 500)
    elif clip["kind"] != "audio":
        fail("readback_mismatch", "Inserted audio file did not produce an audio clip", 500)
    return clip


def session_source_fingerprint(track, slot_index):
    slots = list(getattr(track, "clip_slots", []) or [])
    if slot_index >= len(slots) or not getattr(slots[slot_index], "has_clip", False):
        fail("source_stale", "Session source is missing or stale", 409)
    clip = slots[slot_index].clip
    return token_for([slot_index, getattr(clip, "name", ""), clip_length(clip), clip_kind(clip)])


def exact_track(song, track_index):
    tracks = list(getattr(song, "tracks", []) or [])
    if track_index >= len(tracks):
        fail("target_not_found", "trackIndex is outside the available track range", 404)
    return tracks[track_index]


def track_identity(track_index, track):
    name = getattr(track, "name", "")
    return {"trackIndex": track_index, "trackName": name, "trackIdentity": token_for([track_index, name])}


def clip_kind(clip):
    try:
        return "midi" if bool(clip.is_midi_clip) else "audio"
    except Exception:
        return "unknown"


def clip_length(clip):
    length = getattr(clip, "length", None)
    if is_number(length):
        return length
    start = getattr(clip, "start_time", None)
    end = getattr(clip, "end_time", None)
    return end - start if is_number(start) and is_number(end) else None


def fingerprint(clips):
    fields = ("trackIndex", "trackName", "arrangementIndex", "name", "startBeat", "lengthBeats", "endBeat", "kind")
    return token_for([[clip[key] for key in fields] for clip in clips])


def clip_content_key(clip):
    return token_for([clip["trackIndex"], clip["trackName"], clip["name"], clip["startBeat"], clip["lengthBeats"], clip["kind"]])


def token_for(value):
    return hashlib.sha256(json.dumps(value, separators=(",", ":"), ensure_ascii=True).encode("utf-8")).hexdigest()


def non_negative_integer(value, name):
    return integer_between(value, name, 0, MAX_BEAT)


def integer_between(value, name, minimum, maximum):
    if not isinstance(value, int) or isinstance(value, bool) or value < minimum or value > maximum:
        fail("invalid_request", "%s must be an integer between %s and %s" % (name, minimum, maximum))
    return value


def number_between(value, name, minimum, maximum):
    if not is_number(value) or value < minimum or value > maximum:
        fail("invalid_request", "%s must be a number between %s and %s" % (name, minimum, maximum))
    return value


def non_empty_string(value, name):
    if not isinstance(value, str) or not value.strip():
        fail("invalid_request", "%s must be a non-empty string" % name)
    return value.strip()


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value == value and abs(value) != float("inf")


def close(left, right):
    return abs(left - right) <= EPSILON


def fail(code, message, status=400, details=None):
    metadata = {"errorCode": code}
    metadata.update(details or {})
    raise BridgeHttpError(message, status, metadata)
