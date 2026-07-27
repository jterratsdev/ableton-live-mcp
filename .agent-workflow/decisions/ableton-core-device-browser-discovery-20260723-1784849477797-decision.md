# Decision ableton-core-device-browser-discovery-20260723: Implementation story points

- Status: accepted
- Owner: developer

## Context
developer completed developer

## Decision
3 points

## Consequences
Consumed context files recorded. Changed files recorded. Changed-file traceability recorded. Simplicity review recorded. Goal-to-verification map recorded. Architectural concerns recorded. Handoff summary ready. AC1 evidence: GET /browser/search?kind=audio_effect finds installed Core effects such as Utility or Channel EQ when Live exposes them. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC2 evidence: POST /devices/load can load an exact browser result on a target track without fuzzy selection of an unrelated device. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC3 evidence: Search diagnostics distinguish not found, traversal limit, unavailable edition, and non-loadable browser items. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC4 evidence: Automated tests and live read-only search validation pass before any device is loaded into the user's set. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence.
