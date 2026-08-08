# Decision ableton-fix-site-css-cache-20260807: Story sizing

- Status: accepted
- Owner: architect

## Context
Add a deterministic query version to one stylesheet URL and teach the static checker to resolve query-bearing local assets.

## Decision
xs [1 point]

## Consequences
Cloudflare fetches the updated CSS immediately without changing cache policy globally.
