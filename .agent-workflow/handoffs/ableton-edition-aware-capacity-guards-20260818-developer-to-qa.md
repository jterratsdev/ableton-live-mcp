# Handoff ableton-edition-aware-capacity-guards-20260818: developer to qa

## Task Context
- Title: Add Lite Standard Suite capability and capacity guards
- Goal: Make MCP track creation and duplication edition-aware so Live Lite capacity is reported and rejected before mutation while Standard, Suite, and unknown editions remain accurately represented.
- Current owner: developer
- Current status: pending

## Acceptance Criteria
- The output of python3 test/live_edition_capabilities_test.py contains live edition capacity tests ok, its exit code equals 0, and assertions compare Lite=8, Intro=16, Standard=unlimited, Suite=unlimited, source date, and unknown-path output.
- DevelopmentAbletonAdapter.getStatus returns edition provenance and audio/MIDI current, maximum, and remaining fields equal to the configured fixture or null for unknown values.
- Create and duplicate at a verified finite cap return HTTP 409 with errorCode edition_track_capacity_reached, and serialized tracks before and after are equal.
- Duplicate with eight-track Standard, Suite, and unknown fixtures returns nine tracks, while a rejecting Suite host returns status 500 and unchanged track names.
- Focused Python and Node commands, py_compile, npm test, and git diff --check return exit code 0, and npm output contains deterministic test suite ok.

## Scope And Paths
- ableton_remote_scripts/AbletonMcpBridge
- bridge
- src
- test
- docs

## Phase Handoff
- Status: ready_for_review
- Changed components: Files: ableton_remote_scripts/AbletonMcpBridge/live_editions.py; ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py; ableton_remote_scripts/AbletonMcpBridge/http_bridge.py; ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py; bridge/development/edition-capabilities.js; bridge/development/default-state.js; bridge/development/track-operations.js; bridge/development-adapter.js; bridge/errors.js; bridge/http-server.js; test/live_edition_capabilities_test.py; test/edition-capacity.mjs; test/live_track_operations_test.py; test/remote-script-static.mjs; test/deterministic.mjs; docs/ableton-editions.md; docs/ableton-python-remote-script.md; docs/ableton-bridge-contract.md; README.md. Traceability: AC1 live_editions.py + Python test + edition docs; AC2 adapter status + Node test; AC3 capability modules + before/after HTTP test; AC4 Node edition fixtures + Python Suite host rejection; AC5 deterministic registry + docs.
- Behavior changed: GET /status now returns edition provenance and capacity. Lite=8 and Intro=16 reject create/duplicate before mutation with structured 409. Standard, Suite, and unknown have no artificial cap. ResearchReport: official Ableton comparison verified 2026-08-18; LOM Application has no edition property, so exact installation-path provenance and unknown fallback are used. Simplicity review: one pure module per runtime; no dependency, new endpoint, speculative abstraction, unrelated cleanup, or scope expansion. Real Suite GET /status explicitly deferred until install/restart.
- Unit tests: Goal-to-verification map: AC1 python3 test/live_edition_capabilities_test.py; AC2/AC3 node test/edition-capacity.mjs with actual local HTTP and unchanged state; AC4 Node Standard/Suite/unknown fixtures plus Python Suite host 500 unchanged names; AC5 py_compile, npm test, git diff --check. No active Ableton call.
- Commands run: python3 test/live_edition_capabilities_test.py => 0; node test/edition-capacity.mjs => 0; python3 test/live_track_operations_test.py => 0; python3 -m py_compile changed modules => 0; npm test => 0 deterministic test suite ok; git diff --check => 0. Required context acknowledgement: AGENTS.md, task/criteria, architecture/research, shared worktree and dual Lite/Suite installation inspected. Consumed context files: AGENTS.md; production bridge modules; development adapter/state/operations; tests; docs.
- Known gaps: none
- Risks: none
- Recommended Playwright coverage: not applicable
- Executor provenance: not recorded

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 2
- AUTONOMOUS_RUN_FAILED: fix=Verified by command evidence: Parent takeover: full deterministic acceptance suite passed, including parameter, inventory, mastering, req...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- arrangement-multi-delete: fix=require callable Song.undo, undo once per completed deletion, and verify the complete observable Arrangement fingerprint; prevent=design rollback and readback before implementing multi-step destructive Live operations
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 4
- code.md#SSD5 Plugin Output Routing Runtime: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer - **Paths:** src/plugin-output-routing-tools.js, bridge/development/plugin-output-routin...
- code.md#Arrangement Clip Deletion Undo Compensation: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-arrangement-clip-delete-20260817 - **Role:** developer - **Paths:** ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py, test/live...
- code.md#Ableton Snapshot Rollback: - **Created:** 2026-07-20 - **Updated:** 2026-07-20 - **Iterations:** 1 - **Task:** ableton-product-snapshot-rollback-20260720 - **Role:** developer ### Key decisions - Move deterministic development snapshot and rollback behavior into `...
- code.md#GitHub Issues 1-5 Contract Fixes: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-fix-gh-issues-1-5-20260817 - **Role:** developer ### Key decisions - Declare raw device parameter values as numeric and preserve falsy numeric va...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: not recorded
- Required fields: none
- Contract result: not evaluated

## Required context acknowledgement

Complete: `AGENTS.md`, task criteria, architect decision/review, official research evidence, dirty worktree, and dual Lite/Suite installation were inspected.

## Consumed context files

- `AGENTS.md`
- `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`
- `ableton_remote_scripts/AbletonMcpBridge/http_bridge.py`
- `ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py`
- `bridge/development-adapter.js`
- `bridge/development/default-state.js`
- `bridge/development/track-operations.js`
- `bridge/errors.js`
- `bridge/http-server.js`
- `test/edition-capacity.mjs`
- `test/live_edition_capabilities_test.py`
- `docs/ableton-editions.md`

## Changed files

`ableton_remote_scripts/AbletonMcpBridge/live_editions.py`, `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, `ableton_remote_scripts/AbletonMcpBridge/http_bridge.py`, `ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py`, `bridge/development/edition-capabilities.js`, `bridge/development/default-state.js`, `bridge/development/track-operations.js`, `bridge/development-adapter.js`, `bridge/errors.js`, `bridge/http-server.js`, `test/live_edition_capabilities_test.py`, `test/edition-capacity.mjs`, `test/live_track_operations_test.py`, `test/remote-script-static.mjs`, `test/deterministic.mjs`, `docs/ableton-editions.md`, `docs/ableton-python-remote-script.md`, `docs/ableton-bridge-contract.md`, and `README.md`.

## Changed-file traceability

- AC1 → `ableton_remote_scripts/AbletonMcpBridge/live_editions.py`, `test/live_edition_capabilities_test.py`, `docs/ableton-editions.md`.
- AC2 → `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, `bridge/development-adapter.js`, `test/edition-capacity.mjs`.
- AC3 → `ableton_remote_scripts/AbletonMcpBridge/live_editions.py`, `bridge/development/edition-capabilities.js`, `test/edition-capacity.mjs`.
- AC4 → `test/edition-capacity.mjs`, `test/live_track_operations_test.py`.
- AC5 → `test/deterministic.mjs`, `docs/ableton-editions.md` and the listed commands.

## Simplicity review

Surgical diff: one pure capability module per runtime; no dependency, endpoint, generalized entitlement framework, speculative abstraction, unrelated cleanup, or scope expansion.

## Goal-to-verification map

- AC1: `python3 test/live_edition_capabilities_test.py` exits 0.
- AC2/AC3: `node test/edition-capacity.mjs` exercises actual localhost HTTP and proves unchanged state.
- AC4: the Node edition fixtures plus `python3 test/live_track_operations_test.py` distinguish a Suite host rejection.
- AC5: py_compile, `npm test`, and `git diff --check` exit 0.
- Deferred validation: real Suite `GET /status` after Remote Script install/restart; no active Set mutation.

## researchReport

Official Ableton comparison verified 2026-08-18: Lite 8, Intro 16, Standard Unlimited, Suite Unlimited audio/MIDI tracks. Official LOM Application reference exposes no edition property; exact installation-path provenance and explicit unknown fallback are required.

## Flow-specific required context
- changed behavior
- commands run
- qa plan
- test evidence
