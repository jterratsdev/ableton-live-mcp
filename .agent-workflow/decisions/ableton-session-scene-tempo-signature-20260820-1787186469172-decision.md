# Decision ableton-session-scene-tempo-signature-20260820: Story sizing

- Status: accepted
- Owner: architect

## Context
One atomic vertical slice crosses MCP schemas and capability policy, two bridge adapters, a Remote Script Scene transaction service, deterministic parity, tests, and authoritative docs. The boundaries are separable internally but discovery and mutation cannot ship independently without an untruthful or unusable contract.

## Decision
m [5 points]

## Consequences
Preserve the existing m estimate of 1.5 solo days, 0.8 AI-unguided days, and 0.35 AI-guided days. Implement in ordered internal slices: contracts and registries, bridge domain services, MCP wiring and development parity, then offline QA and docs. Do not split the product story.
