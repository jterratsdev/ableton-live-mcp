from __future__ import absolute_import, print_function

import inspect
import math

from .http_bridge import BridgeHttpError


FIELDS = (
    "tempo", "tempo_enabled", "time_signature_numerator",
    "time_signature_denominator", "time_signature_enabled"
)
DENOMINATORS = (1, 2, 4, 8, 16, 32)
FAMILIES = {
    "tempo": "tempo", "tempo_enabled": "tempo",
    "time_signature_numerator": "timeSignature",
    "time_signature_denominator": "timeSignature",
    "time_signature_enabled": "timeSignature"
}


def parse_scene_index_query(query):
    if not isinstance(query, dict) or set(query.keys()) != set(("sceneIndex",)):
        fail("invalid_request", "sceneIndex must be exactly one non-negative decimal integer", 400)
    values = query.get("sceneIndex")
    if not isinstance(values, list) or len(values) != 1:
        fail("invalid_request", "sceneIndex must be exactly one non-negative decimal integer", 400)
    text = values[0]
    if not isinstance(text, str) or not text or (text != "0" and (text.startswith("0") or not text.isdigit())):
        fail("invalid_request", "sceneIndex must be exactly one non-negative decimal integer", 400)
    return int(text)


def scene_tempo_signature_capabilities(song, scene_index):
    scene_index = exact_scene_index(scene_index)
    before = observe_target(song, scene_index)
    after = observe_target(song, scene_index)
    if before["targetFingerprint"] != after["targetFingerprint"] or before["observed"] != after["observed"]:
        fail("scene_target_changed", "Read-only Scene capability probing changed observable target state", 409)
    result = {"ok": True, "readOnly": True}
    result.update(after)
    return result


def set_scene_tempo_signature_overrides(song, payload):
    request = validate_request(payload)
    pinned_scene, before = capture_target(song, request["sceneIndex"])
    missing = required_capability_failures(before["capabilities"], request)
    if missing:
        fail("scene_override_unsupported", "Scene override request requires unavailable properties", 501, {
            "target": before["target"], "requested": requested_actions(request),
            "missingRequirements": missing, "capabilities": before["capabilities"]
        })

    writes = planned_writes(before["observed"], request)
    journal = []
    original_failure = None
    try:
        for field, family, value in writes:
            entry = {"field": field, "family": family, "invocationOrder": len(journal) + 1, "outcome": "attempted"}
            journal.append(entry)
            try:
                setattr(pinned_scene, field, value)
                entry["outcome"] = "returned"
            except Exception as error:
                entry["outcome"] = "failed"
                raise OperationFailure("setter", field, safe_message(error, "Scene setter failed"))

        try:
            after = observe_target(song, request["sceneIndex"])
        except Exception as error:
            raise OperationFailure("target_reresolution", None, safe_message(error, "Scene target resolution failed"))
        verify_target(before, after)
        verify_requested(after["observed"], request)
        changed_fields = [entry["field"] for entry in journal if entry["outcome"] == "returned"]
        return {
            "ok": True, "target": after["target"], "requested": requested_actions(request),
            "status": "changed" if journal else "no-op", "changed": bool(journal), "noOp": not bool(journal),
            "changedFields": changed_fields, "observed": after["observed"], "capabilities": after["capabilities"]
        }
    except OperationFailure as error:
        original_failure = error.payload
    except Exception as error:
        original_failure = {"stage": "verification", "field": None, "message": safe_message(error, "Scene verification failed")}

    if not journal:
        fail("scene_target_changed", original_failure["message"], 409, {
            "target": before["target"], "requested": requested_actions(request), "originalFailure": original_failure
        })
    raise transaction_error(song, pinned_scene, request, before, journal, original_failure)


def observe_target(song, scene_index):
    return capture_target(song, scene_index)[1]


def capture_target(song, scene_index):
    scenes = list(song.scenes)
    if scene_index >= len(scenes):
        fail("scene_not_found", "sceneIndex %s does not exist" % scene_index, 404)
    scene = scenes[scene_index]
    return scene, observe_resolved_target(scene, scene_index, len(scenes))


def observe_resolved_target(scene, scene_index, scene_count):
    field_capabilities = {}
    raw = {}
    for field in FIELDS:
        probed, value = probe_property(scene, field)
        field_capabilities[field] = probed
        if not probed["readable"]:
            raw[field] = None
            continue
        raw[field] = value
    validate_sentinels(field_capabilities, raw)
    name = safe_name(scene)
    return {
        "target": {"sceneIndex": scene_index, "name": name},
        "targetFingerprint": {
            "sceneIndex": scene_index, "sceneCount": scene_count, "name": name,
            "propertyShape": property_shape(field_capabilities)
        },
        "capabilities": capability_projection(field_capabilities),
        "observed": observed_projection(raw, field_capabilities)
    }


def probe_property(scene, field):
    try:
        descriptor = inspect.getattr_static(scene, field)
    except Exception as error:
        return capability(False, False, safe_message(error, "%s descriptor is unavailable" % field)), None

    writable = False
    try:
        if isinstance(descriptor, property):
            writable = callable(descriptor.fset)
        else:
            writable = callable(getattr(descriptor, "__set__", None))
    except Exception:
        writable = False
    try:
        value = getattr(scene, field)
        validate_raw_field(field, value)
        readable = True
        reason = None
    except Exception as error:
        readable = False
        reason = safe_message(error, "%s getter is unavailable" % field)
    if not writable and reason is None:
        reason = "%s does not expose a structurally writable descriptor" % field
    return capability(readable, writable, reason), value if readable else None


def validate_request(payload):
    if not isinstance(payload, dict):
        fail("invalid_request", "request must be an object", 400)
    exact_keys(payload, ("sceneIndex", "tempo", "timeSignature"), "request")
    scene_index = exact_scene_index(payload.get("sceneIndex"))
    if "tempo" not in payload and "timeSignature" not in payload:
        fail("invalid_request", "tempo or timeSignature is required", 400)
    result = {"sceneIndex": scene_index}
    if "tempo" in payload:
        result["tempo"] = validate_tempo_action(payload["tempo"])
    if "timeSignature" in payload:
        result["timeSignature"] = validate_signature_action(payload["timeSignature"])
    return result


def validate_tempo_action(action):
    if not isinstance(action, dict):
        fail("invalid_request", "tempo must be an object", 400)
    if action.get("action") == "set":
        exact_keys(action, ("action", "bpm"), "tempo")
        bpm = action.get("bpm")
        if isinstance(bpm, bool) or not isinstance(bpm, (int, float)) or not finite(bpm) or bpm < 20 or bpm > 999:
            fail("invalid_request", "tempo.bpm must be a finite number between 20 and 999", 400)
        return {"action": "set", "bpm": bpm}
    if action.get("action") == "clear":
        exact_keys(action, ("action",), "tempo")
        return {"action": "clear"}
    fail("invalid_request", "tempo.action must be set or clear", 400)


def validate_signature_action(action):
    if not isinstance(action, dict):
        fail("invalid_request", "timeSignature must be an object", 400)
    if action.get("action") == "set":
        exact_keys(action, ("action", "numerator", "denominator"), "timeSignature")
        numerator = action.get("numerator")
        denominator = action.get("denominator")
        if isinstance(numerator, bool) or not isinstance(numerator, int) or numerator < 1 or numerator > 32:
            fail("invalid_request", "timeSignature.numerator must be an integer between 1 and 32", 400)
        if isinstance(denominator, bool) or denominator not in DENOMINATORS:
            fail("invalid_request", "timeSignature.denominator must be one of 1, 2, 4, 8, 16, or 32", 400)
        return {"action": "set", "numerator": numerator, "denominator": denominator}
    if action.get("action") == "clear":
        exact_keys(action, ("action",), "timeSignature")
        return {"action": "clear"}
    fail("invalid_request", "timeSignature.action must be set or clear", 400)


def required_capability_failures(capabilities, request):
    requirements = []
    if request.get("tempo"):
        requirements.extend((
            ("tempo", capabilities["tempo"], True, request["tempo"]["action"] == "set"),
            ("tempo_enabled", capabilities["tempoEnabled"], True, True)
        ))
    if request.get("timeSignature"):
        requirements.extend((
            ("time_signature_numerator", capabilities["timeSignature"]["components"]["numerator"], True, request["timeSignature"]["action"] == "set"),
            ("time_signature_denominator", capabilities["timeSignature"]["components"]["denominator"], True, request["timeSignature"]["action"] == "set"),
            ("time_signature_enabled", capabilities["timeSignatureEnabled"], True, True)
        ))
    missing = []
    for field, value, needs_read, needs_write in requirements:
        if needs_read and not value["readable"]:
            missing.append({"field": field, "requirement": "readable", "reason": value["reason"]})
        if needs_write and not value["writable"]:
            missing.append({"field": field, "requirement": "writable", "reason": value["reason"]})
    return missing


def planned_writes(observed, request):
    writes = []
    tempo = request.get("tempo")
    if tempo and tempo["action"] == "set":
        if observed["tempo"]["raw"]["value"] != tempo["bpm"]:
            writes.append(("tempo", "tempo", tempo["bpm"]))
        if observed["tempo"]["raw"]["enabled"] is not True:
            writes.append(("tempo_enabled", "tempo", True))
    elif tempo and observed["tempo"]["raw"]["enabled"] is not False:
        writes.append(("tempo_enabled", "tempo", False))
    signature = request.get("timeSignature")
    if signature and signature["action"] == "set":
        if observed["timeSignature"]["raw"]["numerator"] != signature["numerator"]:
            writes.append(("time_signature_numerator", "timeSignature", signature["numerator"]))
        if observed["timeSignature"]["raw"]["denominator"] != signature["denominator"]:
            writes.append(("time_signature_denominator", "timeSignature", signature["denominator"]))
        if observed["timeSignature"]["raw"]["enabled"] is not True:
            writes.append(("time_signature_enabled", "timeSignature", True))
    elif signature and observed["timeSignature"]["raw"]["enabled"] is not False:
        writes.append(("time_signature_enabled", "timeSignature", False))
    return writes


def transaction_error(song, pinned_scene, request, before, journal, original_failure):
    failures = []
    hidden = []
    for entry in reversed(journal):
        restoration_value, is_hidden = restoration(before["observed"], entry["field"])
        if is_hidden:
            hidden.append({"family": entry["family"], "observable": False, "reason": "disabled pre-state hides the retained value"})
            if entry["outcome"] != "failed":
                entry["outcome"] = "compensated"
            continue
        try:
            setattr(pinned_scene, entry["field"], restoration_value)
            entry["outcome"] = "compensated"
        except Exception as error:
            entry["outcome"] = "compensation-failed"
            failures.append({"stage": "setter", "field": entry["field"], "message": safe_message(error, "compensation failed")})
    final_observed = None
    verification = []
    try:
        after = observe_target(song, request["sceneIndex"])
        final_observed = after["observed"]
        if before["targetFingerprint"] != after["targetFingerprint"]:
            verification.append({"field": "target", "expected": before["targetFingerprint"], "observed": after["targetFingerprint"]})
        for family in ("tempo", "timeSignature"):
            if before["observed"][family] != after["observed"][family]:
                verification.append({"field": family, "expected": before["observed"][family], "observed": after["observed"][family]})
    except Exception as error:
        verification.append({"field": "target", "expected": before["targetFingerprint"], "observed": None, "message": safe_message(error, "rollback verification failed")})
    rollback = {
        "attempted": True, "succeeded": not failures and not verification, "failures": failures,
        "hiddenValueRestoration": unique_dicts(hidden), "finalObserved": final_observed, "verification": verification
    }
    return BridgeHttpError("Scene override transaction failed", 500, {
        "errorCode": "scene_override_transaction_failed", "target": before["target"],
        "requested": requested_actions(request), "originalFailure": original_failure,
        "rollback": rollback, "journal": journal
    })


def verify_target(before, after):
    if before["targetFingerprint"] != after["targetFingerprint"]:
        raise OperationFailure("target_reresolution", None, "Scene target fingerprint changed")


def verify_requested(observed, request):
    tempo = request.get("tempo")
    if tempo and tempo["action"] == "set" and (observed["tempo"]["enabled"] is not True or observed["tempo"]["value"] != tempo["bpm"]):
        raise OperationFailure("readback", "tempo", "tempo readback did not match requested value and enable state")
    if tempo and tempo["action"] == "clear" and (observed["tempo"]["enabled"] is not False or observed["tempo"]["raw"]["value"] != -1 or observed["tempo"]["value"] is not None):
        raise OperationFailure("readback", "tempo", "tempo clear readback did not expose disabled -1 sentinel")
    signature = request.get("timeSignature")
    if signature and signature["action"] == "set":
        value = observed["timeSignature"]["value"] or {}
        if observed["timeSignature"]["enabled"] is not True or value.get("numerator") != signature["numerator"] or value.get("denominator") != signature["denominator"]:
            raise OperationFailure("readback", "timeSignature", "time-signature readback did not match requested values and enable state")
    if signature and signature["action"] == "clear" and (observed["timeSignature"]["enabled"] is not False or observed["timeSignature"]["raw"]["numerator"] != -1 or observed["timeSignature"]["raw"]["denominator"] != -1 or observed["timeSignature"]["value"] is not None):
        raise OperationFailure("readback", "timeSignature", "time-signature clear readback did not expose disabled -1 sentinels")


def restoration(observed, field):
    if field == "tempo":
        return (observed["tempo"]["raw"]["value"], False) if observed["tempo"]["raw"]["enabled"] else (None, True)
    if field == "tempo_enabled":
        return observed["tempo"]["raw"]["enabled"], False
    if field == "time_signature_numerator":
        return (observed["timeSignature"]["raw"]["numerator"], False) if observed["timeSignature"]["raw"]["enabled"] else (None, True)
    if field == "time_signature_denominator":
        return (observed["timeSignature"]["raw"]["denominator"], False) if observed["timeSignature"]["raw"]["enabled"] else (None, True)
    return observed["timeSignature"]["raw"]["enabled"], False


def capability_projection(fields):
    numerator = fields["time_signature_numerator"]
    denominator = fields["time_signature_denominator"]
    reasons = [value["reason"] for value in (numerator, denominator) if not value["readable"] or not value["writable"]]
    return {
        "tempo": dict(fields["tempo"]), "tempoEnabled": dict(fields["tempo_enabled"]),
        "timeSignature": {
            "readable": numerator["readable"] and denominator["readable"],
            "writable": numerator["writable"] and denominator["writable"],
            "reason": "; ".join(unique_values(reasons)) if reasons else None,
            "components": {"numerator": dict(numerator), "denominator": dict(denominator)}
        },
        "timeSignatureEnabled": dict(fields["time_signature_enabled"])
    }


def observed_projection(raw, capabilities):
    tempo_readable = capabilities["tempo"]["readable"] and capabilities["tempo_enabled"]["readable"]
    signature_fields = ("time_signature_numerator", "time_signature_denominator", "time_signature_enabled")
    signature_readable = all(capabilities[field]["readable"] for field in signature_fields)
    tempo_enabled = raw["tempo_enabled"] if tempo_readable else None
    signature_enabled = raw["time_signature_enabled"] if signature_readable else None
    return {
        "tempo": {
            "value": raw["tempo"] if tempo_readable and tempo_enabled else None,
            "enabled": tempo_enabled, "raw": {"value": raw["tempo"], "enabled": raw["tempo_enabled"]}
        },
        "timeSignature": {
            "value": {"numerator": raw["time_signature_numerator"], "denominator": raw["time_signature_denominator"]} if signature_readable and signature_enabled else None,
            "enabled": signature_enabled,
            "raw": {"numerator": raw["time_signature_numerator"], "denominator": raw["time_signature_denominator"], "enabled": raw["time_signature_enabled"]}
        }
    }


def validate_sentinels(capabilities, raw):
    if capabilities["tempo"]["readable"] and capabilities["tempo_enabled"]["readable"]:
        valid = raw["tempo"] != -1 if raw["tempo_enabled"] else raw["tempo"] == -1
        if not valid:
            mark_unreadable(capabilities, ("tempo", "tempo_enabled"), "tempo sentinel and enable state are inconsistent")
    fields = ("time_signature_numerator", "time_signature_denominator", "time_signature_enabled")
    if all(capabilities[field]["readable"] for field in fields):
        valid = (raw["time_signature_numerator"] != -1 and raw["time_signature_denominator"] != -1) if raw["time_signature_enabled"] else (raw["time_signature_numerator"] == -1 and raw["time_signature_denominator"] == -1)
        if not valid:
            mark_unreadable(capabilities, fields, "time-signature sentinels and enable state are inconsistent")


def validate_raw_field(field, value):
    if field == "tempo" and (isinstance(value, bool) or not isinstance(value, (int, float)) or not finite(value) or (value != -1 and (value < 20 or value > 999))):
        raise ValueError("tempo is not a finite BPM or disabled sentinel")
    if field in ("tempo_enabled", "time_signature_enabled") and not isinstance(value, bool):
        raise ValueError("%s is not boolean" % field)
    if field == "time_signature_numerator" and (isinstance(value, bool) or not isinstance(value, int) or (value != -1 and (value < 1 or value > 32))):
        raise ValueError("time_signature_numerator is invalid")
    if field == "time_signature_denominator" and (isinstance(value, bool) or value not in (-1,) + DENOMINATORS):
        raise ValueError("time_signature_denominator is invalid")


def exact_scene(song, scene_index):
    scenes = list(song.scenes)
    if scene_index >= len(scenes):
        fail("scene_not_found", "sceneIndex %s does not exist" % scene_index, 404)
    return scenes[scene_index]


def exact_scene_index(value):
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        fail("invalid_request", "sceneIndex must be a non-negative integer", 400)
    return value


def property_shape(fields):
    return {
        "tempo": axes(fields["tempo"]), "tempoEnabled": axes(fields["tempo_enabled"]),
        "timeSignatureNumerator": axes(fields["time_signature_numerator"]),
        "timeSignatureDenominator": axes(fields["time_signature_denominator"]),
        "timeSignatureEnabled": axes(fields["time_signature_enabled"])
    }


def capability(readable, writable, reason=None):
    unavailable = not readable or not writable
    return {"readable": bool(readable), "writable": bool(writable), "reason": safe_reason(reason, "property is unavailable") if unavailable else None}


def axes(value):
    return {"readable": value["readable"], "writable": value["writable"]}


def mark_unreadable(capabilities, fields, reason):
    for field in fields:
        capabilities[field] = capability(False, capabilities[field]["writable"], reason)


def requested_actions(request):
    result = {}
    if request.get("tempo"):
        result["tempo"] = dict(request["tempo"])
    if request.get("timeSignature"):
        result["timeSignature"] = dict(request["timeSignature"])
    return result


def exact_keys(value, allowed, prefix):
    unexpected = sorted(set(value.keys()) - set(allowed))
    if unexpected:
        fail("invalid_request", "%s contains unsupported fields: %s" % (prefix, ", ".join(unexpected)), 400)


def safe_name(scene):
    try:
        name = scene.name
        return name if isinstance(name, str) else str(name or "")
    except Exception:
        return ""


def finite(value):
    try:
        return math.isfinite(value)
    except AttributeError:
        return not math.isinf(value) and not math.isnan(value)


def safe_message(error, fallback):
    try:
        message = str(error).strip()
        return message or fallback
    except Exception:
        return fallback


def safe_reason(reason, fallback):
    return reason.strip() if isinstance(reason, str) and reason.strip() else fallback


def unique_values(values):
    result = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def unique_dicts(values):
    result = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def fail(error_code, message, status_code, details=None):
    body = {"errorCode": error_code}
    body.update(details or {})
    raise BridgeHttpError(message, status_code, body)


class OperationFailure(Exception):
    def __init__(self, stage, field, message):
        Exception.__init__(self, message)
        self.payload = {"stage": stage, "field": field, "message": message}
