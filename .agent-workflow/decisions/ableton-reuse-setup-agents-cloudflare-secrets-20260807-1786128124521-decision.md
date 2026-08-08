# Decision ableton-reuse-setup-agents-cloudflare-secrets-20260807: Pre-run validation bypass

- Status: accepted
- Owner: qa

## Context
Missing checks: review

## Decision
Proceed despite incomplete proactive workflow checks.

## Consequences
Read-only post-deployment QA requested by the user after CI success; collect real HTTP and workflow evidence needed to satisfy the paused qa-to-release gate without changing release state.
