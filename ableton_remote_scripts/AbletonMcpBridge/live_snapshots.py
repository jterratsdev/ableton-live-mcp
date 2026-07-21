from __future__ import absolute_import, print_function

from .live_clips import create_midi_clip
from .live_summaries import clip_note_summary, master_track_detail, return_track_detail, track_detail, track_type


def project_snapshot(song):
    snapshot = {
        "tempo": song.tempo,
        "signatureNumerator": song.signature_numerator,
        "signatureDenominator": song.signature_denominator,
        "tracks": [track_snapshot(index, track) for index, track in enumerate(song.tracks)],
        "returns": [return_track_detail(index, track) for index, track in enumerate(getattr(song, "return_tracks", []))],
        "master": master_track_detail(song.master_track),
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
                "Remote Script rollback rewrites readable MIDI session clips on existing MIDI tracks.",
                "Remote Script rollback records but does not restore mixer values, sends, routing, devices, return tracks, master devices, audio clips, automation, undo history, or saved .als file state."
            ]
        }
    }
    return snapshot


def track_snapshot(index, track):
    summary = track_detail(index, track)
    summary["clips"] = [clip_snapshot(slot_index, slot) for slot_index, slot in enumerate(getattr(track, "clip_slots", [])) if getattr(slot, "has_clip", False)]
    return summary


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
        "warnings": warnings
    }


def remote_script_rollback_warnings(snapshot):
    warnings = []
    if snapshot.get("tracks"):
        warnings.append("Remote Script rollback does not restore track mixer state, sends, routing, or devices.")
    if snapshot.get("returns"):
        warnings.append("Remote Script rollback records return tracks but does not recreate or restore them.")
    if snapshot.get("master"):
        warnings.append("Remote Script rollback records the master chain but does not restore master mixer or devices.")
    return warnings
