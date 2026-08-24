Task id: ableton-capability-aware-tool-exposure-20260819
Phase: developer
Role: developer
Runtime: codex-cli
Session id: ableton-capability-aware-tool-exposure-20260819:wfrun-1787181760099-a7f5ab:developer:codex-cli

# Developer Handoff

## Result

- Developer implementation: **PASS; ready for independent QA**.
- AC1-AC6 have deterministic local implementation evidence. No active bridge endpoint was contacted, no Live Set was read or mutated, and Ableton was not installed or restarted.
- Close status: Developer phase complete. Release remains gated on the normal QA review and workflow transition.

## Changed Components and Behavior

- `bridge/observability.js`, `bridge/http-server.js`, `bridge/development-adapter.js`: added the normalized, read-only development `GET /capabilities` projection and thin HTTP wiring. Every mapped route has a status and non-empty reason.
- `ableton_remote_scripts/AbletonMcpBridge/live_observability.py`, `AbletonMcpBridge.py`: added the exact Python compatibility projection and a `GET /capabilities` handler that returns before `_call_live_thread`.
- `src/bridge.js`: exported bridge action metadata for parity, added `get_capabilities`, and made dry-run return the deterministic-development capability document without network I/O.
- `src/capability-resolver.js`: added strict mode/schema/route/status/reason validation, one in-flight promise, a 2-second successful-result TTL, a short failure TTL, no stale-success-on-error, and deterministic fail-closed recovery.
- `src/tool-capabilities.js`: added the single tool ownership/route/probe/limitation registry, definition/dispatch/route parity validation, dynamic tool projection, and the matching direct-call guard.
- `src/mcp-handler.js`, `src/server.js`, `src/tools.js`: extracted a testable MCP request handler, made `tools/list` asynchronous and capability-aware, applied the same guard before dispatch, advertised list changes, and passed the resolved view to workflow-plan tools.
- `src/workflow-plans.js`: materializes `availability`, `executable`, exact `capabilityReason`, and optional `capabilityProbe`; unsupported steps remain visible as blocked/non-executable where plan coherence benefits.
- `test/capability-aware-tools.mjs`, `test/live_capabilities_test.py`, `test/deterministic.mjs`: added Node/Python parity, endpoint, policy, cache/failure/recovery, list/call, wording, workflow, and full-suite coverage.
- `README.md`, `docs/ableton-bridge-contract.md`, `docs/ableton-python-remote-script.md`, `docs/high-level-workflows.md`: documented dynamic discovery, fail-closed behavior, re-listing, conditional wording, and workflow availability.
- `.generated-prompts/code.md`, `.generated-prompts/docs.md`, `.generated-prompts/tests.md`: workflow-required prompt-registry traceability for the substantial code/docs/test artifacts. This is the only touched surface outside the task's product ownership paths.

The worktree was already substantially dirty, including overlapping source/docs/test files from other tasks. Those changes were preserved; no reset, checkout, deletion, commit, push, tag, publish, installation, restart, or active-bridge command was performed.

## API Evidence Shape

- Request contract: JSON-RPC `initialize`, `tools/list`, and `tools/call` requests plus HTTP `GET /capabilities` are exercised with local fixtures.
- Response contract/schema: assertions validate the versioned capability schema, exact route set, dynamic tool names/descriptions, JSON-RPC error, and workflow availability fields.
- External side effect or persisted state: the development adapter state is serialized before/after capability reads and remains equal; the unsupported direct-call mock records zero downstream action calls after the handshake.
- Sandbox/mock/contract evidence: in-memory Node adapters, a fake bridge, fake clock, Python Remote Script object, dry-run MCP process, and Python subprocess parity are used; no external environment or active bridge is required or contacted.

## Test Scenarios and Expected Results

| Scenario | Surface/environment | Expected observable result | Obtained evidence |
| --- | --- | --- | --- |
| Node/Python registry parity | API + local sandbox | Exact Remote Script mode and identical canonical route/status/reason arrays; unique routes; all reasons non-empty | `node test/capability-aware-tools.mjs`; Python JSON subprocess comparison |
| Remote Script handler | API + fake Remote Script object | `GET /capabilities` returns without entering the Live thread | `python3 test/live_capabilities_test.py` with `_call_live_thread` trap |
| Development endpoint | API + in-memory development adapter | Deterministic mode response and byte-equivalent adapter state before/after | Focused Node route-boundary assertion |
| Remote Script tool discovery | workflow/runtime + local fixture | Unsupported render, bounce, automation, reorder, consolidation, and render-backed mastering are absent; local/hybrid/supported tools remain | Focused `tools/list` assertions |
| Development discovery | workflow/runtime + local fixture | Development render, bounce, automation, reorder, consolidation, and mastering tools remain | Focused `tools/list` assertions |
| Conditional wording | API + local fixture | Conditional descriptions include exact reason, observable limit, and probe where available | Focused description assertions for Arrangement, meters, locators, snapshots, plugin inventory/parameters, and mastering targets |
| Direct-call bypass | workflow/runtime + local fixture | Hidden render call raises stable `-32602` capability error with route/reason; downstream fixture sees only the handshake | Focused request-count assertion |
| Malformed/unavailable handshake | workflow/runtime + local fixture | Wrong mode, missing/extra/duplicate routes, missing reasons, and unreachable responses fail closed to local tools | Focused validator/list assertions |
| Cache failure and recovery | integration + fake clock/provider | Concurrent resolves use one request; expired success is not reused after failure; later re-list recovers | Focused resolver assertions |
| Capability-aware workflow | workflow/runtime + local fixture | Remote render/bounce steps are blocked, non-executable, and carry exact reasons; local rendered analysis remains executable | Focused workflow-plan call assertion |
| Full regression | CLI + local sandbox | All deterministic suites pass; no active bridge or Set mutation | `npm test` emits `deterministic test suite ok` |

## Goal-to-Verification Map

| Acceptance criterion | Developer status | Evidence judgment |
| --- | --- | --- |
| AC1 | PASS | Both bridge projections report exact mode and status/reason for all Node-registry routes; exact Node/Python parity and non-Live-thread handler assertions pass. |
| AC2 | PASS | Remote fixture hides unsupported-only tools while retaining MIDI import through `POST /clips/midi`, local rendered analysis, observability, risk/workflow tools, diagnostics, and supported bridge tools. |
| AC3 | PASS | Development fixture retains render/bounce/automation/reorder/consolidation/mastering; malformed and unreachable fixtures expose only the conservative local surface. |
| AC4 | PASS | Conditional descriptions carry exact reasons/probes, and named snapshot/plugin/parameter/mastering/meter/locator/Arrangement limits are asserted. |
| AC5 | PASS | MCP workflow calls mark unsupported bridge steps blocked/non-executable with exact reasons; Remote Script render and bounce are never executable, while unsupported automation/reorder/consolidation are not recommended as executable steps. |
| AC6 | PASS for Developer; QA review pending | Focused Node/Python/static/parity, `py_compile`, full `npm test`, and `git diff --check` all exited 0 using local/in-memory/dry-run fixtures only. |

## Commands Run

- `orchestra health --runtime codex-cli --json` — exit 0; workflow ready, only optional generated-guidance refresh warnings.
- `orchestra task list --json --status pending,blocked,in_progress` — exit 0; matching task/run identified.
- `orchestra context`, `delegation decide`, `plan`, `skills plan`, `protocol render`, `workflow render`, and `validate --pre-run --json` for this task — exit 0; pre-run allowed with active context.
- `node --check src/capability-resolver.js` — exit 0.
- `node --check src/tool-capabilities.js` — exit 0.
- `node --check src/mcp-handler.js` — exit 0.
- `node --check src/server.js` — exit 0.
- `node test/capability-aware-tools.mjs` — exit 0; `capability-aware tools ok`.
- `python3 test/live_capabilities_test.py` — exit 0; `live capability contract tests ok`.
- `node test/remote-script-static.mjs` — exit 0; `remote script static ok`.
- `python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_observability.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py test/live_capabilities_test.py` — exit 0.
- `node test/observability.mjs`, `node test/workflow-plans.mjs`, and `node test/smoke.mjs` — exit 0 during focused compatibility checks.
- `npm test` — exit 0 after final code changes; all suites passed and output ended with `deterministic test suite ok`.
- `git diff --check` — exit 0 after final code/docs/test changes.
- `orchestra doc-sync audit --task ableton-capability-aware-tool-exposure-20260819` — exit 0; task docs passed. Warnings named pre-existing dirty docs (`ableton-editions.md`, `ableton-suite-vs-lite-sdk.md`, `product-workflows.md`) outside this task's edits.
- `orchestra qa evidence-check --surface api --type report --path <developer-handoff> --json` — exit 0 but the generic heuristic reported `observableOutcome: false` and generic API evidence gaps despite the explicit request/response/schema/zero-side-effect fixture evidence above. QA must inspect the focused contract directly; this heuristic output is not claimed as acceptance proof.

## Simplicity Review

The diff is the smallest coherent implementation of the accepted cross-runtime contract: two focused policy/I/O modules and one small request-handler extraction keep business rules out of the already-large `src/tools.js`, `src/server.js`, and `AbletonMcpBridge.py`. Existing endpoint, adapter, risk, and workflow patterns were reused. No dependency, framework, build system, broad refactor, speculative feature, render/automation/reorder/consolidation implementation, or unrelated cleanup was added.

## Architectural Concerns (inherited)

None. Implementation follows the accepted Architect decision and keeps discovery, invocation, and workflow materialization on one capability view.

## Architectural Concerns (self-imposed)

- New public `GET /capabilities` API: necessary because the existing observability report carries process/Set-adjacent diagnostics and was not a strict, minimal handshake suitable for discovery policy.
- New `src/tool-capabilities.js`: necessary because the risk registry answers approval risk, not runtime availability; combining them would conflate independent contracts and grow an existing policy surface.
- New `src/capability-resolver.js`: necessary to isolate network/cache/failure semantics from the pure tool policy and keep the entry point thin/testable.
- New `src/mcp-handler.js`: necessary to test the actual JSON-RPC method behavior without spawning against or contacting the configured active bridge; the prior stdin module embedded all request policy.

Structured concerns:

```json
{
  "architecturalConcerns": {
    "inherited": [],
    "selfImposed": [
      "GET /capabilities public bridge contract",
      "focused tool-capability registry",
      "focused capability resolver/cache",
      "testable MCP request-handler extraction"
    ]
  }
}
```

## Risks and Known Gaps

- A successful view can lag an in-place bridge switch by at most two seconds; `listChanged: true`, re-listing, short TTL, and fail-closed refresh behavior bound this risk.
- Independent QA has not yet reviewed the diff/evidence. No release conclusion is claimed here.
- Real installed Remote Script proof is intentionally absent and not substituted with simulated evidence: the assignment prohibited contacting the active bridge or installing/restarting Ableton. AC6 explicitly requires local validation without that contact.
- The preprocessed runtime context warned that some directory content was omitted/trimmed. Full required rules, the complete Architect handoff, and all decisive project modules were read directly before implementation.

## Consumed Context Files

- `.agent-workflow/playbooks/developer.md` — read fully; applied smallest coherent change, traceability, simplicity, AC evidence map, concerns, and handoff requirements.
- `AGENTS.md` — read fully; applied recurring Orchestra health/task/pre-run checks, evidence discipline, active workflow, no gate bypass, and no push/release.
- `rules/development/semantic-code.md` — read fully; applied domain names, focused modules, thin entry points, and behavior-oriented tests.
- `rules/development-engineering.mdc` — read fully; applied project-first boundaries, integration failure handling, static checks, and exact handoff evidence.
- `rules/dry-clean-code.mdc` — read fully; applied one source-of-truth registry, named constants, no duplicated policy lists, and no dead/debug code.
- `rules/module-boundaries.mdc` — read fully; inspected file sizes/responsibilities and kept policy out of god-file-risk adapters.
- `rules/testing-discipline.mdc` — read fully; added deterministic unit/contract, negative, malformed, stale, recovery, parity, and observable-state assertions before handoff.
- Developer runtime prompt — read completely; preserved AC1-AC6, ownership, exact output metadata, prohibited operations, and lifecycle command.
- Architect handoff — read completely; implemented the accepted contract, boundaries, cache semantics, test scenarios, and rollback model.
- Orchestra collection-standards/source-of-truth/prompt-registry/doc-sync/chaos/static-analysis guidance from the runtime context — applied typed registries, O(n) lookups, local sources, prompt traceability, deterministic injected failures, smallest-first checks, full gate, and doc audit.
- Oclif, Playwright, diagram, and release-readiness guidance was not applicable: this task changes no oclif plugin, UI/browser flow, diagram, or release/deploy surface.

## QA Handoff Notes

- Re-run the exact focused commands and `npm test` from a worktree snapshot that preserves the unrelated dirty changes.
- Treat `test/capability-aware-tools.mjs` as the AC1-AC5 contract and challenge exact retained/hidden names, reasons, probes, downstream request count, cache expiry, and recovery.
- Do not call port 9789, install/restart Ableton, or mutate any Live Set during QA. All required evidence is available through local fixture/dry-run/in-memory paths.
- Rollback is code-only: revert the capability endpoint, resolver/policy/request-handler wiring, and workflow projection together. Do not leave discovery, calls, and plans on different policy sources.
