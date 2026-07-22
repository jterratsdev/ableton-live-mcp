from __future__ import absolute_import, print_function

import time


METER_CACHE_STALE_SECONDS = 2.0

METER_PROPERTIES = (
    ("left", "output_meter_left"),
    ("right", "output_meter_right"),
    ("level", "output_meter_level"),
)


class LiveMeterCache(object):
    def __init__(self, log=None):
        self._log = log
        self._listeners = {}
        self._values = {}
        self._listener_errors = {}
        self._poll_count = 0
        self._poll_errors = 0
        self._last_poll_at = None
        self._signal_ever_observed = False
        self._last_signal_at = None
        self._target_keys = set()
        self._poll_target_keys = set()
        self._poll_skipped_target_keys = set()

    def sync(self, song):
        targets = meter_targets(song)
        current_keys = set([target[0] for target in targets])
        for target_key, track in targets:
            self._ensure_track_listeners(target_key, track)
        self._remove_stale(current_keys)
        self._target_keys = current_keys
        return targets

    def poll(self, song):
        targets = self.sync(song)
        self._poll_count += 1
        self._last_poll_at = time.time()
        self._poll_target_keys = set()
        self._poll_skipped_target_keys = set()
        for target_key, track in targets:
            if not bool(getattr(track, "has_audio_output", False)):
                self._poll_skipped_target_keys.add(target_key)
                continue
            self._poll_target_keys.add(target_key)
            for field, property_name in METER_PROPERTIES:
                try:
                    self._record(target_key, track, field, property_name, "display-poll")
                except Exception as error:
                    self._poll_errors += 1
                    self._safe_log("Unable to poll meter %s: %s" % (property_name, error))

    def clear(self):
        self._remove_stale(set())
        self._values = {}
        self._listener_errors = {}
        self._poll_count = 0
        self._poll_errors = 0
        self._last_poll_at = None
        self._signal_ever_observed = False
        self._last_signal_at = None
        self._target_keys = set()
        self._poll_target_keys = set()
        self._poll_skipped_target_keys = set()

    def snapshot(self, target_type, target_index, track, label):
        meter = {}
        sources = {}
        observed = {}
        updated_at_ms = {}
        age_ms = {}
        warnings = []
        now = time.time()
        target_key = meter_target_key(target_type, target_index)

        for field, property_name in METER_PROPERTIES:
            direct_value = read_meter_property(track, property_name)
            cached = self._cached_field(target_key, field)
            selected = self._select_value(direct_value, cached, now)
            meter[field] = selected["value"]
            sources[field] = selected["source"]
            observed[field] = cached is not None and cached.get("source") in ("listener", "display-poll")
            updated_at_ms[field] = _updated_at_ms(cached)
            age_ms[field] = _age_ms(cached, now)

            error = self._listener_errors.get((target_key, property_name))
            if error is not None:
                warnings.append("%s.meter.%s listener is unavailable: %s" % (label, field, error))
            if selected["value"] is None:
                warnings.append("%s.meter.%s is not exposed by this Ableton Live API" % (label, field))
            elif direct_value == 0 and not observed[field]:
                warnings.append("%s.meter.%s direct read is 0 and listener cache has not observed this field yet" % (label, field))
            elif direct_value == 0 and cached is not None and not _is_fresh(cached, now):
                warnings.append("%s.meter.%s observation cache is stale; returning direct meter value" % (label, field))

        return {
            "meter": meter,
            "meterSource": sources,
            "meterObserved": observed,
            "meterUpdatedAtMs": updated_at_ms,
            "meterAgeMs": age_ms,
            "warnings": warnings
        }

    def diagnostics(self):
        now = time.time()
        observed_targets = 0
        signal_targets = 0
        listener_observed_targets = 0
        display_poll_observed_targets = 0
        for _target_id, fields in self._values.items():
            target_observed = False
            target_has_signal = False
            listener_observed = False
            display_poll_observed = False
            for _field, observation in fields.items():
                if not _is_fresh(observation, now):
                    continue
                source = observation.get("source")
                if source in ("listener", "display-poll"):
                    target_observed = True
                if source == "listener":
                    listener_observed = True
                if source == "display-poll":
                    display_poll_observed = True
                if (observation.get("value") or 0) > 0:
                    target_has_signal = True
            if target_observed:
                observed_targets += 1
            if target_has_signal:
                signal_targets += 1
            if listener_observed:
                listener_observed_targets += 1
            if display_poll_observed:
                display_poll_observed_targets += 1
        return {
            "cacheEnabled": True,
            "staleAfterMs": int(METER_CACHE_STALE_SECONDS * 1000),
            "targetCount": len(self._target_keys),
            "listenerCount": len(self._listeners),
            "listenerErrorCount": len(self._listener_errors),
            "observedTargetCount": observed_targets,
            "listenerObservedTargetCount": listener_observed_targets,
            "displayPollObservedTargetCount": display_poll_observed_targets,
            "signalTargetCount": signal_targets,
            "signalEverObserved": self._signal_ever_observed,
            "lastSignalAtMs": int(self._last_signal_at * 1000) if self._last_signal_at is not None else None,
            "pollCount": self._poll_count,
            "pollErrorCount": self._poll_errors,
            "pollTargetCount": len(self._poll_target_keys),
            "pollSkippedTargetCount": len(self._poll_skipped_target_keys),
            "lastPollAtMs": int(self._last_poll_at * 1000) if self._last_poll_at is not None else None
        }

    def _ensure_track_listeners(self, target_key, track):
        for field, property_name in METER_PROPERTIES:
            key = (target_key, property_name)
            if key in self._listeners or key in self._listener_errors:
                continue
            add_listener = getattr(track, "add_%s_listener" % property_name, None)
            if add_listener is None:
                self._listener_errors[key] = "add_%s_listener is not exposed" % property_name
                continue
            listener = self._listener(target_key, track, field, property_name)
            try:
                add_listener(listener)
                self._listeners[key] = {
                    "track": track,
                    "property": property_name,
                    "listener": listener
                }
            except Exception as error:
                self._listener_errors[key] = str(error)
                self._safe_log("Unable to attach meter listener %s: %s" % (property_name, error))

    def _remove_stale(self, current_keys):
        for key, registration in list(self._listeners.items()):
            target_key, property_name = key
            if target_key in current_keys:
                continue
            remove_listener = getattr(registration["track"], "remove_%s_listener" % property_name, None)
            if remove_listener is not None:
                try:
                    remove_listener(registration["listener"])
                except Exception:
                    pass
            del self._listeners[key]
            if target_key in self._values:
                del self._values[target_key]

        for key in list(self._listener_errors.keys()):
            if key[0] not in current_keys:
                del self._listener_errors[key]

        for target_key in list(self._values.keys()):
            if target_key not in current_keys:
                del self._values[target_key]

    def _listener(self, target_key, track, field, property_name):
        def handle_meter_change(*_args):
            self._record(target_key, track, field, property_name, "listener")
        return handle_meter_change

    def _record(self, target_key, track, field, property_name, source):
        value = read_meter_property(track, property_name)
        if value is None:
            return
        fields = self._values.setdefault(target_key, {})
        fields[field] = {
            "value": value,
            "source": source,
            "observedAt": time.time()
        }
        if abs(value) > 0.0001:
            self._signal_ever_observed = True
            self._last_signal_at = time.time()

    def _cached_field(self, target_key, field):
        return self._values.get(target_key, {}).get(field)

    def _select_value(self, direct_value, cached, now):
        if cached is not None and _is_fresh(cached, now):
            cached_value = cached.get("value")
            if direct_value is None or direct_value == 0:
                return {
                    "value": cached_value,
                    "source": "%s-cache" % cached.get("source", "observation")
                }
        if direct_value is not None:
            return {
                "value": direct_value,
                "source": "direct"
            }
        return {
            "value": None,
            "source": "unavailable"
        }

    def _safe_log(self, message):
        if self._log is None:
            return
        try:
            self._log(message)
        except Exception:
            pass


def read_meter_property(track, property_name):
    try:
        value = getattr(track, property_name)
    except Exception:
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    return None


def meter_targets(song):
    targets = []
    for index, track in enumerate(list(getattr(song, "tracks", []) or [])):
        targets.append((meter_target_key("track", index), track))
    for index, track in enumerate(list(getattr(song, "return_tracks", []) or [])):
        targets.append((meter_target_key("return", index), track))
    master_track = getattr(song, "master_track", None)
    if master_track is not None:
        targets.append((meter_target_key("master", None), master_track))
    return targets


def meter_target_key(target_type, target_index):
    return (target_type, target_index)


def _updated_at_ms(observation):
    if observation is None:
        return None
    observed_at = observation.get("observedAt")
    if not isinstance(observed_at, (int, float)):
        return None
    return int(observed_at * 1000)


def _age_ms(observation, now):
    updated_at = _updated_at_ms(observation)
    if updated_at is None:
        return None
    return int(max(0, (now * 1000) - updated_at))


def _is_fresh(observation, now):
    age = _age_ms(observation, now)
    return age is not None and age <= int(METER_CACHE_STALE_SECONDS * 1000)
