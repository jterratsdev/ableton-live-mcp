from __future__ import absolute_import, print_function

from .http_bridge import BridgeHttpError
from .live_core import require_non_empty_string, require_number_range
from .live_summaries import cue_points


def arrangement_snapshot(song):
    locators = cue_points(song)
    clips = arrangement_clips(song)
    length_beats = arrangement_length(song, locators, clips)
    return {
        "ok": True,
        "lengthBeats": length_beats,
        "sections": arrangement_sections(locators, length_beats),
        "locators": locators,
        "clips": clips,
        "warnings": arrangement_warnings(song)
    }


def insert_arrangement_clip(song, payload):
    raise BridgeHttpError("Arrangement clip insertion is not supported by this Ableton Remote Script API", 501)


def add_locator(song, payload):
    beat = require_number_range(payload.get("beat"), "beat", 0, 1000000)
    name = require_non_empty_string(payload.get("name"), "name")

    if not hasattr(song, "cue_points"):
        raise BridgeHttpError("Arrangement cue points are not exposed by this Ableton Live API", 501)

    existing_at_beat = find_cue_at_beat(song, beat)
    if existing_at_beat is not None:
        existing_at_beat.name = name
        return {"ok": True, "locator": cue_summary(existing_at_beat), "locators": cue_points(song)}

    existing_by_name = find_cue_by_name(song, name)
    if existing_by_name is not None:
        try:
            existing_by_name.time = beat
            existing_by_name.name = name
            return {"ok": True, "locator": cue_summary(existing_by_name), "locators": cue_points(song)}
        except Exception:
            raise BridgeHttpError("Updating locator time is not supported by this Ableton Live API", 501)

    if not hasattr(song, "set_or_delete_cue"):
        raise BridgeHttpError("Creating arrangement locators is not supported by this Ableton Live API", 501)

    previous_time = getattr(song, "current_song_time", None)
    try:
        song.current_song_time = beat
        song.set_or_delete_cue()
    except Exception as error:
        raise BridgeHttpError("Unable to create arrangement locator: %s" % error, 501)
    finally:
        if previous_time is not None:
            try:
                song.current_song_time = previous_time
            except Exception:
                pass

    created = find_cue_at_beat(song, beat)
    if created is None:
        raise BridgeHttpError("Ableton Live did not expose the created locator", 501)
    created.name = name
    return {"ok": True, "locator": cue_summary(created), "locators": cue_points(song)}


def arrangement_clips(song):
    clips = []
    for track_index, track in enumerate(getattr(song, "tracks", []) or []):
        observed = []
        for attr in ("arrangement_clips", "arrangement_clip_slots"):
            try:
                value = getattr(track, attr)
                if value:
                    observed = value
                    break
            except Exception:
                pass
        for clip_index, clip in enumerate(observed or []):
            summary = arrangement_clip_summary(track_index, track, clip_index, clip)
            if summary is not None:
                clips.append(summary)
    return clips


def arrangement_clip_summary(track_index, track, clip_index, clip):
    if getattr(clip, "has_clip", False):
        clip = clip.clip
    if clip is None:
        return None

    start = first_attr(clip, ("start_time", "start_marker", "start", "playing_position"), 0)
    length = first_attr(clip, ("length", "loop_end"), 0)
    return {
        "trackIndex": track_index,
        "trackName": getattr(track, "name", ""),
        "arrangementIndex": clip_index,
        "name": getattr(clip, "name", ""),
        "startBeat": start,
        "lengthBeats": length,
        "endBeat": start + length if isinstance(start, (int, float)) and isinstance(length, (int, float)) else None
    }


def arrangement_length(song, locators, clips):
    explicit = first_attr(song, ("last_event_time", "song_length", "length"), 0)
    locator_end = max([locator.get("beat", 0) for locator in locators] or [0])
    clip_end = max([clip.get("endBeat", 0) or 0 for clip in clips] or [0])
    return max(explicit or 0, locator_end, clip_end)


def arrangement_sections(locators, length_beats):
    sections = []
    for index, locator in enumerate(locators):
        next_locator = locators[index + 1] if index + 1 < len(locators) else None
        end_beat = next_locator.get("beat") if next_locator is not None else length_beats
        sections.append({
            "name": locator.get("name", ""),
            "startBeat": locator.get("beat", 0),
            "endBeat": end_beat,
            "lengthBeats": max(0, end_beat - locator.get("beat", 0))
        })
    return sections


def arrangement_warnings(song):
    warnings = []
    tracks = getattr(song, "tracks", []) or []
    if not any(hasattr(track, "arrangement_clips") or hasattr(track, "arrangement_clip_slots") for track in tracks):
        warnings.append("Arrangement clips are not exposed by this Ableton Live API")
    if not hasattr(song, "set_or_delete_cue"):
        warnings.append("Arrangement locator creation is not exposed by this Ableton Live API")
    return warnings


def find_cue_at_beat(song, beat):
    for cue in getattr(song, "cue_points", []) or []:
        if abs(getattr(cue, "time", -1) - beat) < 0.0001:
            return cue
    return None


def find_cue_by_name(song, name):
    for cue in getattr(song, "cue_points", []) or []:
        if getattr(cue, "name", "") == name:
            return cue
    return None


def cue_summary(cue):
    return {
        "beat": getattr(cue, "time", 0),
        "name": getattr(cue, "name", "")
    }


def first_attr(target, names, default):
    for name in names:
        try:
            value = getattr(target, name)
            if value is not None:
                return value
        except Exception:
            pass
    return default
