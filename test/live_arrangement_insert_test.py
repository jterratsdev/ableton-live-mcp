from __future__ import absolute_import, print_function

import os
import sys
import tempfile
import types

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from ableton_remote_scripts.AbletonMcpBridge.http_bridge import BridgeHttpError
from ableton_remote_scripts.AbletonMcpBridge.AbletonMcpBridge import AbletonMcpBridge
from ableton_remote_scripts.AbletonMcpBridge.live_arrangement_contract import arrangement_state
from ableton_remote_scripts.AbletonMcpBridge.live_arrangement_insert import arrangement_insertion_capabilities, insert_arrangement_clip


class ClipModel(object):
    def __init__(self, name, start, length, is_midi=True, notes=None):
        self.name = name
        self.start = start
        self.length = length
        self.is_midi = is_midi
        self.notes = list(notes or [])

    def clone(self):
        return ClipModel(self.name, self.start, self.length, self.is_midi, list(self.notes))


class ClipProxy(object):
    def __init__(self, model, song, modern=True, readable=True):
        self.model = model
        self.song = song
        self.modern = modern
        self.readable = readable
        self.add_calls = 0
        self.set_calls = 0

    @property
    def name(self):
        return self.model.name

    @name.setter
    def name(self, value):
        self.model.name = value

    @property
    def start_time(self):
        return self.model.start

    @property
    def end_time(self):
        return self.model.start + self.model.length

    @property
    def length(self):
        return self.model.length

    @property
    def is_midi_clip(self):
        return self.model.is_midi

    def __getattribute__(self, name):
        if name == "add_new_notes" and not object.__getattribute__(self, "modern"):
            return None
        return object.__getattribute__(self, name)

    def add_new_notes(self, notes):
        self.add_calls += 1
        self.song.note_method_calls.append("add_new_notes")
        self.song.record_undo()
        self.model.notes.extend(list(notes))

    def set_notes(self, notes):
        self.set_calls += 1
        self.song.note_method_calls.append("set_notes")
        self.song.record_undo()
        self.model.notes = list(notes)

    def get_notes_extended(self, from_pitch, pitch_span, from_time, time_span):
        if not self.readable:
            raise RuntimeError("note readback failed")
        return list(self.model.notes)


class SlotProxy(object):
    def __init__(self, model, song, modern=True):
        self.model = model
        self.song = song
        self.modern = modern

    @property
    def has_clip(self):
        return self.model is not None

    @property
    def clip(self):
        return ClipProxy(self.model, self.song, self.modern)


class TrackModel(object):
    def __init__(self, name, kind="midi", arrangement=None, session=None, modern=True):
        self.name = name
        self.kind = kind
        self.arrangement = list(arrangement or [])
        self.session = list(session or [])
        self.modern = modern
        self.supported = {"create_midi_clip": True, "duplicate_clip_to_arrangement": True, "create_audio_clip": True}
        self.behavior = "normal"
        self.note_readable = True


class TrackProxy(object):
    def __init__(self, model, song):
        self.model = model
        self.song = song

    def __getattribute__(self, name):
        if name in ("create_midi_clip", "duplicate_clip_to_arrangement", "create_audio_clip"):
            model = object.__getattribute__(self, "model")
            if not model.supported[name]:
                return None
        return object.__getattribute__(self, name)

    @property
    def name(self):
        return self.model.name

    @property
    def has_midi_input(self):
        return self.model.kind == "midi"

    @property
    def has_audio_input(self):
        return self.model.kind == "audio"

    @property
    def arrangement_clips(self):
        return [ClipProxy(clip, self.song, self.model.modern, self.model.note_readable) for clip in self.model.arrangement]

    @property
    def clip_slots(self):
        return [SlotProxy(clip, self.song, self.model.modern) for clip in self.model.session]

    def create_midi_clip(self, start, length):
        return self._insert(ClipModel("MIDI Clip", start, length, True))

    def duplicate_clip_to_arrangement(self, clip, start):
        source = clip.model
        duplicated = self._insert(ClipModel(source.name, start, source.length, source.is_midi, source.notes))
        if self.model.behavior == "source_stale":
            source.name = "Changed source"
        return duplicated

    def create_audio_clip(self, path, start):
        return self._insert(ClipModel(os.path.basename(path), start, 8.0, False))

    def _insert(self, clip):
        self.song.record_undo()
        if self.model.behavior == "raise_before":
            raise RuntimeError("host rejected insertion")
        if self.model.behavior == "noop":
            return None
        if self.model.behavior == "wrong_time":
            clip.start += 1
        if self.model.behavior == "unexpected_existing_change" and self.model.arrangement:
            self.model.arrangement[0].name = "Unexpected change"
        self.model.arrangement.append(clip)
        if self.model.behavior == "raise_after_insert":
            raise RuntimeError("host failed after insertion")
        if self.model.behavior == "multiple":
            self.model.arrangement.append(ClipModel("Unexpected", clip.start + 1, clip.length, clip.is_midi))
        self.model.arrangement.sort(key=lambda item: item.start)
        return ClipProxy(clip, self.song, self.model.modern, self.model.note_readable)


class Song(object):
    def __init__(self, models):
        self.models = models
        self.undo_stack = []
        self.undo_calls = 0
        self.note_method_calls = []
        self.undo_mode = "normal"

    @property
    def tracks(self):
        return [TrackProxy(model, self) for model in self.models]

    def record_undo(self):
        self.undo_stack.append([[clip.clone() for clip in model.arrangement] for model in self.models])

    def undo(self):
        self.undo_calls += 1
        if self.undo_mode == "raise":
            raise RuntimeError("undo rejected")
        if not self.undo_stack:
            raise RuntimeError("nothing to undo")
        snapshot = self.undo_stack.pop()
        if self.undo_mode != "noop":
            for model, clips in zip(self.models, snapshot):
                model.arrangement = clips


def midi_payload(**overrides):
    payload = {
        "mode": "midi_notes", "trackIndex": 0, "startBeat": 8.0, "lengthBeats": 4.0,
        "name": "Lead", "notes": [
            {"pitch": 60, "start": 0.0, "duration": 1.0, "velocity": 90},
            {"pitch": 64, "start": 1.0, "duration": 1.0, "velocity": 100}
        ]
    }
    payload.update(overrides)
    return payload


def expect_error(callback, code):
    try:
        callback()
    except BridgeHttpError as error:
        assert error.details.get("errorCode") == code, (code, error.details, str(error))
        return error
    raise AssertionError("Expected %s" % code)


def test_capabilities_are_target_specific_and_read_only():
    midi = TrackModel("MIDI", "midi")
    audio = TrackModel("Audio", "audio")
    audio.supported["create_midi_clip"] = False
    song = Song([midi, audio])
    before = arrangement_state(song)["fingerprint"]

    response = arrangement_insertion_capabilities(song, 1)

    assert response["readOnly"] is True
    assert response["target"]["trackIndex"] == 1
    assert response["methods"]["create_midi_clip"] == {"callable": False, "applicable": False, "executable": False}
    assert response["methods"]["create_audio_clip"]["executable"] is True
    assert arrangement_state(song)["fingerprint"] == before


def test_capability_route_normalizes_query_string_index():
    song = Song([TrackModel("MIDI", "midi")])
    bridge = AbletonMcpBridge.__new__(AbletonMcpBridge)
    bridge.song = lambda: song
    bridge._call_live_thread = lambda callback: callback()

    response = bridge.handle_request(
        "GET", "/arrangement/insertion-capabilities", {"trackIndex": ["0"]}, {}
    )

    assert response["target"]["trackIndex"] == 0
    expect_error(
        lambda: bridge.handle_request(
            "GET", "/arrangement/insertion-capabilities", {"trackIndex": ["bad"]}, {}
        ),
        None
    )


def test_live_12_midi_uses_modern_notes_and_returns_exact_readback():
    song = Song([TrackModel("Synth", "midi", modern=True)])

    result = insert_arrangement_clip(song, midi_payload())

    assert len(song.models[0].arrangement) == 1
    assert song.models[0].arrangement[0].start == 8.0
    assert song.models[0].arrangement[0].length == 4.0
    assert song.models[0].arrangement[0].name == "Lead"
    assert len(song.models[0].arrangement[0].notes) == 2
    assert result["clip"]["trackIndex"] == 0
    assert result["clip"]["startBeat"] == 8.0
    assert result["clip"]["lengthBeats"] == 4.0
    assert result["clip"]["name"] == "Lead"
    assert result["noteCount"] == 2
    assert result["noteWriteMethod"] == "add_new_notes"
    assert song.note_method_calls == ["add_new_notes"]


def test_legacy_midi_uses_set_notes_only_when_modern_is_unavailable():
    song = Song([TrackModel("Legacy", "midi", modern=False)])

    result = insert_arrangement_clip(song, midi_payload(name="Legacy Clip"))

    assert result["noteWriteMethod"] == "set_notes"
    assert song.note_method_calls == ["set_notes"]


def test_exact_session_slot_is_duplicated_without_changing_source():
    source = ClipModel("Verse", 0.0, 16.0, True, [(60, 0, 1, 100, False)])
    other = ClipModel("Other", 0.0, 4.0, True)
    model = TrackModel("Keys", "midi", session=[other, source])
    song = Song([model])
    source_before = (source.name, source.length, list(source.notes))

    result = insert_arrangement_clip(song, {
        "mode": "session_clip", "trackIndex": 0, "sourceTrackIndex": 0,
        "sourceClipSlotIndex": 1, "startBeat": 32.0
    })

    assert len(model.arrangement) == 1
    assert result["clip"]["name"] == "Verse"
    assert result["clip"]["startBeat"] == 32.0
    assert result["clip"]["lengthBeats"] == 16.0
    assert (source.name, source.length, source.notes) == source_before


def test_audio_file_insertion_returns_redacted_observed_clip():
    descriptor, path = tempfile.mkstemp(suffix=".wav")
    os.close(descriptor)
    try:
        song = Song([TrackModel("Audio", "audio")])
        result = insert_arrangement_clip(song, {"mode": "audio_file", "trackIndex": 0, "startBeat": 4.0, "sourcePath": path})
        assert result["clip"]["kind"] == "audio"
        assert result["clip"]["startBeat"] == 4.0
        assert path not in str(result)
    finally:
        os.unlink(path)


def test_preflight_failures_are_explicit_and_do_not_mutate():
    model = TrackModel("MIDI", "midi", session=[None])
    song = Song([model])
    before = arrangement_state(song)["fingerprint"]
    model.supported["create_midi_clip"] = False
    expect_error(lambda: insert_arrangement_clip(song, midi_payload()), "unsupported_method")
    model.supported["create_midi_clip"] = True
    expect_error(lambda: insert_arrangement_clip(song, midi_payload(trackIndex=1)), "target_not_found")
    expect_error(lambda: insert_arrangement_clip(song, {"mode": "audio_file", "trackIndex": 0, "startBeat": 0, "sourcePath": "/missing.wav"}), "wrong_track_kind")
    audio_song = Song([TrackModel("Audio", "audio")])
    expect_error(lambda: insert_arrangement_clip(audio_song, {"mode": "audio_file", "trackIndex": 0, "startBeat": 0, "sourcePath": "/missing.wav"}), "file_not_permitted")
    expect_error(lambda: insert_arrangement_clip(song, {"mode": "session_clip", "trackIndex": 0, "sourceTrackIndex": 0, "sourceClipSlotIndex": 0, "startBeat": 0}), "source_slot_empty")
    expect_error(lambda: insert_arrangement_clip(song, midi_payload(expectedFingerprint="stale")), "precondition_stale")
    expect_error(lambda: insert_arrangement_clip(song, {"trackIndex": 0, "startBeat": 0}), "legacy_payload_unsupported")
    assert arrangement_state(song)["fingerprint"] == before
    assert song.undo_calls == 0


def test_post_mutation_failures_undo_and_verify_complete_pre_state():
    for behavior, expected_code in (("wrong_time", "readback_mismatch"), ("multiple", "ambiguous_readback")):
        model = TrackModel("MIDI", "midi")
        model.behavior = behavior
        song = Song([model])
        before = arrangement_state(song)["fingerprint"]

        error = expect_error(lambda: insert_arrangement_clip(song, midi_payload()), expected_code)

        assert error.details["rollbackVerified"] is True
        assert song.undo_calls >= 1
        assert arrangement_state(song)["fingerprint"] == before

    existing = ClipModel("Existing", 0, 4, True)
    model = TrackModel("MIDI", "midi", arrangement=[existing])
    model.behavior = "unexpected_existing_change"
    song = Song([model])
    before = arrangement_state(song)["fingerprint"]
    error = expect_error(lambda: insert_arrangement_clip(song, midi_payload()), "unexpected_post_state")
    assert error.details["rollbackVerified"] is True
    assert arrangement_state(song)["fingerprint"] == before


def test_noop_readback_and_source_stale_fail_with_bounded_rollback():
    noop_model = TrackModel("MIDI", "midi")
    noop_model.behavior = "noop"
    noop_song = Song([noop_model])
    error = expect_error(lambda: insert_arrangement_clip(noop_song, midi_payload()), "mutation_noop")
    assert error.details["rollbackVerified"] is True
    assert noop_song.undo_calls == 1

    unreadable_model = TrackModel("MIDI", "midi")
    unreadable_model.note_readable = False
    unreadable_song = Song([unreadable_model])
    before = arrangement_state(unreadable_song)["fingerprint"]
    error = expect_error(lambda: insert_arrangement_clip(unreadable_song, midi_payload()), "unexpected_post_state")
    assert error.details["rollbackVerified"] is True
    assert unreadable_song.undo_calls == 2
    assert arrangement_state(unreadable_song)["fingerprint"] == before

    source = ClipModel("Source", 0, 4, True)
    source_model = TrackModel("MIDI", "midi", session=[source])
    source_model.behavior = "source_stale"
    source_song = Song([source_model])
    error = expect_error(lambda: insert_arrangement_clip(source_song, {
        "mode": "session_clip", "trackIndex": 0, "sourceTrackIndex": 0,
        "sourceClipSlotIndex": 0, "startBeat": 8
    }), "rollback_failed")
    assert error.details["originalErrorCode"] == "source_stale"
    assert source_song.undo_calls == 1


def test_rollback_failure_is_never_reported_as_success():
    model = TrackModel("MIDI", "midi")
    model.behavior = "wrong_time"
    song = Song([model])
    song.undo_mode = "noop"

    error = expect_error(lambda: insert_arrangement_clip(song, midi_payload()), "rollback_failed")

    assert error.details["originalErrorCode"] == "readback_mismatch"
    assert song.undo_calls == 2
    assert len(model.arrangement) == 1


def test_present_live_module_without_note_spec_rolls_back_created_clip():
    model = TrackModel("MIDI", "midi", modern=True)
    song = Song([model])
    before = arrangement_state(song)["fingerprint"]
    previous_live = sys.modules.get("Live")
    sys.modules["Live"] = types.SimpleNamespace(Clip=types.SimpleNamespace())
    try:
        error = expect_error(lambda: insert_arrangement_clip(song, midi_payload()), "unexpected_post_state")
    finally:
        if previous_live is None:
            del sys.modules["Live"]
        else:
            sys.modules["Live"] = previous_live

    assert error.details["rollbackVerified"] is True
    assert song.undo_calls == 1
    assert arrangement_state(song)["fingerprint"] == before


def test_host_exceptions_rollback_only_when_mutation_is_observable():
    partial_model = TrackModel("MIDI", "midi")
    partial_model.behavior = "raise_after_insert"
    partial_song = Song([partial_model])
    before = arrangement_state(partial_song)["fingerprint"]

    error = expect_error(lambda: insert_arrangement_clip(partial_song, midi_payload()), "unexpected_post_state")

    assert error.details["rollbackVerified"] is True
    assert partial_song.undo_calls == 1
    assert arrangement_state(partial_song)["fingerprint"] == before

    rejected_model = TrackModel("MIDI", "midi")
    rejected_model.behavior = "raise_before"
    rejected_song = Song([rejected_model])
    expect_error(lambda: insert_arrangement_clip(rejected_song, midi_payload()), "unexpected_post_state")
    assert rejected_song.undo_calls == 0


if __name__ == "__main__":
    test_capabilities_are_target_specific_and_read_only()
    test_capability_route_normalizes_query_string_index()
    test_live_12_midi_uses_modern_notes_and_returns_exact_readback()
    test_legacy_midi_uses_set_notes_only_when_modern_is_unavailable()
    test_exact_session_slot_is_duplicated_without_changing_source()
    test_audio_file_insertion_returns_redacted_observed_clip()
    test_preflight_failures_are_explicit_and_do_not_mutate()
    test_post_mutation_failures_undo_and_verify_complete_pre_state()
    test_noop_readback_and_source_stale_fail_with_bounded_rollback()
    test_rollback_failure_is_never_reported_as_success()
    test_present_live_module_without_note_spec_rolls_back_created_clip()
    test_host_exceptions_rollback_only_when_mutation_is_observable()
    print("arrangement insertion fake-Live tests ok")
