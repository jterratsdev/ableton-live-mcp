from __future__ import absolute_import, print_function

from .live_clips import create_midi_clip
from .live_summaries import clip_note_summary, master_track_detail, return_track_detail, track_detail, track_type


RAW_VALUE_TOLERANCE = 0.000001
MISSING_ATTRIBUTE = object()


def project_snapshot(song):
    snapshot = {
        "tempo": song.tempo,
        "signatureNumerator": song.signature_numerator,
        "signatureDenominator": song.signature_denominator,
        "tracks": [track_snapshot(index, track) for index, track in enumerate(song.tracks)],
        "returns": [return_snapshot(index, track) for index, track in enumerate(getattr(song, "return_tracks", []))],
        "master": master_snapshot(song.master_track),
        "coverage": {
            "tracks": {
                "mixerState": True,
                "sends": True,
                "routing": True,
                "devices": True,
                "clips": "midi_notes_when_readable"
            },
            "returns": {
                "mixerState": True,
                "devices": True
            },
            "master": {
                "mixerState": True,
                "devices": True
            },
            "rollbackLimitations": [
                "Remote Script rollback restores tempo and time signature.",
                "Remote Script rollback restores supported mixer fields from captured raw Live parameter values and verifies each write.",
                "Remote Script rollback rewrites readable MIDI session clips on existing MIDI tracks.",
                "Remote Script rollback does not restore routing, devices, return track structure, master devices, audio clips, automation, undo history, or saved .als file state."
            ]
        }
    }
    return snapshot


def track_snapshot(index, track):
    summary = track_detail(index, track)
    summary["mixerState"] = mixer_state_snapshot(track, include_sends=True, include_arm=True)
    summary["clips"] = [clip_snapshot(slot_index, slot) for slot_index, slot in enumerate(getattr(track, "clip_slots", [])) if getattr(slot, "has_clip", False)]
    return summary


def return_snapshot(index, track):
    summary = return_track_detail(index, track)
    summary["mixerState"] = mixer_state_snapshot(track, include_sends=True, include_arm=False)
    return summary


def master_snapshot(track):
    summary = master_track_detail(track)
    summary["mixerState"] = mixer_state_snapshot(track, include_sends=False, include_arm=False, include_cue=True)
    return summary


def mixer_state_snapshot(track, include_sends, include_arm, include_cue=False):
    mixer = getattr(track, "mixer_device", None)
    state = {
        "volumeRaw": raw_parameter_snapshot(getattr(mixer, "volume", None)),
        "panRaw": raw_parameter_snapshot(getattr(mixer, "panning", None))
    }
    add_supported_attribute(state, "muted", track, "mute")
    add_supported_attribute(state, "solo", track, "solo")
    if include_arm:
        add_supported_attribute(state, "armed", track, "arm")
    if include_sends:
        sends = getattr(mixer, "sends", None)
        state["sendsRaw"] = {
            "supported": sends is not None,
            "values": [raw_parameter_snapshot(send) for send in (sends or [])]
        }
    if include_cue:
        state["cueVolumeRaw"] = raw_parameter_snapshot(getattr(mixer, "cue_volume", None))
    return state


def raw_parameter_snapshot(parameter):
    if parameter is None:
        return {"supported": False, "value": None}
    try:
        return {"supported": True, "value": parameter.value}
    except Exception:
        return {"supported": False, "value": None}


def attribute_snapshot(target, name):
    try:
        value = getattr(target, name, MISSING_ATTRIBUTE)
    except Exception:
        return {"supported": False, "value": None}
    if value is MISSING_ATTRIBUTE or value is None:
        return {"supported": False, "value": None}
    return {"supported": True, "value": bool(value)}


def add_supported_attribute(state, field, target, attribute):
    captured = attribute_snapshot(target, attribute)
    if captured["supported"]:
        state[field] = captured


def clip_snapshot(slot_index, slot):
    clip = slot.clip
    length_beats = getattr(clip, "length", 0)
    try:
        raw_notes = clip.get_notes(0.0, 0, float(length_beats), 128)
        notes = [clip_note_summary(note) for note in raw_notes]
    except Exception:
        notes = []
    return {
        "slot": slot_index,
        "name": getattr(clip, "name", ""),
        "lengthBeats": length_beats,
        "notes": notes
    }


def apply_project_snapshot(song, snapshot):
    song.tempo = snapshot["tempo"]
    song.signature_numerator = snapshot["signatureNumerator"]
    song.signature_denominator = snapshot["signatureDenominator"]

    mixer_restoration = restore_mixer_state(song, snapshot)
    restored = []
    warnings = []
    warnings.extend(remote_script_rollback_warnings(snapshot))
    tracks = list(song.tracks)
    for track_data in snapshot.get("tracks", []):
        track_index = track_data.get("index")
        if track_index is None or track_index >= len(tracks):
            warnings.append("Skipped missing track index %s" % track_index)
            continue
        track = tracks[track_index]
        if not getattr(track, "has_midi_input", False):
            warnings.append("Skipped non-MIDI track index %s" % track_index)
            continue
        clip_slots = list(getattr(track, "clip_slots", []))
        snapshot_slots = set([clip_data.get("slot") for clip_data in track_data.get("clips", [])])
        for slot_index, slot in enumerate(clip_slots):
            if slot_index not in snapshot_slots and getattr(slot, "has_clip", False):
                slot.delete_clip()
        for clip_data in track_data.get("clips", []):
            slot_index = clip_data.get("slot")
            if slot_index is None or slot_index >= len(clip_slots):
                warnings.append("Skipped missing clip slot %s on track %s" % (slot_index, track_index))
                continue
            payload = {
                "trackIndex": track_index,
                "clipSlotIndex": slot_index,
                "lengthBeats": clip_data.get("lengthBeats"),
                "notes": clip_data.get("notes") or []
            }
            if not payload["notes"]:
                warnings.append("Skipped empty or unreadable clip slot %s on track %s" % (slot_index, track_index))
                continue
            created = create_midi_clip(song, payload)
            restored.append(created["clip"])
    return {
        "tempo": song.tempo,
        "timeSignature": "%s/%s" % (song.signature_numerator, song.signature_denominator),
        "clips": restored,
        "mixerState": mixer_restoration,
        "complete": mixer_restoration["complete"],
        "warnings": warnings
    }


def restore_mixer_state(song, snapshot):
    target_results = []
    tracks = list(song.tracks)
    returns = list(getattr(song, "return_tracks", []))

    for track_data in snapshot.get("tracks", []):
        target_results.append(restore_indexed_mixer_target("track", tracks, track_data))
    for return_data in snapshot.get("returns", []):
        target_results.append(restore_indexed_mixer_target("return", returns, return_data))

    master_data = snapshot.get("master")
    if master_data:
        target_results.append(restore_mixer_target(
            "master",
            None,
            song.master_track,
            master_data.get("mixerState"),
            master_data.get("name", "Master")
        ))

    applied_count = sum(result["summary"]["applied"] for result in target_results)
    skipped_count = sum(result["summary"]["skipped"] for result in target_results)
    failed_count = sum(result["summary"]["failed"] for result in target_results)
    return {
        "complete": failed_count == 0,
        "appliedCount": applied_count,
        "skippedCount": skipped_count,
        "failedCount": failed_count,
        "targets": target_results
    }


def restore_indexed_mixer_target(target_type, targets, target_data):
    index = target_data.get("index")
    if not isinstance(index, int) or isinstance(index, bool) or index < 0 or index >= len(targets):
        return missing_target_result(target_type, index, target_data)
    return restore_mixer_target(
        target_type,
        index,
        targets[index],
        target_data.get("mixerState"),
        target_data.get("name", "")
    )


def restore_mixer_target(target_type, index, target, mixer_state, snapshot_name):
    result = {
        "target": target_type,
        "index": index,
        "snapshotName": snapshot_name,
        "observedName": getattr(target, "name", ""),
        "fields": []
    }
    if not isinstance(mixer_state, dict):
        result["fields"].append(field_result("mixerState", "failed", None, None, "Snapshot has no raw mixer state"))
        return finish_target_result(result)

    mixer = getattr(target, "mixer_device", None)
    restore_parameter_field(result, "volumeRaw", getattr(mixer, "volume", None), mixer_state.get("volumeRaw"))
    restore_parameter_field(result, "panRaw", getattr(mixer, "panning", None), mixer_state.get("panRaw"))
    if "muted" in mixer_state:
        restore_attribute_field(result, "muted", target, "mute", mixer_state.get("muted"))
    if "solo" in mixer_state:
        restore_attribute_field(result, "solo", target, "solo", mixer_state.get("solo"))
    if "armed" in mixer_state:
        restore_attribute_field(result, "armed", target, "arm", mixer_state.get("armed"))
    if "cueVolumeRaw" in mixer_state:
        restore_parameter_field(result, "cueVolumeRaw", getattr(mixer, "cue_volume", None), mixer_state.get("cueVolumeRaw"))
    if "sendsRaw" in mixer_state:
        restore_send_fields(result, getattr(mixer, "sends", None), mixer_state.get("sendsRaw"))
    return finish_target_result(result)


def restore_parameter_field(result, field, parameter, captured):
    if not captured or not captured.get("supported"):
        result["fields"].append(field_result(field, "skipped", captured_value(captured), None, "Field was not supported when captured"))
        return
    expected = captured.get("value")
    if parameter is None:
        result["fields"].append(field_result(field, "failed", expected, None, "Field is no longer exposed"))
        return
    try:
        parameter.value = expected
        observed = parameter.value
    except Exception as error:
        result["fields"].append(field_result(field, "failed", expected, None, str(error)))
        return
    if raw_values_equal(expected, observed):
        result["fields"].append(field_result(field, "applied", expected, observed))
    else:
        result["fields"].append(field_result(field, "failed", expected, observed, "Raw readback does not match captured value"))


def restore_attribute_field(result, field, target, attribute, captured):
    if not captured or not captured.get("supported"):
        result["fields"].append(field_result(field, "skipped", captured_value(captured), None, "Field was not supported when captured"))
        return
    expected = bool(captured.get("value"))
    try:
        current = getattr(target, attribute, MISSING_ATTRIBUTE)
    except Exception as error:
        result["fields"].append(field_result(field, "failed", expected, None, str(error)))
        return
    if current is MISSING_ATTRIBUTE or current is None:
        result["fields"].append(field_result(field, "failed", expected, None, "Field is no longer exposed"))
        return
    try:
        setattr(target, attribute, expected)
        observed = bool(getattr(target, attribute))
    except Exception as error:
        result["fields"].append(field_result(field, "failed", expected, None, str(error)))
        return
    status = "applied" if observed == expected else "failed"
    reason = None if status == "applied" else "Boolean readback does not match captured value"
    result["fields"].append(field_result(field, status, expected, observed, reason))


def restore_send_fields(result, sends, captured):
    if not captured or not captured.get("supported"):
        result["fields"].append(field_result("sendsRaw", "skipped", None, None, "Sends were not supported when captured"))
        return
    captured_sends = captured.get("values") or []
    if sends is None:
        for index, send_snapshot in enumerate(captured_sends):
            result["fields"].append(field_result("sendsRaw.%s" % index, "failed", captured_value(send_snapshot), None, "Sends are no longer exposed"))
        return
    current_sends = list(sends)
    for index, send_snapshot in enumerate(captured_sends):
        parameter = current_sends[index] if index < len(current_sends) else None
        restore_parameter_field(result, "sendsRaw.%s" % index, parameter, send_snapshot)


def missing_target_result(target_type, index, target_data):
    result = {
        "target": target_type,
        "index": index,
        "snapshotName": target_data.get("name", ""),
        "observedName": None,
        "fields": [
            field_result("mixerState", "failed", target_data.get("mixerState"), None, "Target no longer exists at captured index")
        ]
    }
    return finish_target_result(result)


def finish_target_result(result):
    result["summary"] = {
        "applied": len([field for field in result["fields"] if field["status"] == "applied"]),
        "skipped": len([field for field in result["fields"] if field["status"] == "skipped"]),
        "failed": len([field for field in result["fields"] if field["status"] == "failed"])
    }
    result["complete"] = result["summary"]["failed"] == 0
    return result


def field_result(field, status, expected, observed, reason=None):
    result = {
        "field": field,
        "status": status,
        "expected": expected,
        "observed": observed
    }
    if reason:
        result["reason"] = reason
    return result


def captured_value(captured):
    return captured.get("value") if isinstance(captured, dict) else None


def raw_values_equal(expected, observed):
    if isinstance(expected, (int, float)) and not isinstance(expected, bool) and isinstance(observed, (int, float)) and not isinstance(observed, bool):
        return abs(float(expected) - float(observed)) <= RAW_VALUE_TOLERANCE
    return expected == observed


def remote_script_rollback_warnings(snapshot):
    warnings = []
    if any(track.get("mixerState") is None for track in snapshot.get("tracks", [])):
        warnings.append("Legacy snapshot has no raw track mixer state and cannot restore it.")
    if any(track.get("mixerState") is None for track in snapshot.get("returns", [])):
        warnings.append("Legacy snapshot has no raw return mixer state and cannot restore it.")
    if snapshot.get("master") and snapshot["master"].get("mixerState") is None:
        warnings.append("Legacy snapshot has no raw master mixer state and cannot restore it.")
    if snapshot.get("tracks"):
        warnings.append("Remote Script rollback does not restore track routing or devices.")
    if snapshot.get("returns"):
        warnings.append("Remote Script rollback restores existing return mixer state but does not recreate return tracks or restore devices.")
    if snapshot.get("master"):
        warnings.append("Remote Script rollback restores supported master mixer fields but does not restore master devices.")
    return warnings
