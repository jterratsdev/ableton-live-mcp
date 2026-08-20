from __future__ import absolute_import, print_function

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from ableton_remote_scripts.AbletonMcpBridge.http_bridge import BridgeHttpError
from ableton_remote_scripts.AbletonMcpBridge.live_arrangement_delete import (
    delete_arrangement_clips,
    plan_arrangement_clip_deletion,
)


class FakeClip(object):
    def __init__(self, name, start, end, is_arrangement_clip=True):
        self.name = name
        self.start_time = start
        self.end_time = end
        self.is_arrangement_clip = is_arrangement_clip


class FakeTrack(object):
    def __init__(self, name, arrangement_clips, session_clips=None, deletion_log=None, fail_on_clip=None):
        self.name = name
        self.arrangement_clips = list(arrangement_clips)
        self.session_clips = list(session_clips or [])
        self.deletion_log = deletion_log if deletion_log is not None else []
        self.fail_on_clip = fail_on_clip
        self.song = None

    def delete_clip(self, clip):
        self.deletion_log.append((self.name, clip.name))
        if clip.name == self.fail_on_clip:
            raise RuntimeError("delete failed for %s" % clip.name)
        arrangement_index = self.arrangement_clips.index(clip)
        self.arrangement_clips.remove(clip)
        if self.song is not None:
            self.song.record_deleted_clip(self, arrangement_index, clip)


class UnsupportedDeleteTrack(FakeTrack):
    delete_clip = None


class FakeSong(object):
    def __init__(self, tracks, undo_failure=None, corrupt_undo=False):
        self.tracks = tracks
        self.undo_failure = undo_failure
        self.corrupt_undo = corrupt_undo
        self.undo_calls = 0
        self.undo_stack = []
        for track in tracks:
            track.song = self

    def record_deleted_clip(self, track, arrangement_index, clip):
        self.undo_stack.append((track, arrangement_index, clip))

    def undo(self):
        self.undo_calls += 1
        if self.undo_failure is not None:
            raise RuntimeError(self.undo_failure)
        track, arrangement_index, clip = self.undo_stack.pop()
        restored_name = "%s changed" % clip.name if self.corrupt_undo else clip.name
        restored = FakeClip(restored_name, clip.start_time, clip.end_time, clip.is_arrangement_clip)
        track.arrangement_clips.insert(arrangement_index, restored)


class RewrappedClip(object):
    def __init__(self, model):
        self.model = model

    @property
    def name(self):
        return self.model.name

    @property
    def start_time(self):
        return self.model.start_time

    @property
    def end_time(self):
        return self.model.end_time

    @property
    def is_arrangement_clip(self):
        return self.model.is_arrangement_clip


class RewrappedTrack(object):
    def __init__(self, model, song):
        self.model = model
        self.song = song

    @property
    def name(self):
        return self.model.name

    @property
    def arrangement_clips(self):
        return [RewrappedClip(clip) for clip in self.model.arrangement_clips]

    def delete_clip(self, clip):
        if self.model.no_op_delete:
            return
        arrangement_index = self.model.arrangement_clips.index(clip.model)
        self.model.arrangement_clips.remove(clip.model)
        self.song.undo_stack.append((self.model, arrangement_index, clip.model))


class RewrappedTrackModel(object):
    def __init__(self, name, clips, no_op_delete=False):
        self.name = name
        self.arrangement_clips = list(clips)
        self.no_op_delete = no_op_delete


class RewrappedSong(object):
    def __init__(self, track_models):
        self.track_models = list(track_models)
        self.undo_stack = []
        self.undo_calls = 0

    @property
    def tracks(self):
        return [RewrappedTrack(track, self) for track in self.track_models]

    def undo(self):
        self.undo_calls += 1
        track, arrangement_index, clip = self.undo_stack.pop()
        track.arrangement_clips.insert(arrangement_index, clip)


def assert_error_status(callback, status_code):
    try:
        callback()
    except BridgeHttpError as error:
        assert error.status_code == status_code
        return
    raise AssertionError("Expected BridgeHttpError status %s" % status_code)


def test_plan_is_read_only_and_returns_exact_timing():
    clip = FakeClip("Verse", 8.0, 24.0)
    track = FakeTrack("Piano", [clip], [FakeClip("Session Verse", 0.0, 16.0, False)])
    song = FakeSong([track])

    before_arrangement = list(track.arrangement_clips)
    before_session = list(track.session_clips)
    plan = plan_arrangement_clip_deletion(song)

    assert plan["readOnly"] is True
    assert plan["candidates"][0]["trackIdentity"]
    assert plan["candidates"][0]["clipIdentity"]
    assert plan["candidates"][0]["startBeat"] == 8.0
    assert plan["candidates"][0]["lengthBeats"] == 16.0
    assert track.arrangement_clips == before_arrangement
    assert track.session_clips == before_session


def test_exact_multi_delete_preserves_unselected_and_session_clips():
    deletion_log = []
    first = FakeClip("First", 0.0, 4.0)
    keep = FakeClip("Keep", 4.0, 8.0)
    last = FakeClip("Last", 8.0, 12.0)
    session = FakeClip("Session", 0.0, 4.0, False)
    track = FakeTrack("Audio", [first, keep, last], [session], deletion_log)
    song = FakeSong([track])
    plan = plan_arrangement_clip_deletion(song)
    selected = [plan["candidates"][0]["clipIdentity"], plan["candidates"][2]["clipIdentity"]]

    result = delete_arrangement_clips(song, {"planToken": plan["planToken"], "clipIdentities": selected})

    assert [clip.name for clip in track.arrangement_clips] == ["Keep"]
    assert track.session_clips == [session]
    assert deletion_log == [("Audio", "Last"), ("Audio", "First")]
    assert result["deletedCount"] == 2
    assert all(item["verifiedAbsent"] for item in result["results"])


def test_stale_missing_duplicate_and_partial_support_fail_before_mutation():
    first = FakeClip("First", 0.0, 4.0)
    unsupported = FakeClip("Unsupported", 4.0, 8.0)
    supported_track = FakeTrack("Supported", [first])
    unsupported_track = UnsupportedDeleteTrack("Unsupported", [unsupported])
    song = FakeSong([supported_track, unsupported_track])
    plan = plan_arrangement_clip_deletion(song)
    supported_identity = plan["candidates"][0]["clipIdentity"]
    unsupported_identity = plan["candidates"][1]["clipIdentity"]

    assert_error_status(lambda: delete_arrangement_clips(song, {
        "planToken": plan["planToken"], "clipIdentities": [supported_identity, unsupported_identity]
    }), 501)
    assert supported_track.arrangement_clips == [first]
    assert unsupported_track.arrangement_clips == [unsupported]

    assert_error_status(lambda: delete_arrangement_clips(song, {
        "planToken": plan["planToken"], "clipIdentities": [supported_identity, supported_identity]
    }), 409)
    assert supported_track.arrangement_clips == [first]

    assert_error_status(lambda: delete_arrangement_clips(song, {
        "planToken": plan["planToken"], "clipIdentities": ["missing"]
    }), 409)
    assert supported_track.arrangement_clips == [first]

    first.name = "Changed"
    assert_error_status(lambda: delete_arrangement_clips(song, {
        "planToken": plan["planToken"], "clipIdentities": [supported_identity]
    }), 409)
    assert supported_track.arrangement_clips == [first]

    replacement = FakeClip("Changed", 0.0, 5.0)
    replacement_plan = plan_arrangement_clip_deletion(song)
    supported_track.arrangement_clips[0] = replacement
    assert_error_status(lambda: delete_arrangement_clips(song, {
        "planToken": replacement_plan["planToken"],
        "clipIdentities": [replacement_plan["candidates"][0]["clipIdentity"]]
    }), 409)
    assert supported_track.arrangement_clips == [replacement]


def test_recreated_proxies_keep_plan_and_exact_identity_stable():
    track_model = RewrappedTrackModel("Piano", [
        FakeClip("Intro", 0.0, 8.0),
        FakeClip("Verse", 8.0, 24.0)
    ])
    song = RewrappedSong([track_model])

    plans = [plan_arrangement_clip_deletion(song) for _ in range(3)]
    assert len(set(plan["planToken"] for plan in plans)) == 1
    assert len(set(plan["candidates"][0]["trackIdentity"] for plan in plans)) == 1
    assert len(set(plan["candidates"][0]["clipIdentity"] for plan in plans)) == 1

    selected = plans[0]["candidates"][1]["clipIdentity"]
    result = delete_arrangement_clips(song, {
        "planToken": plans[0]["planToken"],
        "clipIdentities": [selected]
    })
    assert [clip.name for clip in track_model.arrangement_clips] == ["Intro"]
    assert result["deletedCount"] == 1
    assert result["results"][0]["verifiedAbsent"] is True


def test_no_op_delete_is_detected_without_undoing_unrelated_history():
    clip = FakeClip("No op", 0.0, 4.0)
    track_model = RewrappedTrackModel("Audio", [clip], no_op_delete=True)
    song = RewrappedSong([track_model])
    plan = plan_arrangement_clip_deletion(song)

    try:
        delete_arrangement_clips(song, {
            "planToken": plan["planToken"],
            "clipIdentities": [plan["candidates"][0]["clipIdentity"]]
        })
    except BridgeHttpError as error:
        assert error.status_code == 500
        assert "did not remove Arrangement clip" in str(error)
        assert "rollback verified" in str(error)
    else:
        raise AssertionError("Expected no-op deletion verification failure")

    assert song.undo_calls == 0
    assert track_model.arrangement_clips == [clip]


def test_mid_delete_failure_undoes_each_completed_delete_and_verifies_observable_state():
    first = FakeClip("First", 0.0, 4.0)
    middle = FakeClip("Middle", 4.0, 8.0)
    last = FakeClip("Last", 8.0, 12.0)
    track = FakeTrack("Audio", [first, middle, last], fail_on_clip="First")
    song = FakeSong([track])
    plan = plan_arrangement_clip_deletion(song)

    try:
        delete_arrangement_clips(song, {
            "planToken": plan["planToken"],
            "clipIdentities": [candidate["clipIdentity"] for candidate in plan["candidates"]]
        })
    except BridgeHttpError as error:
        assert error.status_code == 500
        assert "delete failed for First" in str(error)
        assert "rollback verified" in str(error)
    else:
        raise AssertionError("Expected the original deletion failure")

    assert song.undo_calls == 2
    assert [clip.name for clip in track.arrangement_clips] == ["First", "Middle", "Last"]
    assert track.arrangement_clips[1] is not middle
    assert track.arrangement_clips[2] is not last


def test_mid_delete_failure_reports_undo_failure_explicitly():
    first = FakeClip("First", 0.0, 4.0)
    last = FakeClip("Last", 8.0, 12.0)
    track = FakeTrack("Audio", [first, last], fail_on_clip="First")
    song = FakeSong([track], undo_failure="undo unavailable")
    plan = plan_arrangement_clip_deletion(song)

    try:
        delete_arrangement_clips(song, {
            "planToken": plan["planToken"],
            "clipIdentities": [candidate["clipIdentity"] for candidate in plan["candidates"]]
        })
    except BridgeHttpError as error:
        assert error.status_code == 500
        assert "rollback failed" in str(error)
        assert "undo unavailable" in str(error)
    else:
        raise AssertionError("Expected explicit rollback failure")

    assert song.undo_calls == 1
    assert [clip.name for clip in track.arrangement_clips] == ["First"]


def test_mid_delete_failure_reports_restoration_readback_mismatch():
    first = FakeClip("First", 0.0, 4.0)
    last = FakeClip("Last", 8.0, 12.0)
    track = FakeTrack("Audio", [first, last], fail_on_clip="First")
    song = FakeSong([track], corrupt_undo=True)
    plan = plan_arrangement_clip_deletion(song)

    try:
        delete_arrangement_clips(song, {
            "planToken": plan["planToken"],
            "clipIdentities": [candidate["clipIdentity"] for candidate in plan["candidates"]]
        })
    except BridgeHttpError as error:
        assert error.status_code == 500
        assert "rollback failed" in str(error)
        assert "restoration fingerprint mismatch" in str(error)
    else:
        raise AssertionError("Expected restoration verification failure")

    assert song.undo_calls == 1


def test_missing_song_undo_fails_before_mutation():
    first = FakeClip("First", 0.0, 4.0)
    track = FakeTrack("Audio", [first])
    song = FakeSong([track])
    song.undo = None
    plan = plan_arrangement_clip_deletion(song)

    assert_error_status(lambda: delete_arrangement_clips(song, {
        "planToken": plan["planToken"],
        "clipIdentities": [plan["candidates"][0]["clipIdentity"]]
    }), 501)
    assert track.arrangement_clips == [first]


if __name__ == "__main__":
    test_plan_is_read_only_and_returns_exact_timing()
    test_exact_multi_delete_preserves_unselected_and_session_clips()
    test_stale_missing_duplicate_and_partial_support_fail_before_mutation()
    test_recreated_proxies_keep_plan_and_exact_identity_stable()
    test_no_op_delete_is_detected_without_undoing_unrelated_history()
    test_mid_delete_failure_undoes_each_completed_delete_and_verifies_observable_state()
    test_mid_delete_failure_reports_undo_failure_explicitly()
    test_mid_delete_failure_reports_restoration_readback_mismatch()
    test_missing_song_undo_fails_before_mutation()
    print("live arrangement delete fake-Live tests ok")
