# Gate Review: po→architect

- Run: wfrun-1787519127542-f884c8
- Task: ableton-session-scene-tempo-signature-20260820
- Transition: po → architect
- From role: product_owner
- To role: architect

## Task Context
- Title: Control tempo and time signature per Session scene
- Goal: Expose capability-gated MCP operations for reading and safely setting or clearing per-scene tempo and time-signature overrides in Ableton Session View, without claiming Arrangement timeline automation.

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

## Checklist
- [ ] Backlog refinement, story sizing, and acceptance criteria
- [ ] Acceptance criteria are specific and traceable to the task goal
- [ ] Required evidence is clear for the next phase
- [ ] No open blockers

## Approval
Approve: orchestra workflow run --task ableton-session-scene-tempo-signature-20260820 --resume wfrun-1787519127542-f884c8
