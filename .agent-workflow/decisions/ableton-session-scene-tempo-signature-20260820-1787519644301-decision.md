# Decision ableton-session-scene-tempo-signature-20260820: Pin transaction mutations to the preflight Scene receiver

- Status: accepted
- Owner: architect

## Context
A Scene replacement can preserve scene count, duplicate name, property shape, and overlapping values, so structural fingerprints are deliberately non-unique. Re-resolving before a setter can redirect writes to a replacement Scene and produce false success.

## Decision
Capture song.scenes[sceneIndex] once with the complete preflight observation and use that exact receiver for every forward and compensation setter. Fresh index resolution is observation-only for success readback, rollback verification, and diagnostics; neither structural fingerprint equality nor matching values may authorize a mutation receiver.

## Consequences
A stale pinned proxy may raise, but it cannot redirect writes. Such exceptions retain the original failure and explicit rollback diagnostics. Recreated proxies remain acceptable for canonical readback only when the current exact index matches the complete expected observation. This supersedes the earlier reacquire-before-compensation wording while retaining the existing public MCP/HTTP contract.
