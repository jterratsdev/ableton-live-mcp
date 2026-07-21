from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_browser import first_browser_item
from .live_core import normalize, parameter_bound, parameter_value, parse_non_negative_integer, require_number_range
from .live_mixer import get_track
from .live_summaries import parameter_summary

DEVICE_TARGETS = ("track", "return", "master")


def set_device_parameter(song, payload):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    track = get_track(song, track_index)
    device = resolve_device(track, payload)
    parameter_name = payload.get("parameter")
    if not isinstance(parameter_name, str) or parameter_name.strip() == "":
        raise BridgeHttpError("parameter must be a non-empty string")
    parameter = resolve_parameter(device, parameter_name)
    previous = parameter_value(parameter)
    requested = payload.get("normalizedValue") if "normalizedValue" in payload else payload.get("value")
    if not isinstance(requested, (int, float)) or isinstance(requested, bool):
        raise BridgeHttpError("value or normalizedValue must be a number")
    applied = set_parameter_value(parameter, requested, "normalizedValue" in payload)
    return {
        "ok": True,
        "parameter": {
            "trackIndex": track_index,
            "deviceIndex": list(track.devices).index(device),
            "deviceName": getattr(device, "name", ""),
            "parameter": getattr(parameter, "name", parameter_name),
            "previousValue": previous,
            "value": applied
        }
    }


def get_device_parameters(song, payload):
    track_index = parse_non_negative_integer(payload.get("trackIndex"), "trackIndex")
    track = get_track(song, track_index)
    devices = resolve_devices(track, payload)
    return {
        "ok": True,
        "track": {"index": track_index, "name": getattr(track, "name", "")},
        "count": len(devices),
        "devices": [device_parameter_inventory(device_index, device) for device_index, device in devices]
    }


def load_master_device(song, browser, payload):
    query = payload.get("query")
    kind = payload.get("kind") or "audio_effect"
    position = payload.get("position") or "append"
    if not isinstance(query, str) or query.strip() == "":
        raise BridgeHttpError("query must be a non-empty string")
    if position not in ("append", "prepend"):
        raise BridgeHttpError("position must be append or prepend")
    warnings = []
    if position == "prepend":
        warnings.append("Ableton browser.load_item appends to the master chain; prepend requires device reorder support")

    item = first_browser_item(browser, query, kind)
    if item is None:
        raise BridgeHttpError("No loadable browser item found for master query: %s" % query, 404)

    master = song.master_track
    before = len(list(master.devices))
    song.view.selected_track = master
    try:
        browser.load_item(item)
    except Exception as error:
        raise BridgeHttpError("Unable to load master device %s: %s" % (query, error), 500)

    devices = list(master.devices)
    loaded_index = len(devices) - 1 if len(devices) > before else None
    loaded_device = devices[loaded_index] if loaded_index is not None else None
    if loaded_device is None:
        raise BridgeHttpError("Ableton did not report a newly loaded master device: %s" % query, 500)

    return {
        "ok": True,
        "device": {
            "target": "master",
            "query": query,
            "kind": kind,
            "position": position,
            "selectedDevice": getattr(item, "name", query),
            "rationale": payload.get("rationale"),
            "loadedDevice": {
                "index": loaded_index,
                "name": getattr(loaded_device, "name", getattr(item, "name", query)),
                "kind": getattr(loaded_device, "class_name", kind)
            }
        },
        "warnings": warnings
    }


def delete_device(song, payload):
    target = resolve_device_chain(song, payload)
    device_index = resolve_device_index(target["devices"], payload.get("deviceIndex"), "deviceIndex")
    chain = target["chain"]
    delete = getattr(chain, "delete_device", None)
    if delete is None:
        raise BridgeHttpError("Ableton Live API does not expose delete_device for this chain", 501)

    device = target["devices"][device_index]
    deleted = device_chain_summary(device_index, device)
    try:
        delete(device_index)
    except Exception as error:
        raise BridgeHttpError("Ableton Live API failed to delete device: %s" % error, 500)

    after = list(getattr(chain, "devices", []) or [])
    if len(after) >= len(target["devices"]) and device in after:
        raise BridgeHttpError("Ableton Live API did not report a deleted device", 501)

    return {
        "ok": True,
        "deleted": True,
        "location": target["location"],
        "device": deleted,
        "deviceIndex": device_index,
        "count": len(after),
        "devices": [device_chain_summary(index, candidate) for index, candidate in enumerate(after)]
    }


def reorder_device(song, payload):
    target = resolve_device_chain(song, payload)
    device_index = resolve_device_index(target["devices"], payload.get("deviceIndex"), "deviceIndex")
    to_index = resolve_device_index(target["devices"], payload.get("toIndex"), "toIndex")
    if device_index == to_index:
        raise BridgeHttpError("toIndex must be different from deviceIndex")
    raise BridgeHttpError("Ableton Live API does not expose a reliable device reorder operation for track, return, or master chains", 501)


def delete_first_instrument(track):
    for index, device in enumerate(track.devices):
        class_name = getattr(device, "class_name", "").lower()
        if "instrument" in class_name or index == 0:
            try:
                track.delete_device(index)
            except Exception:
                pass
            return


def resolve_device(track, payload):
    devices = list(track.devices)
    if "deviceIndex" in payload and payload.get("deviceIndex") is not None:
        device_index = parse_non_negative_integer(payload.get("deviceIndex"), "deviceIndex")
        if device_index >= len(devices):
            raise BridgeHttpError("deviceIndex is outside the available device range", 404)
        return devices[device_index]
    if "deviceName" in payload and payload.get("deviceName"):
        requested = normalize(payload.get("deviceName"))
        for device in devices:
            if normalize(getattr(device, "name", "")) == requested:
                return device
        raise BridgeHttpError("deviceName does not match a device on the track", 404)
    raise BridgeHttpError("deviceIndex or deviceName is required")


def resolve_devices(track, payload):
    devices = list(track.devices)
    has_device_index = payload.get("deviceIndex") is not None and payload.get("deviceIndex") != ""
    has_device_name = isinstance(payload.get("deviceName"), str) and payload.get("deviceName").strip() != ""
    if not has_device_index and not has_device_name:
        return list(enumerate(devices))
    device = resolve_device(track, payload)
    return [(devices.index(device), device)]


def resolve_device_chain(song, payload):
    location = normalized_location(payload)
    if location["target"] == "track":
        track_index = parse_non_negative_integer(location.get("trackIndex"), "trackIndex")
        track = get_track(song, track_index)
        return {
            "location": {"target": "track", "trackIndex": track_index},
            "chain": track,
            "devices": list(getattr(track, "devices", []) or [])
        }

    if location["target"] == "return":
        return_index = parse_non_negative_integer(location.get("returnIndex"), "returnIndex")
        returns = list(getattr(song, "return_tracks", []) or [])
        if return_index >= len(returns):
            raise BridgeHttpError("returnIndex is outside the available return track range", 404)
        return {
            "location": {"target": "return", "returnIndex": return_index},
            "chain": returns[return_index],
            "devices": list(getattr(returns[return_index], "devices", []) or [])
        }

    master = song.master_track
    return {
        "location": {"target": "master"},
        "chain": master,
        "devices": list(getattr(master, "devices", []) or [])
    }


def normalized_location(payload):
    raw = payload.get("location") if isinstance(payload.get("location"), dict) else payload
    target = raw.get("target")
    if target not in DEVICE_TARGETS:
        raise BridgeHttpError("location.target must be track, return, or master")
    return {
        "target": target,
        "trackIndex": raw.get("trackIndex", payload.get("trackIndex")),
        "returnIndex": raw.get("returnIndex", payload.get("returnIndex"))
    }


def resolve_device_index(devices, value, name):
    index = parse_non_negative_integer(value, name)
    if index >= len(devices):
        raise BridgeHttpError("%s is outside the available device range" % name, 404)
    return index


def device_chain_summary(device_index, device):
    return {
        "index": device_index,
        "name": getattr(device, "name", ""),
        "kind": getattr(device, "class_name", device.__class__.__name__)
    }


def device_parameter_inventory(device_index, device):
    parameters = [parameter_summary(parameter) for parameter in getattr(device, "parameters", []) or []]
    return {
        "index": device_index,
        "name": getattr(device, "name", ""),
        "kind": getattr(device, "class_name", device.__class__.__name__),
        "parameterCount": len(parameters),
        "parameters": parameters
    }


def resolve_parameter(device, parameter_name):
    normalized = normalize(parameter_name)
    for parameter in getattr(device, "parameters", []) or []:
        if normalize(getattr(parameter, "name", "")) == normalized:
            return parameter
    raise BridgeHttpError("parameter does not exist on device: %s" % parameter_name, 404)


def apply_device_settings(device, settings):
    if not isinstance(settings, dict):
        return {"applied": {}, "warnings": ["settings must be an object"]}
    applied = {}
    warnings = []
    for name, value in settings.items():
        try:
            parameter = resolve_parameter(device, name)
            applied[getattr(parameter, "name", name)] = set_parameter_value(parameter, value, False)
        except BridgeHttpError as error:
            warnings.append(str(error))
    return {"applied": applied, "warnings": warnings}


def set_parameter_value(parameter, value, normalized):
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise BridgeHttpError("parameter value must be a number")
    if normalized:
        value = require_number_range(value, "normalizedValue", 0, 1)
        minimum = parameter_bound(parameter, "min")
        maximum = parameter_bound(parameter, "max")
        if isinstance(minimum, (int, float)) and isinstance(maximum, (int, float)):
            value = minimum + ((maximum - minimum) * value)
    minimum = parameter_bound(parameter, "min")
    maximum = parameter_bound(parameter, "max")
    if isinstance(minimum, (int, float)) and value < minimum:
        value = minimum
    if isinstance(maximum, (int, float)) and value > maximum:
        value = maximum
    parameter.value = value
    return parameter_value(parameter)
