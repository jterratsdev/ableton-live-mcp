# Decision ableton-session-scene-tempo-signature-20260820: Pin the preflight Scene receiver for transaction writes

- Status: accepted
- Owner: architect

## Context
Independent QA proved that sceneIndex, sceneCount, name, and propertyShape collide when a same-name/same-shape Scene replaces the target without changing count. Reacquiring before setters can redirect a transaction and return false success. This narrowly corrects the earlier reacquire-before-compensation invariant while preserving fresh canonical readback and recreated-proxy compatibility where observably safe.

## Decision
Use the exact preflight-resolved Scene proxy as the sole receiver for every forward and compensation setter. Fresh sceneIndex resolution is readback/verification-only and must never select a mutation receiver.

## Consequences
A stale pinned proxy may raise during a later setter or compensation; that failure is reported explicitly and cannot write a replacement Scene. Fresh readback can still diagnose missing, structurally changed, or value-mismatched current-index state. No stable Live Scene identity is assumed.
