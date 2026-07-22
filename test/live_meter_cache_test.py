from __future__ import absolute_import, print_function

import importlib.util
import os
import unittest


MODULE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "ableton_remote_scripts",
    "AbletonMcpBridge",
    "live_meter_cache.py",
)
SPEC = importlib.util.spec_from_file_location("live_meter_cache", MODULE_PATH)
LIVE_METER_CACHE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LIVE_METER_CACHE)


class FakeTrack(object):
    def __init__(self, values):
        self.has_audio_output = True
        self.output_meter_left = values[0]
        self.output_meter_right = values[1]
        self.output_meter_level = values[2]
        self._listeners = {}

    def __getattr__(self, name):
        if name.startswith("add_") and name.endswith("_listener"):
            property_name = name[4:-9]
            return lambda listener: self._listeners.setdefault(property_name, listener)
        if name.startswith("remove_") and name.endswith("_listener"):
            property_name = name[7:-9]
            return lambda listener: self._listeners.pop(property_name, None)
        raise AttributeError(name)


class ProxySong(object):
    def __init__(self):
        self.emit_signal = True

    def _values(self, signal):
        return signal if self.emit_signal else (0.0, 0.0, 0.0)

    @property
    def tracks(self):
        return [FakeTrack(self._values((0.4, 0.3, 0.5)))]

    @property
    def return_tracks(self):
        return [FakeTrack(self._values((0.2, 0.1, 0.25)))]

    @property
    def master_track(self):
        return FakeTrack(self._values((0.5, 0.45, 0.6)))


class LiveMeterCacheTest(unittest.TestCase):
    def test_poll_cache_survives_new_live_proxy_wrappers(self):
        song = ProxySong()
        cache = LIVE_METER_CACHE.LiveMeterCache()

        cache.poll(song)
        song.emit_signal = False
        snapshot = cache.snapshot("track", 0, song.tracks[0], "tracks[0]")

        self.assertEqual(snapshot["meter"]["level"], 0.5)
        self.assertEqual(snapshot["meterSource"]["level"], "display-poll-cache")
        self.assertTrue(snapshot["meterObserved"]["level"])

        diagnostics = cache.diagnostics()
        self.assertEqual(diagnostics["targetCount"], 3)
        self.assertEqual(diagnostics["observedTargetCount"], 3)
        self.assertEqual(diagnostics["displayPollObservedTargetCount"], 3)
        self.assertEqual(diagnostics["signalTargetCount"], 3)
        self.assertEqual(diagnostics["listenerCount"], 9)

    def test_repeated_polls_do_not_accumulate_proxy_ids(self):
        song = ProxySong()
        cache = LIVE_METER_CACHE.LiveMeterCache()

        cache.poll(song)
        cache.poll(song)

        diagnostics = cache.diagnostics()
        self.assertEqual(diagnostics["targetCount"], 3)
        self.assertEqual(diagnostics["observedTargetCount"], 3)
        self.assertEqual(diagnostics["listenerCount"], 9)


if __name__ == "__main__":
    unittest.main()
