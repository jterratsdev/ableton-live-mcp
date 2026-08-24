# Decision ableton-capability-aware-tool-exposure-20260819: Capability-aware MCP exposure

- Status: accepted
- Owner: architect

## Context
Static MCP discovery currently advertises Remote Script routes that intentionally return 501, while route support is duplicated across Node and Python and static workflows independently recommend unsupported actions.

## Decision
Expose a strict read-only GET /capabilities contract from each bridge; normalize it in a focused MCP resolver; use one tool ownership/route registry to drive tools/list, guard tools/call, and materialize workflow availability; fail closed on unavailable or malformed handshakes.

## Consequences
Runtime discovery becomes mode-aware; conditional tools carry exact reasons and probes; unsupported direct calls are blocked before dispatch; local tools survive bridge failures; parity and cache failure tests become mandatory; no Live probing or mutation is needed.
