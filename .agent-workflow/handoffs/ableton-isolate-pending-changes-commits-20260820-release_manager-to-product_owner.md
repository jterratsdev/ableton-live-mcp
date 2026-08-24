# Handoff ableton-isolate-pending-changes-commits-20260820: release_manager to product_owner

## Task Context
- Title: Isolate accumulated Ableton MCP changes into coherent commits
- Goal: Audit the shared dirty worktree, map product changes to completed task evidence, create coherent non-overlapping local commits for verified changes, and report every intentionally uncommitted item without pushing, tagging, publishing, installing, or touching Live.
- Current owner: release_manager
- Current status: pending

## Acceptance Criteria
- Every tracked and untracked worktree path is classified as a verified feature/fix, workflow evidence, disposable/local artifact, ambiguous user change, or unrelated deferred work before staging.
- Commits are organized by coherent reviewed feature boundaries and contain only files or hunks traceable to their task handoffs and test evidence; ambiguous files and disposable Ableton Sets remain uncommitted and unmodified.
- The deletion of live_project.py, the untracked qa path, test Project directory, generated workflow artifacts, and overlapping shared entrypoint hunks receive explicit disposition evidence before any related staging.
- Relevant focused tests and the full deterministic npm suite pass against the final committed tree, and git diff --check plus package-content checks report no release-blocking defect.
- The handoff lists created commit hashes/messages, exact included task scopes, tests, and the complete remaining git status; it performs no push, tag, npm publish, version bump, Remote Script installation, Ableton restart, or Live Set mutation.
- After commits and validation, the exact committed Remote Script source is installed into Ableton Live Suite using the project installer or an equivalent recoverable replacement, the prior installed directory is backed up, and a recursive source-to-installed comparison reports no difference; Ableton is not restarted and no bridge or Set call is made.

## Scope And Paths
- src
- bridge
- ableton_remote_scripts
- docs
- test
- README.md
- .generated-prompts
- .agent-workflow

## Phase Handoff
- Status: ready_for_review
- Changed components: Created local commit b47fa41 (feat: harden capability-aware Live operations) containing 66 provenance-backed product files across reviewed adjacent scopes. Preserved all workflow/generated/local/ambiguous artifacts. Installed the exact committed Remote Script into Ableton Live 12 Suite with backup at Contents/App-Resources/AbletonMcpBridge Backups/AbletonMcpBridge-before-b47fa41-20260820.
- Behavior changed: Capability-aware tool exposure, safe Arrangement insertion/deletion rollback, edition guards, proxy-safe duplicate handling, Session Scene tempo/signature overrides, and unsupported save removal are now in local history and installed source. No Ableton restart occurred, so the running Live process has not reloaded the replacement. No bridge or Set call occurred.
- Unit tests: Focused Node/Python contract matrix passed; npm test passed all deterministic suites; package release check and npm pack dry-run passed; diff checks passed; recursive source-to-installed diff produced no output.
- Commands run: git diff/status/show/add/commit; focused node/python tests; npm test; npm run check:package; npm pack --dry-run --json; diff -qr source installed; Orchestra evidence/review commands. No push/tag/publish/version bump/restart/bridge call.
- Known gaps: none
- Risks: none
- Recommended Playwright coverage: not applicable
- Executor provenance: not recorded

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 3
- same-fingerprint transaction receiver isolation: fix=capture the exact preflight receiver once and pin all forward and compensation setters to it; reserve fresh index resolution for readback...; prevent=test identity collisions where name, count, property shape, and requested values partially overlap; never use a non-unique fingerprint to...
- atomic Scene transaction target isolation: fix=resolve once, observe and compare the original structural fingerprint, then journal immediately before invoking each forward or compensat...; prevent=add adversarial removal and shift fixtures in both runtimes and require identity verification at every setter boundary
- arrangement-multi-delete: fix=require callable Song.undo, undo once per completed deletion, and verify the complete observable Arrangement fingerprint; prevent=design rollback and readback before implementing multi-step destructive Live operations
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 2
- tests.md#Arrangement Insertion Contract Tests: - **Created:** 2026-08-18 - **Updated:** 2026-08-18 - **Iterations:** 2 - **Task:** ableton-version-gated-arrangement-insertion-20260818 - **Role:** qa - **Paths:** test/live_arrangement_insert_test.py, test/arrangement-insertion.mjs, te...
- tests.md#Ableton Bridge Smoke Evidence Report: - **Created:** 2026-07-16 - **Updated:** 2026-07-16 - **Iterations:** 1 - **Task:** ableton-bridge-real-smoke-20260716 - **Role:** qa ### Key decisions - Add `test/bridge-smoke-report.mjs` as an explicit QA evidence command separate from...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: not recorded
- Required fields: none
- Contract result: not evaluated

## Flow-specific required context
- none
