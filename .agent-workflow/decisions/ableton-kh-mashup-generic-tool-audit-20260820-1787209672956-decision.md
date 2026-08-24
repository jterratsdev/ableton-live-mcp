# Decision ableton-kh-mashup-generic-tool-audit-20260820: Genericization boundary

- Status: accepted
- Owner: architect

## Context
The scripts interleave reusable MIDI/Live mechanics with KH-specific paths, song form, track names, presets, plugins, and unsafe direct HTTP orchestration.

## Decision
Do not promote project scripts wholesale. Extract only narrow typed contracts behind the existing capability registry and risk policy; keep musical authorship, score generation, corpus analysis, fixed track/device recipes, and audition flows local.

## Consequences
Prioritize truthful MIDI inspection/import and exact-target transactional plans; defer multi-step device and Scene workflows until receiver identity and rollback prerequisites are proven. Alternatives rejected: copying scripts, exposing arbitrary script execution, or treating browser/meter responses as guaranteed proof.
