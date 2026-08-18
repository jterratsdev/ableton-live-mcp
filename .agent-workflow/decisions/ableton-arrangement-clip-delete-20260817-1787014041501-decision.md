# Decision ableton-arrangement-clip-delete-20260817: Use Track.delete_clip for exact Arrangement deletion

- Status: accepted
- Owner: architect

## Context
Cycling '74 Live 12.3.5 LOM documents Track.arrangement_clips as the Arrangement clip list and Track.delete_clip with a Clip parameter. Clip exposes canonical Arrangement paths plus start_time/end_time and is_arrangement_clip. Object IDs remain stable while an object exists but are not persisted, so API tokens must be treated as short-lived and verified against current state.

## Decision
Use the official Live Object Model Track.delete_clip(clip) function on an exact object from Track.arrangement_clips; expose a read-only plan token derived from observable clip fields and re-resolve it immediately before deletion. Fail closed when the function or arrangement_clips is unavailable.

## Consequences
No GUI automation or selection emulation is needed. Session deletion remains separate. Deletion must use the track-owned object, deterministic ordering, stale-token rejection, and post-delete timeline readback.
