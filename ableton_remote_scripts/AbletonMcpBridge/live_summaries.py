from __future__ import absolute_import, print_function

from .live_core import parameter_bound, parameter_db_value, parameter_display_value, parameter_value


def track_summary(index, track):
    return {
        "index": index,
        "name": track.name,
        "type": track_type(track)
    }


def track_detail(index, track):
    volume = mixer_volume_summary(track.mixer_device.volume)
    return {
        "index": index,
        "name": track.name,
        "type": track_type(track),
        "volumeRaw": volume["raw"],
        "volumeDb": volume["db"],
        "volumeDisplay": volume["display"],
        "pan": parameter_value(track.mixer_device.panning),
        "muted": bool(getattr(track, "mute", False)),
        "solo": bool(getattr(track, "solo", False)),
        "armed": bool(getattr(track, "arm", False)) if hasattr(track, "arm") else False,
        "inputRouting": routing_name(getattr(track, "current_input_routing", None)),
        "outputRouting": routing_name(getattr(track, "current_output_routing", None)),
        "sendsRaw": send_summaries(track, "raw"),
        "sendsDb": send_summaries(track, "db"),
        "sendsDisplay": send_summaries(track, "display"),
        "devices": [device_summary(device_index, device) for device_index, device in enumerate(track.devices)],
        "clips": clip_summaries(track)
    }


def cue_points(song):
    points = []
    for cue in getattr(song, "cue_points", []):
        points.append({
            "beat": getattr(cue, "time", 0),
            "name": getattr(cue, "name", "")
        })
    return points


def track_type(track):
    if getattr(track, "has_midi_input", False):
        return "midi"
    return "audio"


def device_summary(index, device):
    return {
        "index": index,
        "name": device.name,
        "kind": getattr(device, "class_name", device.__class__.__name__),
        "parameters": [parameter_summary(parameter) for parameter in getattr(device, "parameters", [])]
    }


def parameter_summary(parameter):
    return {
        "name": getattr(parameter, "name", ""),
        "value": parameter_value(parameter),
        "min": parameter_bound(parameter, "min"),
        "max": parameter_bound(parameter, "max"),
        "isEnabled": bool(getattr(parameter, "is_enabled", True))
    }


def mixer_volume_summary(parameter):
    return {
        "raw": parameter_value(parameter),
        "db": parameter_db_value(parameter),
        "display": parameter_display_value(parameter)
    }


def send_summaries(track, unit):
    sends = {}
    for index, send in enumerate(getattr(track.mixer_device, "sends", []) or []):
        if unit == "db":
            sends[str(index)] = parameter_db_value(send)
        elif unit == "display":
            sends[str(index)] = parameter_display_value(send)
        else:
            sends[str(index)] = parameter_value(send)
    return sends


def return_track_detail(index, track):
    volume = mixer_volume_summary(track.mixer_device.volume)
    return {
        "index": index,
        "name": getattr(track, "name", ""),
        "type": "return",
        "volumeRaw": volume["raw"],
        "volumeDb": volume["db"],
        "volumeDisplay": volume["display"],
        "pan": parameter_value(track.mixer_device.panning),
        "muted": bool(getattr(track, "mute", False)),
        "solo": bool(getattr(track, "solo", False)),
        "devices": [device_summary(device_index, device) for device_index, device in enumerate(track.devices)]
    }


def master_track_detail(track):
    mixer = track.mixer_device
    volume = mixer_volume_summary(mixer.volume)
    cue_volume = mixer_volume_summary(getattr(mixer, "cue_volume", None)) if hasattr(mixer, "cue_volume") else {"raw": None, "db": None, "display": None}
    return {
        "name": getattr(track, "name", "Master"),
        "type": "master",
        "volumeRaw": volume["raw"],
        "volumeDb": volume["db"],
        "volumeDisplay": volume["display"],
        "pan": parameter_value(mixer.panning),
        "cueVolumeRaw": cue_volume["raw"],
        "cueVolumeDb": cue_volume["db"],
        "cueVolumeDisplay": cue_volume["display"],
        "devices": [device_summary(device_index, device) for device_index, device in enumerate(track.devices)]
    }


def clip_summaries(track):
    clips = []
    for slot_index, slot in enumerate(getattr(track, "clip_slots", [])):
        if getattr(slot, "has_clip", False):
            clip = slot.clip
            clips.append({
                "slot": slot_index,
                "name": clip.name,
                "lengthBeats": clip.length,
                "isPlaying": bool(getattr(clip, "is_playing", False)),
                "isTriggered": bool(getattr(clip, "is_triggered", False))
            })
    return clips


def clip_note_summary(note):
    if isinstance(note, dict):
        return {
            "pitch": note.get("pitch"),
            "start": note.get("start", note.get("time", note.get("startTime", 0))),
            "duration": note.get("duration"),
            "velocity": note.get("velocity"),
            "muted": bool(note.get("muted", note.get("mute", False)))
        }

    if hasattr(note, "pitch"):
        return {
            "pitch": getattr(note, "pitch"),
            "start": getattr(note, "start_time", getattr(note, "start", 0)),
            "duration": getattr(note, "duration", 0),
            "velocity": getattr(note, "velocity", 100),
            "muted": bool(getattr(note, "mute", getattr(note, "muted", False)))
        }

    return {
        "pitch": note[0],
        "start": note[1],
        "duration": note[2],
        "velocity": note[3],
        "muted": bool(note[4]) if len(note) > 4 else False
    }


def routing_names(options):
    return [routing_name(option) for option in options or []]


def routing_name(option):
    if option is None:
        return None
    for attr in ("display_name", "name"):
        try:
            value = getattr(option, attr)
            if value:
                return value
        except Exception:
            pass
    return str(option)
