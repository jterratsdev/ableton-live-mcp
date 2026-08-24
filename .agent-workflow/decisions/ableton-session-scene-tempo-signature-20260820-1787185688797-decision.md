# Decision ableton-session-scene-tempo-signature-20260820: Backlog sizing and split assessment

- Status: accepted
- Owner: product_owner

## Context
The story spans MCP schema, bridge capability handshake, development adapter, Remote Script Scene access, documentation, and offline tests, but all surfaces implement one externally atomic Session-scene override journey and share one capability/rollback contract.

## Decision
Do not split the product story before architecture. Keep one vertical slice because separating capability discovery, mutation, or tool exposure would create intermediate contracts that either advertise an unusable operation or mutate without truthful discovery. Architect must still record the required Orchestra size and may partition implementation modules and test work internally.

## Consequences
Scope remains limited to one existing Session scene and two coupled override families. Arrangement automation, global fallback, scene lifecycle/launch, installation, and live validation are explicit non-goals, preventing hidden release or support scope.
