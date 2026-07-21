# Decision ableton-real-python-adapter-20260716: Implementation story points

- Status: accepted
- Owner: developer

## Context
developer completed developer

## Decision
3 points

## Consequences
Consumed context files recorded. Changed files recorded. Changed-file traceability recorded. Simplicity review recorded. Goal-to-verification map recorded. Architectural concerns recorded. Handoff summary ready. AC1 evidence: An Ableton MIDI Remote Script package exists with create_instance and a ControlSurface class that starts a loopback HTTP server. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC2 evidence: The script implements the same endpoint contract used by the MCP bridge for status, project, tempo, transport, plugins, device loading, and mastering apply. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC3 evidence: Live API calls are marshalled onto Ableton's control-surface thread instead of directly mutating Live from the HTTP thread. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC4 evidence: Docs explain install location, Ableton preferences setup, startup verification, and the smoke command against Live. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC5 evidence: Static validation covers Python syntax and repository tests still pass; live Ableton validation is explicitly deferred with owner and command. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence.
