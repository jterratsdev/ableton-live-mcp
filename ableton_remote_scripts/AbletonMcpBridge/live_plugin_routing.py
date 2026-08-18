from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_routing_options import (
    read_attribute as _read_attribute,
    resolve_routing as _resolve_routing,
    routing_contract as _routing_contract,
    routing_display_name as _routing_display_name,
    routing_identifier as _routing_identifier,
    same_routing as _same_routing,
    supports_attribute as _supports_attribute,
    unique_routing_display_names as _unique_routing_display_names,
)
from .live_plugin_routing_validation import (
    optional_non_empty_string as _optional_non_empty_string,
    requested_tracks_by_name as _requested_tracks_by_name,
    required_non_empty_string as _required_non_empty_string,
    validated_routes as _validated_routes,
)


MONITOR_IN_STATE = 0


def plan_plugin_output_routing(song, payload):
    source = _source_context(song, payload)
    channels = _observable_output_channels(song, source)
    prefix = _optional_non_empty_string(payload.get("receiverNamePrefix"), "receiverNamePrefix")
    if prefix is None:
        prefix = "%s - " % source["trackName"]
    receiver_required = None
    if not channels:
        receiver_required = _receiver_required_diagnostic(source["trackName"])
    return {
        "ok": True,
        "readOnly": True,
        "source": _source_summary(source),
        "discoveryStatus": "available" if channels else "receiver_required",
        "availableOutputChannels": channels,
        "proposedRoutes": [
            {"outputChannel": channel, "trackName": "%s%s" % (prefix, channel)}
            for channel in channels
        ],
        "receiverRequired": receiver_required
    }


def apply_plugin_output_routing(song, payload):
    source = _source_context(song, payload)
    routes = _validated_routes(payload.get("routes"))
    observable_channels = _observable_output_channels(song, source)
    if observable_channels:
        available = set(observable_channels)
        for route in routes:
            if route["outputChannel"] not in available:
                raise BridgeHttpError(
                    "outputChannel is not available: %s" % route["outputChannel"],
                    404
                )

    existing_by_name = _requested_tracks_by_name(
        song.tracks,
        [route["trackName"] for route in routes]
    )
    receiver_by_name = {}
    created_tracks = []
    for route in routes:
        existing = existing_by_name.get(route["trackName"])
        if existing is not None:
            receiver_by_name[route["trackName"]] = _verified_receiver(
                song, existing, source, route, False
            )

    try:
        for route in routes:
            if route["trackName"] in receiver_by_name:
                continue
            track = _create_audio_track(song)
            created_tracks.append(track)
            track.name = route["trackName"]
            _configure_receiver(track, source, route)
            receiver_by_name[route["trackName"]] = _verified_receiver(
                song, track, source, route, True
            )
    except Exception as error:
        rollback_errors = _rollback_created_tracks(song, created_tracks)
        if rollback_errors:
            raise BridgeHttpError(
                "%s; rollback failed: %s" % (error, "; ".join(rollback_errors)),
                500
            )
        raise

    receivers = [receiver_by_name[route["trackName"]] for route in routes]
    return {
        "ok": True,
        "source": _source_summary(source),
        "createdCount": len(created_tracks),
        "reusedCount": len(receivers) - len(created_tracks),
        "receivers": receivers
    }


def _source_context(song, payload):
    source_track_name = _required_non_empty_string(payload.get("sourceTrackName"), "sourceTrackName")
    device_name = _required_non_empty_string(payload.get("deviceName"), "deviceName")
    requested_routing_type = _required_non_empty_string(payload.get("sourceRoutingType"), "sourceRoutingType")
    matching = [track for track in song.tracks if getattr(track, "name", "") == source_track_name]
    if len(matching) != 1:
        raise BridgeHttpError(
            "sourceTrackName must match exactly one track: %s" % source_track_name,
            404
        )
    track = matching[0]
    if not any(getattr(device, "name", "") == device_name for device in getattr(track, "devices", []) or []):
        raise BridgeHttpError("deviceName is not present on source track: %s" % device_name, 404)
    context = {
        "track": track,
        "trackIndex": list(song.tracks).index(track),
        "trackName": source_track_name,
        "deviceName": device_name,
        "requestedRoutingType": requested_routing_type
    }
    context["routingOption"] = _source_routing_option(song, context)
    if context["routingOption"] is None:
        raise BridgeHttpError(
            "sourceRoutingType is not available: %s" % requested_routing_type,
            404
        )
    return context


def _observable_output_channels(song, source):
    channels = []
    seen = set()
    for track in song.tracks:
        if track is source["track"]:
            continue
        type_contract = _routing_contract(track, "type")
        if type_contract is None:
            continue
        source_option = _resolve_routing(
            type_contract["available"],
            source["requestedRoutingType"],
            allow_identifier=True
        )
        if source_option is None or not _same_routing(type_contract["current"], source_option):
            continue
        channel_contract = _routing_contract(track, "channel")
        if channel_contract is None:
            continue
        for label in _unique_routing_display_names(channel_contract["available"]):
            if label not in seen:
                seen.add(label)
                channels.append(label)
    return channels


def _configure_receiver(track, source, route):
    type_contract = _routing_contract(track, "type")
    if type_contract is None:
        raise BridgeHttpError("Audio track does not expose supported input routing type properties", 409)
    source_option = _resolve_routing(
        type_contract["available"],
        source["requestedRoutingType"],
        allow_identifier=True
    )
    if source_option is None:
        raise BridgeHttpError(
            "sourceRoutingType is not available: %s" % source["requestedRoutingType"],
            404
        )
    setattr(track, type_contract["currentAttribute"], source_option)

    channel_contract = _routing_contract(track, "channel")
    if channel_contract is None:
        raise BridgeHttpError("Audio track does not expose supported input routing channel properties", 409)
    channel_option = _resolve_routing(
        channel_contract["available"],
        route["outputChannel"],
        allow_identifier=False
    )
    if channel_option is None:
        raise BridgeHttpError("outputChannel is not available: %s" % route["outputChannel"], 404)
    try:
        setattr(track, channel_contract["currentAttribute"], channel_option)
    except Exception as error:
        raise BridgeHttpError(
            "Failed to route output channel: %s (%s)" % (route["outputChannel"], error),
            409
        )
    if not _supports_attribute(track, "current_monitoring_state"):
        raise BridgeHttpError("Audio track does not expose current_monitoring_state", 409)
    track.current_monitoring_state = MONITOR_IN_STATE


def _verified_receiver(song, track, source, route, created):
    type_contract = _routing_contract(track, "type")
    channel_contract = _routing_contract(track, "channel")
    observed_type = type_contract["current"] if type_contract else None
    observed_channel = channel_contract["current"] if channel_contract else None
    requested_type = source["requestedRoutingType"]
    type_matches = requested_type in (
        _routing_display_name(observed_type),
        _routing_identifier(observed_type)
    )
    channel_matches = _routing_display_name(observed_channel) == route["outputChannel"]
    monitoring_state = _read_attribute(track, "current_monitoring_state")
    if not type_matches or not channel_matches or monitoring_state != MONITOR_IN_STATE:
        raise BridgeHttpError(
            "Existing receiver track does not match requested routing: %s" % route["trackName"],
            409
        )
    return {
        "trackIndex": list(song.tracks).index(track),
        "trackName": getattr(track, "name", ""),
        "sourceRoutingType": _routing_display_name(observed_type),
        "sourceRoutingIdentifier": _routing_identifier(observed_type),
        "outputChannel": _routing_display_name(observed_channel),
        "monitoring": "In",
        "created": bool(created),
        "reused": not bool(created),
        "verified": True,
        "readback": {
            "inputRoutingType": _routing_display_name(observed_type),
            "inputRoutingIdentifier": _routing_identifier(observed_type),
            "inputRoutingChannel": _routing_display_name(observed_channel),
            "monitoringState": monitoring_state
        }
    }


def _create_audio_track(song):
    before = list(song.tracks)
    song.create_audio_track(len(before))
    after = list(song.tracks)
    created = [track for track in after if all(track is not previous for previous in before)]
    if len(created) != 1:
        raise BridgeHttpError("Live did not expose exactly one newly created audio track", 500)
    return created[0]


def _rollback_created_tracks(song, created_tracks):
    errors = []
    for created in reversed(created_tracks):
        try:
            tracks = list(song.tracks)
            index = next(index for index, track in enumerate(tracks) if track is created)
            song.delete_track(index)
        except StopIteration:
            continue
        except Exception as error:
            errors.append(str(error))
    return errors


def _source_summary(source):
    option = source.get("routingOption")
    return {
        "trackIndex": source["trackIndex"],
        "trackName": source["trackName"],
        "deviceName": source["deviceName"],
        "sourceRoutingType": _routing_display_name(option) or source["requestedRoutingType"],
        "sourceRoutingIdentifier": _routing_identifier(option)
    }


def _source_routing_option(song, source):
    for track in song.tracks:
        if track is source["track"]:
            continue
        contract = _routing_contract(track, "type")
        if contract is None:
            continue
        option = _resolve_routing(
            contract["available"],
            source["requestedRoutingType"],
            allow_identifier=True
        )
        if option is not None:
            return option
    return None


def _receiver_required_diagnostic(source_track_name):
    return {
        "required": True,
        "reason": "Live exposes plugin output-channel choices only for a receiver's currently selected input routing type.",
        "nextStep": "In Live, route one audio track's Audio From to %s, then run this read-only plan again." % source_track_name
    }
