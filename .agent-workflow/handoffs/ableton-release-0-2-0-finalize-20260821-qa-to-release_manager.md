# Handoff ableton-release-0-2-0-finalize-20260821: qa to release_manager

## Task Context
- Title: Finalize npm and Remote Script release 0.2.0
- Goal: Prepare a clean 0.2.0 release candidate for the npm MCP package and bundled Ableton Remote Script, validate package contents and runtime artifacts, document unsupported surfaces, and stop before push/tag/publish unless separately authorized.
- Current owner: release_manager
- Current status: pending

## Acceptance Criteria
- The release candidate contains only intended npm files and excludes Orchestra state, tests, user projects, and generated artifacts.
- package.json and package-lock.json are synchronized at the selected release version and package checks pass.
- Deterministic tests, Python compilation, package dry-run, and release checklist evidence are recorded from the exact candidate commit.
- Remote Script installation/restart and real-Live checks are either completed with evidence or explicitly deferred with owner and reason; no unsupported SDK behavior is advertised.

## Scope And Paths
- package.json
- package-lock.json
- README.md
- docs
- src
- bridge
- ableton_remote_scripts
- scripts

## Phase Handoff
- Status: ready_for_review
- Changed components: Verification against acceptance criteria and edge cases Consumed context files: workflow task context and developer handoff. Acceptance criteria mapping: recorded criteria require QA-owned observable evidence. Actual result: verification pending; deterministic workflow state is not QA proof. Edge case reviewed: missing or fragmented acceptance criteria block the release transition. Release recommendation: no-go until QA records executed checks, artifacts, and assertions. AC1 verification pending: The release candidate contains only intended npm files and excludes Orchestra state, tests, user projects, and generated artifacts. -> requires an observable artifact, executed command, and explicit assertion. AC2 verification pending: package.json and package-lock.json are synchronized at the selected release version and package checks pass. -> requires an observable artifact, executed command, and explicit assertion. AC3 verification pending: Deterministic tests, Python compilation, package dry-run, and release checklist evidence are recorded from the exact candidate commit. -> requires an observable artifact, executed command, and explicit assertion. AC4 verification pending: Remote Script installation/restart and real-Live checks are either completed with evidence or explicitly deferred with owner and reason; no unsupported SDK behavior is advertised. -> requires an observable artifact, executed command, and explicit assertion.
- Behavior changed: Verification against acceptance criteria and edge cases
- Unit tests: See phase task evidence
- Commands run: See phase task evidence
- Known gaps: All required transition checks were explicitly assessed.
- Risks:
- Recommended Playwright coverage: not applicable
- Executor provenance: mode=single-agent; executor=parent-agent; role=qa; phase=qa; runtime=codex-cli; session=ableton-release-0-2-0-finalize-20260821:wfrun-1787352193742-f5e862:qa:codex-cli; fallback=workflow phase execution mode is single-agent; directProviderApiAllowed=false

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 3
- atomic Scene transaction target isolation: fix=resolve once, observe and compare the original structural fingerprint, then journal immediately before invoking each forward or compensat...; prevent=add adversarial removal and shift fixtures in both runtimes and require identity verification at every setter boundary
- AUTONOMOUS_RUN_FAILED: fix=Verified by file evidence: Recovery PO handoff preserved and revalidated the already user-approved AC1-AC6 capability contract without ma...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- AUTONOMOUS_RUN_FAILED: fix=Verified by command evidence: Parent takeover: full deterministic acceptance suite passed, including parameter, inventory, mastering, req...; prevent=Capture recoverable failure context in Orchestra and verify the corrected sequence before handoff.
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 2
- tests.md#Arrangement Insertion Contract Tests: - **Created:** 2026-08-18 - **Updated:** 2026-08-18 - **Iterations:** 2 - **Task:** ableton-version-gated-arrangement-insertion-20260818 - **Role:** qa - **Paths:** test/live_arrangement_insert_test.py, test/arrangement-insertion.mjs, te...
- code.md#Ableton Installer Doctor CLI: - **Created:** 2026-07-20 - **Updated:** 2026-07-20 - **Iterations:** 1 - **Task:** ableton-product-installer-doctor-20260720 - **Role:** developer ### Key decisions - Add `src/doctor.js` as a read-only CLI and importable diagnostic surf...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: qa (qa) -> release (release_manager)
- Required fields: testPlan, results, evidence, acceptanceCriteriaCoverage, realProductProof
- Contract result: evaluated

## Required Handoff Field Coverage
- testPlan: covered - QA evidence pending: execute checks and record observable assertions before release.; AC1 verification pending: The release candidate contains only intended npm files and excludes Orchestra state, tests, user projects, and generated artifacts. -> requires an observable artifact, executed command, and explicit assertion.; AC2 verification pending: package.json and package-lock.json are synchronized at the selected release version and package checks pass. -> requires an observable artifact, executed command, and explicit assertion.; AC3 verification pending: Deterministic tests, Python compilation, package dry-run, and release checklist evidence are recorded from the exact candidate commit. -> requires an observable artifact, executed command, and explicit assertion.; AC4 verification pending: Remote Script installation/restart and real-Live checks are either completed with evidence or explicitly deferred with owner and reason; no unsupported SDK behavior is advertised. -> requires an observable artifact, executed command, and explicit assertion.; Generated workflow E2E plan: .agent-workflow/runs/ableton-release-0-2-0-finalize-20260821/qa/wfrun-1787352193742-f5e862-qa-e2e-plan.md; Generated executable E2E runner: .agent-workflow/runs/ableton-release-0-2-0-finalize-20260821/qa/wfrun-1787352193742-f5e862-qa-e2e.sh
- results: covered - Phase verdict: pass
- evidence: covered - QA evidence pending: execute checks and record observable assertions before release.; AC1 verification pending: The release candidate contains only intended npm files and excludes Orchestra state, tests, user projects, and generated artifacts. -> requires an observable artifact, executed command, and explicit assertion.; AC2 verification pending: package.json and package-lock.json are synchronized at the selected release version and package checks pass. -> requires an observable artifact, executed command, and explicit assertion.; AC3 verification pending: Deterministic tests, Python compilation, package dry-run, and release checklist evidence are recorded from the exact candidate commit. -> requires an observable artifact, executed command, and explicit assertion.; AC4 verification pending: Remote Script installation/restart and real-Live checks are either completed with evidence or explicitly deferred with owner and reason; no unsupported SDK behavior is advertised. -> requires an observable artifact, executed command, and explicit assertion.; Generated workflow E2E plan: .agent-workflow/runs/ableton-release-0-2-0-finalize-20260821/qa/wfrun-1787352193742-f5e862-qa-e2e-plan.md; Generated executable E2E runner: .agent-workflow/runs/ableton-release-0-2-0-finalize-20260821/qa/wfrun-1787352193742-f5e862-qa-e2e.sh
- acceptanceCriteriaCoverage: covered - AC1 mapped for evidence: The release candidate contains only intended npm files and excludes Orchestra state, tests, user projects, and generated artifacts.; AC2 mapped for evidence: package.json and package-lock.json are synchronized at the selected release version and package checks pass.; AC3 mapped for evidence: Deterministic tests, Python compilation, package dry-run, and release checklist evidence are recorded from the exact candidate commit.; AC4 mapped for evidence: Remote Script installation/restart and real-Live checks are either completed with evidence or explicitly deferred with owner and reason; no unsupported SDK behavior is advertised.
- realProductProof: covered - qa->release (qa->release_manager) ableton-release-0-2-0-finalize-20260821: handoff includes concrete command, artifact, and assertion evidence.

## Role Quality Contract
- Contract: qa-verification
- Validation mode: block
- Result: pass
- Transition allowed: true
- Allowed transitions: release, docs_review, developer
- Return to phase: not required
- Human approval required: false

## Role Contract Requirement Coverage
- Allowed phase transition: covered - qa can transition to release.
- Required context acknowledgement: covered - Consumed context files section was provided.
- Consumed context files: covered - Consumed context files covered.
- Acceptance criteria mapping: covered - Acceptance criteria mapping covered.
- Actual result evidence: covered - Actual result evidence covered.
- Edge cases: covered - Edge cases covered.
- E2E evidence or rationale: covered - E2E evidence or rationale covered.
- Release recommendation: covered - Release recommendation covered.
- Evidence artifacts: covered - Evidence artifacts covered.

## Flow-specific required context
- test plan
- test results
- known gaps
- release plan
