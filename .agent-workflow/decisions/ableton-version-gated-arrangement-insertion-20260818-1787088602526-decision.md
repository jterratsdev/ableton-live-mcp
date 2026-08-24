# Decision ableton-version-gated-arrangement-insertion-20260818: Explicit version-gated Arrangement insertion safety envelope

- Status: accepted
- Owner: architect

## Context
Three host-dependent insertion modes share target-specific capability probing, canonical full-state fingerprints, exact one-delta readback, modern MIDI note APIs, and verified rollback; current payload is ambiguous and current Remote Script returns unconditional 501.

## Decision
Keep one m/5-point story; preserve the insert tool/route but require explicit midi_notes, session_clip, or audio_file mode; add a target-specific read-only capability route; implement a focused Live insertion service; require callable Song.undo for executability; use add_new_notes when callable and set_notes only when modern is unavailable; reject legacy ambiguous payloads; verify fresh-proxy full-state deltas and bounded rollback.

## Consequences
Adds a read-only capability surface and strict discriminated contract; legacy ambiguous calls fail visibly; adapters remain thin; product proof is deferred to the approved disposable Live Set after local QA and install/restart; implementation and QA must prove AC1-AC5 and AC7 before release.
