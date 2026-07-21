from __future__ import absolute_import, print_function

from .live_core import normalize


MAX_BROWSER_SEARCH_RESULTS = 50
DEFAULT_BROWSER_SEARCH_LIMIT = 25


def first_browser_item(browser, query, kind):
    items = find_browser_items(browser, query, kind, loadable_only=True)
    if items:
        return items[0]
    return None


def browser_item_inventory(browser, query, kind):
    roots = browser_roots(browser, kind)
    normalized_query = normalize(query)
    results = []
    for root_kind, root in roots:
        walk_browser_inventory(root, root_kind, normalized_query, results, depth=0, limit=MAX_BROWSER_SEARCH_RESULTS, path_parts=[])
        if len(results) >= MAX_BROWSER_SEARCH_RESULTS:
            break
    return results


def browser_search_inventory(browser, query, kind, limit):
    normalized_kind = normalize_browser_kind(kind)
    normalized_limit = normalize_browser_limit(limit)
    roots, warnings = browser_roots_with_warnings(browser, normalized_kind, include_browser_search=True)
    normalized_query = normalize(query)
    results = []
    for root_kind, root in roots:
        walk_browser_inventory(root, root_kind, normalized_query, results, depth=0, limit=normalized_limit, path_parts=[])
        if len(results) >= normalized_limit:
            break
    return {
        "ok": True,
        "filters": {"kind": normalized_kind or "any", "query": query or "", "limit": normalized_limit},
        "count": len(results),
        "capped": len(results) >= normalized_limit,
        "availableKinds": sorted(set([root_kind for root_kind, _root in roots])),
        "warnings": warnings,
        "results": results
    }


def find_browser_items(browser, query, kind, loadable_only=True):
    roots = browser_roots(browser, kind)
    normalized_query = normalize(query)
    results = []
    for root_kind, root in roots:
        walk_browser_items(root, root_kind, normalized_query, loadable_only, results, depth=0)
        if len(results) >= MAX_BROWSER_SEARCH_RESULTS:
            break
    return results


def browser_roots(browser, kind):
    roots, _warnings = browser_roots_with_warnings(browser, kind, include_browser_search=False)
    return roots


def browser_roots_with_warnings(browser, kind, include_browser_search):
    normalized_kind = normalize_browser_kind(kind)
    candidates = [
        ("instrument", "instruments"),
        ("audio_effect", "audio_effects"),
        ("midi_effect", "midi_effects"),
        ("vst", "plugins"),
        ("vst", "plug_ins"),
        ("au", "audio_units"),
        ("preset", "sounds")
    ]
    if include_browser_search:
        candidates.extend([
            ("rack", "racks"),
            ("sample", "samples"),
            ("groove", "grooves"),
            ("max_device", "max_for_live"),
            ("max_device", "max_devices")
        ])
    roots = []
    for root_kind, attr in candidates:
        if not browser_kind_matches(root_kind, normalized_kind):
            continue
        if hasattr(browser, attr):
            roots.append((root_kind, getattr(browser, attr)))
    warnings = []
    if normalized_kind and normalized_kind != "any" and not roots:
        warnings.append("Browser category is not available in this Live version: %s" % normalized_kind)
    return roots, warnings


def walk_browser_inventory(item, kind, normalized_query, results, depth, limit, path_parts):
    if depth > 5 or len(results) >= limit:
        return

    name = getattr(item, "name", "")
    next_path_parts = path_parts + ([name] if name else [])
    is_loadable = bool(getattr(item, "is_loadable", False))
    if normalized_query in normalize(name) and is_loadable:
        path = "/".join(next_path_parts)
        results.append({
            "name": name,
            "kind": kind,
            "path": path or None,
            "ref": getattr(item, "uri", None) or path or name,
            "type": plugin_type_for_kind(kind),
            "source": "ableton-browser",
            "tags": [kind],
            "loadable": True
        })

    for child in getattr(item, "children", []) or []:
        walk_browser_inventory(child, kind, normalized_query, results, depth + 1, limit, next_path_parts)


def walk_browser_items(item, kind, normalized_query, loadable_only, results, depth):
    if depth > 5 or len(results) >= MAX_BROWSER_SEARCH_RESULTS:
        return

    name = getattr(item, "name", "")
    is_loadable = bool(getattr(item, "is_loadable", False))
    if normalized_query in normalize(name) and (not loadable_only or is_loadable):
        results.append(item)

    for child in getattr(item, "children", []) or []:
        walk_browser_items(child, kind, normalized_query, loadable_only, results, depth + 1)


def plugin_type_for_kind(kind):
    if kind in ("instrument", "vst", "au", "preset"):
        return "instrument"
    if kind in ("audio_effect", "midi_effect"):
        return "effect"
    if kind == "rack":
        return "rack"
    if kind == "sample":
        return "sample"
    if kind == "groove":
        return "groove"
    if kind == "max_device":
        return "max_device"
    return kind or "browser_item"


def normalize_browser_kind(kind):
    if not kind:
        return "any"
    normalized = str(kind).strip().lower()
    aliases = {
        "presets": "preset",
        "samples": "sample",
        "racks": "rack",
        "grooves": "groove",
        "plugins": "plugin",
        "max": "max_device",
        "m4l": "max_device",
        "max_devices": "max_device",
        "max-device": "max_device",
        "max-devices": "max_device",
        "max_for_live": "max_device",
        "max-for-live": "max_device"
    }
    return aliases.get(normalized, normalized)


def browser_kind_matches(root_kind, requested_kind):
    if not requested_kind or requested_kind == "any":
        return True
    if requested_kind == "plugin":
        return root_kind in ("vst", "au")
    return root_kind == requested_kind


def normalize_browser_limit(limit):
    if limit is None or limit == "":
        return DEFAULT_BROWSER_SEARCH_LIMIT
    try:
        parsed = int(limit)
    except (TypeError, ValueError):
        return DEFAULT_BROWSER_SEARCH_LIMIT
    if parsed < 1:
        return DEFAULT_BROWSER_SEARCH_LIMIT
    return min(parsed, MAX_BROWSER_SEARCH_RESULTS)
