# Decision ableton-meter-runtime-fix-20260722: Story sizing

- Status: accepted
- Owner: architect

## Context
The listener strategy registers successfully but emits no observations in Live 12 Lite; investigation spans Remote Script API behavior, endpoint contract, tests, and live runtime validation.

## Decision
m [5 points]

## Consequences
Implementation is not accepted until localhost:9789 demonstrates observable non-zero signal or reports a precise unsupported capability.
