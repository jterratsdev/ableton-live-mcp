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
load_module("live_routing_options")
load_module("live_plugin_routing_validation")
LIVE_PLUGIN_ROUTING = load_module("live_plugin_routing")
apply_plugin_output_routing = LIVE_PLUGIN_ROUTING.apply_plugin_output_routing
plan_plugin_output_routing = LIVE_PLUGIN_ROUTING.plan_plugin_output_routing


SOURCE_TRACK_NAME = "Batería"
SOURCE_ROUTING_TYPE = "Batería"
SSD_DEVICE_NAME = "SSD Sampler 5"
OUTPUT_CHANNELS = ["SSD 3/4", "SSD 5/6"]


def routing(display_name, identifier):
    return {"display_name": display_name, "identifier": identifier}


class FakeDevice(object):
    def __init__(self, name):
        self.name = name


class FakeSourceTrack(object):
    def __init__(self):
        self.name = SOURCE_TRACK_NAME
        self.devices = [FakeDevice(SSD_DEVICE_NAME)]


class FakeAudioTrack(object):
    def __init__(self, name="Audio", failure_channels=None, routed_to_source=False, routing_types=None, channel_options=None):
        self.name = name
        self.devices = []
        self.available_input_routing_types = routing_types or [
            routing("Ext. In", "ext-in"),
            routing(SOURCE_ROUTING_TYPE, "track-0"),
        ]
        self._input_routing_type = self.available_input_routing_types[1 if routed_to_source else 0]
        self._input_routing_channel = routing("1/2", "stereo-1-2")
        self.current_monitoring_state = 2
        self.failure_channels = set(failure_channels or [])
        self.channel_options = channel_options

    @property
    def input_routing_type(self):
        return self._input_routing_type

    @input_routing_type.setter
    def input_routing_type(self, value):
        self._input_routing_type = value

    @property
    def available_input_routing_channels(self):
        if self._input_routing_type["display_name"] == SOURCE_ROUTING_TYPE:
            return self.channel_options or [
                routing(name, "ssd-%s" % index) for index, name in enumerate(OUTPUT_CHANNELS)
            ]
        return [routing("1/2", "stereo-1-2")]

    @property
    def input_routing_channel(self):
        return self._input_routing_channel

    @input_routing_channel.setter
    def input_routing_channel(self, value):
        if value["display_name"] in self.failure_channels:
            raise RuntimeError("simulated routing failure")
        self._input_routing_channel = value


class FakeSong(object):
    def __init__(self, failure_channels=None, routed_observer=True, routing_types=None, channel_options=None):
        self.failure_channels = failure_channels or []
        self.routing_types = routing_types
        self.channel_options = channel_options
        self.tracks = [
            FakeSourceTrack(),
            FakeAudioTrack(
                "SSD routing observer",
                routed_to_source=routed_observer,
                routing_types=routing_types,
                channel_options=channel_options,
            ),
        ]

    def create_audio_track(self, index):
        track = FakeAudioTrack(
            failure_channels=self.failure_channels,
            routing_types=self.routing_types,
            channel_options=self.channel_options,
        )
        if index < 0 or index >= len(self.tracks):
            self.tracks.append(track)
        else:
            self.tracks.insert(index, track)

    def delete_track(self, index):
        del self.tracks[index]


class FailingNameTrack(FakeAudioTrack):
    def __init__(self):
        self._name = "Audio"
        FakeAudioTrack.__init__(self)

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if value != "Audio":
            raise RuntimeError("simulated name failure")
        self._name = value


class FailingNameSong(FakeSong):
    def create_audio_track(self, index):
        self.tracks.append(FailingNameTrack())


class PluginOutputRoutingTest(unittest.TestCase):
    def test_plan_is_read_only_and_returns_observable_exact_channels(self):
        song = FakeSong()
        before_ids = [id(track) for track in song.tracks]

        result = plan_plugin_output_routing(song, plan_request())

        self.assertEqual([id(track) for track in song.tracks], before_ids)
        self.assertEqual(result["availableOutputChannels"], OUTPUT_CHANNELS)
        self.assertEqual(result["proposedRoutes"][0], {
            "outputChannel": "SSD 3/4",
            "trackName": "Batería - SSD 3/4",
        })

    def test_plan_returns_receiver_required_without_a_routed_observer(self):
        song = FakeSong(routed_observer=False)

        result = plan_plugin_output_routing(song, plan_request())

        self.assertEqual(result["discoveryStatus"], "receiver_required")
        self.assertEqual(result["availableOutputChannels"], [])
        self.assertTrue(result["receiverRequired"]["required"])
        self.assertIn("currently selected input routing type", result["receiverRequired"]["reason"])

    def test_source_routing_identifier_is_an_exact_supported_selector(self):
        song = FakeSong()
        payload = plan_request()
        payload["sourceRoutingType"] = "track-0"

        result = plan_plugin_output_routing(song, payload)

        self.assertEqual(result["availableOutputChannels"], OUTPUT_CHANNELS)
        self.assertEqual(result["source"]["sourceRoutingType"], SOURCE_ROUTING_TYPE)
        self.assertEqual(result["source"]["sourceRoutingIdentifier"], "track-0")

    def test_duplicate_source_display_names_fail_closed_without_mutation(self):
        duplicate_types = [
            routing("Ext. In", "ext-in"),
            routing(SOURCE_ROUTING_TYPE, "track-0"),
            routing(SOURCE_ROUTING_TYPE, "track-other"),
        ]
        song = FakeSong(routing_types=duplicate_types)
        before_ids = [id(track) for track in song.tracks]

        with self.assertRaisesRegex(Exception, "routing display name is ambiguous: Batería"):
            plan_plugin_output_routing(song, plan_request())

        self.assertEqual([id(track) for track in song.tracks], before_ids)

    def test_exact_identifier_selects_one_of_duplicate_display_names(self):
        duplicate_types = [
            routing("Ext. In", "ext-in"),
            routing(SOURCE_ROUTING_TYPE, "track-0"),
            routing(SOURCE_ROUTING_TYPE, "track-other"),
        ]
        song = FakeSong(routing_types=duplicate_types)
        song.tracks[1]._input_routing_type = duplicate_types[2]
        payload = plan_request()
        payload["sourceRoutingType"] = "track-other"

        result = plan_plugin_output_routing(song, payload)

        self.assertEqual(result["source"]["sourceRoutingIdentifier"], "track-other")
        self.assertEqual(result["availableOutputChannels"], OUTPUT_CHANNELS)

    def test_unavailable_source_routing_type_is_not_a_bootstrap_diagnostic(self):
        song = FakeSong(routed_observer=False)
        before_ids = [id(track) for track in song.tracks]
        payload = plan_request()
        payload["sourceRoutingType"] = "missing-routing-type"

        with self.assertRaisesRegex(Exception, "sourceRoutingType is not available: missing-routing-type"):
            plan_plugin_output_routing(song, payload)

        self.assertEqual([id(track) for track in song.tracks], before_ids)

    def test_duplicate_output_display_names_fail_and_rollback(self):
        duplicate_channels = [
            routing("SSD 3/4", "ssd-first"),
            routing("SSD 3/4", "ssd-second"),
        ]
        song = FakeSong(channel_options=duplicate_channels)
        before_ids = [id(track) for track in song.tracks]

        with self.assertRaisesRegex(Exception, "routing display name is ambiguous: SSD 3/4"):
            apply_plugin_output_routing(song, apply_request([
                {"outputChannel": "SSD 3/4", "trackName": "Batería - Ambiguous"}
            ]))

        self.assertEqual([id(track) for track in song.tracks], before_ids)

    def test_apply_creates_exact_verified_monitor_in_receivers(self):
        song = FakeSong()

        result = apply_plugin_output_routing(song, apply_request())

        self.assertEqual(result["createdCount"], 2)
        self.assertEqual(receiver_summaries(result), [
            ("Batería - Kick", SOURCE_ROUTING_TYPE, "SSD 3/4", "In", True),
            ("Batería - Snare", SOURCE_ROUTING_TYPE, "SSD 5/6", "In", True),
        ])
        self.assertEqual([track.current_monitoring_state for track in song.tracks[-2:]], [0, 0])

    def test_repeated_apply_reuses_verified_receivers(self):
        song = FakeSong()
        apply_plugin_output_routing(song, apply_request())
        after_first_count = len(song.tracks)

        result = apply_plugin_output_routing(song, apply_request())

        self.assertEqual(len(song.tracks), after_first_count)
        self.assertEqual(result["createdCount"], 0)
        self.assertEqual(result["reusedCount"], 2)

    def test_unsupported_output_leaves_no_new_tracks(self):
        song = FakeSong()
        before_ids = [id(track) for track in song.tracks]

        with self.assertRaisesRegex(Exception, "outputChannel is not available: SSD 99/100"):
            apply_plugin_output_routing(song, apply_request([
                {"outputChannel": "SSD 99/100", "trackName": "Batería - Unsupported"}
            ]))

        self.assertEqual([id(track) for track in song.tracks], before_ids)

    def test_conflicting_existing_name_fails_without_creating_a_duplicate(self):
        song = FakeSong()
        conflicting = FakeAudioTrack("Batería - Kick")
        song.tracks.append(conflicting)
        before_ids = [id(track) for track in song.tracks]

        with self.assertRaisesRegex(Exception, "does not match requested routing"):
            apply_plugin_output_routing(song, apply_request())

        self.assertEqual([id(track) for track in song.tracks], before_ids)

    def test_duplicate_output_or_track_names_are_rejected_before_creation(self):
        duplicate_route_sets = [
            [
                {"outputChannel": "SSD 3/4", "trackName": "One"},
                {"outputChannel": "SSD 3/4", "trackName": "Two"},
            ],
            [
                {"outputChannel": "SSD 3/4", "trackName": "Same"},
                {"outputChannel": "SSD 5/6", "trackName": "Same"},
            ],
        ]
        for routes in duplicate_route_sets:
            song = FakeSong()
            before_ids = [id(track) for track in song.tracks]

            with self.assertRaisesRegex(Exception, "routes contains duplicate"):
                apply_plugin_output_routing(song, apply_request(routes))

            self.assertEqual([id(track) for track in song.tracks], before_ids)

    def test_unrelated_duplicate_track_names_do_not_block_apply(self):
        song = FakeSong()
        song.tracks.extend([FakeAudioTrack("Unrelated"), FakeAudioTrack("Unrelated")])

        result = apply_plugin_output_routing(song, apply_request())

        self.assertEqual(result["createdCount"], 2)

    def test_partial_failure_rolls_back_every_new_track(self):
        song = FakeSong(failure_channels=["SSD 5/6"])
        before_ids = [id(track) for track in song.tracks]

        with self.assertRaisesRegex(Exception, "Failed to route output channel: SSD 5/6"):
            apply_plugin_output_routing(song, apply_request())

        self.assertEqual([id(track) for track in song.tracks], before_ids)

    def test_name_assignment_failure_rolls_back_the_just_created_track(self):
        song = FailingNameSong()
        before_ids = [id(track) for track in song.tracks]

        with self.assertRaisesRegex(Exception, "simulated name failure"):
            apply_plugin_output_routing(song, apply_request())

        self.assertEqual([id(track) for track in song.tracks], before_ids)


def plan_request():
    return {
        "sourceTrackName": SOURCE_TRACK_NAME,
        "deviceName": SSD_DEVICE_NAME,
        "sourceRoutingType": SOURCE_ROUTING_TYPE,
    }


def apply_request(routes=None):
    payload = plan_request()
    payload["routes"] = routes or [
        {"outputChannel": "SSD 3/4", "trackName": "Batería - Kick"},
        {"outputChannel": "SSD 5/6", "trackName": "Batería - Snare"},
    ]
    return payload


def receiver_summaries(result):
    return [
        (
            receiver["trackName"],
            receiver["sourceRoutingType"],
            receiver["outputChannel"],
            receiver["monitoring"],
            receiver["verified"],
        )
        for receiver in result["receivers"]
    ]


if __name__ == "__main__":
    unittest.main()
