# Decision ableton-live-readonly-safety-contract-validation-20260723: Pre-run validation bypass

- Status: accepted
- Owner: qa

## Context
Missing checks: review

## Decision
Proceed despite incomplete proactive workflow checks.

## Consequences
Read-only post-reinstall runtime validation; QA review will be recorded from actual GET responses and installed-source comparison, with all write endpoints explicitly excluded.
