from __future__ import absolute_import, print_function

import re

from .http_bridge import BridgeHttpError


def first_query_value(query, key):
    values = query.get(key)
    if not values:
        return None
    return values[0]


def parse_non_negative_integer(value, name):
    if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    raise BridgeHttpError("%s must be a non-negative integer" % name)


def require_non_empty_string(value, name):
    if not isinstance(value, str) or value.strip() == "":
        raise BridgeHttpError("%s must be a non-empty string" % name)
    return value.strip()


def require_bool(value, name):
    if not isinstance(value, bool):
        raise BridgeHttpError("%s must be a boolean" % name)
    return value


def require_number_range(value, name, minimum, maximum):
    if not isinstance(value, (int, float)) or isinstance(value, bool) or value < minimum or value > maximum:
        raise BridgeHttpError("%s must be a number between %s and %s" % (name, minimum, maximum))
    return value


def normalize(value):
    if value is None:
        return ""
    return str(value).lower().replace("_", " ").strip()


def parameter_value(parameter):
    try:
        return parameter.value
    except Exception:
        return None


def parameter_display_value(parameter):
    try:
        return parameter.str_for_value(parameter.value)
    except Exception:
        try:
            return parameter.display_value
        except Exception:
            return None


def parameter_db_value(parameter):
    display = parameter_display_value(parameter)
    if not isinstance(display, str) or "dB" not in display:
        return None
    match = re.search(r"[-+]?\d+(?:\.\d+)?", display)
    if not match:
        return None
    try:
        return float(match.group(0))
    except Exception:
        return None


def parameter_bound(parameter, name):
    try:
        return getattr(parameter, name)
    except Exception:
        return None


def db_to_live_volume(db):
    if db <= -70:
        return 0
    return pow(10, db / 20.0)


def db_to_live_send(db):
    if db <= -70:
        return 0
    return pow(10, db / 20.0)
