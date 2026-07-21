# Decision ableton-mixer-volume-contract-fix-20260721: Implementation story points

- Status: accepted
- Owner: developer

## Context
developer completed developer

## Decision
3 points

## Consequences
Consumed context files recorded. Changed files recorded. Changed-file traceability recorded. Simplicity review recorded. Goal-to-verification map recorded. Architectural concerns recorded. Handoff summary ready. AC1 evidence: Live project summaries no longer label raw mixer parameter values as volumeDb or cueVolumeDb. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC2 evidence: Read models expose raw mixer values separately from dB values where available. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence. AC3 evidence: Tests and docs cover the read/write unit contract so users do not send readback raw values into volumeDb writes. -> observed pass via deterministic workflow state, phase handoff artifact, command result, and release readiness evidence.
