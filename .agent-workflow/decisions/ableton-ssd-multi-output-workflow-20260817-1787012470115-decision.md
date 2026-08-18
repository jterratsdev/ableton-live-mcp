# Decision ableton-ssd-multi-output-workflow-20260817: Replace stale runtime workflow with sign-off run

- Status: accepted
- Owner: product_owner

## Context
Open Orchestra 1.3.0 runtime-native resolver validates the spawn-request artifact instead of the expected child result artifact, leaving Developer handoff fields permanently invisible despite corrected handoff and lifecycle refresh.

## Decision
Cancel workflow wfrun-1787002057777-44ad19 and start a single-agent sign-off run using the accepted AC1-AC4 evidence.

## Consequences
All implementation, QA, review, and evidence artifacts remain preserved; only the stale run is canceled. No product code, Live Set, publish, or deployment state changes.
