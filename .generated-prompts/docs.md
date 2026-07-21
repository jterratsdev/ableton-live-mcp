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
