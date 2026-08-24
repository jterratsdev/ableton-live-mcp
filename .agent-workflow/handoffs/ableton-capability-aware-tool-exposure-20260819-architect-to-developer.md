# Handoff ableton-capability-aware-tool-exposure-20260819: architect to developer

## Task Context
- Title: Expose only truthful Ableton MCP capabilities
- Goal: Make MCP tool discovery and workflow guidance accurately reflect the active bridge, hiding hard-unsupported Live actions while preserving MCP-owned local capabilities and explicitly labeling conditional behavior.
- Current owner: product_owner
- Current status: pending

## Acceptance Criteria
- A Remote Script capability response reports the active bridge mode and a support status plus reason for every mapped HTTP route, and its route set is checked against the Node registry.
- When tools/list runs against a Remote Script capability fixture, tools backed only by unsupported routes are absent while MCP-owned local MIDI import, rendered-file analysis, diagnostics, risk tools, and supported routes remain present.
- When tools/list runs against the deterministic development bridge, development-supported render, bounce, automation, reorder, consolidation, and mastering tools remain present; an unavailable or malformed capability handshake produces a conservative deterministic list without claiming unsupported Live writes.
- Conditional tools remain discoverable only with explicit capability language and target-level probes where available; snapshot, plugin inventory, plugin parameter, mastering target, meter, locator, and Arrangement descriptions state their observable limits.
- High-level workflow plans returned through MCP omit unsupported steps or mark them blocked with the exact capability reason, and no Remote Script workflow recommends render, bounce, automation, device reorder, or consolidation as executable.
- Focused Node and Python contract tests, registry parity/static checks, py_compile, npm test, and git diff --check exit 0 without contacting the active bridge or mutating a Live Set.

## Scope And Paths
- src
- bridge
- ableton_remote_scripts/AbletonMcpBridge
- docs
- test

## Phase Handoff
- Status: ready_for_review
- Changed components: Accepted capability-aware exposure architecture; detailed design artifact records normalized bridge handshake, route/tool source of truth, dynamic list and call guard, capability-aware workflows, cache/failure policy, module boundaries, implementation slices, and deterministic test matrix.
- Behavior changed: Developer must implement GET /capabilities in both bridges and use one normalized capability view to filter tools/list, block unsupported direct tools/call, label conditional tools, and block/omit unsupported workflow steps while retaining eligible MCP-local and deterministic-development capabilities.
- Unit tests: No implementation tests run in Architect phase. Developer/QA must use ephemeral Remote Script/development fixtures and assert route parity, exact tool sets, direct-call blocking, malformed/unreachable/stale fail-closed behavior, conditional wording/probes, workflow availability, py_compile, npm test, and git diff --check without active bridge contact.
- Commands run: Orchestra preflight/context/delegation/skills/protocol/workflow; read-only rg/sed/wc/jq inspection; doc-sync audit. No bridge, Ableton, build, test, install, restart, save, render, push, tag, or publish command.
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
- code.md#SSD5 Plugin Output Routing Runtime: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer - **Paths:** src/plugin-output-routing-tools.js, bridge/development/plugin-output-routin...
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
