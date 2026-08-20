from __future__ import absolute_import, print_function

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from ableton_remote_scripts.AbletonMcpBridge.http_bridge import BridgeHttpError
from ableton_remote_scripts.AbletonMcpBridge.live_track_operations import duplicate_track


class FakeParameter(object):
    value = 0.5
    display_value = "0.0 dB"

    def str_for_value(self, value):
        return self.display_value


class FakeMixer(object):
    def __init__(self):
        self.volume = FakeParameter()
        self.panning = FakeParameter()
        self.sends = []


class TrackModel(object):
    def __init__(self, name):
        self.name = name


class TrackProxy(object):
    def __init__(self, model, song):
        self.model = model
        self.song = song
        self.mixer_device = FakeMixer()
        self.has_midi_input = True
        self.mute = False
        self.solo = False
        self.arm = False
        self.current_input_routing = None
        self.current_output_routing = None
        self.devices = []
        self.clip_slots = []

    @property
    def name(self):
        return self.model.name

    @name.setter
    def name(self, value):
        before = self.model.name
        self.model.name = value
        self.song.undo_stack.append(("rename", self.model, before))


class RewrappedSong(object):
    def __init__(self, names, wrong_insert_index=None, ignore_rename=False):
        self.models = [TrackModel(name) for name in names]
        self.wrong_insert_index = wrong_insert_index
        self.ignore_rename = ignore_rename
        self.undo_stack = []
        self.undo_calls = 0

    @property
    def tracks(self):
        proxies = [TrackProxy(model, self) for model in self.models]
        if self.ignore_rename:
            for proxy in proxies:
                proxy.__class__ = IgnoreRenameTrackProxy
        return proxies

    def duplicate_track(self, source_index):
        if not isinstance(source_index, int):
            source_index = self.models.index(source_index.model)
        insert_index = source_index + 1 if self.wrong_insert_index is None else self.wrong_insert_index
        duplicate = TrackModel("%s Copy" % self.models[source_index].name)
        self.models.insert(insert_index, duplicate)
        self.undo_stack.append(("duplicate", duplicate, None))
        return TrackProxy(duplicate, self)

    def undo(self):
        self.undo_calls += 1
        kind, model, previous = self.undo_stack.pop()
        if kind == "rename":
            model.name = previous
        else:
            self.models.remove(model)


class IgnoreRenameTrackProxy(TrackProxy):
    @TrackProxy.name.setter
    def name(self, value):
        return


def test_nonzero_duplicate_uses_exact_insertion_index_with_fresh_proxies():
    song = RewrappedSong(["Drums", "Piano", "Atmosphere"])

    result = duplicate_track(song, {"trackIndex": 1, "name": "Piano Double"})

    assert [model.name for model in song.models] == ["Drums", "Piano", "Piano Double", "Atmosphere"]
    assert result["sourceTrackIndex"] == 1
    assert result["newTrackIndex"] == 2
    assert result["track"]["name"] == "Piano Double"
    assert song.undo_calls == 0


def test_wrong_insertion_rolls_back_without_renaming_track_zero():
    song = RewrappedSong(["Drums", "Piano", "Atmosphere"], wrong_insert_index=0)

    try:
        duplicate_track(song, {"trackIndex": 1, "name": "Piano Double"})
    except BridgeHttpError as error:
        assert error.status_code == 500
        assert "rollback verified" in str(error)
    else:
        raise AssertionError("Expected exact duplicate readback failure")

    assert [model.name for model in song.models] == ["Drums", "Piano", "Atmosphere"]
    assert song.undo_calls == 2


def test_ignored_destination_rename_rolls_back_duplicate():
    song = RewrappedSong(["Drums", "Piano", "Atmosphere"], ignore_rename=True)

    try:
        duplicate_track(song, {"trackIndex": 1, "name": "Piano Double"})
    except BridgeHttpError as error:
        assert error.status_code == 500
        assert "rollback verified" in str(error)
    else:
        raise AssertionError("Expected duplicate name readback failure")

    assert [model.name for model in song.models] == ["Drums", "Piano", "Atmosphere"]
    assert song.undo_calls == 1


def test_missing_undo_fails_before_mutation():
    song = RewrappedSong(["Drums", "Piano"])
    song.undo = None

    try:
        duplicate_track(song, {"trackIndex": 1, "name": "Piano Double"})
    except BridgeHttpError as error:
        assert error.status_code == 501
    else:
        raise AssertionError("Expected callable Song.undo preflight")

    assert [model.name for model in song.models] == ["Drums", "Piano"]


def test_suite_host_failure_is_not_misclassified_as_capacity():
    song = RewrappedSong(["Track %s" % index for index in range(8)])

    def reject_duplicate(source_index):
        raise RuntimeError("host refused duplicate")

    song.duplicate_track = reject_duplicate
    runtime_path = "/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/script.py"
    try:
        duplicate_track(song, {"trackIndex": 3}, runtime_path)
    except BridgeHttpError as error:
        assert error.status_code == 500
        assert error.details == {}
        assert "failed before observable mutation" in str(error)
        assert "host refused duplicate" in str(error)
    else:
        raise AssertionError("Expected host duplication failure")

    assert [model.name for model in song.models] == ["Track %s" % index for index in range(8)]


if __name__ == "__main__":
    test_nonzero_duplicate_uses_exact_insertion_index_with_fresh_proxies()
    test_wrong_insertion_rolls_back_without_renaming_track_zero()
    test_ignored_destination_rename_rolls_back_duplicate()
    test_missing_undo_fails_before_mutation()
    test_suite_host_failure_is_not_misclassified_as_capacity()
    print("live track operations fresh-proxy tests ok")
