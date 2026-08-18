from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError


def routing_contract(track, kind):
    if kind == "type":
        candidates = (
            ("available_input_routing_types", "input_routing_type"),
            ("input_routings", "current_input_routing")
        )
    else:
        candidates = (
            ("available_input_routing_channels", "input_routing_channel"),
            ("input_sub_routings", "current_input_sub_routing")
        )
    for available_attribute, current_attribute in candidates:
        available = read_attribute(track, available_attribute)
        if available is None or not supports_attribute(track, current_attribute):
            continue
        return {
            "available": list(available or []),
            "current": read_attribute(track, current_attribute),
            "currentAttribute": current_attribute
        }
    return None


def resolve_routing(options, requested, allow_identifier):
    options = list(options or [])
    if allow_identifier:
        identifier_matches = [
            option for option in options if routing_identifier(option) == requested
        ]
        if identifier_matches:
            return identifier_matches[0]
    display_matches = [
        option for option in options if routing_display_name(option) == requested
    ]
    if len(display_matches) < 2:
        return display_matches[0] if display_matches else None
    identifiers = [routing_identifier(option) for option in display_matches]
    if all(identifier is not None for identifier in identifiers) and len(set(identifiers)) == 1:
        return display_matches[0]
    raise BridgeHttpError(
        "routing display name is ambiguous: %s; use an exact identifier when supported" % requested,
        409
    )


def unique_routing_display_names(options):
    options = list(options or [])
    labels = []
    seen = set()
    for option in options:
        label = routing_display_name(option)
        if not label or label in seen:
            continue
        resolve_routing(options, label, allow_identifier=False)
        seen.add(label)
        labels.append(label)
    return labels


def same_routing(left, right):
    left_identifier = routing_identifier(left)
    right_identifier = routing_identifier(right)
    if left_identifier is not None and right_identifier is not None:
        return left_identifier == right_identifier
    return routing_display_name(left) == routing_display_name(right)


def routing_display_name(option):
    if isinstance(option, dict):
        return option.get("display_name") or option.get("displayName") or option.get("name")
    if isinstance(option, str):
        return option
    return getattr(option, "display_name", None) or getattr(option, "name", None)


def routing_identifier(option):
    if isinstance(option, dict):
        return option.get("identifier")
    return getattr(option, "identifier", None)


def supports_attribute(target, name):
    try:
        getattr(target, name)
        return True
    except AttributeError:
        return False


def read_attribute(target, name):
    try:
        return getattr(target, name)
    except AttributeError:
        return None
