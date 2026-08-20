from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_core import parse_non_negative_integer, require_non_empty_string
from .live_mixer import get_track
from .live_summaries import track_detail
from .live_editions import require_audio_midi_track_capacity


def duplicate_track(song, payload, runtime_path=None):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    source = get_track(song, track_index)
    name = optional_name(payload)
    require_audio_midi_track_capacity(song, runtime_path, "duplicate_track")
    duplicate = getattr(song, "duplicate_track", None)
    if not callable(duplicate):
        raise BridgeHttpError("Ableton Live API does not expose track duplication", 501)
    undo = song_undo(song)

    before = list(song.tracks)
    before_names = observable_track_names(before)
    mutation_count = 1
    try:
        try:
            duplicate(track_index)
        except TypeError:
            if observable_track_names(list(song.tracks)) != before_names:
                raise
            duplicate(source)

        after = list(song.tracks)
        if len(after) != len(before) + 1:
            raise BridgeHttpError("Ableton Live API did not report exactly one duplicated track", 501)

        new_track_index = track_index + 1
        track = resolve_created_track(after, new_track_index)
        if name is not None:
            track.name = name
            mutation_count += 1

        readback = list(song.tracks)
        verify_duplicate_readback(before_names, readback, track_index, name)
        verified_track = readback[new_track_index]
        return {
            "ok": True,
            "duplicated": True,
            "sourceTrackIndex": track_index,
            "newTrackIndex": new_track_index,
            "track": track_detail(new_track_index, verified_track)
        }
    except Exception as error:
        rollback_duplicate_failure(song, undo, before_names, mutation_count, error)


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


def resolve_created_track(after, requested_index):
    if requested_index >= len(after):
        raise BridgeHttpError("Ableton Live did not expose the duplicated track at sourceIndex + 1", 501)
    return after[requested_index]


def verify_duplicate_readback(before_names, after, source_index, requested_name):
    after_names = observable_track_names(after)
    if len(after_names) != len(before_names) + 1:
        raise BridgeHttpError("Duplicated track readback has an unexpected track count", 500)
    for before_index, before_name in enumerate(before_names):
        after_index = before_index if before_index <= source_index else before_index + 1
        if after_names[after_index] != before_name:
            raise BridgeHttpError(
                "Duplicated track readback changed existing track %s" % before_index,
                500
            )
    if requested_name is not None and after_names[source_index + 1] != requested_name:
        raise BridgeHttpError("Duplicated track name was not observable at sourceIndex + 1", 500)


def rollback_duplicate_failure(song, undo, before_names, maximum_undo_count, original_error):
    try:
        current_names = observable_track_names(list(song.tracks))
    except Exception:
        current_names = None

    if current_names == before_names:
        status = original_error.status_code if isinstance(original_error, BridgeHttpError) else 500
        raise BridgeHttpError("Track duplication failed before observable mutation: %s" % original_error, status)

    restored_names = current_names
    undo_errors = []
    for undo_index in range(maximum_undo_count):
        try:
            undo()
        except Exception as undo_error:
            undo_errors.append("undo %s of %s: %s" % (
                undo_index + 1,
                maximum_undo_count,
                undo_error
            ))
            break
        try:
            restored_names = observable_track_names(list(song.tracks))
        except Exception as readback_error:
            undo_errors.append("restoration readback error: %s" % readback_error)
            break
        if restored_names == before_names:
            break

    if undo_errors or restored_names != before_names:
        reasons = list(undo_errors)
        if restored_names != before_names:
            reasons.append("track fingerprint mismatch")
        raise BridgeHttpError(
            "Track duplication failed and rollback failed: %s; original error: %s" % (
                "; ".join(reasons),
                original_error
            ),
            500
        )

    status = original_error.status_code if isinstance(original_error, BridgeHttpError) else 500
    raise BridgeHttpError(
        "Track duplication failed; rollback verified by observable track fingerprint; original error: %s" % original_error,
        status
    )


def observable_track_names(tracks):
    return [getattr(track, "name", "") for track in tracks]


def song_undo(song):
    try:
        undo = getattr(song, "undo", None)
    except Exception:
        undo = None
    if not callable(undo):
        raise BridgeHttpError("Track duplication requires callable Song.undo before mutation", 501)
    return undo


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
