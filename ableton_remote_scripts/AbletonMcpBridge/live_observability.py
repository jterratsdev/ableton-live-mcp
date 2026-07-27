from __future__ import absolute_import, print_function

import hashlib
import calendar
import os
import time


OBSERVABILITY_SCHEMA_VERSION = "1.0.0"
DEFAULT_BRIDGE_VERSION = "0.1.0"


ENDPOINT_SUPPORT = (
    {"method": "GET", "path": "/status", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/project", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/arrangement", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/project/snapshot", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/project/rollback", "riskTier": "destructive", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/plugins", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/browser/search", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/analysis/audio", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Remote Script does not analyze local audio files"}},
    {"method": "POST", "path": "/analysis/mix", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "MCP performs rendered-file analysis locally; Remote Script does not analyze audio files"}},
    {"method": "GET", "path": "/production/report", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/tempo", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/automation", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Live Python API does not expose reliable cross-version envelope mutation"}},
    {"method": "POST", "path": "/project/save", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Save methods vary by Live version and set state"}},
    {"method": "POST", "path": "/signature", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/tracks/midi", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/tracks/duplicate", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires Live duplicate_track support"}},
    {"method": "POST", "path": "/tracks/freeze", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires Live freeze support"}},
    {"method": "POST", "path": "/tracks/flatten", "riskTier": "destructive", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires Live flatten support"}},
    {"method": "POST", "path": "/tracks/modify", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/returns", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/returns/create", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires Live return-track creation support"}},
    {"method": "POST", "path": "/returns/modify", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "DELETE", "path": "/returns", "riskTier": "destructive", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires Live return-track deletion support"}},
    {"method": "GET", "path": "/routing/buses", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/meters", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Meter fields vary by Live version"}},
    {"method": "POST", "path": "/master/modify", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Master mute and solo are not universally exposed"}},
    {"method": "POST", "path": "/arrangement/insert", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Remote Script has no reliable arrangement clip insertion API"}},
    {"method": "POST", "path": "/arrangement/locators", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires Live cue point mutation support"}},
    {"method": "POST", "path": "/transport/start", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/transport/stop", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/clips/launch", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/scenes/launch", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/devices/load", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/devices/load-master", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/devices/parameters", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/devices/parameter", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/devices/reorder", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Live Python API does not expose reliable cross-version device reorder"}},
    {"method": "DELETE", "path": "/devices", "riskTier": "destructive", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires device-chain delete support"}},
    {"method": "POST", "path": "/mastering/apply", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/render/export", "riskTier": "export", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Remote Script render export is not supported"}},
    {"method": "POST", "path": "/tracks/bounce", "riskTier": "export", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Remote Script track bounce is not supported"}},
    {"method": "POST", "path": "/mastering/analyze-and-apply", "riskTier": "export", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Remote Script mastering analysis depends on unsupported render export"}},
    {"method": "POST", "path": "/mastering/remove-reverb", "riskTier": "safe-write", "development": {"status": "unsupported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/clips/midi", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "POST", "path": "/clips/consolidate", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "Remote Script has no reliable consolidation API"}},
    {"method": "DELETE", "path": "/clips/midi", "riskTier": "destructive", "development": {"status": "supported"}, "remoteScript": {"status": "supported"}},
    {"method": "GET", "path": "/clips/notes", "riskTier": "read", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires readable MIDI note API"}},
    {"method": "POST", "path": "/clips/humanize", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires readable and replaceable MIDI note API"}},
    {"method": "POST", "path": "/clips/quantize", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires readable and replaceable MIDI note API"}},
    {"method": "POST", "path": "/groove/apply", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "conditional", "note": "Requires readable and replaceable MIDI note API"}},
    {"method": "POST", "path": "/midi/import", "riskTier": "safe-write", "development": {"status": "supported"}, "remoteScript": {"status": "unsupported", "note": "MIDI import is parsed in the MCP process"}}
)


def bridge_observability(options=None):
    options = options or {}
    installed_files = options.get("installedFiles") or installed_file_metadata(options.get("installedPaths") or [])
    runtime_started_at = options.get("runtimeStartedAt")
    return {
        "ok": True,
        "schemaVersion": OBSERVABILITY_SCHEMA_VERSION,
        "mode": options.get("mode") or "ableton-remote-script-observability",
        "version": {
            "bridgeVersion": options.get("bridgeVersion") or DEFAULT_BRIDGE_VERSION,
            "buildHash": options.get("buildHash") or build_hash_from_installed_files(installed_files)
        },
        "process": {
            "pid": options.get("processPid") or os.getpid(),
            "livePid": options.get("livePid") or os.getpid()
        },
        "runtime": {
            "host": options.get("host") or "127.0.0.1",
            "port": options.get("port") or 9789,
            "startedAt": runtime_started_at
        },
        "installedFiles": installed_files,
        "endpointSupport": endpoint_support_summary(),
        "lastError": normalize_last_error(options.get("lastError")),
        "staleRuntime": diagnose_stale_runtime(runtime_started_at, installed_files)
    }


def installed_file_metadata(paths):
    files = []
    for path in paths:
        try:
            metadata = os.stat(path)
            files.append({
                "path": path,
                "exists": True,
                "sizeBytes": metadata.st_size,
                "mtimeMs": metadata.st_mtime * 1000,
                "sha256": sha256_file(path)
            })
        except OSError as error:
            files.append({
                "path": path,
                "exists": False,
                "error": str(error)
            })
    return files


def endpoint_support_summary():
    endpoints = [copy_endpoint(endpoint) for endpoint in ENDPOINT_SUPPORT]
    return {
        "count": len(endpoints),
        "development": count_statuses(endpoints, "development"),
        "remoteScript": count_statuses(endpoints, "remoteScript"),
        "endpoints": endpoints
    }


def build_hash_from_installed_files(files):
    hashed_files = [file_info for file_info in files if file_info.get("exists") and file_info.get("sha256")]
    if not hashed_files:
        return None
    digest = hashlib.sha256()
    for file_info in sorted(hashed_files, key=lambda item: item.get("path") or ""):
        digest.update(("%s:%s:%s:%s\n" % (
            file_info.get("path"),
            file_info.get("sizeBytes"),
            file_info.get("mtimeMs"),
            file_info.get("sha256")
        )).encode("utf-8"))
    return digest.hexdigest()


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file_handle:
        while True:
            chunk = file_handle.read(65536)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def copy_endpoint(endpoint):
    copy = dict(endpoint)
    copy["development"] = dict(endpoint["development"])
    copy["remoteScript"] = dict(endpoint["remoteScript"])
    return copy


def count_statuses(endpoints, runtime_key):
    counts = {}
    for endpoint in endpoints:
        status = endpoint[runtime_key]["status"]
        counts[status] = counts.get(status, 0) + 1
    return counts


def normalize_last_error(error):
    if not error:
        return None
    if isinstance(error, str):
        return {"message": error}
    return {
        "name": error.get("name"),
        "message": error.get("message") or str(error),
        "endpoint": error.get("endpoint"),
        "statusCode": error.get("statusCode"),
        "at": error.get("at")
    }


def diagnose_stale_runtime(runtime_started_at, installed_files):
    runtime_started_ms = timestamp_ms(runtime_started_at)
    if runtime_started_ms is None:
        return {
            "status": "unknown",
            "isStale": None,
            "reason": "runtime start time or installed file timestamps are unavailable"
        }
    newest_installed_mtime_ms = None
    for file_info in installed_files:
        if file_info.get("exists") and isinstance(file_info.get("mtimeMs"), (int, float)):
            newest_installed_mtime_ms = max(newest_installed_mtime_ms or file_info["mtimeMs"], file_info["mtimeMs"])
    if newest_installed_mtime_ms is None:
        return {
            "status": "unknown",
            "isStale": None,
            "reason": "runtime start time or installed file timestamps are unavailable"
        }
    if runtime_started_ms < newest_installed_mtime_ms:
        return {
            "status": "stale",
            "isStale": True,
            "reason": "installed Remote Script files are newer than the running bridge runtime",
            "newestInstalledMtimeMs": newest_installed_mtime_ms
        }
    return {
        "status": "fresh",
        "isStale": False,
        "reason": "running bridge runtime is newer than or equal to installed Remote Script files",
        "newestInstalledMtimeMs": newest_installed_mtime_ms
    }


def timestamp_ms(value):
    if isinstance(value, (int, float)):
        return value
    if not isinstance(value, str):
        return None

    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1]
    millisecond = 0
    if "." in text:
        text, fraction = text.split(".", 1)
        millisecond = int((fraction + "000")[:3])
    try:
        parsed = time.strptime(text, "%Y-%m-%dT%H:%M:%S")
        return calendar.timegm(parsed) * 1000 + millisecond
    except Exception:
        return None
