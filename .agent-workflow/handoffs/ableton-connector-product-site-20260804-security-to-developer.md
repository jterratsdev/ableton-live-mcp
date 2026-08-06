# Handoff ableton-connector-product-site-20260804: security to developer

## Task Context
- Title: Build Ableton Live MCP product site
- Goal: Create, deploy, and route a polished product site for the open-source Ableton Live MCP connector that matches jterrats.dev while remaining isolated from the npm package runtime.
- Current owner: developer
- Current status: pending

## Acceptance Criteria
- Opening the deployed custom HTTPS hostname at desktop and mobile widths shows the Ableton Live MCP product name, open-source status, installation commands, architecture, verified capabilities, safety model, limitations, and GitHub call to action without overlap or horizontal overflow.
- Running the site validation command exits 0 after checking required content, internal anchors, external HTTPS links, image assets, accessible landmarks, and metadata.
- Running npm test and npm pack --dry-run exits 0 and confirms the product site does not alter the published MCP package contents.
- Playwright screenshots at desktop and mobile widths show a visual system consistent with jterrats.dev and no blank, clipped, or overlapping content.
- Cloudflare MCP responses and public HTTPS checks report a successful Pages deployment and active DNS for the selected jterrats.dev hostname.

## Scope And Paths
- site
- README.md
- package.json
- test

## Phase Handoff
- Status: ready_for_review
- Changed components: Security, privacy, tenant isolation, abuse-case, and data protection review
- Behavior changed: Security, privacy, tenant isolation, abuse-case, and data protection review
- Unit tests: See phase task evidence
- Commands run: See phase task evidence
- Known gaps: Role contract generic-advisory warn: missing Handoff notes
- Risks: risk: Reviewed: no risk findings were recorded by this phase.
- Recommended Playwright coverage: not applicable
- Executor provenance: mode=single-agent; executor=parent-agent; role=security; phase=security; runtime=codex-cli; fallback=workflow phase execution mode is single-agent; directProviderApiAllowed=false

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 0
- none
- Lessons applied: none available
- Prompt registry entries consulted: 5
- code.md#Ableton Installer Doctor CLI: - **Created:** 2026-07-20 - **Updated:** 2026-07-20 - **Iterations:** 1 - **Task:** ableton-product-installer-doctor-20260720 - **Role:** developer ### Key decisions - Add `src/doctor.js` as a read-only CLI and importable diagnostic surf...
- tests.md#Ableton Remote Script Static Test: - **Created:** 2026-07-16 - **Updated:** 2026-07-16 - **Iterations:** 1 - **Task:** ableton-real-python-adapter-20260716 - **Role:** developer ### Key decisions - Add `test/remote-script-static.mjs` to validate the Remote Script package ...
- code.md#Ableton Python Remote Script Adapter: - **Created:** 2026-07-16 - **Updated:** 2026-07-16 - **Iterations:** 1 - **Task:** ableton-real-python-adapter-20260716 - **Role:** developer ### Key decisions - Add `ableton_remote_scripts/AbletonMcpBridge` as an installable Ableton MI...
- code.md#Ableton Snapshot Rollback: - **Created:** 2026-07-20 - **Updated:** 2026-07-20 - **Iterations:** 1 - **Task:** ableton-product-snapshot-rollback-20260720 - **Role:** developer ### Key decisions - Move deterministic development snapshot and rollback behavior into `...
- services.md#Minimal Ableton Bridge Contract Implementation: - **Created:** 2026-07-16 - **Updated:** 2026-07-16 - **Iterations:** 1 - **Task:** ableton-bridge-minimal-20260716 - **Role:** developer ### Key decisions - Implement the initial bridge contract as a local HTTP service backed by a deter...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: security (security) -> developer (developer)
- Required fields: risk, finding, recommendation, realProductProof
- Contract result: evaluated

## Required Handoff Field Coverage
- risk: covered - Reviewed: no risk findings were recorded by this phase.
- finding: covered - security output is ready for the next phase.
- recommendation: covered - security output is ready for the next phase.
- realProductProof: covered - security->developer (security->developer) ableton-connector-product-site-20260804: real product evidence event recorded.

## Role Quality Contract
- Contract: generic-advisory
- Validation mode: advisory
- Result: warn
- Transition allowed: true
- Allowed transitions: *
- Return to phase: not required
- Human approval required: false

## Role Contract Requirement Coverage
- Handoff notes: gap - Gap: Handoff notes missing.

## Flow-specific required context
- none
