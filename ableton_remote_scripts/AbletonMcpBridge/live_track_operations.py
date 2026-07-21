from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_core import parse_non_negative_integer, require_non_empty_string
from .live_mixer import get_track
from .live_summaries import track_detail


def duplicate_track(song, payload):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    get_track(song, track_index)
    name = optional_name(payload)
    duplicate = getattr(song, "duplicate_track", None)
    if duplicate is None:
        raise BridgeHttpError("Ableton Live API does not expose track duplication", 501)

    before = list(song.tracks)
    try:
        created = duplicate(track_index)
    except TypeError:
        created = duplicate(before[track_index])

    after = list(song.tracks)
    if len(after) <= len(before):
        raise BridgeHttpError("Ableton Live API did not report a duplicated track", 501)

    track = resolve_created_track(before, after, created, track_index + 1)
    if name is not None:
        track.name = name
    new_track_index = after.index(track)
    return {
        "ok": True,
        "duplicated": True,
        "sourceTrackIndex": track_index,
        "newTrackIndex": new_track_index,
        "track": track_detail(new_track_index, track)
    }


def freeze_track(song, payload):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    track = get_track(song, track_index)
    call_supported_track_operation(song, track, track_index, ("freeze_track", "freeze"), "freeze")
    frozen = read_frozen_state(track)
    if frozen is False:
        raise BridgeHttpError("Ableton Live API did not report a frozen track", 501)
    return {
        "ok": True,
        "frozen": frozen,
        "track": track_detail(track_index, track),
        "warnings": observed_state_warnings(frozen, "frozen")
    }


def flatten_track(song, payload):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    track = get_track(song, track_index)
    call_supported_track_operation(song, track, track_index, ("flatten", "flatten_track"), "flatten")
    flattened = read_flattened_state(track)
    return {
        "ok": True,
        "flattened": flattened,
        "audio": not getattr(track, "has_midi_input", False),
        "track": track_detail(track_index, track),
        "warnings": observed_state_warnings(flattened, "flattened")
    }


def consolidate_clip(song, payload):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    get_track(song, track_index)
    require_number(payload.get("startBeat"), "startBeat", 0, False)
    require_number(payload.get("lengthBeats"), "lengthBeats", 0, True)
    if payload.get("clipSlotIndex") is not None:
        parse_non_negative_integer(payload.get("clipSlotIndex"), "clipSlotIndex")

    consolidate = getattr(song, "consolidate", None)
    if consolidate is None:
        consolidate = getattr(song, "consolidate_clip", None)
    if consolidate is None:
        raise BridgeHttpError("Ableton Live API does not expose clip consolidation", 501)

    try:
        result = consolidate()
    except TypeError:
        raise BridgeHttpError("Ableton Live clip consolidation API has an unsupported signature for this bridge", 501)

    return {
        "ok": True,
        "consolidated": True,
        "result": str(result) if result is not None else None,
        "track": track_detail(track_index, get_track(song, track_index))
    }


def call_supported_track_operation(song, track, track_index, names, label):
    for name in names:
        operation = getattr(track, name, None)
        if operation is not None:
            operation()
            return
    for name in names:
        operation = getattr(song, name, None)
        if operation is not None:
            try:
                operation(track_index)
            except TypeError:
                operation(track)
            return
    raise BridgeHttpError("Ableton Live API does not expose track %s" % label, 501)


def optional_name(payload):
    if payload.get("name") is None:
        return None
    return require_non_empty_string(payload.get("name"), "name")


def resolve_created_track(before, after, created, requested_index):
    if created is not None and created in after:
        return created
    before_ids = set(id(track) for track in before)
    for track in after:
        if id(track) not in before_ids:
            return track
    if requested_index < len(after):
        return after[requested_index]
    return after[-1]


def read_frozen_state(track):
    return first_bool_attr(track, ("is_frozen", "frozen"))


def read_flattened_state(track):
    return first_bool_attr(track, ("is_flattened", "flattened"))


def first_bool_attr(target, names):
    for name in names:
        try:
            value = getattr(target, name)
        except Exception:
            continue
        if isinstance(value, bool):
            return value
    return None


def observed_state_warnings(value, label):
    if value is None:
        return ["Ableton Live API did not expose an observable %s state flag" % label]
    return []


def require_number(value, name, minimum, exclusive):
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise BridgeHttpError("%s must be a finite number" % name)
    if exclusive and value <= minimum:
        raise BridgeHttpError("%s must be greater than %s" % (name, minimum))
    if not exclusive and value < minimum:
        raise BridgeHttpError("%s must be at least %s" % (name, minimum))
    return value
