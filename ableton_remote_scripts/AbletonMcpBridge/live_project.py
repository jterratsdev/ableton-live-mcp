from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError


def save_project(song, application, payload):
    path = normalized_optional_string(payload.get("path"), "path")
    label = normalized_optional_string(payload.get("label"), "label")
    requested_mode = "save_as" if path else "save"

    try:
        if path:
            return invoke_save_method(
                ((song, "save_as", "song.save_as"), (application, "save_live_set_as", "application.save_live_set_as")),
                (path,),
                path,
                label,
                requested_mode
            )
        return invoke_save_method(
            ((song, "save", "song.save"), (application, "save_live_set", "application.save_live_set")),
            (),
            None,
            label,
            requested_mode
        )
    except BridgeHttpError:
        raise
    except Exception as error:
        raise BridgeHttpError("Unable to save project: %s" % error, 500)


def invoke_save_method(candidates, args, path, label, requested_mode):
    for owner, attribute, mode in candidates:
        method = getattr(owner, attribute, None)
        if not callable(method):
            continue
        method(*args)
        return {
            "ok": True,
            "saved": True,
            "path": path,
            "label": label,
            "mode": mode,
            "verification": {
                "methodInvoked": True,
                "requestedMode": requested_mode
            }
        }
    operation = "Save As" if requested_mode == "save_as" else "Save"
    raise BridgeHttpError("%s is not supported by this Ableton API" % operation, 501)


def normalized_optional_string(value, name):
    if value is None:
        return None
    if not isinstance(value, str) or value.strip() == "":
        raise BridgeHttpError("%s must be a non-empty string when provided" % name)
    return value.strip()
