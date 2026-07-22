from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_browser import first_browser_item
from .live_core import normalize
from .live_devices import apply_device_settings


def apply_mastering_chain(song, browser, payload):
    chain = payload.get("chain") or []
    if not isinstance(chain, list):
        raise BridgeHttpError("chain must be an array")
    mode = payload.get("mode") or "replace_matching"
    if mode not in ("replace_matching", "replace_all", "append"):
        raise BridgeHttpError("mode must be replace_matching, replace_all, or append")

    master = song.master_track
    loaded = []
    removed = []
    warnings = []
    cleared_master = False

    for step in chain:
        if not isinstance(step, dict):
            warnings.append("Skipped mastering step that is not an object")
            continue
        device_name = step.get("device")
        if not isinstance(device_name, str) or device_name.strip() == "":
            warnings.append("Skipped mastering step without device name")
            continue
        item = first_browser_item(browser, device_name, "audio_effect")
        if item is None:
            warnings.append("No loadable browser item found for mastering device: %s" % device_name)
            continue

        if mode == "replace_all" and not cleared_master:
            removed.extend(delete_master_devices(master, None, warnings))
            cleared_master = True
        elif mode == "replace_matching":
            removed.extend(delete_master_devices(master, (device_name, getattr(item, "name", device_name)), warnings))

        before = len(list(master.devices))
        song.view.selected_track = master
        try:
            browser.load_item(item)
        except Exception as error:
            warnings.append("Unable to load mastering device %s: %s" % (device_name, error))
            continue
        after_devices = list(master.devices)
        loaded_device = after_devices[-1] if len(after_devices) > before else None
        if loaded_device is None:
            warnings.append("Ableton did not report a newly loaded mastering device: %s" % device_name)
            continue

        settings_result = apply_device_settings(loaded_device, step.get("settings") or {})
        loaded.append({
            "index": len(after_devices) - 1,
            "device": getattr(loaded_device, "name", getattr(item, "name", device_name)),
            "requestedDevice": device_name,
            "settings": settings_result["applied"],
            "warnings": settings_result["warnings"]
        })

    if not loaded:
        detail = "; ".join(warnings) if warnings else "No mastering devices were requested"
        raise BridgeHttpError("No mastering devices were loaded. %s" % detail, 404)

    return {
        "ok": True,
        "mastering": payload,
        "mode": mode,
        "loadedDevices": loaded,
        "removedDevices": removed,
        "warnings": warnings
    }


def delete_master_devices(master, names, warnings):
    delete = getattr(master, "delete_device", None)
    if delete is None:
        warnings.append("Ableton Live API does not expose delete_device on the master chain; mastering devices were appended")
        return []
    requested = set([normalize(name) for name in names]) if names is not None else None
    devices = list(getattr(master, "devices", []) or [])
    removed = []
    for index in range(len(devices) - 1, -1, -1):
        device = devices[index]
        if requested is not None and normalize(getattr(device, "name", "")) not in requested:
            continue
        removed.append({
            "index": index,
            "name": getattr(device, "name", ""),
            "kind": getattr(device, "class_name", device.__class__.__name__)
        })
        try:
            delete(index)
        except Exception as error:
            warnings.append("Unable to delete existing master device %s: %s" % (getattr(device, "name", ""), error))
    removed.reverse()
    return removed
