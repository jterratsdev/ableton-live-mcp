# Decision ableton-mixer-snapshot-rollback-safety-20260723: Story sizing

- Status: accepted
- Owner: architect

## Context
Safety-critical state capture and granular restoration across tracks, returns, and master.

## Decision
m [5 points]

## Consequences
Use raw values for rollback, avoid dB conversions, and make partial failures explicit.
