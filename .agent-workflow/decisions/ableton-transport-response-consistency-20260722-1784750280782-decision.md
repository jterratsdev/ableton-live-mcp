# Decision ableton-transport-response-consistency-20260722: Story sizing

- Status: accepted
- Owner: architect

## Context
Small response-contract correction across real and development adapters with tests and docs.

## Decision
xs [1 point]

## Consequences
playing represents requested command state; observedPlaying and confirmed expose immediate readback; GET /status remains authoritative.
