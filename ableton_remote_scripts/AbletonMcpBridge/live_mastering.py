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

    resolved_chain = resolve_mastering_chain(browser, chain)
    master = song.master_track
    loaded = []
    loaded_device_objects = []
    removed = []
    warnings = []
    cleared_master = False

    for step, item, device_name in resolved_chain:
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
        loaded_device_objects.append(loaded_device)
        loaded.append({
            "index": len(after_devices) - 1,
            "device": getattr(loaded_device, "name", getattr(item, "name", device_name)),
            "requestedDevice": device_name,
            "settings": settings_result["applied"],
            "warnings": settings_result["warnings"]
        })

    if len(loaded) != len(resolved_chain):
        detail = "; ".join(warnings) if warnings else "Ableton did not load every resolved device"
        raise BridgeHttpError(
            "Mastering chain is incomplete: loaded %s of %s devices. %s" % (len(loaded), len(resolved_chain), detail),
            500
        )

    if mode == "replace_all" and list(master.devices) != loaded_device_objects:
        raise BridgeHttpError(
            "Mastering chain is incomplete: replace_all did not produce the exact requested device order",
            500
        )

    return {
        "ok": True,
        "mastering": payload,
        "mode": mode,
        "loadedDevices": loaded,
        "removedDevices": removed,
        "warnings": warnings
    }


def resolve_mastering_chain(browser, chain):
    if not chain:
        raise BridgeHttpError("Mastering chain must contain at least one device")
    resolved = []
    missing = []
    supported_kinds = ("audio_effect", "rack", "preset", "vst", "au", "any")
    for index, step in enumerate(chain):
        if not isinstance(step, dict):
            raise BridgeHttpError("chain[%s] must be an object" % index)
        device_name = step.get("device")
        if not isinstance(device_name, str) or device_name.strip() == "":
            raise BridgeHttpError("chain[%s].device must be a non-empty string" % index)
        kind = step.get("kind") or "audio_effect"
        if kind not in supported_kinds:
            raise BridgeHttpError("chain[%s].kind is unsupported: %s" % (index, kind))
        item = first_browser_item(browser, device_name, kind)
        if item is None:
            missing.append("%s (%s)" % (device_name, kind))
        else:
            resolved.append((step, item, device_name))
    if missing:
        raise BridgeHttpError(
            "Mastering chain is incomplete; no loadable browser item found for: %s" % ", ".join(missing),
            404
        )
    return resolved


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
