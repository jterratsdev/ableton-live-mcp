# Decision ableton-master-optional-mixer-properties-20260723: Pre-run validation bypass

- Status: accepted
- Owner: product_owner

## Context
Missing checks: evidence, review

## Decision
Proceed despite incomplete proactive workflow checks.

## Consequences
User explicitly confirmed the exact Live failure and required optional master mute/solo behavior. Verification will use fake proxies with absent and exception-raising properties plus targeted and full suites; no live bridge calls.
