from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_core import (
    db_to_live_send,
    db_to_live_volume,
    normalize,
    parameter_db_value,
    parameter_display_value,
    parameter_value,
    parse_non_negative_integer,
    require_bool,
    require_non_empty_string,
    require_number_range
)
from .live_summaries import device_summary, master_track_detail, return_track_detail, routing_name, routing_names, track_detail, track_type
from .live_meter_cache import read_meter_property


DEFAULT_WRITE_TOLERANCE_DB = 0.5
MINIMUM_ZERO_ONLY_POLLS = 20

METER_PROPERTIES = (
    ("left", "output_meter_left"),
    ("right", "output_meter_right"),
    ("level", "output_meter_level"),
)


def get_track(song, track_index):
    tracks = list(song.tracks)
    if track_index >= len(tracks):
        raise BridgeHttpError("trackIndex is outside the available track range", 404)
    return tracks[track_index]


def modify_track(song, payload):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    track = get_track(song, track_index)
    applied = {}
    warnings = []
    write_verification = {}
    tolerance_db = write_tolerance_db(payload)

    if "name" in payload:
        name = require_non_empty_string(payload.get("name"), "name")
        track.name = name
        applied["name"] = track.name
    if "color" in payload and hasattr(track, "color"):
        track.color = payload.get("color")
        applied["color"] = track.color
    apply_mixer_patch(track, payload, applied, warnings, write_verification, tolerance_db)
    if "armed" in payload:
        if not hasattr(track, "arm"):
            warnings.append("Track does not support arm")
        else:
            track.arm = require_bool(payload.get("armed"), "armed")
            applied["armed"] = bool(track.arm)
    if "sends" in payload:
        applied["sends"] = apply_sends(song, track, payload.get("sends"), write_verification, tolerance_db, warnings)
    if "inputRouting" in payload:
        applied["inputRouting"] = set_routing(track, "input", payload.get("inputRouting"))
    if "outputRouting" in payload:
        applied["outputRouting"] = set_routing(track, "output", payload.get("outputRouting"))

    return {
        "ok": True,
        "track": track_detail(track_index, track),
        "applied": applied,
        "writeVerification": write_verification,
        "warnings": warnings
    }


def list_return_tracks(song):
    returns = [return_track_detail(index, track) for index, track in enumerate(getattr(song, "return_tracks", []))]
    return {"ok": True, "count": len(returns), "returns": returns}


def create_return_track(song, payload):
    name = require_non_empty_string(payload.get("name"), "name")
    before = list(getattr(song, "return_tracks", []))
    return_index = parse_optional_create_return_index(payload, len(before))

    create = getattr(song, "create_return_track", None)
    if create is None:
        raise BridgeHttpError("Ableton Live API does not expose return track creation", 501)

    try:
        created = create(return_index)
    except TypeError:
        created = create()

    after = list(getattr(song, "return_tracks", []))
    if len(after) <= len(before):
        raise BridgeHttpError("Ableton Live API did not report a created return track", 501)

    track = resolve_created_return_track(before, after, created, return_index)
    track.name = name
    actual_index = after.index(track)
    return {
        "ok": True,
        "created": True,
        "return": return_track_detail(actual_index, track),
        "returnIndex": actual_index,
        "count": len(after)
    }


def modify_return_track(song, payload):
    return_index = parse_non_negative_integer(payload.get("returnIndex"), "returnIndex")
    returns = list(getattr(song, "return_tracks", []))
    if return_index >= len(returns):
        raise BridgeHttpError("returnIndex is outside the available return track range", 404)
    track = returns[return_index]
    applied = {}
    warnings = []
    write_verification = {}
    tolerance_db = write_tolerance_db(payload)

    if "name" in payload:
        name = require_non_empty_string(payload.get("name"), "name")
        track.name = name
        applied["name"] = track.name
    apply_mixer_patch(track, payload, applied, warnings, write_verification, tolerance_db)
    return {
        "ok": True,
        "return": return_track_detail(return_index, track),
        "applied": applied,
        "writeVerification": write_verification,
        "warnings": warnings
    }


def delete_return_track(song, payload):
    return_index = parse_non_negative_integer(payload.get("returnIndex"), "returnIndex")
    returns = list(getattr(song, "return_tracks", []))
    if return_index >= len(returns):
        raise BridgeHttpError("returnIndex is outside the available return track range", 404)

    delete = getattr(song, "delete_return_track", None)
    if delete is None:
        raise BridgeHttpError("Ableton Live API does not expose return track deletion", 501)

    track = returns[return_index]
    deleted = return_track_detail(return_index, track)
    try:
        delete(track)
    except TypeError:
        delete(return_index)

    after = list(getattr(song, "return_tracks", []))
    if len(after) >= len(returns) and track in after:
        raise BridgeHttpError("Ableton Live API did not report a deleted return track", 501)

    return {
        "ok": True,
        "deleted": True,
        "return": deleted,
        "returnIndex": return_index,
        "count": len(after)
    }


def modify_master_track(song, payload):
    master = song.master_track
    applied = {}
    warnings = []
    mixer = master.mixer_device
    write_verification = {}
    tolerance_db = write_tolerance_db(payload)

    if "volumeDb" in payload:
        db = require_number_range(payload.get("volumeDb"), "volumeDb", -70, 12)
        applied["volumeDb"] = {
            "requested": db,
            "value": set_parameter_value(mixer.volume, db_to_live_volume(db), False)
        }
        write_verification["volumeDb"] = verify_db_write(db, mixer.volume, tolerance_db)
        append_verification_warning(warnings, "volumeDb", write_verification["volumeDb"])
    if "pan" in payload:
        pan = require_number_range(payload.get("pan"), "pan", -1, 1)
        applied["pan"] = set_parameter_value(mixer.panning, pan, False)
    if "cueVolumeDb" in payload:
        db = require_number_range(payload.get("cueVolumeDb"), "cueVolumeDb", -70, 12)
        if hasattr(mixer, "cue_volume"):
            applied["cueVolumeDb"] = {
                "requested": db,
                "value": set_parameter_value(mixer.cue_volume, db_to_live_volume(db), False)
            }
            write_verification["cueVolumeDb"] = verify_db_write(db, mixer.cue_volume, tolerance_db)
            append_verification_warning(warnings, "cueVolumeDb", write_verification["cueVolumeDb"])
        else:
            warnings.append("Master cue volume is not exposed by this Ableton Live API")
    if "muted" in payload:
        require_bool(payload.get("muted"), "muted")
        warnings.append("Master mute is not exposed by this Ableton Live API")
    if "solo" in payload:
        require_bool(payload.get("solo"), "solo")
        warnings.append("Master solo is not exposed by this Ableton Live API")

    return {
        "ok": True,
        "master": master_track_detail(master),
        "applied": applied,
        "writeVerification": write_verification,
        "warnings": warnings
    }


def routing_buses(song):
    returns = [return_track_detail(index, track) for index, track in enumerate(getattr(song, "return_tracks", []))]
    tracks = []
    for index, track in enumerate(song.tracks):
        tracks.append({
            "trackIndex": index,
            "name": getattr(track, "name", ""),
            "inputRouting": routing_name(getattr(track, "current_input_routing", None)),
            "outputRouting": routing_name(getattr(track, "current_output_routing", None)),
            "availableInputs": routing_names(getattr(track, "available_input_routing_types", [])),
            "availableOutputs": routing_names(getattr(track, "available_output_routing_types", []))
        })
    return {
        "ok": True,
        "master": master_track_detail(song.master_track),
        "returns": returns,
        "buses": [{"name": "Master", "type": "master"}] + [
            {"name": track["name"], "type": "return", "returnIndex": track["index"]} for track in returns
        ],
        "trackRouting": tracks
    }


def list_meters(song, meter_cache=None):
    if meter_cache is not None:
        meter_cache.sync(song)
    warnings = []
    tracks = []
    returns = []
    for index, track in enumerate(song.tracks):
        tracks.append(meter_target(index, track, "tracks[%s]" % index, track_type(track), meter_cache))
        warnings.extend(tracks[-1]["warnings"])
    for index, track in enumerate(getattr(song, "return_tracks", [])):
        returns.append(meter_target(index, track, "returns[%s]" % index, "return", meter_cache))
        warnings.extend(returns[-1]["warnings"])
    master = master_meter_target(song.master_track, meter_cache)
    warnings.extend(master["warnings"])
    diagnostics = meter_cache.diagnostics() if meter_cache is not None else {
            "cacheEnabled": False,
            "staleAfterMs": 2000,
            "targetCount": 0,
            "listenerCount": 0,
            "listenerErrorCount": 0,
            "observedTargetCount": 0,
            "listenerObservedTargetCount": 0,
            "displayPollObservedTargetCount": 0,
            "signalTargetCount": 0,
            "signalEverObserved": False,
            "lastSignalAtMs": None,
            "pollCount": 0,
            "pollErrorCount": 0,
            "pollTargetCount": 0,
            "pollSkippedTargetCount": 0,
            "lastPollAtMs": None
        }
    capability = meter_capability(song, diagnostics)
    return {
        "ok": True,
        "reliableForMixing": capability["reliableForMixing"],
        "meterCapability": capability,
        "meterCache": diagnostics,
        "tracks": tracks,
        "returns": returns,
        "master": master,
        "warnings": warnings
    }


def meter_target(index, track, label, target_type, meter_cache=None):
    cache_target_type = "return" if target_type == "return" else "track"
    snapshot = read_output_meter(track, label, meter_cache, cache_target_type, index)
    return {
        "index": index,
        "name": getattr(track, "name", ""),
        "type": target_type,
        "meter": snapshot["meter"],
        "meterSource": snapshot.get("meterSource"),
        "meterObserved": snapshot.get("meterObserved"),
        "meterUpdatedAtMs": snapshot.get("meterUpdatedAtMs"),
        "meterAgeMs": snapshot.get("meterAgeMs"),
        "warnings": snapshot["warnings"]
    }


def master_meter_target(track, meter_cache=None):
    snapshot = read_output_meter(track, "master", meter_cache, "master", None)
    return {
        "name": getattr(track, "name", "Master"),
        "type": "master",
        "meter": snapshot["meter"],
        "meterSource": snapshot.get("meterSource"),
        "meterObserved": snapshot.get("meterObserved"),
        "meterUpdatedAtMs": snapshot.get("meterUpdatedAtMs"),
        "meterAgeMs": snapshot.get("meterAgeMs"),
        "warnings": snapshot["warnings"]
    }


def read_output_meter(track, label, meter_cache=None, target_type="track", target_index=None):
    if meter_cache is not None:
        return meter_cache.snapshot(target_type, target_index, track, label)
    meter = {}
    warnings = []
    sources = {}
    observed = {}
    updated_at_ms = {}
    age_ms = {}
    for field, property_name in METER_PROPERTIES:
        value = read_meter_property(track, property_name)
        meter[field] = value
        sources[field] = "direct" if value is not None else "unavailable"
        observed[field] = False
        updated_at_ms[field] = None
        age_ms[field] = None
        if value is None:
            warnings.append("%s.meter.%s is not exposed by this Ableton Live API" % (label, field))
    return {
        "meter": meter,
        "meterSource": sources,
        "meterObserved": observed,
        "meterUpdatedAtMs": updated_at_ms,
        "meterAgeMs": age_ms,
        "warnings": warnings
    }


def meter_capability(song, diagnostics):
    active_session_playback = has_active_session_playback(song)
    signal_observed = bool(diagnostics.get("signalEverObserved"))
    poll_count = diagnostics.get("pollCount") or 0
    observed_count = diagnostics.get("observedTargetCount") or 0
    poll_errors = diagnostics.get("pollErrorCount") or 0

    if signal_observed:
        return {
            "status": "signal-observed",
            "reliableForMixing": True,
            "activeSessionPlayback": active_session_playback,
            "reason": "Live has produced at least one non-zero meter observation"
        }
    if poll_errors > 0:
        status = "polling-error"
        reason = "Live meter polling reported errors"
    elif active_session_playback and poll_count >= MINIMUM_ZERO_ONLY_POLLS and observed_count > 0:
        status = "zero-only-during-active-playback"
        reason = "Live returned only zero meter values while Session clips were playing"
    elif observed_count > 0:
        status = "zero-only-unverified"
        reason = "Live meter properties are observable but no non-zero signal has been seen"
    else:
        status = "unobserved"
        reason = "Live meter properties have not produced an observation"
    return {
        "status": status,
        "reliableForMixing": False,
        "activeSessionPlayback": active_session_playback,
        "reason": reason
    }


def has_active_session_playback(song):
    for track in list(getattr(song, "tracks", []) or []):
        for clip_slot in list(getattr(track, "clip_slots", []) or []):
            clip = getattr(clip_slot, "clip", None)
            if clip is not None and bool(getattr(clip, "is_playing", False)):
                return True
    return False


def apply_mixer_patch(track, payload, applied, warnings, write_verification, tolerance_db):
    mixer = track.mixer_device
    if "volumeDb" in payload:
        db = require_number_range(payload.get("volumeDb"), "volumeDb", -70, 12)
        applied["volumeDb"] = {
            "requested": db,
            "value": set_parameter_value(mixer.volume, db_to_live_volume(db), False)
        }
        write_verification["volumeDb"] = verify_db_write(db, mixer.volume, tolerance_db)
        append_verification_warning(warnings, "volumeDb", write_verification["volumeDb"])
    if "pan" in payload:
        pan = require_number_range(payload.get("pan"), "pan", -1, 1)
        applied["pan"] = set_parameter_value(mixer.panning, pan, False)
    if "muted" in payload:
        track.mute = require_bool(payload.get("muted"), "muted")
        applied["muted"] = bool(track.mute)
    if "solo" in payload:
        track.solo = require_bool(payload.get("solo"), "solo")
        applied["solo"] = bool(track.solo)


def apply_sends(song, track, sends, write_verification, tolerance_db, warnings):
    if not isinstance(sends, dict):
        raise BridgeHttpError("sends must be an object")
    return_tracks = list(getattr(song, "return_tracks", []))
    send_parameters = list(getattr(track.mixer_device, "sends", []) or [])
    applied = {}
    write_verification["sends"] = {}
    for name, value in sends.items():
        send_index = resolve_send_index(return_tracks, name)
        if send_index >= len(send_parameters):
            raise BridgeHttpError("send does not exist on track: %s" % name, 404)
        db = require_number_range(value, "sends.%s" % name, -70, 12)
        applied_name = getattr(return_tracks[send_index], "name", str(send_index)) if send_index < len(return_tracks) else str(send_index)
        applied[applied_name] = {
            "requested": db,
            "value": set_parameter_value(send_parameters[send_index], db_to_live_send(db), False)
        }
        write_verification["sends"][applied_name] = verify_db_write(db, send_parameters[send_index], tolerance_db)
        append_verification_warning(warnings, "sends.%s" % applied_name, write_verification["sends"][applied_name])
    return applied


def write_tolerance_db(payload):
    if "verifyToleranceDb" not in payload or payload.get("verifyToleranceDb") is None:
        return DEFAULT_WRITE_TOLERANCE_DB
    return require_number_range(payload.get("verifyToleranceDb"), "verifyToleranceDb", 0, 12)


def verify_db_write(requested, parameter, tolerance_db):
    observed = parameter_db_value(parameter)
    has_observed = isinstance(observed, (int, float)) and not isinstance(observed, bool)
    delta = observed - requested if has_observed else None
    return {
        "requested": requested,
        "observed": observed if has_observed else None,
        "display": parameter_display_value(parameter),
        "raw": parameter_value(parameter),
        "deltaDb": delta,
        "toleranceDb": tolerance_db,
        "withinTolerance": abs(delta) <= tolerance_db if delta is not None else False
    }


def append_verification_warning(warnings, name, verification):
    if verification.get("withinTolerance"):
        return
    if verification.get("observed") is None:
        warnings.append("%s write could not be verified from observed dB display" % name)
        return
    warnings.append("%s write target %s dB observed %s dB outside +/- %s dB tolerance" % (
        name,
        verification.get("requested"),
        verification.get("observed"),
        verification.get("toleranceDb")
    ))


def resolve_send_index(return_tracks, name):
    if isinstance(name, int):
        return name
    text = str(name).strip()
    if text.isdigit():
        return int(text)
    normalized = normalize(text)
    for index, return_track in enumerate(return_tracks):
        if normalize(getattr(return_track, "name", "")) == normalized:
            return index
    raise BridgeHttpError("Unknown return send: %s" % name, 404)


def parse_optional_create_return_index(payload, return_count):
    if "returnIndex" not in payload or payload.get("returnIndex") is None:
        return return_count
    return_index = parse_non_negative_integer(payload.get("returnIndex"), "returnIndex")
    if return_index > return_count:
        raise BridgeHttpError("returnIndex must be between 0 and current return count")
    return return_index


def resolve_created_return_track(before, after, created, requested_index):
    if created is not None and created in after:
        return created
    before_ids = set(id(track) for track in before)
    for track in after:
        if id(track) not in before_ids:
            return track
    if requested_index < len(after):
        return after[requested_index]
    return after[-1]


def set_routing(track, direction, requested):
    requested = require_non_empty_string(requested, "%sRouting" % direction)
    available_attr = "available_%s_routing_types" % direction
    current_attr = "current_%s_routing" % direction
    routing = resolve_routing(getattr(track, available_attr, []), requested)
    if routing is None:
        raise BridgeHttpError("%sRouting is not available: %s" % (direction, requested), 404)
    setattr(track, current_attr, routing)
    return routing_name(getattr(track, current_attr, None))


def resolve_routing(options, requested):
    normalized = normalize(requested)
    for option in options or []:
        if normalize(routing_name(option)) == normalized:
            return option
    return None


def set_parameter_value(parameter, value, normalized):
    from .live_devices import set_parameter_value as set_device_parameter_value
    return set_device_parameter_value(parameter, value, normalized)
