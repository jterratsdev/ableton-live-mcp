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
load_module("live_mixer")
load_module("live_summaries")
load_module("live_browser")
load_module("live_devices")
LIVE_MASTERING = load_module("live_mastering")


class FakeBrowserItem(object):
    def __init__(self, name, is_loadable=False, children=None):
        self.name = name
        self.is_loadable = is_loadable
        self.children = children or []


class FakeDevice(object):
    def __init__(self, name):
        self.name = name
        self.class_name = "PluginDevice"
        self.parameters = []


class FakeMaster(object):
    def __init__(self, devices=None, retain_on_delete=False):
        self.devices = devices or []
        self.retain_on_delete = retain_on_delete

    def delete_device(self, index):
        if not self.retain_on_delete:
            del self.devices[index]


class FakeSong(object):
    def __init__(self, devices=None, retain_on_delete=False):
        self.master_track = FakeMaster(devices, retain_on_delete)
        self.view = types.SimpleNamespace(selected_track=None)


class FakeBrowser(object):
    def __init__(self, song, fail_name=None):
        self.song = song
        self.fail_name = fail_name
        self.plugins = FakeBrowserItem("Plugins", children=[FakeBrowserItem("Kontakt 8", True)])
        self.audio_units = FakeBrowserItem("Audio Units", children=[FakeBrowserItem("LABS", True)])
        self.loaded_names = []

    def load_item(self, item):
        if item.name == self.fail_name:
            raise RuntimeError("load failed")
        self.loaded_names.append(item.name)
        self.song.master_track.devices.append(FakeDevice(item.name))


class LiveMasteringTest(unittest.TestCase):
    def test_vst_and_au_entries_use_declared_browser_kinds_in_order(self):
        song = FakeSong()
        browser = FakeBrowser(song)

        result = LIVE_MASTERING.apply_mastering_chain(song, browser, {
            "mode": "replace_all",
            "chain": [
                {"device": "Kontakt 8", "kind": "vst"},
                {"device": "LABS", "kind": "au"}
            ]
        })

        self.assertEqual(browser.loaded_names, ["Kontakt 8", "LABS"])
        self.assertEqual([device["requestedDevice"] for device in result["loadedDevices"]], ["Kontakt 8", "LABS"])

    def test_replace_all_does_not_mutate_when_any_entry_is_unresolved(self):
        original = FakeDevice("Existing Limiter")
        song = FakeSong([original])
        browser = FakeBrowser(song)

        with self.assertRaises(LIVE_MASTERING.BridgeHttpError) as raised:
            LIVE_MASTERING.apply_mastering_chain(song, browser, {
                "mode": "replace_all",
                "chain": [
                    {"device": "Kontakt 8", "kind": "vst"},
                    {"device": "Missing AU", "kind": "au"}
                ]
            })

        self.assertEqual(raised.exception.status_code, 404)
        self.assertEqual(song.master_track.devices, [original])
        self.assertEqual(browser.loaded_names, [])

    def test_partial_load_returns_an_error_instead_of_ok_true(self):
        song = FakeSong()
        browser = FakeBrowser(song, fail_name="LABS")

        with self.assertRaises(LIVE_MASTERING.BridgeHttpError) as raised:
            LIVE_MASTERING.apply_mastering_chain(song, browser, {
                "mode": "append",
                "chain": [
                    {"device": "Kontakt 8", "kind": "vst"},
                    {"device": "LABS", "kind": "au"}
                ]
            })

        self.assertEqual(raised.exception.status_code, 500)
        self.assertIn("loaded 1 of 2", str(raised.exception))

    def test_replace_all_errors_when_existing_devices_remain(self):
        song = FakeSong([FakeDevice("Existing Limiter")], retain_on_delete=True)
        browser = FakeBrowser(song)

        with self.assertRaises(LIVE_MASTERING.BridgeHttpError) as raised:
            LIVE_MASTERING.apply_mastering_chain(song, browser, {
                "mode": "replace_all",
                "chain": [{"device": "Kontakt 8", "kind": "vst"}]
            })

        self.assertEqual(raised.exception.status_code, 500)
        self.assertIn("exact requested device order", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
