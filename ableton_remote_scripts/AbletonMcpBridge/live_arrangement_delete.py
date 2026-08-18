from __future__ import absolute_import, print_function

import hashlib
import json

from .http_bridge import BridgeHttpError


def plan_arrangement_clip_deletion(song):
    candidates = arrangement_clip_candidates(song)
    assert_unique_identities(candidates)
    return {
        "ok": True,
        "readOnly": True,
        "planToken": token_for([candidate["clipIdentity"] for candidate in candidates]),
        "candidates": candidates
    }


def delete_arrangement_clips(song, payload):
    requested_identities = validate_deletion_request(payload)
    current_plan = plan_arrangement_clip_deletion(song)
    if payload.get("planToken") != current_plan["planToken"]:
        raise BridgeHttpError("Arrangement deletion plan is stale; run the read-only planning tool again", 409)

    candidates_by_identity = dict((candidate["clipIdentity"], candidate) for candidate in current_plan["candidates"])
    selected = []
    for clip_identity in requested_identities:
        candidate = candidates_by_identity.get(clip_identity)
        if candidate is None:
            raise BridgeHttpError("Arrangement clip identity is missing or stale: %s" % clip_identity, 409)
        if not candidate["deletionSupported"]:
            raise BridgeHttpError("Arrangement clip deletion is unsupported for track %s" % candidate["trackIndex"], 501)
        selected.append(candidate)

    undo = song_undo(song)
    original_fingerprint = observable_arrangement_fingerprint(current_plan["candidates"])

    results = []
    try:
        for candidate in sorted(selected, key=reverse_timeline_key, reverse=True):
            track = list(getattr(song, "tracks", []) or [])[candidate["trackIndex"]]
            clip = resolve_exact_clip(track, candidate)
            track.delete_clip(clip)
            results.append(candidate["clipIdentity"])
    except Exception as error:
        rollback_deletion_failure(song, undo, len(results), original_fingerprint, error)

    remaining = set(candidate["clipIdentity"] for candidate in arrangement_clip_candidates(song))
    return {
        "ok": True,
        "deletedCount": len(results),
        "results": [{
            "clipIdentity": clip_identity,
            "deleted": clip_identity not in remaining,
            "verifiedAbsent": clip_identity not in remaining
        } for clip_identity in requested_identities]
    }


def arrangement_clip_candidates(song):
    candidates = []
    for track_index, track in enumerate(getattr(song, "tracks", []) or []):
        try:
            clips = list(track.arrangement_clips or [])
        except Exception:
            raise BridgeHttpError("Arrangement clips are not exposed for track %s" % track_index, 501)
        for arrangement_index, clip in enumerate(clips):
            candidates.append(clip_candidate(track_index, track, arrangement_index, clip))
    return candidates


def clip_candidate(track_index, track, arrangement_index, clip):
    try:
        is_arrangement_clip = bool(clip.is_arrangement_clip)
        start_beat = clip.start_time
        end_beat = clip.end_time
    except Exception:
        raise BridgeHttpError("Arrangement clip identity fields are unavailable for track %s" % track_index, 501)
    if not is_arrangement_clip or not is_number(start_beat) or not is_number(end_beat) or end_beat < start_beat:
        raise BridgeHttpError("Arrangement clip identity is unsupported or invalid for track %s" % track_index, 501)

    name = getattr(clip, "name", "")
    identity_fields = [track_index, arrangement_index, id(clip), name, start_beat, end_beat]
    return {
        "trackIndex": track_index,
        "trackIdentity": token_for([track_index, id(track), getattr(track, "name", "")]),
        "trackName": getattr(track, "name", ""),
        "arrangementIndex": arrangement_index,
        "clipIdentity": token_for(identity_fields),
        "name": name,
        "startBeat": start_beat,
        "lengthBeats": end_beat - start_beat,
        "deletionSupported": supports_delete_clip(track)
    }


def resolve_exact_clip(track, expected):
    matches = []
    for arrangement_index, clip in enumerate(list(track.arrangement_clips or [])):
        candidate = clip_candidate(expected["trackIndex"], track, arrangement_index, clip)
        if candidate["clipIdentity"] == expected["clipIdentity"]:
            matches.append(clip)
    if len(matches) != 1:
        raise BridgeHttpError("Arrangement clip changed or became ambiguous during deletion", 409)
    return matches[0]


def validate_deletion_request(payload):
    plan_token = payload.get("planToken")
    identities = payload.get("clipIdentities")
    if not isinstance(plan_token, str) or not plan_token:
        raise BridgeHttpError("planToken must be the token returned by the read-only planning tool")
    if not isinstance(identities, list) or not identities:
        raise BridgeHttpError("clipIdentities must be a non-empty array of pre-resolved Arrangement clip identities")
    if any(not isinstance(identity, str) or not identity for identity in identities):
        raise BridgeHttpError("clipIdentities must contain only non-empty strings")
    if len(set(identities)) != len(identities):
        raise BridgeHttpError("clipIdentities contains a duplicated or ambiguous selection", 409)
    return list(identities)


def assert_unique_identities(candidates):
    identities = [candidate["clipIdentity"] for candidate in candidates]
    if len(set(identities)) != len(identities):
        raise BridgeHttpError("Arrangement clip identities are ambiguous; no deletion plan was created", 409)


def reverse_timeline_key(candidate):
    return candidate["trackIndex"], candidate["startBeat"], candidate["arrangementIndex"]


def song_undo(song):
    try:
        undo = getattr(song, "undo", None)
    except Exception:
        undo = None
    if not callable(undo):
        raise BridgeHttpError("Arrangement clip deletion requires callable Song.undo before mutation", 501)
    return undo


def rollback_deletion_failure(song, undo, completed_count, original_fingerprint, deletion_error):
    undo_errors = []
    for undo_index in range(completed_count):
        try:
            undo()
        except Exception as undo_error:
            undo_errors.append("undo %s of %s: %s" % (undo_index + 1, completed_count, undo_error))

    try:
        restored_candidates = arrangement_clip_candidates(song)
        restored_fingerprint = observable_arrangement_fingerprint(restored_candidates)
    except Exception as readback_error:
        raise BridgeHttpError(
            "Arrangement clip deletion failed after %s completed deletion(s); rollback failed: "
            "restoration readback failed: %s; undo errors: %s; original error: %s" % (
                completed_count,
                readback_error,
                "; ".join(undo_errors) if undo_errors else "none",
                deletion_error
            ),
            500
        )

    if undo_errors or restored_fingerprint != original_fingerprint:
        failure_reasons = list(undo_errors)
        if restored_fingerprint != original_fingerprint:
            failure_reasons.append(
                "restoration fingerprint mismatch (expected %s, observed %s)" % (
                    original_fingerprint,
                    restored_fingerprint
                )
            )
        raise BridgeHttpError(
            "Arrangement clip deletion failed after %s completed deletion(s); rollback failed: %s; original error: %s" % (
                completed_count,
                "; ".join(failure_reasons),
                deletion_error
            ),
            500
        )

    original_status = deletion_error.status_code if isinstance(deletion_error, BridgeHttpError) else 500
    raise BridgeHttpError(
        "Arrangement clip deletion failed after %s completed deletion(s); rollback verified by observable "
        "Arrangement fingerprint; original error: %s" % (completed_count, deletion_error),
        original_status
    )


def observable_arrangement_fingerprint(candidates):
    observable = [[
        candidate["trackIndex"],
        candidate["trackName"],
        candidate["arrangementIndex"],
        candidate["name"],
        candidate["startBeat"],
        candidate["lengthBeats"]
    ] for candidate in candidates]
    return token_for(observable)


def token_for(value):
    encoded = json.dumps(value, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def supports_delete_clip(track):
    try:
        return callable(getattr(track, "delete_clip", None))
    except Exception:
        return False
