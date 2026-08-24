# Decision ableton-kh-mashup-generic-tool-audit-20260820: MIDI import safety prerequisites

- Status: accepted
- Owner: architect

## Context
src/midi-import.js accepts and echoes createTracks and quantize without applying them; Remote Script create_midi_clip deletes an occupied slot before creating and setting the replacement notes; rollback is partial and cannot restore devices or routing.

## Decision
Before adding composite tools, make ableton_import_midi truthful, add read-only MIDI inspection and exact-target replacement planning, and classify replacement of an occupied clip as destructive.

## Consequences
Implementation should either reject unsupported options or implement them, use bounded file/payload validation, fingerprint the target, capture readable prior clip state, verify exact note/length readback, and compensate or fail explicitly. Existing ableton_create_midi_clip remains usable only with informed risk handling.
