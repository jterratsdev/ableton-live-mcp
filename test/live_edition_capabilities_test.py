from __future__ import absolute_import, print_function

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from ableton_remote_scripts.AbletonMcpBridge.http_bridge import BridgeHttpError
from ableton_remote_scripts.AbletonMcpBridge.live_editions import (
    detect_live_edition,
    edition_capabilities,
    require_audio_midi_track_capacity
)


class FakeSong(object):
    def __init__(self, track_count):
        self.tracks = [object() for _ in range(track_count)]


def app_path(edition):
    return "/Applications/Ableton Live 12 %s.app/Contents/App-Resources/MIDI Remote Scripts/AbletonMcpBridge/AbletonMcpBridge.py" % edition


def test_exact_installation_path_detection():
    assert detect_live_edition(app_path("Lite"))["name"] == "lite"
    assert detect_live_edition(app_path("Intro"))["name"] == "intro"
    assert detect_live_edition(app_path("Standard"))["name"] == "standard"
    assert detect_live_edition(app_path("Suite"))["name"] == "suite"
    assert detect_live_edition("/Users/me/ableton-live-suite-notes/script.py")["name"] == "unknown"


def test_lite_capacity_blocks_before_mutation():
    song = FakeSong(8)
    before = list(song.tracks)
    try:
        require_audio_midi_track_capacity(song, app_path("Lite"), "duplicate_track")
    except BridgeHttpError as error:
        assert error.status_code == 409
        assert error.details["errorCode"] == "edition_track_capacity_reached"
        assert error.details["editionCapabilities"]["audioMidiTracks"] == {
            "current": 8,
            "maximum": 8,
            "remaining": 0,
            "finiteLimit": True,
            "atLimit": True,
            "status": "at-limit"
        }
    else:
        raise AssertionError("Expected verified Lite capacity error")
    assert song.tracks == before


def test_below_limit_and_nonfinite_profiles():
    lite = edition_capabilities(FakeSong(7), app_path("Lite"))
    assert lite["audioMidiTracks"]["remaining"] == 1
    assert lite["audioMidiTracks"]["status"] == "available"

    intro = edition_capabilities(FakeSong(16), app_path("Intro"))
    assert intro["audioMidiTracks"]["maximum"] == 16
    assert intro["audioMidiTracks"]["atLimit"] is True

    for edition in ("Standard", "Suite"):
        song = FakeSong(64)
        result = require_audio_midi_track_capacity(song, app_path(edition), "create_midi_track")
        assert result["audioMidiTracks"]["maximum"] is None
        assert result["audioMidiTracks"]["status"] == "unlimited"

    unknown = require_audio_midi_track_capacity(FakeSong(64), "/tmp/custom/script.py", "duplicate_track")
    assert unknown["edition"]["name"] == "unknown"
    assert unknown["audioMidiTracks"]["status"] == "unknown"


if __name__ == "__main__":
    test_exact_installation_path_detection()
    test_lite_capacity_blocks_before_mutation()
    test_below_limit_and_nonfinite_profiles()
    print("live edition capacity tests ok")
