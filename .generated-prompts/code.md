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
## SSD5 Plugin Output Routing Runtime
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 2
- **Task:** ableton-ssd-multi-output-workflow-20260817
- **Role:** developer
- **Paths:** src/plugin-output-routing-tools.js, bridge/development/plugin-output-routing.js, bridge/development/routing-options.js, ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py, ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing_validation.py, ableton_remote_scripts/AbletonMcpBridge/live_routing_options.py

### Key decisions
- Keep planning read-only and return a structured receiver bootstrap diagnostic when Live cannot expose channel choices without selecting a receiver input type.
- Match the source routing type by exact display name or identifier, match output channels by exact display name, and never fuzzy-match or infer labels.
- Make apply idempotent through verified exact reuse and rollback every newly created track by object identity on any partial failure.
- Keep large entrypoints thin by placing routing behavior and collection validation in focused modules below 300 lines.
- Fail closed when one display name maps to different identifiers, while giving an exact identifier precedence; reject unavailable plan source selectors before returning bootstrap diagnostics.

### Evidence
- `node test/plugin-output-routing.mjs` passed.
- `python3 test/live_plugin_routing_test.py` passed 15 tests after QA remediation.
- `npm test` passed the complete deterministic suite.

### Prompt
````
Implement safe SSD5 multi-output planning and explicit apply behavior with exact routing contracts, observable readback, idempotence, and rollback, without mutating the active Ableton Set during automated validation.
````
---
## project-lifecycle-runtime
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-clip-delete-project-save-20260817
- **Role:** developer
- **Paths:** ableton_remote_scripts/AbletonMcpBridge/live_project.py, ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py, ableton_remote_scripts/AbletonMcpBridge/live_clips.py, bridge/development-adapter.js, src/tools.js

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Implement verified MCP clip deletion and explicit save/save-as reporting without mutating a real Ableton Set.
````
---
## src/tools.js
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-fix-gh-issues-1-5-20260817
- **Role:** developer
- **Paths:** src/tools.js

### Key decisions
- Prompt registry update recorded.

### Evidence
- Pending verification evidence.

### Prompt
````
Update MCP schemas and dispatch for numeric parameter values, bounded MIDI notes, mastering kinds, and exact inventory-backed preset matching.
````
---
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

## GitHub Issues 1-5 Contract Fixes
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-fix-gh-issues-1-5-20260817
- **Role:** developer

### Key decisions
- Declare raw device parameter values as numeric and preserve falsy numeric values through dispatch.
- Resolve preset catalog candidates against exact, loadable browser inventory before returning recommendations.
- Pre-resolve complete mastering chains, support explicit VST/AU kinds, and fail when `replace_all` cannot produce the exact requested order.
- Raise the finite HTTP body ceiling to 1 MiB and bound MIDI clips to 8,192 notes.
- Keep real Live round-trip validation behind explicit disposable-Set and empty-slot gates.

### Evidence
- `node test/contracts.mjs`, `node test/live-mastering.mjs`, `node test/preset-intelligence.mjs`, and `node test/remote-script-static.mjs` passed.
- `npm test` passed the complete deterministic suite.
- `test/live-contract.mjs` provides opt-in real Live write/read/compare coverage and was intentionally not invoked.

### Prompt
````
Fix GitHub issues 1-5: correct the numeric MCP schema, make preset recommendations inventory-backed and relevant, make mastering resolution complete and atomic before destructive replacement, replace the undocumented 64 KiB request ceiling with documented finite limits, and add deterministic plus opt-in real Live round-trip contracts without touching the active Set during automated QA.
````
---

## Arrangement Clip Deletion Undo Compensation
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 1
- **Task:** ableton-arrangement-clip-delete-20260817
- **Role:** developer
- **Paths:** ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py, test/live_arrangement_delete_test.py, docs/ableton-bridge-contract.md, docs/ableton-python-remote-script.md

### Key decisions
- Require callable `Song.undo` during whole-selection preflight before any `Track.delete_clip` mutation.
- On a later deletion exception, invoke undo exactly once per completed deletion and reread the complete Arrangement state.
- Verify restoration with track/index/name/start/length fingerprints rather than ephemeral Live Python proxy identities; report undo, readback, or fingerprint mismatch explicitly as rollback failure.

### Evidence
- `node test/arrangement-clip-delete.mjs` passed and invoked the fake-Live Python contract without calling the active bridge.
- `python3 test/live_arrangement_delete_test.py` passed callable-undo preflight, multi-undo restoration, recreated-proxy verification, undo failure, and readback mismatch cases.
- `npm test` passed the complete deterministic suite.

### Prompt
````
Add compensating Song.undo handling for mid-delete Arrangement clip failures, verify the original observable timeline independently of proxy identity, report rollback failures explicitly, and validate only with local Node/Python fixtures so the user's active Ableton Set is untouched.
````
---

## Version-Gated Arrangement Insertion
- **Created:** 2026-08-18
- **Updated:** 2026-08-18
- **Iterations:** 1
- **Task:** ableton-version-gated-arrangement-insertion-20260818
- **Role:** developer
- **Paths:** ableton_remote_scripts/AbletonMcpBridge/live_arrangement_contract.py, ableton_remote_scripts/AbletonMcpBridge/live_arrangement_insert.py, bridge/development/arrangement-insert.js, src/arrangement-insertion.js

### Key decisions
- Require explicit MIDI, Session-copy, or audio-file mode and reject legacy ambiguous payloads.
- Probe callable methods on the exact track and require callable Song.undo before mutation.
- Verify one stable observable clip delta and use bounded undo with complete Arrangement fingerprint restoration.
- Prefer Live 12 `add_new_notes`; use `set_notes` only when the modern method is non-callable.

### Evidence
- Focused fake-Live Python, Node contract, static wiring, Python compile, and complete deterministic npm tests pass without contacting Live.

### Prompt
````
Implement exact-track Arrangement insertion capabilities and three explicit insertion modes with stable observable readback, modern MIDI note writing, legacy capability fallback, audio-path redaction, and fail-closed bounded undo verification.
````
---

## Capability-Aware MCP Tool Exposure
- **Created:** 2026-08-19
- **Updated:** 2026-08-19
- **Iterations:** 1
- **Task:** ableton-capability-aware-tool-exposure-20260819
- **Role:** developer
- **Paths:** bridge/observability.js, src/capability-resolver.js, src/tool-capabilities.js, src/mcp-handler.js, src/server.js, src/workflow-plans.js, ableton_remote_scripts/AbletonMcpBridge/live_observability.py

### Key decisions
- Use one normalized route-capability document for MCP discovery, direct-call guards, and workflow availability.
- Keep tool ownership and route requirements in a focused registry; keep handshake I/O, TTL, single-flight, and fail-closed recovery in a separate resolver.
- Preserve MCP-local tools during handshake failures and require supported downstream routes for hybrid tools such as MIDI import.

### Evidence
- Focused Node/Python contracts compare the Node and Remote Script capability documents and exercise supported, conditional, unsupported, malformed, unavailable, stale, and recovered views.

### Prompt
````
Expose only truthful Ableton tools by projecting the active bridge capability contract into tools/list, tools/call, and high-level workflow plans while preserving MCP-local capabilities and failing closed on an unverifiable handshake.
````
---

## Session Scene Tempo And Time-Signature Overrides
- **Created:** 2026-08-20
- **Updated:** 2026-08-20
- **Iterations:** 3
- **Task:** ableton-session-scene-tempo-signature-20260820
- **Role:** developer
- **Paths:** src/scene-tempo-signature-tools.js, bridge/development/scene-tempo-signature-observation.js, bridge/development/scene-tempo-signature.js, ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py

### Key decisions
- Treat the zero-based Session Scene index as identity and names as descriptive only.
- Probe each Live property through static descriptors without test writes, then preflight combined requests as one transaction.
- Journal before setter invocation, reacquire the exact index, verify fresh readback, and compensate attempted setters in reverse order.
- Pin the exact preflight-resolved receiver for every forward and compensation setter; fresh index resolution is readback/diagnostics-only so even a same-name, same-shape, unchanged-count replacement receives no writes.
- Preserve disabled hidden values by writing only enable flags and reporting that retained values are unobservable.

### Evidence
- Focused deterministic Node, MCP-to-direct-HTTP-handler, and fake-Live Python suites cover validation, capability matrices, exact targeting, ordering, idempotency, sentinels, recreated proxies, readback mismatch, rollback failure, Scene removal/shift, and same-fingerprint replacement between setters with zero replacement writes, without contacting Live.

### Prompt
````
Implement capability-gated atomic Session Scene tempo and time-signature overrides with exact-index identity, non-mutating descriptor probes, deterministic writes, fresh readback, reverse compensation, development/Python parity, and no Scene launch, Arrangement, or global Song side effects.
````
---
