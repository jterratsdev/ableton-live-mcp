# Handoff ableton-edition-aware-capacity-guards-20260818: architect to developer

## Task Context
- Title: Add Lite Standard Suite capability and capacity guards
- Goal: Make MCP track creation and duplication edition-aware so Live Lite capacity is reported and rejected before mutation while Standard, Suite, and unknown editions remain accurately represented.
- Current owner: developer
- Current status: pending

## Acceptance Criteria
- An official-source-backed edition profile documents only verified Lite, Standard, and Suite limits relevant to MCP creation and duplication operations, with source date and unknown handling.
- The bridge status or diagnostics response reports detected edition provenance and observable audio/MIDI track capacity as current, maximum, and remaining when determinable, or explicit unknown values without guessing.
- Creating or duplicating a track at a verified edition limit fails before mutation with a structured capacity error that distinguishes edition limit from bridge or Live API failure; existing tracks and names remain unchanged.
- Standard, Suite, and unknown-edition fixtures receive no artificial Lite cap, while host-side creation failures remain fail-closed and accurately classified.
- Focused Remote Script and development-adapter tests plus the complete deterministic npm suite pass, and documentation explains edition detection, capacity guards, and limitations.

## Scope And Paths
- ableton_remote_scripts/AbletonMcpBridge
- bridge
- src
- test
- docs

## Phase Handoff
- Status: ready_for_review
- Changed components: Technical tasking, design decisions, and size estimation Consumed context files: workflow task context and product handoff. Architecture decision: preserve existing workflow boundaries and route model selection through the shared sizing policy. Data flow: estimate -> phase routing -> provider executor -> append-only routing provenance. Risks: runtime model switching and provider capability checks remain owned by the runtime checkpoint work. Owned implementation-proof deferral: Developer must verify the selected route with a focused workflow E2E and report the exact command and result. Rationale: implementation files are owned by Developer and do not exist during architecture. Handoff notes: architecture is substantive and the implementation proof has an explicit owner and verification target.
- Behavior changed: Technical tasking, design decisions, and size estimation
- Unit tests: See phase task evidence
- Commands run: See phase task evidence
- Known gaps: All required transition checks were explicitly assessed.
- Risks: risks: Hard-coded or inferred edition limits can become stale or wrongly restrict Standard/Suite; only official verified finite limits may block operations.; splitDecision: technical split recommended or explicit accepted-risk decision required: broad path count (5); multiple required roles (architect, developer, qa); technicalRisks: Hard-coded or inferred edition limits can become stale or wrongly restrict Standard/Suite; only official verified finite limits may block operations.
- Recommended Playwright coverage: not applicable
- Executor provenance: mode=single-agent; executor=parent-agent; role=architect; phase=architect; runtime=codex-cli; session=ableton-edition-aware-capacity-guards-20260818:wfrun-1787082981538-1d39f2:architect:codex-cli; fallback=workflow phase execution mode is single-agent; directProviderApiAllowed=false

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 2
- AUTONOMOUS_RUN_FAILED: fix=Verified by command evidence: Parent takeover: full deterministic acceptance suite passed, including parameter, inventory, mastering, req...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- arrangement-multi-delete: fix=require callable Song.undo, undo once per completed deletion, and verify the complete observable Arrangement fingerprint; prevent=design rollback and readback before implementing multi-step destructive Live operations
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 4
- tests.md#SSD5 Plugin Output Routing QA Evidence: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** qa - **Paths:** .agent-workflow/handoffs/ableton-ssd-multi-output-workflow-20260817-wfrun-17870020...
- code.md#SSD5 Plugin Output Routing Runtime: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer - **Paths:** src/plugin-output-routing-tools.js, bridge/development/plugin-output-routin...
- code.md#Arrangement Clip Deletion Undo Compensation: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-arrangement-clip-delete-20260817 - **Role:** developer - **Paths:** ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py, test/live...
- services.md#SSD5 Plugin Output Routing Service: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer ### Key decisions - Expose `GET /routing/plugin-outputs/plan` as read-only and `POST /ro...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: architect (architect) -> developer (developer)
- Required fields: decision, tradeoffs, risks, scopeAssessment, affectedBoundaries, splitDecision, technicalRisks
- Contract result: evaluated

## Required Handoff Field Coverage
- decision: covered - Use incremental implementation
- tradeoffs: covered - Hard-coded or inferred edition limits can become stale or wrongly restrict Standard/Suite; only official verified finite limits may block operations.
- risks: covered - Hard-coded or inferred edition limits can become stale or wrongly restrict Standard/Suite; only official verified finite limits may block operations.
- scopeAssessment: covered - technical scope requires split review: broad path count (5); multiple required roles (architect, developer, qa)
- affectedBoundaries: covered - ableton_remote_scripts, bridge, src, test, docs
- splitDecision: covered - technical split recommended or explicit accepted-risk decision required: broad path count (5); multiple required roles (architect, developer, qa)
- technicalRisks: covered - Hard-coded or inferred edition limits can become stale or wrongly restrict Standard/Suite; only official verified finite limits may block operations.

## Verifier Contracts
- edition-capacity-contract: api; owner=qa; evidence=Official source links, focused test output, and API before-after assertions; required=true

## Role Quality Contract
- Contract: generic-advisory
- Validation mode: advisory
- Result: pass
- Transition allowed: true
- Allowed transitions: *
- Return to phase: not required
- Human approval required: false

## Role Contract Requirement Coverage
- Handoff notes: covered - Handoff notes covered.

## Flow-specific required context
- architecture decision
- scope
- code diff
- unit test results
