from __future__ import print_function

import os
import json
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from ableton_remote_scripts.AbletonMcpBridge.http_bridge import BridgeHttpError
from ableton_remote_scripts.AbletonMcpBridge.live_scene_tempo_signature import (
    parse_scene_index_query,
    scene_tempo_signature_capabilities,
    set_scene_tempo_signature_overrides,
)


class SceneState(object):
    def __init__(self, name, tempo=120, enabled=False, numerator=4, denominator=4, signature_enabled=False):
        self.name = name
        self.tempo = tempo
        self.tempo_enabled = enabled
        self.numerator = numerator
        self.denominator = denominator
        self.signature_enabled = signature_enabled
        self.log = []
        self.fail_after = {}
        self.fail_before = {}
        self.get_failures = set()
        self.read_overrides = {}
        self.after_write = None


class FakeScene(object):
    def __init__(self, state):
        self._state = state

    @property
    def name(self):
        return self._state.name

    @property
    def tempo(self):
        return self._read("tempo", self._state.tempo if self._state.tempo_enabled else -1)

    @tempo.setter
    def tempo(self, value):
        self._write("tempo", value, "tempo")

    @property
    def tempo_enabled(self):
        return self._read("tempo_enabled", self._state.tempo_enabled)

    @tempo_enabled.setter
    def tempo_enabled(self, value):
        self._write("tempo_enabled", value, "tempo_enabled")

    @property
    def time_signature_numerator(self):
        return self._read("time_signature_numerator", self._state.numerator if self._state.signature_enabled else -1)

    @time_signature_numerator.setter
    def time_signature_numerator(self, value):
        self._write("time_signature_numerator", value, "numerator")

    @property
    def time_signature_denominator(self):
        return self._read("time_signature_denominator", self._state.denominator if self._state.signature_enabled else -1)

    @time_signature_denominator.setter
    def time_signature_denominator(self, value):
        self._write("time_signature_denominator", value, "denominator")

    @property
    def time_signature_enabled(self):
        return self._read("time_signature_enabled", self._state.signature_enabled)

    @time_signature_enabled.setter
    def time_signature_enabled(self, value):
        self._write("time_signature_enabled", value, "signature_enabled")

    def _read(self, field, value):
        if field in self._state.get_failures:
            raise RuntimeError("%s getter raised" % field)
        override = self._state.read_overrides.get(field)
        return override(value) if override else value

    def _write(self, field, value, storage):
        before = self._state.fail_before.get(field)
        if before and before(value):
            raise RuntimeError("%s compensation rejected" % field)
        self._state.log.append(field)
        setattr(self._state, storage, value)
        if self._state.after_write:
            self._state.after_write(field, value)
        after = self._state.fail_after.pop(field, None)
        if after:
            raise RuntimeError(after)


class RecreatedProxySong(object):
    def __init__(self, states, scene_class=FakeScene):
        self.states = states
        self.scene_class = scene_class
        self.wrapper_ids = []

    @property
    def scenes(self):
        wrappers = [self.scene_class(state) for state in self.states]
        self.wrapper_ids.extend(id(wrapper) for wrapper in wrappers)
        return wrappers


def test_capability_probe_is_read_only_and_reports_raising_getter():
    state = SceneState("Intro")
    state.get_failures.add("time_signature_denominator")
    song = RecreatedProxySong([state])

    result = scene_tempo_signature_capabilities(song, 0)

    assert result["readOnly"] is True
    assert result["target"] == {"sceneIndex": 0, "name": "Intro"}
    assert result["capabilities"]["tempo"] == {"readable": True, "writable": True, "reason": None}
    assert result["capabilities"]["timeSignature"]["readable"] is False
    assert "getter raised" in result["capabilities"]["timeSignature"]["reason"]
    assert state.log == []


def test_read_only_descriptor_fails_closed():
    class ReadOnlyTempoScene(FakeScene):
        tempo = property(FakeScene.tempo.fget)

    song = RecreatedProxySong([SceneState("Read only")], ReadOnlyTempoScene)

    result = scene_tempo_signature_capabilities(song, 0)

    assert result["capabilities"]["tempo"]["readable"] is True
    assert result["capabilities"]["tempo"]["writable"] is False
    assert result["capabilities"]["tempo"]["reason"]


def test_missing_and_instance_only_properties_fail_closed():
    class MissingScene(object):
        name = "Missing"

    missing = RecreatedProxySong([SceneState("unused")])
    missing.scene_class = lambda _state: MissingScene()
    missing_result = scene_tempo_signature_capabilities(missing, 0)
    assert missing_result["capabilities"]["tempo"]["readable"] is False
    assert missing_result["capabilities"]["tempo"]["reason"]

    class DynamicScene(object):
        def __init__(self, _state):
            self.name = "Dynamic"
            self.tempo = 120
            self.tempo_enabled = True
            self.time_signature_numerator = 4
            self.time_signature_denominator = 4
            self.time_signature_enabled = True

    dynamic = scene_tempo_signature_capabilities(RecreatedProxySong([SceneState("unused")], DynamicScene), 0)
    assert dynamic["capabilities"]["tempo"]["readable"] is True
    assert dynamic["capabilities"]["tempo"]["writable"] is False
    assert dynamic["capabilities"]["tempo"]["reason"]


def test_validation_and_partial_capability_use_zero_setters():
    state = SceneState("Intro")

    assert_http_error(lambda: set_scene_tempo_signature_overrides(RecreatedProxySong([state]), {
        "sceneIndex": 0, "tempo": {"action": "clear", "bpm": 120}
    }), 400, "invalid_request")
    assert state.log == []

    class ReadOnlyEnableScene(FakeScene):
        time_signature_enabled = property(FakeScene.time_signature_enabled.fget)

    error = assert_http_error(lambda: set_scene_tempo_signature_overrides(RecreatedProxySong([state], ReadOnlyEnableScene), {
        "sceneIndex": 0,
        "tempo": {"action": "set", "bpm": 130},
        "timeSignature": {"action": "set", "numerator": 5, "denominator": 4}
    }), 501, "scene_override_unsupported")
    assert any(item["field"] == "time_signature_enabled" for item in error.details["missingRequirements"])
    assert state.log == []


def test_exact_index_order_idempotency_and_clear():
    states = [SceneState("Same"), SceneState("Same"), SceneState("")]
    song = RecreatedProxySong(states)
    request = {
        "sceneIndex": 1,
        "tempo": {"action": "set", "bpm": 135},
        "timeSignature": {"action": "set", "numerator": 7, "denominator": 8}
    }

    changed = set_scene_tempo_signature_overrides(song, request)
    no_op = set_scene_tempo_signature_overrides(song, request)
    cleared = set_scene_tempo_signature_overrides(song, {
        "sceneIndex": 1, "tempo": {"action": "clear"}, "timeSignature": {"action": "clear"}
    })

    assert states[0].log == []
    assert changed["changedFields"] == ["tempo", "tempo_enabled", "time_signature_numerator", "time_signature_denominator", "time_signature_enabled"]
    assert no_op["status"] == "no-op"
    assert cleared["observed"]["tempo"] == {"value": None, "enabled": False, "raw": {"value": -1, "enabled": False}}
    assert cleared["observed"]["timeSignature"]["raw"] == {"numerator": -1, "denominator": -1, "enabled": False}
    assert (states[1].tempo, states[1].numerator, states[1].denominator) == (135, 7, 8)
    assert len(set(song.wrapper_ids)) > 1


def test_mutate_then_raise_rolls_back_and_reports_journal():
    state = SceneState("Verse", tempo=120, enabled=True, numerator=4, denominator=4, signature_enabled=True)
    state.fail_after["time_signature_denominator"] = "mutated then raised"
    song = RecreatedProxySong([state])

    error = assert_http_error(lambda: set_scene_tempo_signature_overrides(song, {
        "sceneIndex": 0,
        "tempo": {"action": "set", "bpm": 150},
        "timeSignature": {"action": "set", "numerator": 9, "denominator": 16}
    }), 500, "scene_override_transaction_failed")

    assert error.details["originalFailure"]["stage"] == "setter"
    assert error.details["rollback"]["succeeded"] is True
    assert [entry["field"] for entry in error.details["journal"]] == ["tempo", "time_signature_numerator", "time_signature_denominator"]
    assert (state.tempo, state.numerator, state.denominator) == (120, 4, 4)


def test_rollback_failure_and_readback_mismatch_are_reported():
    state = SceneState("Verse", tempo=120, enabled=True, numerator=4, denominator=4, signature_enabled=True)
    state.fail_after["time_signature_numerator"] = "original setter failure"
    state.fail_before["tempo"] = lambda value: value == 120

    error = assert_http_error(lambda: set_scene_tempo_signature_overrides(RecreatedProxySong([state]), {
        "sceneIndex": 0, "tempo": {"action": "set", "bpm": 160},
        "timeSignature": {"action": "set", "numerator": 3, "denominator": 8}
    }), 500, "scene_override_transaction_failed")
    assert error.details["rollback"]["succeeded"] is False
    assert error.details["rollback"]["failures"]
    assert error.details["rollback"]["verification"]

    mismatch = SceneState("Verse", tempo=120, enabled=True, numerator=4, denominator=4, signature_enabled=True)
    reads_after_write = {"count": 0}
    original_write = FakeScene.tempo.fset

    class MismatchScene(FakeScene):
        @property
        def tempo(self):
            value = FakeScene.tempo.fget(self)
            return value + 1 if reads_after_write["count"] == 1 else value

        @tempo.setter
        def tempo(self, value):
            original_write(self, value)
            reads_after_write["count"] += 1

    mismatch_error = assert_http_error(lambda: set_scene_tempo_signature_overrides(
        RecreatedProxySong([mismatch], MismatchScene), {"sceneIndex": 0, "tempo": {"action": "set", "bpm": 132}}
    ), 500, "scene_override_transaction_failed")
    assert mismatch_error.details["originalFailure"]["stage"] == "readback"
    assert mismatch_error.details["rollback"]["succeeded"] is True
    assert mismatch.tempo == 120


def test_replacement_scene_never_receives_forward_or_rollback_setters():
    original = SceneState("Original", tempo=120, enabled=True, numerator=4, denominator=4, signature_enabled=True)
    replacement = SceneState("Replacement", tempo=125, enabled=True, numerator=3, denominator=4, signature_enabled=True)
    song = RecreatedProxySong([original, replacement])
    shifted = {"done": False}

    def remove_original(field, _value):
        if field == "tempo" and not shifted["done"]:
            shifted["done"] = True
            song.states.pop(0)

    original.after_write = remove_original
    error = assert_http_error(lambda: set_scene_tempo_signature_overrides(song, {
        "sceneIndex": 0, "tempo": {"action": "set", "bpm": 130},
        "timeSignature": {"action": "set", "numerator": 7, "denominator": 4}
    }), 500, "scene_override_transaction_failed")

    assert error.details["originalFailure"] == {
        "stage": "target_reresolution",
        "field": None,
        "message": "Scene target fingerprint changed"
    }
    assert [entry["field"] for entry in error.details["journal"]] == ["tempo", "time_signature_numerator"]
    assert error.details["rollback"]["succeeded"] is False
    assert error.details["rollback"]["failures"] == []
    assert any(item["field"] == "target" for item in error.details["rollback"]["verification"])
    assert original.log == ["tempo", "time_signature_numerator", "time_signature_numerator", "tempo"]
    assert replacement.log == []


def test_missing_scene_never_redirects_pinned_receiver():
    original = SceneState("Original", tempo=120, enabled=True, numerator=4, denominator=4, signature_enabled=True)
    song = RecreatedProxySong([original])
    removed = {"done": False}

    def remove_all(field, _value):
        if field == "tempo" and not removed["done"]:
            removed["done"] = True
            song.states[:] = []

    original.after_write = remove_all
    error = assert_http_error(lambda: set_scene_tempo_signature_overrides(song, {
        "sceneIndex": 0, "tempo": {"action": "set", "bpm": 131},
        "timeSignature": {"action": "set", "numerator": 7, "denominator": 4}
    }), 500, "scene_override_transaction_failed")

    assert error.details["originalFailure"]["stage"] == "target_reresolution"
    assert error.details["originalFailure"]["field"] is None
    assert [entry["field"] for entry in error.details["journal"]] == ["tempo", "time_signature_numerator"]
    assert error.details["rollback"]["failures"] == []
    assert any(item["field"] == "target" for item in error.details["rollback"]["verification"])
    assert original.log == ["tempo", "time_signature_numerator", "time_signature_numerator", "tempo"]


def test_same_fingerprint_replacement_never_becomes_mutation_receiver():
    original = SceneState("Same", tempo=120, enabled=True, numerator=4, denominator=4, signature_enabled=True)
    replacement = SceneState("Same", tempo=130, enabled=True, numerator=3, denominator=4, signature_enabled=True)
    song = RecreatedProxySong([original, replacement])
    swapped = {"done": False}

    def replace_original(field, _value):
        if field == "tempo" and not swapped["done"]:
            swapped["done"] = True
            song.states[0] = replacement

    original.after_write = replace_original
    error = assert_http_error(lambda: set_scene_tempo_signature_overrides(song, {
        "sceneIndex": 0,
        "tempo": {"action": "set", "bpm": 130},
        "timeSignature": {"action": "set", "numerator": 7, "denominator": 4}
    }), 500, "scene_override_transaction_failed")

    assert error.details["originalFailure"]["stage"] == "readback"
    assert error.details["originalFailure"]["field"] == "timeSignature"
    assert [entry["field"] for entry in error.details["journal"]] == ["tempo", "time_signature_numerator"]
    assert error.details["rollback"]["succeeded"] is False
    assert error.details["rollback"]["failures"] == []
    assert any(item["field"] == "tempo" for item in error.details["rollback"]["verification"])
    assert any(item["field"] == "timeSignature" for item in error.details["rollback"]["verification"])
    assert original.log == ["tempo", "time_signature_numerator", "time_signature_numerator", "tempo"]
    assert replacement.log == []


def test_query_grammar_is_exact():
    assert parse_scene_index_query({"sceneIndex": ["0"]}) == 0
    for query in ({}, {"sceneIndex": ["-1"]}, {"sceneIndex": ["01"]}, {"sceneIndex": ["0", "1"]}, {"sceneIndex": ["0"], "name": ["Intro"]}):
        assert_http_error(lambda query=query: parse_scene_index_query(query), 400, "invalid_request")


def assert_http_error(operation, status_code, error_code):
    try:
        operation()
    except BridgeHttpError as error:
        assert error.status_code == status_code
        assert error.details["errorCode"] == error_code
        return error
    raise AssertionError("Expected BridgeHttpError")


if __name__ == "__main__":
    test_capability_probe_is_read_only_and_reports_raising_getter()
    test_read_only_descriptor_fails_closed()
    test_missing_and_instance_only_properties_fail_closed()
    test_validation_and_partial_capability_use_zero_setters()
    test_exact_index_order_idempotency_and_clear()
    test_mutate_then_raise_rolls_back_and_reports_journal()
    test_rollback_failure_and_readback_mismatch_are_reported()
    test_replacement_scene_never_receives_forward_or_rollback_setters()
    test_missing_scene_never_redirects_pinned_receiver()
    test_same_fingerprint_replacement_never_becomes_mutation_receiver()
    test_query_grammar_is_exact()
    if "--json" in sys.argv:
        parity_state = SceneState("Intro", tempo=124, enabled=False, numerator=4, denominator=4, signature_enabled=False)
        parity_song = RecreatedProxySong([parity_state])
        print(json.dumps({
            "capability": scene_tempo_signature_capabilities(parity_song, 0),
            "mutation": set_scene_tempo_signature_overrides(parity_song, {
                "sceneIndex": 0, "tempo": {"action": "set", "bpm": 128},
                "timeSignature": {"action": "set", "numerator": 7, "denominator": 8}
            })
        }, sort_keys=True))
    else:
        print("live scene tempo signature tests ok")
