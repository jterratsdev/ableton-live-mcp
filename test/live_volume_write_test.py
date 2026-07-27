from __future__ import absolute_import, print_function

import importlib.util
import math
import os
import sys
import types
import unittest


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE_NAME = "ableton_remote_scripts.AbletonMcpBridge"
PACKAGE_PATH = os.path.join(ROOT, "ableton_remote_scripts", "AbletonMcpBridge")


def load_module(name):
    module_name = "%s.%s" % (PACKAGE_NAME, name)
    path = os.path.join(PACKAGE_PATH, "%s.py" % name)
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


package = types.ModuleType(PACKAGE_NAME)
package.__path__ = [PACKAGE_PATH]
sys.modules[PACKAGE_NAME] = package
load_module("http_bridge")
LIVE_CORE = load_module("live_core")


class FakeLiveVolumeParameter(object):
    def __init__(self, value=0.85, readable=True, drift_db=0.0, maximum_db=12.0, ignore_restore=False):
        self.min = 0.0
        self.max = 1.0
        self._value = value
        self.readable = readable
        self.drift_db = drift_db
        self.maximum_db = maximum_db
        self.ignore_restore = ignore_restore
        self.write_count = 0

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self.write_count += 1
        if self.ignore_restore and self.write_count > 1:
            return
        self._value = value

    def str_for_value(self, value):
        if not self.readable:
            return "unavailable"
        if value <= 0:
            return "-inf dB"
        normalized = value / self.max
        db = -70.0 + ((self.maximum_db + 70.0) * normalized * normalized) + self.drift_db
        return "%.3f dB" % db


class LiveVolumeWriteTest(unittest.TestCase):
    def test_round_trip_restored_levels_and_boundaries(self):
        for requested in (-70, -10.161, -8.337, -7.372, -5.68, 0, 6, 12):
            parameter = FakeLiveVolumeParameter()
            verification = LIVE_CORE.write_verified_db(parameter, requested, 0.01)

            self.assertTrue(verification["confirmed"])
            self.assertAlmostEqual(verification["observedDb"], requested, delta=0.01)
            self.assertEqual(verification["requestedDb"], requested)
            self.assertEqual(verification["rawWritten"], verification["observedRaw"])
            self.assertEqual(verification["observedDisplay"], parameter.str_for_value(parameter.value))
            if requested == -7.372:
                self.assertNotAlmostEqual(verification["rawWritten"], math.pow(10, requested / 20.0), places=2)

    def test_unparseable_display_fails_without_writing(self):
        parameter = FakeLiveVolumeParameter(value=0.85, readable=False)

        with self.assertRaises(LIVE_CORE.BridgeHttpError):
            LIVE_CORE.write_verified_db(parameter, -8.337, 0.5)

        self.assertEqual(parameter.value, 0.85)

    def test_unreachable_target_fails_without_writing(self):
        parameter = FakeLiveVolumeParameter(value=0.85, maximum_db=6.0)

        with self.assertRaises(LIVE_CORE.BridgeHttpError) as raised:
            LIVE_CORE.write_verified_db(parameter, 12, 0.5)

        self.assertEqual(raised.exception.status_code, 422)
        self.assertEqual(parameter.value, 0.85)

    def test_failed_readback_restores_original_raw_value(self):
        parameter = FakeLiveVolumeParameter(value=0.85)
        original = parameter.value
        resolved = LIVE_CORE.resolve_db_raw_value(parameter, -7.372, 0.01)
        parameter.drift_db = 4.0

        original_resolver = LIVE_CORE.resolve_db_raw_value
        LIVE_CORE.resolve_db_raw_value = lambda unused_parameter, unused_requested, unused_tolerance: resolved
        try:
            with self.assertRaises(LIVE_CORE.BridgeHttpError) as raised:
                LIVE_CORE.write_verified_db(parameter, -7.372, 0.01)
        finally:
            LIVE_CORE.resolve_db_raw_value = original_resolver

        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(parameter.value, original)

    def test_failed_restore_readback_is_reported_as_server_error(self):
        parameter = FakeLiveVolumeParameter(value=0.85, ignore_restore=True)
        resolved = LIVE_CORE.resolve_db_raw_value(parameter, -7.372, 0.01)
        parameter.drift_db = 4.0

        original_resolver = LIVE_CORE.resolve_db_raw_value
        LIVE_CORE.resolve_db_raw_value = lambda unused_parameter, unused_requested, unused_tolerance: resolved
        try:
            with self.assertRaises(LIVE_CORE.BridgeHttpError) as raised:
                LIVE_CORE.write_verified_db(parameter, -7.372, 0.01)
        finally:
            LIVE_CORE.resolve_db_raw_value = original_resolver

        self.assertEqual(raised.exception.status_code, 500)
        self.assertNotEqual(parameter.value, 0.85)
        self.assertIn("restoration failed readback", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
