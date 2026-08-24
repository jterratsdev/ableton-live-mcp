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
## SSD5 Plugin Output Routing QA Evidence
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 3
- **Task:** ableton-ssd-multi-output-workflow-20260817
- **Role:** qa
- **Paths:** .agent-workflow/handoffs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-qa-qa-runtime-handoff.md

### Key decisions
- Independently execute the focused Node and fake-Live Python suites plus the complete deterministic gate without calling the active Ableton bridge.
- Treat duplicate exact routing display names with different identifiers as ambiguous and require fail-closed behavior instead of first-match selection.
- Revalidate the remediated ambiguous-source, exact-identifier, unavailable-source, and ambiguous-output cases by explicit unittest name before approving the aggregate suites.
- Approve all four acceptance criteria after the Remote Script and development adapter reject ambiguous/unavailable selectors without mutation; retain real Ableton install/restart and active-Set apply as an explicit external deferral.

### Evidence
- Four named fail-closed Python cases passed: ambiguous source, exact identifier precedence, unavailable source, and ambiguous output rollback.
- `node test/plugin-output-routing.mjs`, `python3 test/live_plugin_routing_test.py` (15 tests), and `npm test` exited 0 after remediation.
- Static Remote Script, risk-policy, observability, Python compilation, and diff checks exited 0.

### Prompt
````
Revalidate the SSD5 fail-closed remediation against every acceptance criterion, explicitly proving ambiguous labels and unavailable selectors preserve state while exact identifiers remain selectable, then run focused and full gates without calling a mutating endpoint on the active Ableton Set.
````
---
## SSD5 Plugin Output Routing Contracts
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 2
- **Task:** ableton-ssd-multi-output-workflow-20260817
- **Role:** developer
- **Paths:** test/plugin-output-routing.mjs, test/live_plugin_routing_test.py, test/remote-script-static.mjs, test/compatibility-matrix.mjs, test/deterministic.mjs

### Key decisions
- Use deterministic Node and fake-Live Python fixtures, including modern routing dictionaries with display names and identifiers.
- Assert no-mutation planning, manual-bootstrap diagnostics, exact routing/readback, Monitor In on every receiver, duplicate rejection, idempotence, name conflicts, unsupported outputs, and rollback after routing or name-assignment failures.
- Exercise the listed MCP dispatch through an ephemeral development bridge only; never call the active Ableton bridge.
- Regress ambiguous source/channel display names, exact identifier precedence, and unavailable source selectors with zero-mutation assertions.

### Evidence
- `node test/plugin-output-routing.mjs` passed through an ephemeral localhost bridge.
- `python3 test/live_plugin_routing_test.py` passed 15 cases after QA remediation.
- `npm test` passed all deterministic suites.

### Prompt
````
Prove SSD5 plan/apply behavior with deterministic Node and fake-Live tests, including bootstrap limits and atomic rollback, without invoking a mutating endpoint on the user's running Ableton instance.
````
---
## project-lifecycle-contract-tests
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-clip-delete-project-save-20260817
- **Role:** developer
- **Paths:** test/project-lifecycle.mjs, test/live_project_clip_test.py, test/bridge.mjs, test/deterministic.mjs, test/remote-script-static.mjs

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Assert tool exposure, confirmed clip deletion, idempotent empty deletion, save versus save-as mode, and Remote Script error handling using development fixtures and Python fakes.
````
---
## GitHub issues 1-5 contract suites
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-fix-gh-issues-1-5-20260817
- **Role:** qa
- **Paths:** test/bridge.mjs, test/contracts.mjs, test/deterministic.mjs, test/live-contract.mjs, test/live-mastering.mjs, test/live-smoke-suite.mjs, test/live_mastering_test.py, test/preset-intelligence.mjs, test/smoke.mjs

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Add deterministic and opt-in Live round-trip regression coverage for schema forwarding, inventory truthfulness, mastering atomicity/order, realistic MIDI payloads, cleanup, and explicit mutation deferral.
````
---
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

## Arrangement Insertion Contract Tests
- **Created:** 2026-08-18
- **Updated:** 2026-08-18
- **Iterations:** 2
- **Task:** ableton-version-gated-arrangement-insertion-20260818
- **Role:** qa
- **Paths:** test/live_arrangement_insert_test.py, test/arrangement-insertion.mjs, test/remote-script-static.mjs, .agent-workflow/handoffs/ableton-version-gated-arrangement-insertion-20260818-wfrun-1787088039539-625c87-qa-qa-runtime-handoff.md

### Key decisions
- Use fresh-proxy fake-Live fixtures for exact MIDI, Session-copy, audio, stale, ambiguous, no-op, partial host failure, and rollback-failure behavior.
- Prove Live 12 selects `add_new_notes` with zero legacy calls, while the legacy fixture selects only `set_notes`.
- Keep all tests local and deterministic; never call port 9789 or the running Ableton bridge.
- Exercise public route boundaries, not only direct service calls: Remote Script query strings must parse to exact indices, and development HTTP must enforce the same discriminated schema as MCP/Python.
- Keep AC6 explicitly deferred and release-blocking until separately approved evidence exists from the disposable Live Suite Set after install/restart.
- Independently revalidate QA remediations through the Python route object and an ephemeral Node HTTP server, proving malformed input behavior plus exact fingerprint and complete-state preservation.

### Evidence
- Focused suites emit `arrangement insertion fake-Live tests ok`, `arrangement insertion contract tests ok`, and `remote script static ok`.
- `npm test` emits `deterministic test suite ok`.
- QA reproduced two blockers: valid Remote Script capability query indices are rejected as strings, and a mixed-mode development HTTP payload succeeds instead of failing without mutation.
- QA remediation revalidation passed: Python accepts `{"trackIndex":["0"]}` and rejects malformed input; ephemeral Node HTTP returns 400 `invalid_request` for mixed modes with unchanged full state and fingerprint; focused/full gates pass.

### Prompt
````
Independently verify explicit Arrangement insertion modes, exact readback, target-specific read-only capabilities, note API selection, schema discrimination at every public boundary, path redaction, host failures, ambiguous or stale post-state, and verified bounded undo using only local fake-Live and development fixtures. Treat real disposable-Live proof as AC6's explicit release-blocking deferral and never contact the active bridge or production Set.
````
---

## Capability-Aware Tool Contract Tests
- **Created:** 2026-08-19
- **Updated:** 2026-08-19
- **Iterations:** 1
- **Task:** ableton-capability-aware-tool-exposure-20260819
- **Role:** developer
- **Paths:** test/capability-aware-tools.mjs, test/live_capabilities_test.py, test/deterministic.mjs

### Key decisions
- Compare exact Node and Python Remote Script capability projections.
- Exercise Remote Script, deterministic-development, malformed, unavailable, expired, and recovered capability views with local fixtures only.
- Assert hidden tools cannot bypass discovery through direct calls and workflow steps preserve exact blocked reasons.

### Prompt
````
Prove dynamic tools/list, direct-call guarding, conditional language, workflow blocking, resolver recovery, and registry parity without contacting the configured active bridge or mutating a Live Set.
````
---
