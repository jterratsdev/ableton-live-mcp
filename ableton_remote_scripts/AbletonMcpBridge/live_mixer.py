from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_core import (
    db_to_live_send,
    db_to_live_volume,
    normalize,
    parameter_value,
    parse_non_negative_integer,
    require_bool,
    require_non_empty_string,
    require_number_range
)
from .live_summaries import device_summary, master_track_detail, return_track_detail, routing_name, routing_names, track_detail, track_type


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

    if "name" in payload:
        name = require_non_empty_string(payload.get("name"), "name")
        track.name = name
        applied["name"] = track.name
    if "color" in payload and hasattr(track, "color"):
        track.color = payload.get("color")
        applied["color"] = track.color
    apply_mixer_patch(track, payload, applied, warnings)
    if "armed" in payload:
        if not hasattr(track, "arm"):
            warnings.append("Track does not support arm")
        else:
            track.arm = require_bool(payload.get("armed"), "armed")
            applied["armed"] = bool(track.arm)
    if "sends" in payload:
        applied["sends"] = apply_sends(song, track, payload.get("sends"))
    if "inputRouting" in payload:
        applied["inputRouting"] = set_routing(track, "input", payload.get("inputRouting"))
    if "outputRouting" in payload:
        applied["outputRouting"] = set_routing(track, "output", payload.get("outputRouting"))

    return {
        "ok": True,
        "track": track_detail(track_index, track),
        "applied": applied,
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

    if "name" in payload:
        name = require_non_empty_string(payload.get("name"), "name")
        track.name = name
        applied["name"] = track.name
    apply_mixer_patch(track, payload, applied, warnings)
    return {
        "ok": True,
        "return": return_track_detail(return_index, track),
        "applied": applied,
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

    if "volumeDb" in payload:
        db = require_number_range(payload.get("volumeDb"), "volumeDb", -70, 12)
        applied["volumeDb"] = {
            "requested": db,
            "value": set_parameter_value(mixer.volume, db_to_live_volume(db), False)
        }
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


def list_meters(song):
    warnings = []
    tracks = []
    returns = []
    for index, track in enumerate(song.tracks):
        tracks.append(meter_target(index, track, "tracks[%s]" % index, track_type(track)))
        warnings.extend(tracks[-1]["warnings"])
    for index, track in enumerate(getattr(song, "return_tracks", [])):
        returns.append(meter_target(index, track, "returns[%s]" % index, "return"))
        warnings.extend(returns[-1]["warnings"])
    master = master_meter_target(song.master_track)
    warnings.extend(master["warnings"])
    return {
        "ok": True,
        "tracks": tracks,
        "returns": returns,
        "master": master,
        "warnings": warnings
    }


def meter_target(index, track, label, target_type):
    snapshot = read_output_meter(track, label)
    return {
        "index": index,
        "name": getattr(track, "name", ""),
        "type": target_type,
        "meter": snapshot["meter"],
        "warnings": snapshot["warnings"]
    }


def master_meter_target(track):
    snapshot = read_output_meter(track, "master")
    return {
        "name": getattr(track, "name", "Master"),
        "type": "master",
        "meter": snapshot["meter"],
        "warnings": snapshot["warnings"]
    }


def read_output_meter(track, label):
    meter = {}
    warnings = []
    for field, property_name in METER_PROPERTIES:
        value = read_meter_property(track, property_name)
        meter[field] = value
        if value is None:
            warnings.append("%s.meter.%s is not exposed by this Ableton Live API" % (label, field))
    return {"meter": meter, "warnings": warnings}


def read_meter_property(track, property_name):
    try:
        value = getattr(track, property_name)
    except Exception:
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    return None


def apply_mixer_patch(track, payload, applied, warnings):
    mixer = track.mixer_device
    if "volumeDb" in payload:
        db = require_number_range(payload.get("volumeDb"), "volumeDb", -70, 12)
        applied["volumeDb"] = {
            "requested": db,
            "value": set_parameter_value(mixer.volume, db_to_live_volume(db), False)
        }
    if "pan" in payload:
        pan = require_number_range(payload.get("pan"), "pan", -1, 1)
        applied["pan"] = set_parameter_value(mixer.panning, pan, False)
    if "muted" in payload:
        track.mute = require_bool(payload.get("muted"), "muted")
        applied["muted"] = bool(track.mute)
    if "solo" in payload:
        track.solo = require_bool(payload.get("solo"), "solo")
        applied["solo"] = bool(track.solo)


def apply_sends(song, track, sends):
    if not isinstance(sends, dict):
        raise BridgeHttpError("sends must be an object")
    return_tracks = list(getattr(song, "return_tracks", []))
    send_parameters = list(getattr(track.mixer_device, "sends", []) or [])
    applied = {}
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
    return applied


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
