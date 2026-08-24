# Handoff ableton-session-scene-tempo-signature-20260820: developer to qa

## Task Context
- Title: Control tempo and time signature per Session scene
- Goal: Expose capability-gated MCP operations for reading and safely setting or clearing per-scene tempo and time-signature overrides in Ableton Session View, without claiming Arrangement timeline automation.
- Current owner: developer
- Current status: blocked

## Acceptance Criteria
- AC1. For a required zero-based sceneIndex, a read-only capability call returns exact target metadata {sceneIndex,name} and separate {readable,writable,reason} results for Scene.tempo, Scene.tempo_enabled, the composite time signature value (with component detail for Scene.time_signature_numerator and Scene.time_signature_denominator), and Scene.time_signature_enabled; it performs no setter call, and any absent, descriptor-incompatible, or exception-raising probe is unavailable with a non-empty reason rather than inferred from Live edition.
- AC2. The mutation input accepts only an exact existing integer sceneIndex plus at least one of tempo or timeSignature; each family is a tagged action: tempo is {action:set,bpm} or {action:clear}, and timeSignature is {action:set,numerator,denominator} or {action:clear}. It rejects negative, fractional, stale/out-of-range indexes, fuzzy/name-only targeting, unknown actions, clear actions carrying values, non-finite or out-of-range BPM outside inclusive 20..999, numerator outside integer 1..32, and denominators outside 1,2,4,8,16,32 before any write.
- AC3. The index is the authoritative Session-scene identity for the serialized request: resolution is exactly song.scenes[sceneIndex], duplicate or empty names are allowed, names are descriptive only, and every post-write or rollback readback reacquires song.scenes[sceneIndex] so recreated proxy objects succeed while a missing or structurally changed target fails verification; no other scene, global Song tempo/signature, clip, transport, or launch state is touched.
- AC4. Preflight reads one complete observable target snapshot and verifies all operation-required capabilities before any write. Set tempo requires readable/writable tempo and tempo_enabled; clear tempo requires readable tempo plus readable/writable tempo_enabled. Set signature requires readable/writable numerator, denominator, and time_signature_enabled; clear signature requires readable numerator and denominator plus readable/writable time_signature_enabled. A combined request fails closed as a whole when either requested family is unsupported, including idempotent requests.
- AC5. Set writes value before enable: tempo then tempo_enabled=true; signature numerator, denominator, then time_signature_enabled=true; a combined request applies tempo family then signature family. Clear writes only the corresponding enable=false and never overwrites a hidden retained value. Already-equal requests may skip physical setters but still run full preflight and fresh readback. Success is returned only after fresh-proxy readback exactly observes enabled=true and requested values for set, or enabled=false with Live sentinel -1 values normalized as null while preserving the exact raw observations for clear.
- AC6. The operation is atomic across all requested fields: on any setter exception, target re-resolution failure, readback exception, or value/enable mismatch, it rolls back every field actually written in reverse transaction order toward the complete pre-mutation observable snapshot, reacquires the scene, and verifies the full target fingerprint and all readable tempo/signature fields. The error reports the original failure, rollback attempted/succeeded, any rollback failures, and final observed state; it never reports success after failed verification. Disabled pre-state is restored by disabling the family and verifying its -1 sentinels because Live does not expose the hidden retained value.
- AC7. The response returns target {sceneIndex,name}, requested actions, exact normalized and raw observed tempo/signature values and enable states, changed/no-op status, and capability details. The scene mutation tool is listed only when the active bridge handshake truthfully supports its route; deterministic development fixtures expose equivalent behavior, while absent, malformed, or unreachable capability handshakes fail closed.
- AC8. Tool copy and authoritative docs state that these overrides take effect only when the Session scene is later launched by the user or another explicit launch operation; this operation itself never launches a scene and never creates, edits, or promises Arrangement tempo envelopes, Arrangement time-signature markers, or global Song fallback writes.
- AC9. Offline Node and Python fake-Live tests assert full and partial capability matrices, missing/raising properties, validation with zero setter calls, duplicate scene names and exact indexes, set/combined set/idempotency, clear/disable sentinels, mid-sequence failure rollback, rollback failure reporting, recreated-proxy readback, readback mismatch rollback, route/tool registry parity, malformed handshake fail-closed behavior, py_compile, focused MCP-to-HTTP behavior, npm test, and git diff --check without contacting the active bridge or mutating a Live Set.

## Scope And Paths
- src
- bridge
- ableton_remote_scripts/AbletonMcpBridge
- docs
- test

## Phase Handoff
- Status: ready_for_review
- Changed components: Second P0 remediation pins the exact preflight Scene proxy as the sole forward and compensation mutation receiver in Node and Python. Fresh exact-index resolution is now readback/verification-only. Added same-name/same-shape/unchanged-count swap regressions, retained and updated removal/shift/missing-target regressions, recorded the narrow Architect invariant correction, lesson, prompt iteration, evidence, and Developer review.
- Behavior changed: After A.tempo, even if B replaces A with identical name, property shape, and scene count, all later forward and rollback setters stay on A and B's log remains empty. Fresh B readback produces an explicit timeSignature mismatch, prevents success, and rollback reports final current-index mismatches. A stale pinned proxy may fail explicitly but can never redirect a write.
- Unit tests: Node and Python fixtures assert A forward+compensation logs, B empty log, original readback cause, journaled actual invocations, unsuccessful rollback verification, and no false success. Prior removal/shift/missing cases remain green. MCP-to-handler, parity, capability, static, risk, py_compile, full npm, diff, and doc-sync gates pass offline.
- Commands run: node test/scene-tempo-signature.mjs; node test/scene-tempo-signature-mcp.mjs; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_scene_tempo_signature_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_capabilities_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py; node test/capability-aware-tools.mjs; node test/remote-script-static.mjs; node test/risk-policy.mjs; npm test; git diff --check; orchestra doc-sync audit --task ableton-session-scene-tempo-signature-20260820
- Known gaps: none
- Risks: none
- Recommended Playwright coverage: not applicable
- Executor provenance: not recorded

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 3
- atomic Scene transaction target isolation: fix=resolve once, observe and compare the original structural fingerprint, then journal immediately before invoking each forward or compensat...; prevent=add adversarial removal and shift fixtures in both runtimes and require identity verification at every setter boundary
- Python bytecode validation: fix=Set PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache for py_compile and Python-spawning Node fixtures; prevent=Always isolate Python bytecode cache under /tmp for offline validation in the managed workspace
- same-fingerprint transaction receiver isolation: fix=capture the exact preflight receiver once and pin all forward and compensation setters to it; reserve fresh index resolution for readback...; prevent=test identity collisions where name, count, property shape, and requested values partially overlap; never use a non-unique fingerprint to...
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 2
- code.md#Session Scene Tempo And Time-Signature Overrides: - **Created:** 2026-08-20 - **Updated:** 2026-08-20 - **Iterations:** 3 - **Task:** ableton-session-scene-tempo-signature-20260820 - **Role:** developer - **Paths:** src/scene-tempo-signature-tools.js, bridge/development/scene-tempo-sign...
- docs.md#Session Scene Override Contract Documentation: - **Created:** 2026-08-20 - **Updated:** 2026-08-20 - **Iterations:** 1 - **Task:** ableton-session-scene-tempo-signature-20260820 - **Role:** developer - **Paths:** README.md, docs/ableton-bridge-contract.md, docs/ableton-python-remote-...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: not recorded
- Required fields: none
- Contract result: not evaluated

## Flow-specific required context
- changed behavior
- commands run
- qa plan
- test evidence
