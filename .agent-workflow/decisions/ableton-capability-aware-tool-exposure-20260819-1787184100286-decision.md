# Decision ableton-capability-aware-tool-exposure-20260819: Story sizing

- Status: accepted
- Owner: architect

## Context
One atomic public capability contract spans two bridge runtimes, MCP discovery/call policy, workflow materialization, deterministic tests, and docs; implementation can proceed in four dependency-ordered slices without independent releases.

## Decision
m [5 points]

## Consequences
Retain the existing m estimate; keep registry, resolver, workflow, and verification slices in one story so partial delivery cannot leave discovery, calls, and plans inconsistent.
