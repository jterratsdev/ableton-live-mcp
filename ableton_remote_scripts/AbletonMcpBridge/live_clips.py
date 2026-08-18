from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_core import parse_non_negative_integer
from .live_summaries import clip_note_summary

MAX_HUMANIZE_TIMING_BEATS = 0.25
MAX_HUMANIZE_DURATION_BEATS = 0.5
MAX_HUMANIZE_VELOCITY = 64
MIN_DURATION_BEATS = 0.01
EPSILON = 0.000001
GRID_BEATS = {
    "1/4": 1.0,
    "1/8": 0.5,
    "1/16": 0.25,
    "1/32": 0.125,
    "1/64": 0.0625
}


def create_midi_clip(song, payload):
    track_index = payload.get("trackIndex")
    clip_slot_index = payload.get("clipSlotIndex")
    length_beats = payload.get("lengthBeats")
    notes = payload.get("notes")
    validate_midi_clip_payload(track_index, clip_slot_index, length_beats, notes)

    track = get_track(song, track_index)
    if not getattr(track, "has_midi_input", False):
        raise BridgeHttpError("trackIndex must point to a MIDI track")
    clip_slots = list(getattr(track, "clip_slots", []))
    if clip_slot_index >= len(clip_slots):
        raise BridgeHttpError("clipSlotIndex is outside the available clip slot range", 404)

    clip_slot = clip_slots[clip_slot_index]
    if getattr(clip_slot, "has_clip", False):
        clip_slot.delete_clip()
    clip_slot.create_clip(length_beats)
    clip = clip_slot.clip
    live_notes = [
        (note["pitch"], note["start"], note["duration"], note.get("velocity", 100), False)
        for note in notes
    ]
    clip.set_notes(tuple(live_notes))
    return {
        "ok": True,
        "clip": {
            "slot": clip_slot_index,
            "name": getattr(clip, "name", "MIDI Clip"),
            "lengthBeats": getattr(clip, "length", length_beats),
            "noteCount": len(notes)
        },
        "track": {"index": track_index, "name": getattr(track, "name", "")}
    }


def delete_clip(song, payload):
    track_index = payload.get("trackIndex")
    clip_slot_index = payload.get("clipSlotIndex")
    validate_clip_target_payload(track_index, clip_slot_index)

    track = get_track(song, track_index)
    clip_slots = list(getattr(track, "clip_slots", []))
    if clip_slot_index >= len(clip_slots):
        raise BridgeHttpError("clipSlotIndex is outside the available clip slot range", 404)

    clip_slot = clip_slots[clip_slot_index]
    if not getattr(clip_slot, "has_clip", False):
        return {
            "ok": True,
            "deleted": False,
            "clip": {"slot": clip_slot_index},
            "track": {"index": track_index, "name": getattr(track, "name", "")}
        }

    clip = clip_slot.clip
    deleted = {
        "slot": clip_slot_index,
        "name": getattr(clip, "name", ""),
        "lengthBeats": getattr(clip, "length", None)
    }
    clip_slot.delete_clip()
    if getattr(clip_slot, "has_clip", False):
        raise BridgeHttpError("Ableton did not report the clip slot as empty after deletion", 500)
    return {
        "ok": True,
        "deleted": True,
        "clip": deleted,
        "track": {"index": track_index, "name": getattr(track, "name", "")}
    }


def get_clip_notes(song, payload):
    track_index = payload.get("trackIndex")
    clip_slot_index = payload.get("clipSlotIndex")
    track_index, clip_slot_index = validate_clip_target_payload(track_index, clip_slot_index)

    track = get_track(song, track_index)
    clip_slots = list(getattr(track, "clip_slots", []))
    if clip_slot_index >= len(clip_slots):
        raise BridgeHttpError("clipSlotIndex is outside the available clip slot range", 404)

    clip_slot = clip_slots[clip_slot_index]
    if not getattr(clip_slot, "has_clip", False):
        raise BridgeHttpError("clipSlotIndex does not contain a clip", 404)

    clip = clip_slot.clip
    length_beats = getattr(clip, "length", 0)
    raw_notes = clip.get_notes(0.0, 0, float(length_beats), 128)
    notes = [clip_note_summary(note) for note in raw_notes]
    return {
        "ok": True,
        "clip": {
            "slot": clip_slot_index,
            "name": getattr(clip, "name", ""),
            "lengthBeats": length_beats,
            "noteCount": len(notes)
        },
        "track": {"index": track_index, "name": getattr(track, "name", "")},
        "notes": notes
    }


def launch_clip(song, payload):
    track_index = payload.get("trackIndex")
    clip_slot_index = payload.get("clipSlotIndex")
    track_index, clip_slot_index = validate_clip_target_payload(track_index, clip_slot_index)
    track = get_track(song, track_index)
    clip_slots = list(getattr(track, "clip_slots", []))
    if clip_slot_index >= len(clip_slots):
        raise BridgeHttpError("clipSlotIndex is outside the available clip slot range", 404)
    clip_slot = clip_slots[clip_slot_index]
    if not getattr(clip_slot, "has_clip", False):
        raise BridgeHttpError("clipSlotIndex does not contain a clip", 404)
    fire = getattr(clip_slot, "fire", None)
    if fire is None:
        raise BridgeHttpError("Clip launch is not supported by this Live API", 501)
    fire()
    clip = clip_slot.clip
    return {
        "ok": True,
        "launched": True,
        "clip": {
            "slot": clip_slot_index,
            "name": getattr(clip, "name", ""),
            "lengthBeats": getattr(clip, "length", None)
        },
        "track": {"index": track_index, "name": getattr(track, "name", "")}
    }


def launch_scene(song, payload):
    scene_index = parse_non_negative_integer(payload.get("sceneIndex"), "sceneIndex")
    scenes = list(getattr(song, "scenes", []) or [])
    if scene_index >= len(scenes):
        raise BridgeHttpError("sceneIndex is outside the available scene range", 404)
    scene = scenes[scene_index]
    fire = getattr(scene, "fire", None)
    if fire is None:
        raise BridgeHttpError("Scene launch is not supported by this Live API", 501)
    fire()
    return {
        "ok": True,
        "launched": True,
        "sceneIndex": scene_index,
        "scene": {"name": getattr(scene, "name", "")}
    }


def humanize_clip(song, payload):
    track_index, clip_slot_index, track, clip, notes = editable_clip_notes(song, payload)
    timing_amount = optional_number(payload, "timingAmountBeats", 0, MAX_HUMANIZE_TIMING_BEATS, 0)
    duration_amount = optional_number(payload, "durationAmountBeats", 0, MAX_HUMANIZE_DURATION_BEATS, 0)
    velocity_amount = optional_integer(payload, "velocityAmount", 0, MAX_HUMANIZE_VELOCITY, 0)
    seed = payload.get("seed", "ableton-mcp")
    if seed is None:
        seed = "ableton-mcp"
    seed = str(seed)
    if seed.strip() == "":
        raise BridgeHttpError("seed must not be blank when provided")

    rng = seeded_random(seed)
    transformed = []
    for note in notes:
        timing_offset = random_signed(rng) * timing_amount
        duration_offset = random_signed(rng) * duration_amount
        velocity_offset = int(round(random_signed(rng) * velocity_amount))
        changed = dict(note)
        changed["start"] = round_beat(note["start"] + timing_offset)
        changed["duration"] = round_beat(note["duration"] + duration_offset)
        changed["velocity"] = int(round(note.get("velocity", 100) + velocity_offset))
        transformed.append(bounded_note(changed, getattr(clip, "length", 0)))

    mode = replace_clip_notes(clip, transformed)
    return rewrite_result("humanize", track_index, clip_slot_index, track, clip, notes, transformed, {
        "seed": seed,
        "timingAmountBeats": timing_amount,
        "durationAmountBeats": duration_amount,
        "velocityAmount": velocity_amount,
        "mode": mode
    })


def quantize_clip(song, payload):
    track_index, clip_slot_index, track, clip, notes = editable_clip_notes(song, payload)
    grid, grid_beats = validate_grid(payload.get("grid", "1/16"))
    strength = optional_number(payload, "strength", 0, 1, 1)
    transformed = []
    for note in notes:
        target_start = round(note["start"] / grid_beats) * grid_beats
        changed = dict(note)
        changed["start"] = round_beat(note["start"] + ((target_start - note["start"]) * strength))
        transformed.append(bounded_note(changed, getattr(clip, "length", 0)))

    mode = replace_clip_notes(clip, transformed)
    return rewrite_result("quantize", track_index, clip_slot_index, track, clip, notes, transformed, {
        "grid": grid,
        "gridBeats": grid_beats,
        "strength": strength,
        "mode": mode
    })


def apply_groove(song, payload):
    track_index, clip_slot_index, track, clip, notes = editable_clip_notes(song, payload)
    grid, grid_beats = validate_grid(payload.get("grid", "1/16"))
    amount = optional_number(payload, "amount", 0, 1, None)
    swing = optional_number(payload, "swing", 0, 1, 0.5)
    transformed = []
    for note in notes:
        subdivision = int((note["start"] / grid_beats) + EPSILON)
        changed = dict(note)
        if subdivision % 2 == 1:
            changed["start"] = round_beat(note["start"] + (grid_beats * swing * amount))
        transformed.append(bounded_note(changed, getattr(clip, "length", 0)))

    mode = replace_clip_notes(clip, transformed)
    return rewrite_result("groove", track_index, clip_slot_index, track, clip, notes, transformed, {
        "grid": grid,
        "gridBeats": grid_beats,
        "amount": amount,
        "swing": swing,
        "mode": mode
    })


def editable_clip_notes(song, payload):
    track_index = payload.get("trackIndex")
    clip_slot_index = payload.get("clipSlotIndex")
    track_index, clip_slot_index = validate_clip_target_payload(track_index, clip_slot_index)
    track = get_track(song, track_index)
    if not getattr(track, "has_midi_input", False):
        raise BridgeHttpError("trackIndex must point to a MIDI track")
    clip_slots = list(getattr(track, "clip_slots", []))
    if clip_slot_index >= len(clip_slots):
        raise BridgeHttpError("clipSlotIndex is outside the available clip slot range", 404)
    clip_slot = clip_slots[clip_slot_index]
    if not getattr(clip_slot, "has_clip", False):
        raise BridgeHttpError("clipSlotIndex does not contain a clip", 404)
    clip = clip_slot.clip
    if not hasattr(clip, "get_notes_extended"):
        raise BridgeHttpError("MIDI note rewrite requires get_notes_extended in this Live API", 501)
    length_beats = getattr(clip, "length", 0)
    raw_notes = clip.get_notes_extended(0, 128, 0.0, float(length_beats))
    notes = [clip_note_summary(note) for note in raw_notes]
    return track_index, clip_slot_index, track, clip, notes


def replace_clip_notes(clip, notes):
    live_notes = tuple([
        (
            int(note["pitch"]),
            float(note["start"]),
            float(note["duration"]),
            int(note.get("velocity", 100)),
            bool(note.get("muted", False))
        )
        for note in notes
    ])
    if hasattr(clip, "select_all_notes") and hasattr(clip, "replace_selected_notes"):
        clip.select_all_notes()
        clip.replace_selected_notes(live_notes)
        return "replace_selected_notes"
    if hasattr(clip, "remove_notes_extended") and hasattr(clip, "set_notes"):
        clip.remove_notes_extended(0, 128, 0.0, float(getattr(clip, "length", 0)))
        clip.set_notes(live_notes)
        return "remove_notes_extended+set_notes"
    raise BridgeHttpError("MIDI note rewrite is not supported by this Live API", 501)


def rewrite_result(operation, track_index, clip_slot_index, track, clip, before, after, parameters):
    changed_note_count = 0
    for index, note in enumerate(before):
        if not notes_equal(note, after[index]):
            changed_note_count += 1
    return {
        "ok": True,
        "operation": operation,
        "changedNoteCount": changed_note_count,
        "clip": {
            "slot": clip_slot_index,
            "name": getattr(clip, "name", ""),
            "lengthBeats": getattr(clip, "length", 0),
            "noteCount": len(after)
        },
        "track": {"index": track_index, "name": getattr(track, "name", "")},
        "parameters": parameters,
        "notes": after
    }


def validate_midi_clip_payload(track_index, clip_slot_index, length_beats, notes):
    validate_clip_target_payload(track_index, clip_slot_index)
    if not isinstance(length_beats, (int, float)) or length_beats < 0.25:
        raise BridgeHttpError("lengthBeats must be at least 0.25")
    if not isinstance(notes, list) or len(notes) == 0:
        raise BridgeHttpError("notes must be a non-empty array")
    for index, note in enumerate(notes):
        validate_midi_note(note, index)


def validate_clip_target_payload(track_index, clip_slot_index):
    return (
        parse_non_negative_integer(track_index, "trackIndex"),
        parse_non_negative_integer(clip_slot_index, "clipSlotIndex")
    )


def validate_midi_note(note, index):
    if not isinstance(note, dict):
        raise BridgeHttpError("notes[%s] must be an object" % index)
    if not isinstance(note.get("pitch"), int) or note.get("pitch") < 0 or note.get("pitch") > 127:
        raise BridgeHttpError("notes[%s].pitch must be an integer between 0 and 127" % index)
    if not isinstance(note.get("start"), (int, float)) or note.get("start") < 0:
        raise BridgeHttpError("notes[%s].start must be a non-negative number" % index)
    if not isinstance(note.get("duration"), (int, float)) or note.get("duration") <= 0:
        raise BridgeHttpError("notes[%s].duration must be greater than 0" % index)
    velocity = note.get("velocity", 100)
    if not isinstance(velocity, int) or velocity < 1 or velocity > 127:
        raise BridgeHttpError("notes[%s].velocity must be an integer between 1 and 127" % index)


def validate_grid(grid):
    if grid not in GRID_BEATS:
        raise BridgeHttpError("grid must be one of 1/4, 1/8, 1/16, 1/32, or 1/64")
    return grid, GRID_BEATS[grid]


def optional_number(payload, key, minimum, maximum, default):
    value = payload.get(key, default)
    if value is None:
        raise BridgeHttpError("%s must be a number between %s and %s" % (key, minimum, maximum))
    if not isinstance(value, (int, float)) or value < minimum or value > maximum:
        raise BridgeHttpError("%s must be a number between %s and %s" % (key, minimum, maximum))
    return value


def optional_integer(payload, key, minimum, maximum, default):
    value = payload.get(key, default)
    if not isinstance(value, int) or value < minimum or value > maximum:
        raise BridgeHttpError("%s must be an integer between %s and %s" % (key, minimum, maximum))
    return value


def bounded_note(note, length_beats):
    start_max = max(0, length_beats - MIN_DURATION_BEATS) if isinstance(length_beats, (int, float)) else note["start"]
    start = clamp(note["start"], 0, start_max)
    max_duration = max(MIN_DURATION_BEATS, length_beats - start) if isinstance(length_beats, (int, float)) else note["duration"]
    bounded = dict(note)
    bounded["start"] = round_beat(start)
    bounded["duration"] = round_beat(clamp(note["duration"], MIN_DURATION_BEATS, max_duration))
    bounded["velocity"] = int(clamp(int(round(note.get("velocity", 100))), 1, 127))
    return bounded


def seeded_random(seed):
    state = 2166136261
    for char in seed:
        state = state ^ ord(char)
        state = (state * 16777619) & 0xffffffff

    def next_value():
        nonlocal_state[0] = (nonlocal_state[0] + 0x6d2b79f5) & 0xffffffff
        value = nonlocal_state[0]
        value = ((value ^ (value >> 15)) * (value | 1)) & 0xffffffff
        value = (value ^ ((value + (((value ^ (value >> 7)) * (value | 61)) & 0xffffffff)) & 0xffffffff)) & 0xffffffff
        return ((value ^ (value >> 14)) & 0xffffffff) / 4294967296.0

    nonlocal_state = [state]
    return next_value


def random_signed(rng):
    return (rng() * 2) - 1


def notes_equal(left, right):
    return (
        left.get("pitch") == right.get("pitch") and
        abs(left.get("start", 0) - right.get("start", 0)) < EPSILON and
        abs(left.get("duration", 0) - right.get("duration", 0)) < EPSILON and
        left.get("velocity", 100) == right.get("velocity", 100) and
        bool(left.get("muted", False)) == bool(right.get("muted", False))
    )


def clamp(value, minimum, maximum):
    return min(maximum, max(minimum, value))


def round_beat(value):
    return round(value, 6)


def get_track(song, track_index):
    tracks = list(song.tracks)
    if track_index >= len(tracks):
        raise BridgeHttpError("trackIndex is outside the available track range", 404)
    return tracks[track_index]
