# Decision ableton-product-integration-qa-20260720: Development adapter as facade

- Status: accepted
- Owner: architect

## Context
During product integration the adapter had grown to 659 lines with inline return routing, device loading, metering, and observability-facing behavior. The user explicitly requested that adapters abstract helper functionality instead of owning heavy logic.

## Decision
Keep bridge/development-adapter.js as an orchestration facade and delegate heavy behavior to focused helpers under bridge/development/.

## Consequences
New product behavior should be implemented in helper modules and adapter methods should remain thin pass-through methods with validation only when local to the facade contract.
