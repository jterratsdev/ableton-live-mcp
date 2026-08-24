<!-- open-orchestra: prompt-registry-v1 -->
# Documentation Prompts

> Prompt register for ADRs, runbooks, release notes, user docs, support docs, and technical guides.
> Commit this file so generated artifacts can be traced back to their prompt intent.
> Keep one entry per artifact or component; store only the latest prompt. Git history keeps prior versions.

## Agent Protocol

### Before creating or substantially changing an artifact

1. Read the full relevant register file in `.generated-prompts/`.
2. Search for an existing `## <ArtifactName>` entry.
3. Use prior entries to preserve project conventions, constraints, decisions, and known risks.
4. If a related entry exists, adapt the new work to fit that established context unless an explicit decision changes it.

### After creating or substantially changing an artifact

1. Add or update the matching `## <ArtifactName>` entry.
2. Increment **Iterations** on substantial updates.
3. Replace **Prompt** with the final prompt or a concise summary when the prompt is long.
4. Record key decisions and evidence links that explain why the artifact changed.
5. Do not update the register for typos, formatting-only edits, or single-line mechanical fixes.

## Usage

- Read this file before generating or substantially revising documentation.
- Preserve audience, structure, tone, decision history, and links to related artifacts.
- Update entries when docs capture new decisions, release behavior, runbooks, or support guidance.

## Entry Format

```markdown
## <ArtifactName>
- **Created:** YYYY-MM-DD
- **Updated:** YYYY-MM-DD
- **Iterations:** N
- **Task:** TASK-ID or backlog item
- **Role:** active role that generated or changed the artifact

### Key decisions
- <Pattern, constraint, trade-off, or risk that shaped the artifact>

### Evidence
- <Command, test, review, screenshot, trace, or decision link>

### Prompt
````
<final prompt, or summary of the prompt key instructions if over 500 words>
````
---
```

<!-- Entries below this line are maintained by agents -->
## docs/release-checklist.md
- **Created:** 2026-08-23
- **Updated:** 2026-08-24
- **Iterations:** 2
- **Task:** ableton-release-0-2-0-publish-20260824
- **Role:** release_manager
- **Paths:** package.json, package-lock.json, README.md, docs/release-checklist.md

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Advance release metadata and rollback guidance to 0.2.1 because npm 0.2.0 is already immutable from commit 35286c1; keep 0.2.0 as the rollback pin, use 0.2.2 as the forward fix, and preserve explicit operator control for push and publish.
````
---
## SSD5 Multi-Output Routing Guide And Contracts
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 2
- **Task:** ableton-ssd-multi-output-workflow-20260817
- **Role:** developer
- **Paths:** docs/ssd5-multi-output.md, docs/ableton-bridge-contract.md, docs/ableton-python-remote-script.md, docs/ableton-compatibility.md, docs/risk-policy.md

### Key decisions
- Document the two-step plan/apply workflow and the exact-label, fail-closed contract.
- State that Live exposes channel choices only for the receiver's currently selected input type, requiring a manual receiver bootstrap when no routed observer exists.
- Defer active-Set apply until the Remote Script is reinstalled/restarted and the user reviews the proposed map.
- Distinguish an unavailable source selector from a valid source that needs a receiver bootstrap, and document ambiguous display-name rejection.

### Evidence
- `node test/compatibility-matrix.mjs` passed.
- `npm test` passed documentation-backed compatibility and risk-policy checks.

### Prompt
````
Document the safe SSD5 multi-output workflow, atomicity guarantees, Live channel-discovery limitation, and explicit active-Set next step without overstating runtime verification.
````
---
## project-lifecycle-docs
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-clip-delete-project-save-20260817
- **Role:** developer
- **Paths:** docs/ableton-bridge-contract.md, docs/ableton-python-remote-script.md

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Document confirmed-empty delete semantics and the observable guarantees and limits of save/save-as responses.
````
---
## docs/live-smoke-suite.md
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-fix-gh-issues-1-5-20260817
- **Role:** developer
- **Paths:** docs/live-smoke-suite.md

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Document the mutation-gated real Live round-trip contract suite, cleanup behavior, explicit target selection, and optional destructive mastering check.
````
---
## docs/ableton-bridge-contract.md
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-fix-gh-issues-1-5-20260817
- **Role:** developer
- **Paths:** docs/ableton-bridge-contract.md

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Document the finite HTTP and MIDI limits plus complete mastering-chain resolution semantics for GitHub issues 3 and 4.
````
---
## Ableton MCP README And Bridge Contract
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** fix-code-pattern-findings-20260716
- **Role:** developer

### Key decisions
- Update the MCP client config example to the current repository path.
- Clarify that real bridge mode forwards plugin filters as query parameters, while dry-run returns them in the payload.

### Evidence
- `npm test` passed after README and bridge contract updates.

### Prompt
````
Synchronize README and bridge contract docs with the implemented behavior: correct the local server path and document plugin filter forwarding consistently with the bridge implementation and dry-run behavior.
````
---

## Ableton Development Bridge Documentation
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-bridge-minimal-20260716
- **Role:** developer

### Key decisions
- Document `npm run bridge` in README quick start.
- Clarify that `bridge/server.js` is a deterministic development bridge, not the final Ableton Live adapter.
- Keep the bridge contract focused on endpoint shape and adapter boundary.

### Evidence
- `orchestra doc-sync audit --task ableton-bridge-minimal-20260716` passed.

### Prompt
````
Update user-facing and contract documentation for the new deterministic development bridge while making the deferred real Ableton adapter boundary explicit.
````
---

## Ableton Bridge Smoke Evidence Documentation
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-bridge-real-smoke-20260716
- **Role:** qa

### Key decisions
- Add `docs/ableton-bridge-smoke-evidence.md` as the compact QA evidence report.
- Map every acceptance criterion to command evidence, generated JSON evidence, or deferred external verification.
- Keep the Ableton Live gap explicit with owner and rationale instead of implying that the deterministic adapter proves live DAW behavior.

### Evidence
- `npm run smoke:bridge` generated `test/evidence/ableton-bridge-smoke-report.json`.
- `orchestra doc-sync audit --task ableton-bridge-real-smoke-20260716` passed.

### Prompt
````
Document the bridge smoke evidence in a compact QA report with acceptance-criteria coverage, command evidence, external verification status, and a live Ableton deferral owned by QA plus developer.
````
---

## Ableton Python Remote Script Documentation
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-real-python-adapter-20260716
- **Role:** developer

### Key decisions
- Add `docs/ableton-python-remote-script.md` with install paths, Ableton Preferences setup, supported endpoints, smoke command, and known limits.
- Link the real adapter documentation from README near the development bridge section.
- Keep live validation instructions explicit because Python syntax tests cannot prove runtime behavior inside Ableton Live.

### Evidence
- `orchestra doc-sync audit --task ableton-real-python-adapter-20260716` passed.

### Prompt
````
Document how to install and verify the Ableton Python Remote Script adapter, including the exact smoke command and known limitations around browser search, VST availability, and parameter mapping.
````
---

## Ableton Snapshot Rollback Documentation
- **Created:** 2026-07-20
- **Updated:** 2026-07-20
- **Iterations:** 1
- **Task:** ableton-product-snapshot-rollback-20260720
- **Role:** developer

### Key decisions
- Add `docs/snapshot-rollback.md` as the focused rollback coverage guide instead of expanding broader bridge contract docs during the child assignment.
- Separate deterministic development bridge full in-memory restore guarantees from Python Remote Script partial rollback behavior.
- Make the operating rule explicit: use real Ableton saves or file copies before edits that affect devices, routing, sends, returns, audio clips, automation, or master chain.

### Evidence
- `node test/snapshot-rollback.mjs` passed.
- `npm test` passed.

### Prompt
````
Create focused snapshot rollback documentation that maps tempo, signature, clips, devices, routing, sends, returns, and master chain coverage across the deterministic development bridge and Python Remote Script bridge, with unsupported rollback gaps stated plainly.
````
---

## Bridge Limits And Live Contract Runbook
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-fix-gh-issues-1-5-20260817
- **Role:** developer

### Key decisions
- Document the 1 MiB HTTP request ceiling and 8,192-note schema bound alongside the bridge contract.
- Document mastering kinds and the all-entries pre-resolution guarantee.
- Treat real Live round-trip checks as a separate, mutation-gated tier with explicit track and empty clip-slot selection.
- Keep master-chain validation optional and warn that generic rollback is unavailable.

### Evidence
- `node --check test/live-contract.mjs` passed.
- `npm test` passed.
- `orchestra doc-sync audit --task ableton-fix-gh-issues-1-5-20260817` records documentation synchronization status.

### Prompt
````
Synchronize the bridge contract and Live smoke runbook with the request-size, MIDI-note, preset-inventory, parameter round-trip, and mastering-chain guarantees, preserving explicit safety gates and deferred real Live execution.
````
---

## Arrangement Insertion Capability And Safety Contract
- **Created:** 2026-08-18
- **Updated:** 2026-08-18
- **Iterations:** 1
- **Task:** ableton-version-gated-arrangement-insertion-20260818
- **Role:** developer
- **Paths:** docs/ableton-bridge-contract.md, docs/ableton-python-remote-script.md, docs/ableton-compatibility.md

### Key decisions
- Document exact-track capability discovery separately from mutation.
- Document explicit mode fields, callable Song.undo, one-delta verification, modern/legacy note provenance, and audio-path redaction.
- Keep real Live proof deferred to a reinstalled/restarted disposable Set with separate approval per mutation.

### Evidence
- Compatibility matrix and complete deterministic npm suite pass.

### Prompt
````
Synchronize bridge and compatibility documentation with the version-gated Arrangement insertion contract while preserving explicit disposable-Set-only runtime validation and no production-Set contact.
````
---

## Dynamic Capability Discovery Documentation
- **Created:** 2026-08-19
- **Updated:** 2026-08-19
- **Iterations:** 1
- **Task:** ableton-capability-aware-tool-exposure-20260819
- **Role:** developer
- **Paths:** README.md, docs/ableton-bridge-contract.md, docs/ableton-python-remote-script.md, docs/high-level-workflows.md

### Key decisions
- Document `GET /capabilities` as a read-only, non-Live-thread contract.
- Explain dynamic tool re-listing, fail-closed fallback, conditional descriptions, and blocked workflow steps.
- Preserve explicit observable limits for snapshots, inventory, parameters, mastering targets, meters, locators, and Arrangement operations.

### Prompt
````
Document capability-aware MCP discovery and workflow materialization without implying unsupported Remote Script writes or target-level guarantees.
````
---

## Session Scene Override Contract Documentation
- **Created:** 2026-08-20
- **Updated:** 2026-08-20
- **Iterations:** 1
- **Task:** ableton-session-scene-tempo-signature-20260820
- **Role:** developer
- **Paths:** README.md, docs/ableton-bridge-contract.md, docs/ableton-python-remote-script.md, docs/ableton-compatibility.md

### Key decisions
- Describe the read-only exact-Scene capability probe separately from atomic mutation.
- State that overrides take effect only after a later explicit Session Scene launch.
- Explicitly deny Scene launch side effects, Arrangement tempo envelopes, Arrangement time-signature markers, and global Song fallback writes.

### Evidence
- Static copy checks and the complete offline validation gate cover canonical routes, tool descriptions, and authoritative docs.

### Prompt
````
Document exact-index Session Scene tempo and time-signature override probing and atomic mutation without implying immediate playback, Scene launch, Arrangement automation or markers, or global Song tempo/signature writes.
````
---
