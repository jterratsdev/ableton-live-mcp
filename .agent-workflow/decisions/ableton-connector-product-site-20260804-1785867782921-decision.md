# Decision ableton-connector-product-site-20260804: Story sizing

- Status: accepted
- Owner: architect

## Context
The work adds an isolated static product site, custom visual asset, content contract, package-isolation checks, and responsive browser QA.

## Decision
s [3 points]

## Consequences
Use site/ with plain HTML/CSS and no runtime dependencies; keep it excluded from the npm package files list and defer deployment/DNS.
