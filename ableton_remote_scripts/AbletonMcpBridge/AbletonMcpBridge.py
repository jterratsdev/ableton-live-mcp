from __future__ import absolute_import, print_function

import threading

try:
    from _Framework.ControlSurface import ControlSurface
except ImportError:
    class ControlSurface(object):
        def __init__(self, c_instance=None):
            self._c_instance = c_instance

        def song(self):
            raise RuntimeError("Ableton _Framework is only available inside Live")

        def application(self):
            raise RuntimeError("Ableton _Framework is only available inside Live")

        def schedule_message(self, delay, callback):
            callback()

        def update_display(self):
            pass

        def disconnect(self):
            pass

from .http_bridge import BridgeHttpError, start_http_server, stop_http_server
from .live_meter_cache import LiveMeterCache
from .live_observability import endpoint_support_summary
from .live_api import (
    add_locator,
    apply_groove,
    apply_project_snapshot,
    create_midi_clip,
    create_return_track,
    consolidate_clip,
    cue_points,
    delete_clip,
    delete_device,
    delete_return_track,
    delete_first_instrument,
    browser_item_inventory,
    browser_search_inventory,
    find_browser_items,
    first_browser_item,
    first_query_value,
    flatten_track,
    freeze_track,
    get_clip_notes,
    arrangement_snapshot,
    get_device_parameters,
    humanize_clip,
    insert_arrangement_clip,
    load_master_device,
    launch_clip,
    launch_scene,
    list_meters,
    list_return_tracks,
    master_track_detail,
    modify_master_track,
    modify_return_track,
    modify_track,
    project_snapshot,
    routing_buses,
    reorder_device,
    quantize_clip,
    return_track_detail,
    set_device_parameter,
    apply_mastering_chain,
    duplicate_track,
    get_track,
    track_detail,
    track_summary
)


HOST = "127.0.0.1"
PORT = 9789
LIVE_CALL_TIMEOUT_SECONDS = 5


def transport_command_response(requested_playing, observed_playing):
    requested = bool(requested_playing)
    observed = bool(observed_playing)
    return {
        "ok": True,
        "playing": requested,
        "requestedPlaying": requested,
        "observedPlaying": observed,
        "confirmed": observed == requested
    }


class AbletonMcpBridge(ControlSurface):
    def __init__(self, c_instance):
        ControlSurface.__init__(self, c_instance)
        self._queue_lock = threading.Lock()
        self._pending_live_calls = []
        self._snapshots = {}
        self._snapshot_counter = 0
        self._meter_cache = LiveMeterCache(self._log)
        self._server = None
        self._server_thread = None
        self._server, self._server_thread = start_http_server(HOST, PORT, self)
        self._log("AbletonMcpBridge listening on http://%s:%s" % (HOST, PORT))

    def disconnect(self):
        self._meter_cache.clear()
        stop_http_server(self._server)
        self._server = None
        self._server_thread = None
        ControlSurface.disconnect(self)

    def update_display(self):
        ControlSurface.update_display(self)
        try:
            self._meter_cache.poll(self.song())
        except Exception as error:
            self._log("Unable to poll Live meters during update_display: %s" % error)

    def handle_request(self, method, path, query, payload):
        route = "%s %s" % (method, path)
        if route == "GET /status":
            return self._call_live_thread(self._get_status)
        if route == "GET /project":
            return self._call_live_thread(self._get_project)
        if route == "GET /arrangement":
            return self._call_live_thread(lambda: arrangement_snapshot(self.song()))
        if route == "POST /project/snapshot":
            return self._call_live_thread(lambda: self._create_snapshot(payload))
        if route == "POST /project/rollback":
            return self._call_live_thread(lambda: self._rollback_snapshot(payload))
        if route == "GET /plugins":
            return self._call_live_thread(lambda: self._list_plugins(query))
        if route == "GET /browser/search":
            return self._call_live_thread(lambda: self._search_browser(query))
        if route == "GET /production/report":
            return self._call_live_thread(self._production_report)
        if route == "POST /tempo":
            return self._call_live_thread(lambda: self._set_tempo(payload))
        if route == "POST /automation":
            raise BridgeHttpError("Automation envelope writing is not supported by this Remote Script bridge because the Live Python API does not expose a reliable cross-version envelope mutation surface", 501)
        if route == "POST /project/save":
            return self._call_live_thread(lambda: self._save_project(payload))
        if route == "POST /signature":
            return self._call_live_thread(lambda: self._set_signature(payload))
        if route == "POST /tracks/midi":
            return self._call_live_thread(lambda: self._create_midi_track(payload))
        if route == "POST /tracks/duplicate":
            return self._call_live_thread(lambda: duplicate_track(self.song(), payload))
        if route == "POST /tracks/freeze":
            return self._call_live_thread(lambda: freeze_track(self.song(), payload))
        if route == "POST /tracks/flatten":
            return self._call_live_thread(lambda: flatten_track(self.song(), payload))
        if route == "POST /tracks/modify":
            return self._call_live_thread(lambda: modify_track(self.song(), payload))
        if route == "GET /returns":
            return self._call_live_thread(lambda: list_return_tracks(self.song()))
        if route == "POST /returns/create":
            return self._call_live_thread(lambda: create_return_track(self.song(), payload))
        if route == "POST /returns/modify":
            return self._call_live_thread(lambda: modify_return_track(self.song(), payload))
        if route == "DELETE /returns":
            return self._call_live_thread(lambda: delete_return_track(self.song(), payload))
        if route == "GET /routing/buses":
            return self._call_live_thread(lambda: routing_buses(self.song()))
        if route == "GET /meters":
            return self._call_live_thread(lambda: list_meters(self.song(), self._meter_cache))
        if route == "POST /master/modify":
            return self._call_live_thread(lambda: modify_master_track(self.song(), payload))
        if route == "POST /arrangement/insert":
            return self._call_live_thread(lambda: insert_arrangement_clip(self.song(), payload))
        if route == "POST /arrangement/locators":
            return self._call_live_thread(lambda: add_locator(self.song(), payload))
        if route == "POST /transport/start":
            return self._call_live_thread(self._start_transport)
        if route == "POST /transport/stop":
            return self._call_live_thread(self._stop_transport)
        if route == "POST /devices/load":
            return self._call_live_thread(lambda: self._load_device(payload))
        if route == "POST /devices/load-master":
            return self._call_live_thread(lambda: load_master_device(self.song(), self.application().browser, payload))
        if route == "GET /devices/parameters":
            return self._call_live_thread(lambda: get_device_parameters(self.song(), {
                "target": first_query_value(query, "target"),
                "trackIndex": first_query_value(query, "trackIndex"),
                "returnIndex": first_query_value(query, "returnIndex"),
                "deviceIndex": first_query_value(query, "deviceIndex"),
                "deviceName": first_query_value(query, "deviceName")
            }))
        if route == "POST /devices/parameter":
            return self._call_live_thread(lambda: set_device_parameter(self.song(), payload))
        if route == "POST /devices/reorder":
            return self._call_live_thread(lambda: reorder_device(self.song(), payload))
        if route == "DELETE /devices":
            return self._call_live_thread(lambda: delete_device(self.song(), payload))
        if route == "POST /mastering/apply":
            return self._call_live_thread(lambda: apply_mastering_chain(self.song(), self.application().browser, payload))
        if route == "POST /render/export":
            raise BridgeHttpError("Ableton Remote Script render export is not supported by this bridge", 501)
        if route == "POST /tracks/bounce":
            raise BridgeHttpError("Ableton Remote Script track bounce is not supported by this bridge", 501)
        if route == "POST /mastering/analyze-and-apply":
            raise BridgeHttpError("Ableton Remote Script mastering analyze-and-apply is not supported by this bridge", 501)
        if route == "POST /mastering/remove-reverb":
            return self._call_live_thread(self._remove_master_reverb)
        if route == "POST /clips/midi":
            return self._call_live_thread(lambda: create_midi_clip(self.song(), payload))
        if route == "POST /clips/consolidate":
            return self._call_live_thread(lambda: consolidate_clip(self.song(), payload))
        if route == "DELETE /clips/midi":
            return self._call_live_thread(lambda: delete_clip(self.song(), payload))
        if route == "GET /clips/notes":
            return self._call_live_thread(lambda: get_clip_notes(self.song(), {
                "trackIndex": first_query_value(query, "trackIndex"),
                "clipSlotIndex": first_query_value(query, "clipSlotIndex")
            }))
        if route == "POST /clips/launch":
            return self._call_live_thread(lambda: launch_clip(self.song(), payload))
        if route == "POST /scenes/launch":
            return self._call_live_thread(lambda: launch_scene(self.song(), payload))
        if route == "POST /clips/humanize":
            return self._call_live_thread(lambda: humanize_clip(self.song(), payload))
        if route == "POST /clips/quantize":
            return self._call_live_thread(lambda: quantize_clip(self.song(), payload))
        if route == "POST /groove/apply":
            return self._call_live_thread(lambda: apply_groove(self.song(), payload))
        if route == "POST /midi/import":
            raise BridgeHttpError("MIDI file import is handled by the MCP parser; use POST /clips/midi", 501)
        raise BridgeHttpError("Unsupported endpoint: %s" % route, 404)

    def _call_live_thread(self, callback):
        event = threading.Event()
        result = {"value": None, "error": None}
        call = {
            "callback": callback,
            "event": event,
            "result": result
        }

        with self._queue_lock:
            self._pending_live_calls.append(call)

        self.schedule_message(1, self._drain_live_call_queue)
        if not event.wait(LIVE_CALL_TIMEOUT_SECONDS):
            raise BridgeHttpError("Timed out waiting for Ableton Live API", 504)
        if result["error"] is not None:
            raise result["error"]
        return result["value"]

    def _drain_live_call_queue(self):
        with self._queue_lock:
            calls = self._pending_live_calls
            self._pending_live_calls = []

        for call in calls:
            try:
                call["result"]["value"] = call["callback"]()
            except Exception as error:
                call["result"]["error"] = error
            finally:
                call["event"].set()

    def _get_status(self):
        song = self.song()
        return {
            "ok": True,
            "tempo": song.tempo,
            "playing": song.is_playing,
            "tracks": [track_summary(index, track) for index, track in enumerate(song.tracks)]
        }

    def _get_project(self):
        song = self.song()
        return {
            "ok": True,
            "mixerContract": mixer_contract(),
            "tempo": song.tempo,
            "timeSignature": "%s/%s" % (song.signature_numerator, song.signature_denominator),
            "tracks": [track_detail(index, track) for index, track in enumerate(song.tracks)],
            "returns": [return_track_detail(index, track) for index, track in enumerate(getattr(song, "return_tracks", []) or [])],
            "master": master_track_detail(song.master_track),
            "locators": cue_points(song)
        }

    def _list_plugins(self, query):
        kind = first_query_value(query, "kind")
        text = first_query_value(query, "query")
        items = browser_item_inventory(self.application().browser, text, kind)
        return {
            "ok": True,
            "filters": {"kind": kind or "any", "query": text or ""},
            "count": len(items),
            "plugins": items
        }

    def _search_browser(self, query):
        kind = first_query_value(query, "kind") or "any"
        text = first_query_value(query, "query") or ""
        limit = first_query_value(query, "limit")
        return browser_search_inventory(self.application().browser, text, kind, limit)

    def _production_report(self):
        project = self._get_project()
        buses = routing_buses(self.song())
        meters = list_meters(self.song(), self._meter_cache)
        risks = []
        if meters.get("warnings"):
            risks.append("Some meter values are unavailable from this Live API")
        if not meters.get("reliableForMixing"):
            status = meters.get("meterCapability", {}).get("status", "unknown")
            risks.append("Live meters are not reliable for automated mixing: %s" % status)
        return {
            "ok": True,
            "mode": "ableton-remote-script-report",
            "mixerContract": project.get("mixerContract"),
            "endpointSupport": endpoint_support_summary(),
            "summary": {
                "tempo": project.get("tempo"),
                "timeSignature": project.get("timeSignature"),
                "trackCount": len(project.get("tracks") or []),
                "returnCount": len(buses.get("returns") or []),
                "locatorCount": len(project.get("locators") or [])
            },
            "project": project,
            "routing": buses,
            "meters": meters,
            "risks": risks
        }

    def _set_tempo(self, payload):
        bpm = payload.get("bpm")
        if not isinstance(bpm, (int, float)) or bpm < 20 or bpm > 999:
            raise BridgeHttpError("bpm must be a number between 20 and 999")
        self.song().tempo = bpm
        return {"ok": True, "tempo": self.song().tempo}

    def _create_snapshot(self, payload):
        label = payload.get("label")
        if not isinstance(label, str) or label.strip() == "":
            raise BridgeHttpError("label must be a non-empty string")

        self._snapshot_counter += 1
        snapshot_id = "live-snap-%s" % self._snapshot_counter
        snapshot = {
            "id": snapshot_id,
            "label": label.strip(),
            "project": project_snapshot(self.song())
        }
        self._snapshots[snapshot_id] = snapshot
        return {
            "ok": True,
            "snapshot": {
                "id": snapshot_id,
                "label": snapshot["label"],
                "mode": "ableton-remote-script-memory",
                "trackCount": len(snapshot["project"]["tracks"])
            }
        }

    def _rollback_snapshot(self, payload):
        snapshot_id = payload.get("snapshotId")
        if not isinstance(snapshot_id, str) or snapshot_id.strip() == "":
            raise BridgeHttpError("snapshotId must be a non-empty string")
        snapshot = self._snapshots.get(snapshot_id.strip())
        if snapshot is None:
            raise BridgeHttpError("snapshotId does not exist", 404)

        result = apply_project_snapshot(self.song(), snapshot["project"])
        complete = bool(result.get("complete"))
        return {
            "ok": complete,
            "rolledBack": complete,
            "snapshot": {
                "id": snapshot["id"],
                "label": snapshot["label"],
                "mode": "ableton-remote-script-memory"
            },
            "restored": result
        }

    def _save_project(self, payload):
        path = payload.get("path")
        if path is not None and (not isinstance(path, str) or path.strip() == ""):
            raise BridgeHttpError("path must be a non-empty string when provided")

        song = self.song()
        app = self.application()
        try:
            if path:
                if hasattr(song, "save_as"):
                    song.save_as(path)
                    return {"ok": True, "saved": True, "path": path, "mode": "song.save_as"}
                if hasattr(app, "save_live_set_as"):
                    app.save_live_set_as(path)
                    return {"ok": True, "saved": True, "path": path, "mode": "application.save_live_set_as"}
                raise BridgeHttpError("Save As is not supported by this Ableton API", 501)

            if hasattr(song, "save"):
                song.save()
                return {"ok": True, "saved": True, "path": None, "mode": "song.save"}
            if hasattr(app, "save_live_set"):
                app.save_live_set()
                return {"ok": True, "saved": True, "path": None, "mode": "application.save_live_set"}
            raise BridgeHttpError("Save is not supported by this Ableton API", 501)
        except BridgeHttpError:
            raise
        except Exception as error:
            raise BridgeHttpError("Unable to save project: %s" % error, 500)

    def _set_signature(self, payload):
        numerator = payload.get("numerator")
        denominator = payload.get("denominator")
        if not isinstance(numerator, int) or numerator < 1 or numerator > 32:
            raise BridgeHttpError("numerator must be an integer between 1 and 32")
        if denominator not in (1, 2, 4, 8, 16, 32):
            raise BridgeHttpError("denominator must be one of 1, 2, 4, 8, 16, or 32")
        song = self.song()
        song.signature_numerator = numerator
        song.signature_denominator = denominator
        return {
            "ok": True,
            "numerator": song.signature_numerator,
            "denominator": song.signature_denominator,
            "timeSignature": "%s/%s" % (song.signature_numerator, song.signature_denominator)
        }

    def _start_transport(self):
        song = self.song()
        song.start_playing()
        return transport_command_response(True, song.is_playing)

    def _stop_transport(self):
        song = self.song()
        song.stop_playing()
        return transport_command_response(False, song.is_playing)

    def _create_midi_track(self, payload):
        name = payload.get("name") or "MIDI"
        if not isinstance(name, str):
            raise BridgeHttpError("name must be a string")
        before = len(list(self.song().tracks))
        self.song().create_midi_track(before)
        track = list(self.song().tracks)[before]
        track.name = name
        return {
            "ok": True,
            "track": {
                "index": before,
                "name": track.name,
                "type": "midi"
            }
        }

    def _load_device(self, payload):
        track_index = payload.get("trackIndex")
        query = payload.get("query")
        kind = payload.get("kind")
        position = payload.get("position") or "append"
        if not isinstance(track_index, int) or track_index < 0:
            raise BridgeHttpError("trackIndex must be a non-negative integer")
        if not isinstance(query, str) or query.strip() == "":
            raise BridgeHttpError("query must be a non-empty string")

        track = get_track(self.song(), track_index)
        self.song().view.selected_track = track
        item = first_browser_item(self.application().browser, query, kind)
        if item is None:
            raise BridgeHttpError("No loadable browser item found for query: %s" % query, 404)

        if position == "replace_instrument":
            delete_first_instrument(track)
        self.application().browser.load_item(item)
        return {
            "ok": True,
            "device": {
                "trackIndex": track_index,
                "query": query,
                "kind": kind,
                "position": position,
                "selectedDevice": getattr(item, "name", query),
                "role": payload.get("role"),
                "rationale": payload.get("rationale")
            }
        }

    def _remove_master_reverb(self):
        removed = []
        master = self.song().master_track
        for index in reversed(range(len(master.devices))):
            device = master.devices[index]
            name = getattr(device, "name", "")
            normalized = name.lower()
            if (
                "reverb" in normalized or
                "ambience" in normalized or
                "room" in normalized or
                "hall" in normalized
            ):
                removed.append({"index": index, "name": name})
                master.delete_device(index)
        return {"ok": True, "removedDevices": removed}

    def _log(self, message):
        try:
            self.log_message(message)
        except Exception:
            print(message)


def mixer_contract():
    return {
        "version": 2,
        "safeForAutomatedMixing": True,
        "readback": {
            "volumeRaw": "Live raw mixer parameter value",
            "volumeDb": "Parsed dB display value when available",
            "volumeDisplay": "Live display string",
            "sendsRaw": "Live raw send parameter values",
            "sendsDb": "Parsed send dB display values when available",
            "sendsDisplay": "Live send display strings, including -inf dB/off states"
        },
        "writes": {
            "volumeDb": "Real dB target; verify observed readback after writing",
            "cueVolumeDb": "Real dB target; verify observed readback after writing",
            "sends": "Real dB targets by send index or name",
            "verifyToleranceDb": "Optional dB tolerance for writeVerification; defaults to 0.5"
        }
    }
