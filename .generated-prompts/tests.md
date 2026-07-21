<!-- open-orchestra: prompt-registry-v1 -->
# Test and Evidence Prompts

> Prompt register for unit tests, integration tests, Playwright specs, QA plans, fixtures, and evidence strategy.
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

- Read this file before creating tests or QA automation.
- Preserve fixture strategy, page object patterns, locator conventions, and evidence requirements.
- Update entries for substantial test plan, Playwright, or regression coverage changes.

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

## Ableton MCP Regression Tests
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** fix-code-pattern-findings-20260716
- **Role:** developer

### Key decisions
- Keep the existing smoke test and add `test/regression.mjs` for targeted review findings.
- Cover invalid MIDI note rejection, real-mode plugin filter forwarding, and config validation.
- Add `npm test` as the full local test gate while retaining `npm run smoke`.

### Evidence
- `npm test` passed with `smoke ok` and `regression ok`.

### Prompt
````
Add deterministic Node-based regression tests for the review findings: invalid MIDI note values must fail before bridge invocation, GET plugin filters must reach a local HTTP bridge as query params, and bridge config validation must reject unsafe/invalid values.
````
---

## Ableton Bridge Integration Test
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-bridge-minimal-20260716
- **Role:** developer

### Key decisions
- Add `test/bridge.mjs` to start the development bridge on an ephemeral loopback port.
- Run the MCP server without `ABLETON_MCP_DRY_RUN` and assert observable status, project, tempo, transport, and plugin filter behavior.
- Include the bridge integration test in `npm test` while preserving the existing smoke and regression checks.

### Evidence
- `npm test` passed with `bridge ok`.

### Prompt
````
Add deterministic integration coverage proving the MCP server can call the local HTTP bridge in real/non-dry-run mode for the first bridge endpoints.
````
---

## Ableton Bridge Smoke Evidence Report
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-bridge-real-smoke-20260716
- **Role:** qa

### Key decisions
- Add `test/bridge-smoke-report.mjs` as an explicit QA evidence command separate from the fast `npm test` gate.
- Generate `test/evidence/ableton-bridge-smoke-report.json` with JSON-RPC request shape, parsed MCP response content, observable tempo/transport state changes, plugin filter output, and live Ableton deferral metadata.
- Keep `npm test` unchanged so routine tests do not rewrite timestamped evidence on every run.

### Evidence
- `npm run smoke:bridge` passed and generated `test/evidence/ableton-bridge-smoke-report.json`.
- `npm test` passed with `smoke ok`, `regression ok`, and `bridge ok`.

### Prompt
````
Create a reproducible QA smoke command that exercises the MCP server through the local HTTP bridge without dry-run mode and writes a compact evidence artifact mapping requests, responses, state transitions, and the deferred live Ableton verification gap.
````
---

## Ableton Remote Script Static Test
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-real-python-adapter-20260716
- **Role:** developer

### Key decisions
- Add `test/remote-script-static.mjs` to validate the Remote Script package without requiring Ableton Live in CI/local shell.
- Check `create_instance`, critical route strings, Live-thread scheduling, and Python syntax compilation.
- Keep live Ableton execution as deferred manual evidence because this workspace cannot host Ableton's ControlSurface runtime.

### Evidence
- `npm test` passed with `remote script static ok`.

### Prompt
````
Add static coverage for the Ableton Remote Script adapter that proves the files are installable-shaped, compile under Python, and expose the expected bridge endpoints.
````
---

## Ableton Snapshot Rollback Test
- **Created:** 2026-07-20
- **Updated:** 2026-07-20
- **Iterations:** 1
- **Task:** ableton-product-snapshot-rollback-20260720
- **Role:** developer

### Key decisions
- Add `test/snapshot-rollback.mjs` as a focused deterministic Node test rather than broadening `test/bridge.mjs`.
- Exercise rollback through `DevelopmentAbletonAdapter` so the test proves the wired product path restores track mixer state, sends, devices, returns, master chain, arrangement, automation, and clips.
- Include static assertions for `live_snapshots.py` limitation wording because live Ableton runtime validation is not available in this workspace.

### Evidence
- `node test/snapshot-rollback.mjs` passed.
- `npm test` passed.

### Prompt
````
Add deterministic rollback coverage for the snapshot assignment, focusing on observable adapter behavior and Remote Script limitation metadata without requiring Ableton Live.
````
---
