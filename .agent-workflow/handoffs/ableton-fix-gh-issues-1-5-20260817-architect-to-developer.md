# Handoff ableton-fix-gh-issues-1-5-20260817: architect to developer

## Task Context
- Title: Fix GitHub issues 1 through 5
- Goal: not specified
- Current owner: architect
- Current status: pending

## Acceptance Criteria
- A schema assertion verifies ableton_set_device_parameter declares value as a number, and MCP dispatch tests verify value 0 and -1 reach the bridge unchanged.
- Preset-intent tests verify unavailable catalog entries are not returned as actionable matches, available matches are backed by bridge inventory, and a drum-kit intent does not rank unrelated piano or orchestral entries.
- Mastering tests verify VST and AU entries use the same browser resolution contract as individual master-device loading, every chain entry is resolved before replace_all mutates the master chain, and incomplete chains return an error rather than ok true.
- HTTP bridge tests verify a realistic MIDI clip request larger than 65536 bytes succeeds within the documented new limit, oversized requests report both maximum and observed byte counts, and the MIDI notes schema exposes a deterministic maximum item count.
- Running node test/contracts.mjs and npm test exits successfully after assertions compare parameter writes, realistic-scale clip contents, mastering chain order and completeness, and inventory-backed preset recommendations.

## Scope And Paths
- src/tools.js
- bridge/presets
- bridge/http-server.js
- ableton_remote_scripts/AbletonMcpBridge/http_bridge.py
- ableton_remote_scripts/AbletonMcpBridge/live_mastering.py
- ableton_remote_scripts/AbletonMcpBridge/live_devices.py
- ableton_remote_scripts/AbletonMcpBridge/live_browser.py
- test
- package.json
- docs

## Phase Handoff
- Status: ready_for_review
- Changed components: Technical tasking, design decisions, and size estimation Consumed context files: workflow task context and product handoff. Architecture decision: preserve existing workflow boundaries and route model selection through the shared sizing policy. Data flow: estimate -> phase routing -> provider executor -> append-only routing provenance. Risks: runtime model switching and provider capability checks remain owned by the runtime checkpoint work. Owned implementation-proof deferral: Developer must verify the selected route with a focused workflow E2E and report the exact command and result. Rationale: implementation files are owned by Developer and do not exist during architecture. Handoff notes: architecture is substantive and the implementation proof has an explicit owner and verification target.
- Behavior changed: Technical tasking, design decisions, and size estimation
- Unit tests: See phase task evidence
- Commands run: See phase task evidence
- Known gaps: All required transition checks were explicitly assessed.
- Risks: risks: Mastering-chain tests must use fakes or the development adapter because applying replace_all against an active Set is destructive; request-size changes must retain a finite DoS guard; preset availability checks must not turn dry-run behavior into false installation claims.; splitDecision: technical split recommended or explicit accepted-risk decision required: broad path count (10); technicalRisks: Mastering-chain tests must use fakes or the development adapter because applying replace_all against an active Set is destructive; request-size changes must retain a finite DoS guard; preset availability checks must not turn dry-run behavior into false installation claims.
- Recommended Playwright coverage: not applicable
- Executor provenance: mode=single-agent; executor=parent-agent; role=architect; phase=architect; runtime=codex-cli; session=ableton-fix-gh-issues-1-5-20260817:wfrun-1786994547855-1b6422:architect:codex-cli; fallback=workflow phase execution mode is single-agent; directProviderApiAllowed=false

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 1
- AUTONOMOUS_RUN_FAILED: fix=Verified by command evidence: Parent takeover: full deterministic acceptance suite passed, including parameter, inventory, mastering, req...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 4
- code.md#GitHub Issues 1-5 Contract Fixes: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-fix-gh-issues-1-5-20260817 - **Role:** developer ### Key decisions - Declare raw device parameter values as numeric and preserve falsy numeric va...
- docs.md#Bridge Limits And Live Contract Runbook: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-fix-gh-issues-1-5-20260817 - **Role:** developer ### Key decisions - Document the 1 MiB HTTP request ceiling and 8,192-note schema bound alongsid...
- docs.md#docs/ableton-bridge-contract.md: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-fix-gh-issues-1-5-20260817 - **Role:** developer - **Paths:** docs/ableton-bridge-contract.md ### Key decisions - Prompt registry update recorded...
- docs.md#docs/live-smoke-suite.md: - **Created:** 2026-08-17 - **Updated:** 2026-08-17 - **Iterations:** 1 - **Task:** ableton-fix-gh-issues-1-5-20260817 - **Role:** developer - **Paths:** docs/live-smoke-suite.md ### Key decisions - Prompt registry update recorded. ### E...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: architect (architect) -> developer (developer)
- Required fields: decision, tradeoffs, risks, scopeAssessment, affectedBoundaries, splitDecision, technicalRisks, realProductProof
- Contract result: evaluated

## Required Handoff Field Coverage
- decision: covered - Use incremental implementation
- tradeoffs: covered - Mastering-chain tests must use fakes or the development adapter because applying replace_all against an active Set is destructive; request-size changes must retain a finite DoS guard; preset availability checks must not turn dry-run behavior into false installation claims.
- risks: covered - Mastering-chain tests must use fakes or the development adapter because applying replace_all against an active Set is destructive; request-size changes must retain a finite DoS guard; preset availability checks must not turn dry-run behavior into false installation claims.
- scopeAssessment: covered - technical scope requires split review: broad path count (10)
- affectedBoundaries: covered - src, bridge, ableton_remote_scripts, test, package.json, docs
- splitDecision: covered - technical split recommended or explicit accepted-risk decision required: broad path count (10)
- technicalRisks: covered - Mastering-chain tests must use fakes or the development adapter because applying replace_all against an active Set is destructive; request-size changes must retain a finite DoS guard; preset availability checks must not turn dry-run behavior into false installation claims.
- realProductProof: covered - architect->developer (architect->developer) ableton-fix-gh-issues-1-5-20260817: architecture/security substance recorded with owned implementation evidence deferral.

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
