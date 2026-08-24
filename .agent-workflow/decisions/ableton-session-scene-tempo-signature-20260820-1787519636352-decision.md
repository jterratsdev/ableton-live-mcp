# Decision ableton-session-scene-tempo-signature-20260820: Story sizing

- Status: accepted
- Owner: architect

## Context
The correction preserves the existing focused Node and Python Scene services, two MCP routes, capability registries, docs, and offline parity tests; the safety invariant spans both runtimes but introduces no new framework or integration boundary.

## Decision
m [5 points]

## Consequences
Keep one atomic vertical story. Developer work is a narrow verification/correction pass around receiver pinning, followed by full offline QA; no story split is warranted.
