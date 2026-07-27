from __future__ import absolute_import, print_function

import re

from .http_bridge import BridgeHttpError


NEGATIVE_INFINITY_DB = -70.0
DB_SEARCH_ITERATIONS = 48
RAW_RESTORE_TOLERANCE = 0.000001


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
    return parse_db_display(display)


def parse_db_display(display, negative_infinity_db=None):
    if not isinstance(display, str) or "db" not in display.lower():
        return None
    normalized = display.lower().replace("−", "-").replace("∞", "inf")
    if "-inf" in normalized and negative_infinity_db is not None:
        return float(negative_infinity_db)
    match = re.search(r"[-+]?\d+(?:\.\d+)?", normalized)
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


def parameter_display_for_raw(parameter, raw_value):
    try:
        return parameter.str_for_value(raw_value)
    except Exception:
        return None


def resolve_db_raw_value(parameter, requested_db, tolerance_db):
    minimum = parameter_bound(parameter, "min")
    maximum = parameter_bound(parameter, "max")
    if not _finite_number(minimum) or not _finite_number(maximum) or maximum <= minimum:
        raise BridgeHttpError("Live parameter does not expose a usable raw range for dB conversion", 422)
    if not callable(getattr(parameter, "str_for_value", None)):
        raise BridgeHttpError("Live parameter does not expose str_for_value for safe dB conversion", 422)

    floor_db = NEGATIVE_INFINITY_DB
    low = float(minimum)
    high = float(maximum)
    candidates = [_db_candidate(parameter, low, requested_db, floor_db), _db_candidate(parameter, high, requested_db, floor_db)]
    if candidates[0]["observedDb"] is None or candidates[1]["observedDb"] is None:
        raise BridgeHttpError("Live parameter display is not parseable as dB; write was not attempted", 422)

    ascending = candidates[1]["observedDb"] >= candidates[0]["observedDb"]
    for _ in range(DB_SEARCH_ITERATIONS):
        raw_value = (low + high) / 2.0
        candidate = _db_candidate(parameter, raw_value, requested_db, floor_db)
        if candidate["observedDb"] is None:
            raise BridgeHttpError("Live parameter display became unparseable during dB conversion; write was not attempted", 422)
        candidates.append(candidate)
        if candidate["observedDb"] == requested_db:
            break
        if (candidate["observedDb"] < requested_db) == ascending:
            low = raw_value
        else:
            high = raw_value

    best = min(candidates, key=lambda item: abs(item["deltaDb"]))
    if abs(best["deltaDb"]) > tolerance_db:
        raise BridgeHttpError(
            "Live parameter cannot resolve %s dB within +/- %s dB; write was not attempted" % (
                requested_db,
                tolerance_db
            ),
            422
        )
    return best


def write_verified_db(parameter, requested_db, tolerance_db):
    original_raw = parameter_value(parameter)
    if not _finite_number(original_raw):
        raise BridgeHttpError("Live parameter raw value is unavailable; dB write was not attempted", 422)
    resolved = resolve_db_raw_value(parameter, requested_db, tolerance_db)
    try:
        parameter.value = resolved["raw"]
    except Exception as error:
        raise BridgeHttpError("Live rejected the resolved dB raw value: %s" % error, 422)

    verification = verify_parameter_db_write(parameter, requested_db, resolved["raw"], tolerance_db)
    if verification["confirmed"]:
        return verification

    try:
        parameter.value = original_raw
    except Exception as rollback_error:
        raise BridgeHttpError(
            "dB write could not be verified and the original raw value could not be restored: %s" % rollback_error,
            500
        )
    restored_raw = parameter_value(parameter)
    if not _raw_values_equal(original_raw, restored_raw):
        raise BridgeHttpError(
            "dB write could not be verified and original raw value restoration failed readback "
            "(expected %s, observed %s)" % (original_raw, restored_raw),
            500
        )
    raise BridgeHttpError(
        "dB write could not be verified; original raw value was restored (requested %s dB, observed %s)" % (
            requested_db,
            verification["observedDisplay"]
        ),
        409
    )


def verify_parameter_db_write(parameter, requested_db, raw_written, tolerance_db):
    observed_raw = parameter_value(parameter)
    observed_display = parameter_display_value(parameter)
    floor_db = NEGATIVE_INFINITY_DB if requested_db <= NEGATIVE_INFINITY_DB else None
    observed_db = parse_db_display(observed_display, floor_db)
    delta_db = observed_db - requested_db if _finite_number(observed_db) else None
    confirmed = (
        _finite_number(observed_raw)
        and delta_db is not None
        and abs(delta_db) <= tolerance_db
    )
    return {
        "requestedDb": requested_db,
        "rawWritten": raw_written,
        "observedRaw": observed_raw if _finite_number(observed_raw) else None,
        "observedDisplay": observed_display,
        "observedDb": observed_db if _finite_number(observed_db) else None,
        "deltaDb": delta_db,
        "toleranceDb": tolerance_db,
        "confirmed": confirmed,
        # Backward-compatible aliases for 0.1.x clients.
        "requested": requested_db,
        "raw": observed_raw if _finite_number(observed_raw) else None,
        "observed": observed_db if _finite_number(observed_db) else None,
        "display": observed_display,
        "withinTolerance": confirmed
    }


def _db_candidate(parameter, raw_value, requested_db, floor_db):
    display = parameter_display_for_raw(parameter, raw_value)
    observed_db = parse_db_display(display, floor_db)
    return {
        "raw": raw_value,
        "display": display,
        "observedDb": observed_db,
        "deltaDb": observed_db - requested_db if observed_db is not None else None
    }


def _finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value == value and value not in (float("inf"), float("-inf"))


def _raw_values_equal(expected, observed):
    return (
        _finite_number(expected)
        and _finite_number(observed)
        and abs(float(expected) - float(observed)) <= RAW_RESTORE_TOLERANCE
    )
