# Decision ableton-volume-db-write-safety-20260723: Story sizing

- Status: accepted
- Owner: architect

## Context
Safety-critical nonlinear Live parameter conversion with fail-closed contract and live round-trip evidence.

## Decision
m [5 points]

## Consequences
Isolate conversion helpers and require verified display readback before success.
