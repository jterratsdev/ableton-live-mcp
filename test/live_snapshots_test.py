from __future__ import absolute_import, print_function

import importlib.util
import os
import sys
import types
import unittest


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULE_PATH = os.path.join(
    ROOT,
    "ableton_remote_scripts",
    "AbletonMcpBridge",
    "live_snapshots.py",
)


def load_live_snapshots():
    package = types.ModuleType("AbletonMcpBridge")
    package.__path__ = []
    sys.modules["AbletonMcpBridge"] = package

    clips = types.ModuleType("AbletonMcpBridge.live_clips")
    clips.create_midi_clip = lambda song, payload: {"clip": payload}
    sys.modules[clips.__name__] = clips

    summaries = types.ModuleType("AbletonMcpBridge.live_summaries")
    summaries.clip_note_summary = lambda note: note
    summaries.track_type = lambda track: "midi" if track.has_midi_input else "audio"
    summaries.track_detail = lambda index, track: {
        "index": index,
        "name": track.name,
        "volumeRaw": track.mixer_device.volume.value
    }
    summaries.return_track_detail = lambda index, track: {
        "index": index,
        "name": track.name,
        "volumeRaw": track.mixer_device.volume.value
    }
    summaries.master_track_detail = lambda track: {
        "name": track.name,
        "volumeRaw": track.mixer_device.volume.value
    }
    sys.modules[summaries.__name__] = summaries

    spec = importlib.util.spec_from_file_location("AbletonMcpBridge.live_snapshots", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


LIVE_SNAPSHOTS = load_live_snapshots()


class FakeParameter(object):
    def __init__(self, value):
        self._value = value
        self.reject_writes = False

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        if self.reject_writes:
            raise RuntimeError("parameter write rejected")
        self._value = value


class FakeMixer(object):
    def __init__(self, volume, pan, sends=None, cue=None):
        self.volume = FakeParameter(volume)
        self.panning = FakeParameter(pan)
        self.sends = [FakeParameter(value) for value in (sends or [])]
        if cue is not None:
            self.cue_volume = FakeParameter(cue)


class FakeTrack(object):
    def __init__(self, name, volume, pan=0.0, sends=None, arm=True):
        self.name = name
        self.mixer_device = FakeMixer(volume, pan, sends)
        self.mute = False
        self.solo = False
        if arm:
            self.arm = False
        self.has_midi_input = False
        self.clip_slots = []


class OptionalMainTrack(FakeTrack):
    def __init__(self, raises=False):
        FakeTrack.__init__(self, "Main", 0.85, 0.0, [], arm=False)
        del self.mute
        del self.solo
        self.raises = raises
        self.optional_accesses = 0
        self.mixer_device.cue_volume = FakeParameter(0.42)

    def __getattr__(self, name):
        if name in ("mute", "solo"):
            self.optional_accesses += 1
            if self.raises:
                raise RuntimeError("Main track has no '%s' property" % name)
            raise AttributeError(name)
        raise AttributeError(name)


class FakeSong(object):
    def __init__(self):
        # Displays in the incident were -7.372, -8.337, -10.161, and -5.68 dB.
        # These are captured as the exact native raw values exposed by each fake
        # Live parameter; rollback never derives them from the display dB values.
        self.tracks = [
            FakeTrack("Piano -7.372 dB", 0.6831, -0.1, [0.11, 0.22]),
            FakeTrack("Strings -8.337 dB", 0.6412, 0.15, [0.31, 0.41]),
            FakeTrack("Flute -10.161 dB", 0.5537, 0.25, [0.51, 0.61]),
            FakeTrack("Guitar -5.68 dB", 0.7354, -0.2, [0.71, 0.81])
        ]
        self.return_tracks = [
            FakeTrack("Hall", 0.61, -0.05, [0.12], arm=False),
            FakeTrack("Delay", 0.52, 0.08, [], arm=False)
        ]
        self.master_track = FakeTrack("Master", 0.85, 0.0, [], arm=False)
        self.master_track.mixer_device.cue_volume = FakeParameter(0.42)
        self.tempo = 140
        self.signature_numerator = 3
        self.signature_denominator = 4


class LiveSnapshotsTest(unittest.TestCase):
    def test_master_snapshot_omits_absent_optional_mute_and_solo(self):
        song = FakeSong()
        song.master_track = OptionalMainTrack()

        snapshot = LIVE_SNAPSHOTS.project_snapshot(song)
        mixer_state = snapshot["master"]["mixerState"]

        self.assertNotIn("muted", mixer_state)
        self.assertNotIn("solo", mixer_state)
        self.assertFalse(LIVE_SNAPSHOTS.attribute_snapshot(song.master_track, "mute")["supported"])

    def test_master_snapshot_handles_raising_optional_properties_and_rollback_does_not_reaccess_them(self):
        song = FakeSong()
        song.master_track = OptionalMainTrack(raises=True)

        snapshot = LIVE_SNAPSHOTS.project_snapshot(song)
        mixer_state = snapshot["master"]["mixerState"]
        self.assertNotIn("muted", mixer_state)
        self.assertNotIn("solo", mixer_state)

        song.master_track.optional_accesses = 0
        restored = LIVE_SNAPSHOTS.apply_project_snapshot(song, snapshot)
        master_result = restored["mixerState"]["targets"][-1]

        self.assertTrue(restored["complete"])
        self.assertEqual(master_result["summary"]["failed"], 0)
        self.assertEqual(song.master_track.optional_accesses, 0)

    def test_round_trip_restores_raw_track_return_and_master_mixer_state(self):
        song = FakeSong()
        snapshot = LIVE_SNAPSHOTS.project_snapshot(song)

        self.assertEqual(snapshot["tracks"][0]["mixerState"]["volumeRaw"]["value"], 0.6831)
        self.assertEqual(snapshot["tracks"][3]["mixerState"]["sendsRaw"]["values"][1]["value"], 0.81)
        self.assertEqual(snapshot["returns"][0]["mixerState"]["panRaw"]["value"], -0.05)
        self.assertEqual(snapshot["master"]["mixerState"]["cueVolumeRaw"]["value"], 0.42)

        for track in song.tracks:
            track.mixer_device.volume.value = 0.01
            track.mixer_device.panning.value = 0.9
            track.mute = True
            track.solo = True
            track.arm = True
            for send in track.mixer_device.sends:
                send.value = 0.0
        song.return_tracks[0].mixer_device.volume.value = 0.02
        song.return_tracks[0].mixer_device.sends[0].value = 0.0
        song.master_track.mixer_device.volume.value = 0.03
        song.master_track.mixer_device.cue_volume.value = 0.04

        restored = LIVE_SNAPSHOTS.apply_project_snapshot(song, snapshot)

        self.assertTrue(restored["complete"])
        self.assertEqual(restored["mixerState"]["failedCount"], 0)
        self.assertGreater(restored["mixerState"]["appliedCount"], 30)
        self.assertEqual(song.tracks[0].mixer_device.volume.value, 0.6831)
        self.assertEqual(song.tracks[3].mixer_device.volume.value, 0.7354)
        self.assertEqual(song.tracks[2].mixer_device.panning.value, 0.25)
        self.assertEqual(song.tracks[1].mixer_device.sends[1].value, 0.41)
        self.assertEqual(song.return_tracks[0].mixer_device.volume.value, 0.61)
        self.assertEqual(song.return_tracks[0].mixer_device.sends[0].value, 0.12)
        self.assertEqual(song.master_track.mixer_device.volume.value, 0.85)
        self.assertEqual(song.master_track.mixer_device.cue_volume.value, 0.42)

    def test_rejected_raw_write_is_reported_as_failed_and_incomplete(self):
        song = FakeSong()
        snapshot = LIVE_SNAPSHOTS.project_snapshot(song)
        guitar_volume = song.tracks[3].mixer_device.volume
        guitar_volume._value = 0.1
        guitar_volume.reject_writes = True

        restored = LIVE_SNAPSHOTS.apply_project_snapshot(song, snapshot)
        guitar = restored["mixerState"]["targets"][3]
        volume = [field for field in guitar["fields"] if field["field"] == "volumeRaw"][0]

        self.assertFalse(restored["complete"])
        self.assertFalse(restored["mixerState"]["complete"])
        self.assertEqual(restored["mixerState"]["failedCount"], 1)
        self.assertEqual(volume["status"], "failed")
        self.assertEqual(volume["expected"], 0.7354)
        self.assertIsNone(volume["observed"])
        self.assertIn("write rejected", volume["reason"])

    def test_missing_return_target_is_reported_as_failed(self):
        song = FakeSong()
        snapshot = LIVE_SNAPSHOTS.project_snapshot(song)
        song.return_tracks.pop()

        restored = LIVE_SNAPSHOTS.apply_project_snapshot(song, snapshot)
        missing_return = [
            target for target in restored["mixerState"]["targets"]
            if target["target"] == "return" and target["index"] == 1
        ][0]

        self.assertFalse(restored["complete"])
        self.assertEqual(missing_return["summary"]["failed"], 1)
        self.assertEqual(missing_return["fields"][0]["field"], "mixerState")


if __name__ == "__main__":
    unittest.main()
