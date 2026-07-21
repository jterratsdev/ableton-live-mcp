<!-- open-orchestra: prompt-registry-v1 -->
# Code Generation Prompts

> Prompt register for source code, refactors, shared modules, and implementation-heavy changes.
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

- Read this file before creating or substantially changing source code.
- Use previous entries to preserve naming, layering, module ownership, and test patterns.
- Update the matching component entry when behavior, responsibility, or architecture changes.

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

## MCP Server Entrypoint And Tool Modules
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** fix-code-pattern-findings-20260716
- **Role:** developer

### Key decisions
- Keep `src/server.js` as the stdio JSON-RPC adapter and move MCP tool registry, dispatch, validation, and normalization into `src/tools.js`.
- Keep each edited source module below the local 300-line module-boundary threshold.
- Preserve the existing dry-run behavior and MCP text response shape.

### Evidence
- `npm test` passed with smoke and regression coverage.
- `wc -l src/server.js src/bridge.js src/config.js src/tools.js test/regression.mjs` confirmed `src/server.js` is 94 lines and `src/tools.js` is 296 lines.

### Prompt
````
Fix the code review findings while preserving the Ableton MCP scaffold: split the server entrypoint from tool definitions/dispatch/validation, keep modules within project boundary rules, preserve JSON-RPC behavior and dry-run output, and add focused tests for the regressions.
````
---

## Ableton Development Bridge Modules
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-bridge-minimal-20260716
- **Role:** developer

### Key decisions
- Add `bridge/server.js` as the development bridge entrypoint and keep HTTP routing in `bridge/http-server.js`.
- Keep deterministic development behavior in `bridge/development-adapter.js` so a future real Ableton adapter can replace it without changing the MCP HTTP client.
- Restrict the bridge listener to loopback hosts and keep modules below local boundary thresholds.

### Evidence
- `npm test` passed with `smoke ok`, `regression ok`, and `bridge ok`.
- `wc -l bridge/*.js src/*.js test/*.mjs` confirmed all bridge modules remain below 300 lines.

### Prompt
````
Implement the first connector-development milestone: a minimal loopback HTTP bridge with status, project, tempo, transport, and plugin inventory endpoints, using a deterministic development adapter and leaving a clear adapter boundary for real Ableton Live integration.
````
---

## Ableton Python Remote Script Adapter
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-real-python-adapter-20260716
- **Role:** developer

### Key decisions
- Add `ableton_remote_scripts/AbletonMcpBridge` as an installable Ableton MIDI Remote Script package with `create_instance`.
- Keep the ControlSurface entrypoint in `AbletonMcpBridge.py`, HTTP parsing in `http_bridge.py`, and Live/browser helpers in `live_api.py` so each module stays below the project boundary threshold.
- Queue HTTP requests back onto Ableton's Control Surface thread with `schedule_message` before reading or mutating Live state.

### Evidence
- `python3 -m py_compile` passed for every Remote Script Python file.
- `npm test` passed with `remote script static ok`.

### Prompt
````
Implement the real Ableton adapter as a Python MIDI Remote Script that starts a loopback HTTP server inside Live, exposes the MCP bridge endpoints, and marshals Live API calls onto Ableton's control-surface thread.
````
---

## Ableton Installer Doctor CLI
- **Created:** 2026-07-20
- **Updated:** 2026-07-20
- **Iterations:** 1
- **Task:** ableton-product-installer-doctor-20260720
- **Role:** developer

### Key decisions
- Add `src/doctor.js` as a read-only CLI and importable diagnostic surface so deterministic checks can inject Live process and bridge status adapters.
- Compare bundled and installed `AbletonMcpBridge` files by SHA-256 hash rather than relying only on timestamps.
- Keep stale-runtime guidance explicit: stale installed files, Live started before install, Live running with unreachable bridge, and healthy bridge are distinct diagnoses.
- Add `scripts/check-doctor-diagnostics.mjs` under the task-owned `scripts` path instead of touching the existing `test/` ownership boundary.

### Evidence
- `npm run doctor:test` passed with healthy and stale-install deterministic scenarios.
- `npm test` passed with existing smoke/regression/bridge/static checks plus `doctor:test`.

### Prompt
````
Implement the Orchestra child assignment for installer verification and stale bridge troubleshooting: add a doctor command that reports Ableton app path, installed Remote Script path, file freshness, Live PID, bridge status, and stale-runtime diagnosis; improve installer guidance; and add deterministic diagnostic output checks within the assigned ownership paths.
````
---

## Ableton Snapshot Rollback
- **Created:** 2026-07-20
- **Updated:** 2026-07-20
- **Iterations:** 1
- **Task:** ableton-product-snapshot-rollback-20260720
- **Role:** developer

### Key decisions
- Move deterministic development snapshot and rollback behavior into `bridge/development/snapshots.js` so the oversized adapter delegates rollback state transitions to a focused module.
- Preserve process-local development rollback semantics while adding explicit coverage metadata for tracks, mixer state, sends, routing, devices, returns, master devices, arrangement, automation, and mastering metadata.
- Extend Remote Script snapshots to record wider mixer/device/return/master metadata while keeping rollback warnings explicit for fields the Live Python API path does not safely restore.

### Evidence
- `node test/snapshot-rollback.mjs` passed.
- `python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_snapshots.py` passed.
- `npm test` passed with existing smoke, regression, bridge, Remote Script static, and doctor diagnostics checks.

### Prompt
````
Execute the Orchestra child assignment for snapshot rollback: document current rollback coverage and gaps, improve deterministic snapshot coverage for devices, mixer state, sends, returns, and master chain, and keep Remote Script limitations explicit instead of claiming unsupported rollback safety.
````
---
