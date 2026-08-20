from __future__ import absolute_import

import re

from .http_bridge import BridgeHttpError


OFFICIAL_SOURCE_URL = "https://www.ableton.com/en/upgrade-live/"
SOURCE_VERIFIED_DATE = "2026-08-18"

EDITION_PROFILES = {
    "lite": {"displayName": "Live Lite", "maximum": 8},
    "intro": {"displayName": "Live Intro", "maximum": 16},
    "standard": {"displayName": "Live Standard", "maximum": None},
    "suite": {"displayName": "Live Suite", "maximum": None}
}

_LIVE_APP_SEGMENT = re.compile(
    r"^(?:ableton )?live(?: [0-9]+(?:\.[0-9]+)*)? (lite|intro|standard|suite)$",
    re.IGNORECASE
)


def detect_live_edition(runtime_path):
    normalized = (runtime_path or "").replace("\\", "/")
    for segment in normalized.split("/"):
        candidate = segment[:-4] if segment.lower().endswith(".app") else segment
        match = _LIVE_APP_SEGMENT.match(candidate.strip())
        if match:
            name = match.group(1).lower()
            profile = EDITION_PROFILES[name]
            return {
                "name": name,
                "displayName": profile["displayName"],
                "detected": True,
                "provenance": "remote-script-installation-path",
                "confidence": "high",
                "evidence": segment,
                "source": official_source()
            }
    return {
        "name": "unknown",
        "displayName": "Unknown Live edition",
        "detected": False,
        "provenance": "unavailable",
        "confidence": "none",
        "evidence": None,
        "source": official_source()
    }


def edition_capabilities(song, runtime_path):
    edition = detect_live_edition(runtime_path)
    profile = EDITION_PROFILES.get(edition["name"])
    maximum = profile["maximum"] if profile is not None else None
    current = len(list(song.tracks))
    finite = maximum is not None
    remaining = max(maximum - current, 0) if finite else None
    if not edition["detected"]:
        status = "unknown"
    elif not finite:
        status = "unlimited"
    elif remaining == 0:
        status = "at-limit"
    else:
        status = "available"
    return {
        "edition": edition,
        "audioMidiTracks": {
            "current": current,
            "maximum": maximum,
            "remaining": remaining,
            "finiteLimit": finite,
            "atLimit": finite and remaining == 0,
            "status": status
        }
    }


def require_audio_midi_track_capacity(song, runtime_path, operation):
    capabilities = edition_capabilities(song, runtime_path)
    capacity = capabilities["audioMidiTracks"]
    if capacity["atLimit"]:
        edition = capabilities["edition"]
        raise BridgeHttpError(
            "%s cannot create another audio/MIDI track: %s is at its verified %s-track limit" % (
                operation,
                edition["displayName"],
                capacity["maximum"]
            ),
            409,
            {
                "errorCode": "edition_track_capacity_reached",
                "operation": operation,
                "editionCapabilities": capabilities
            }
        )
    return capabilities


def official_source():
    return {"url": OFFICIAL_SOURCE_URL, "verifiedDate": SOURCE_VERIFIED_DATE}
