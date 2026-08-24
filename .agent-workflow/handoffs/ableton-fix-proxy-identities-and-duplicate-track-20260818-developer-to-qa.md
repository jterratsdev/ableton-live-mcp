# Handoff ableton-fix-proxy-identities-and-duplicate-track-20260818: developer to qa

## Task Context
- Title: Fix stable Arrangement deletion and exact track duplication
- Goal: Eliminate ephemeral Python proxy identity from Arrangement deletion and wrong-target track duplication, with fail-closed verification locally and in the user-authorized current Set.
- Current owner: developer
- Current status: pending

## Acceptance Criteria
- Three unchanged Arrangement deletion plans over freshly recreated Live proxies return identical observable track identities, clip identities, and plan tokens.
- Exact Arrangement deletion resolves freshly recreated proxies, proves each requested clip is absent after deletion, rejects observable stale changes before mutation, and reports no-op or rollback failures without claiming success.
- Duplicating a nonzero source track selects only sourceIndex plus one, preserves the source and all other track names, verifies the requested destination name by readback, and rolls back on post-mutation failure when Song undo is callable.
- Focused recreated-proxy and no-op tests plus the complete deterministic npm suite pass without contacting the active Ableton bridge.
- After installation and restart, the current user-authorized Set produces three stable read-only deletion plans and an exact nonzero duplicate-track result; any real clip deletion requires a separately confirmed exact candidate and complete before-after readback.

## Scope And Paths
- ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py
- ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py
- test
- docs

## Phase Handoff
- Status: ready_for_review
- Changed components: Changed files: ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py; ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py; bridge/development/arrangement-clip-delete.js; test/live_arrangement_delete_test.py; test/live_track_operations_test.py; test/live-track-operations.mjs; test/arrangement-clip-delete.mjs; test/deterministic.mjs; docs/ableton-bridge-contract.md; docs/ableton-python-remote-script.md. Changed-file traceability: Arrangement module and parity implement AC1/AC2; track operations implements AC3; focused tests and registry implement AC1-AC4; docs/install evidence supports AC5. Simplicity review: surgical existing-module correction, no endpoint/dependency/speculative abstraction/unrelated cleanup.
- Behavior changed: Required context acknowledgement: complete. Consumed context files: AGENTS.md, Orchestra task/plan/protocol/workflow/architect artifacts, both production modules, parity adapter, focused/deterministic tests, contracts, installer, and real bridge responses. Object identity is removed; deletion requires immediate complete absence readback; duplicate is exact sourceIndex+1 with bounded fingerprint-verified undo. Goal-to-verification map: AC1 three stable fresh-proxy plans; AC2 exact/no-op/stale tests; AC3 nonzero exact duplicate and rollback tests; AC4 focused/full green; AC5 installed hashes and real old-runtime reproduction, post-restart deferred to user/QA.
- Unit tests: Focused Python and Node suites, py_compile, git diff --check, and full npm test exit 0. Real product proof: source/installed hashes match and three read-only current-Set plans reproduced old loaded tokens 0ac293..., 8dcaef..., 97bd72... without mutation. Accepted deferral owner=user: restart must preserve/explicitly handle unsaved baseline; QA then runs three plans, duplicate, and candidate-gated deletion.
- Commands run: python3 test/live_arrangement_delete_test.py; python3 test/live_track_operations_test.py; node test/arrangement-clip-delete.mjs; node test/live-track-operations.mjs; python3 -m py_compile; npm test; git diff --check; shasum source and installed modules; curl GET /arrangement/clips/delete-plan x3
- Known gaps: none
- Risks: none
- Recommended Playwright coverage: not applicable
- Executor provenance: not recorded

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 2
- arrangement-multi-delete: fix=require callable Song.undo, undo once per completed deletion, and verify the complete observable Arrangement fingerprint; prevent=design rollback and readback before implementing multi-step destructive Live operations
- AUTONOMOUS_RUN_FAILED: fix=Verified by command evidence: Parent takeover: full deterministic acceptance suite passed, including parameter, inventory, mastering, req...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 4
- code.md#Arrangement Clip Deletion Undo Compensation: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-arrangement-clip-delete-20260817 - **Role:** developer - **Paths:** ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py, test/live...
- code.md#SSD5 Plugin Output Routing Runtime: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer - **Paths:** src/plugin-output-routing-tools.js, bridge/development/plugin-output-routin...
- docs.md#SSD5 Multi-Output Routing Guide And Contracts: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer - **Paths:** docs/ssd5-multi-output.md, docs/ableton-bridge-contract.md, docs/ableton-py...
- services.md#SSD5 Plugin Output Routing Service: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer ### Key decisions - Expose `GET /routing/plugin-outputs/plan` as read-only and `POST /ro...
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
