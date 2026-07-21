from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_browser import first_browser_item
from .live_devices import apply_device_settings


def apply_mastering_chain(song, browser, payload):
    chain = payload.get("chain") or []
    if not isinstance(chain, list):
        raise BridgeHttpError("chain must be an array")

    master = song.master_track
    loaded = []
    warnings = []
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
        "loadedDevices": loaded,
        "warnings": warnings
    }
