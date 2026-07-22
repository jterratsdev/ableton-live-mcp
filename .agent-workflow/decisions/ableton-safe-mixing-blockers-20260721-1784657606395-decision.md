# Decision ableton-safe-mixing-blockers-20260721: Story sizing

- Status: accepted
- Owner: architect

## Context
The work spans live Remote Script read contracts, mastering-chain idempotency, and device parameter target addressing across track, return, and master chains.

## Decision
m [5 points]

## Consequences
Implement as focused single-agent changes because the three blockers share the same bridge contract and test surface; do not run automatic mastering against the user's Live set as part of this task.
