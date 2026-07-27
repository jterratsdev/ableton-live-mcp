# Decision ableton-core-device-browser-discovery-20260723: Story sizing

- Status: accepted
- Owner: architect

## Context
Requires diagnosing version-dependent Live browser traversal and hardening exact device resolution with bounded diagnostics.

## Decision
s [3 points]

## Consequences
Keep adapter thin, place traversal in live_browser helper, and validate read-only before loading any effect.
