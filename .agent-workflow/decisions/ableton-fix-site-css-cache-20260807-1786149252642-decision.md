# Decision ableton-fix-site-css-cache-20260807: Implementation story points

- Status: accepted
- Owner: developer

## Context
developer completed developer

## Decision
3 points

## Consequences
Consumed context files recorded. Changed files recorded. Changed-file traceability recorded. Simplicity review recorded. Goal-to-verification map recorded. Architectural concerns recorded. Handoff summary ready. AC1 verification pending: The local stylesheet URL includes a deterministic content version while the shared token URL remains unchanged. -> requires an observable artifact, executed command, and explicit assertion. AC2 verification pending: The site contract resolves query-versioned local assets and passes. -> requires an observable artifact, executed command, and explicit assertion. AC3 verification pending: After push, live desktop and mobile screenshots render the new navigation, accent CTA, and shared typography without the stale details marker. -> requires an observable artifact, executed command, and explicit assertion.
