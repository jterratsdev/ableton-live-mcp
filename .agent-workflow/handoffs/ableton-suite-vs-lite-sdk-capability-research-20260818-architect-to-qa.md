# Handoff ableton-suite-vs-lite-sdk-capability-research-20260818: architect to qa

## Task Context
- Title: Compare Live Suite and Lite MCP SDK capabilities
- Goal: Determine which MCP capabilities materially improve in Live Suite versus Lite and whether Suite exposes any supported save or other SDK operations absent in Lite.
- Current owner: architect
- Current status: pending

## Acceptance Criteria
- An official-source matrix returns observable Lite versus Suite differences for tracks, scenes, sends/returns, audio inputs/outputs, instruments, effects, Packs, and Max for Live, with source URLs and verification date.
- A source inspection of the official Live Object Model and installed Live 12 Suite resources returns whether save, save_as, Arrangement clip insertion, tempo-envelope writing, plugin parameters, and routing surfaces exist, and records exact symbols or explicit absence.
- The final report classifies every capability as edition entitlement, shared SDK surface, unsupported SDK surface, or unknown, and contains a specific recommendation for each current MCP limitation.
- All investigation is read-only, no active Set endpoint mutates state, and any real Suite check is limited to GET status or project diagnostics.

## Scope And Paths
- ableton_remote_scripts/AbletonMcpBridge
- docs
- test

## Phase Handoff
- Status: ready_for_review
- Changed components: Technical tasking, design decisions, and size estimation Consumed context files: workflow task context and product handoff. Architecture decision: preserve existing workflow boundaries and route model selection through the shared sizing policy. Data flow: estimate -> phase routing -> provider executor -> append-only routing provenance. Risks: runtime model switching and provider capability checks remain owned by the runtime checkpoint work. Owned implementation-proof deferral: Developer must verify the selected route with a focused workflow E2E and report the exact command and result. Rationale: implementation files are owned by Developer and do not exist during architecture. Handoff notes: architecture is substantive and the implementation proof has an explicit owner and verification target.
- Behavior changed: Technical tasking, design decisions, and size estimation
- Unit tests: See phase task evidence
- Commands run: See phase task evidence
- Known gaps: All required transition checks were explicitly assessed.
- Risks: risks: Reviewed: no risk findings were recorded by this phase.; splitDecision: technical split recommended or explicit accepted-risk decision required: cross-cutting technical keywords; technicalRisks: Reviewed: no risk findings were recorded by this phase.
- Recommended Playwright coverage: not applicable
- Executor provenance: mode=single-agent; executor=parent-agent; role=architect; phase=architect; runtime=codex-cli; session=ableton-suite-vs-lite-sdk-capability-research-20260818:wfrun-1787084161454-665db7:architect:codex-cli; fallback=workflow phase execution mode is single-agent; directProviderApiAllowed=false

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 2
- AUTONOMOUS_RUN_FAILED: fix=Verified by command evidence: Parent takeover: full deterministic acceptance suite passed, including parameter, inventory, mastering, req...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- arrangement-multi-delete: fix=require callable Song.undo, undo once per completed deletion, and verify the complete observable Arrangement fingerprint; prevent=design rollback and readback before implementing multi-step destructive Live operations
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 4
- code.md#Ableton Installer Doctor CLI: - **Created:** 2026-07-20 - **Updated:** 2026-07-20 - **Iterations:** 1 - **Task:** ableton-product-installer-doctor-20260720 - **Role:** developer ### Key decisions - Add `src/doctor.js` as a read-only CLI and importable diagnostic surf...
- code.md#Ableton Snapshot Rollback: - **Created:** 2026-07-20 - **Updated:** 2026-07-20 - **Iterations:** 1 - **Task:** ableton-product-snapshot-rollback-20260720 - **Role:** developer ### Key decisions - Move deterministic development snapshot and rollback behavior into `...
- code.md#SSD5 Plugin Output Routing Runtime: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 2 - **Task:** ableton-ssd-multi-output-workflow-20260817 - **Role:** developer - **Paths:** src/plugin-output-routing-tools.js, bridge/development/plugin-output-routin...
- code.md#Ableton Python Remote Script Adapter: - **Created:** 2026-07-16 - **Updated:** 2026-07-16 - **Iterations:** 1 - **Task:** ableton-real-python-adapter-20260716 - **Role:** developer ### Key decisions - Add `ableton_remote_scripts/AbletonMcpBridge` as an installable Ableton MI...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: architect (architect) -> qa (qa)
- Required fields: decision, tradeoffs, risks, scopeAssessment, affectedBoundaries, splitDecision, technicalRisks
- Contract result: evaluated

## Required Handoff Field Coverage
- decision: covered - Use incremental implementation
- tradeoffs: covered - Reviewed: no risk findings were recorded by this phase.
- risks: covered - Reviewed: no risk findings were recorded by this phase.
- scopeAssessment: covered - technical scope requires split review: cross-cutting technical keywords
- affectedBoundaries: covered - ableton_remote_scripts, docs, test
- splitDecision: covered - technical split recommended or explicit accepted-risk decision required: cross-cutting technical keywords
- technicalRisks: covered - Reviewed: no risk findings were recorded by this phase.

## Verifier Contracts
- suite-lite-capability-report: api; owner=qa; evidence=docs/ableton-suite-vs-lite-sdk.md and command/source evidence; required=true

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
- none
