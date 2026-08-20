from __future__ import print_function

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from ableton_remote_scripts.AbletonMcpBridge.live_observability import (
    ENDPOINT_SUPPORT,
    capability_document,
)
from ableton_remote_scripts.AbletonMcpBridge.AbletonMcpBridge import AbletonMcpBridge


def test_remote_script_capabilities_are_complete_and_reasoned():
    document = capability_document()
    assert document["ok"] is True
    assert document["schemaVersion"] == "1.0.0"
    assert document["mode"] == "ableton-remote-script"
    assert len(document["routes"]) == len(ENDPOINT_SUPPORT)
    assert len(set("%s %s" % (route["method"], route["path"]) for route in document["routes"])) == len(ENDPOINT_SUPPORT)
    assert all(route["status"] in ("supported", "conditional", "unsupported") for route in document["routes"])
    assert all(isinstance(route["reason"], str) and route["reason"] for route in document["routes"])
    return document


def test_capability_handler_does_not_enter_live_thread():
    bridge = AbletonMcpBridge.__new__(AbletonMcpBridge)
    bridge._call_live_thread = lambda callback: (_ for _ in ()).throw(AssertionError("Live thread must not be called"))
    assert bridge.handle_request("GET", "/capabilities", {}, {}) == capability_document()


if __name__ == "__main__":
    result = test_remote_script_capabilities_are_complete_and_reasoned()
    test_capability_handler_does_not_enter_live_thread()
    if "--json" in sys.argv:
        print(json.dumps(result, sort_keys=True))
    else:
        print("live capability contract tests ok")
