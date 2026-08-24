# Handoff ableton-session-scene-tempo-signature-20260820: architect to developer

## Task Context
- Title: Control tempo and time signature per Session scene
- Goal: Expose capability-gated MCP operations for reading and safely setting or clearing per-scene tempo and time-signature overrides in Ableton Session View, without claiming Arrangement timeline automation.
- Current owner: product_owner
- Current status: pending

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
- Changed components: Recorded accepted m/5 sizing and ADR for two capability-gated Scene tempo/signature routes; defined focused MCP, development, and Python Live modules plus exact response, error, probe, transaction, rollback, and parity contracts in the runtime handoff.
- Behavior changed: Resolve only exact zero-based song.scenes[sceneIndex]. Read capabilities without setters. Validate complete tagged request before writes. Set tempo value then enable, then signature numerator, denominator, enable; clear only enable. Journal before setters, reacquire fresh proxies, verify exact raw/normalized readback, and reverse-compensate with full observable pre-state verification. Never launch or touch Song/Arrangement state.
- Unit tests: Developer and QA must add focused Node/Python fake-Live and MCP-to-HTTP fixtures for property matrices, strict validation, duplicate names, ordering, idempotency, sentinels, recreated proxies, mid-write and rollback failures, handshake fail-closed, route/tool parity, py_compile, npm test, and git diff --check. No active bridge.
- Commands run: See .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787185194034-63cc7d-architect-architect-runtime-handoff.md for exact commands. Architect ran Orchestra preflight/validation, targeted read-only inspection, decisions/evidence/review, workflow artifact diff-check; Mermaid lint was attempted but mmdc is absent.
- Known gaps: none
- Risks: none
- Recommended Playwright coverage: not applicable
- Executor provenance: not recorded

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 3
- AUTONOMOUS_RUN_FAILED: fix=Verified by file evidence: Recovery PO handoff preserved and revalidated the already user-approved AC1-AC6 capability contract without ma...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- arrangement-multi-delete: fix=require callable Song.undo, undo once per completed deletion, and verify the complete observable Arrangement fingerprint; prevent=design rollback and readback before implementing multi-step destructive Live operations
- AUTONOMOUS_RUN_FAILED: fix=Verified by command evidence: Parent takeover: full deterministic acceptance suite passed, including parameter, inventory, mastering, req...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 2
- tests.md#Arrangement Insertion Contract Tests: - **Created:** 2026-08-18 - **Updated:** 2026-08-18 - **Iterations:** 2 - **Task:** ableton-version-gated-arrangement-insertion-20260818 - **Role:** qa - **Paths:** test/live_arrangement_insert_test.py, test/arrangement-insertion.mjs, te...
- code.md#Ableton Python Remote Script Adapter: - **Created:** 2026-07-16 - **Updated:** 2026-07-16 - **Iterations:** 1 - **Task:** ableton-real-python-adapter-20260716 - **Role:** developer ### Key decisions - Add `ableton_remote_scripts/AbletonMcpBridge` as an installable Ableton MI...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: not recorded
- Required fields: none
- Contract result: not evaluated

## Flow-specific required context
- architecture decision
- scope
- code diff
- unit test results
