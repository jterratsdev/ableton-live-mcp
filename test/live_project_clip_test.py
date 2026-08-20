from __future__ import absolute_import, print_function

import importlib.util
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
load_module("live_core")
load_module("live_summaries")
LIVE_CLIPS = load_module("live_clips")


class FakeClip(object):
    name = "Disposable clip"
    length = 4


class FakeClipSlot(object):
    def __init__(self, has_clip=True, retain=False):
        self.has_clip = has_clip
        self.clip = FakeClip() if has_clip else None
        self.retain = retain

    def delete_clip(self):
        if not self.retain:
            self.has_clip = False
            self.clip = None


class FakeTrack(object):
    def __init__(self, slot):
        self.name = "MIDI"
        self.clip_slots = [slot]


class FakeSong(object):
    def __init__(self, slot=None):
        self.tracks = [FakeTrack(slot)] if slot is not None else []


class ProjectLifecycleTest(unittest.TestCase):
    def test_delete_clip_confirms_the_slot_is_empty(self):
        slot = FakeClipSlot()
        result = LIVE_CLIPS.delete_clip(FakeSong(slot), {"trackIndex": 0, "clipSlotIndex": 0})
        self.assertTrue(result["deleted"])
        self.assertFalse(slot.has_clip)

    def test_delete_empty_slot_is_idempotent(self):
        result = LIVE_CLIPS.delete_clip(FakeSong(FakeClipSlot(False)), {"trackIndex": 0, "clipSlotIndex": 0})
        self.assertFalse(result["deleted"])

    def test_delete_errors_when_live_keeps_the_clip(self):
        with self.assertRaises(LIVE_CLIPS.BridgeHttpError) as raised:
            LIVE_CLIPS.delete_clip(FakeSong(FakeClipSlot(retain=True)), {"trackIndex": 0, "clipSlotIndex": 0})
        self.assertEqual(raised.exception.status_code, 500)

if __name__ == "__main__":
    unittest.main()
