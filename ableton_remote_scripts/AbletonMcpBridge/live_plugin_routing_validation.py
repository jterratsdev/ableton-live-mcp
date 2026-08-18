from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError


MAX_RECEIVER_ROUTES = 64


def requested_tracks_by_name(tracks, requested_names):
    requested = set(requested_names)
    result = {}
    duplicates = set()
    for track in tracks:
        name = getattr(track, "name", "")
        if name not in requested:
            continue
        if name in result:
            duplicates.add(name)
        else:
            result[name] = track
    if duplicates:
        raise BridgeHttpError("Existing track name is ambiguous: %s" % sorted(duplicates)[0], 409)
    return result


def validated_routes(routes):
    if not isinstance(routes, list) or not 1 <= len(routes) <= MAX_RECEIVER_ROUTES:
        raise BridgeHttpError("routes must contain between 1 and %s entries" % MAX_RECEIVER_ROUTES)
    output_channels = set()
    track_names = set()
    validated = []
    for index, route in enumerate(routes):
        if not isinstance(route, dict):
            raise BridgeHttpError("routes[%s] must be an object" % index)
        output_channel = required_non_empty_string(
            route.get("outputChannel"),
            "routes[%s].outputChannel" % index
        )
        track_name = required_non_empty_string(
            route.get("trackName"),
            "routes[%s].trackName" % index
        )
        _require_unique(output_channels, output_channel, "outputChannel")
        _require_unique(track_names, track_name, "trackName")
        validated.append({"outputChannel": output_channel, "trackName": track_name})
    return validated


def required_non_empty_string(value, name):
    result = optional_non_empty_string(value, name)
    if result is None:
        raise BridgeHttpError("%s must be a non-empty string" % name)
    return result


def optional_non_empty_string(value, name):
    if value is None:
        return None
    if not isinstance(value, str) or value.strip() == "":
        raise BridgeHttpError("%s must be a non-empty string" % name)
    return value.strip()


def _require_unique(values, value, name):
    if value in values:
        raise BridgeHttpError("routes contains duplicate %s: %s" % (name, value))
    values.add(value)
