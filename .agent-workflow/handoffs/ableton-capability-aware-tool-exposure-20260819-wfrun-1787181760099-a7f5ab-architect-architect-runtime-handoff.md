Task id: ableton-capability-aware-tool-exposure-20260819
Phase: architect
Role: architect
Runtime: codex-cli
Session id: ableton-capability-aware-tool-exposure-20260819:wfrun-1787181760099-a7f5ab:architect:codex-cli

# Architect Handoff

## Result

- Architecture review: **PASS for development** against the unchanged, user-approved PO contract.
- Story size: **m / 5 points**. Preserve the existing estimate. The change crosses Python and Node bridge adapters, MCP discovery/call policy, workflow planning, tests, and docs, but these are one atomic truthfulness contract and should not be split into independently releasable stories.
- Product code, tests, and product documentation were not changed. No active bridge endpoint was called; Ableton was not installed, restarted, saved, or mutated.
- Close status: architect phase complete. AC1-AC6 remain release-blocking until Developer and QA provide implementation and deterministic command evidence.

## Architecture Decision

### Decision: one normalized route-capability view drives discovery, invocation, and plans

Status: accepted for implementation.

Context: `bridge/observability.js` and `live_observability.py` already carry parallel endpoint-support catalogs, but neither HTTP bridge exposes a dedicated capability handshake. `src/server.js` returns the static 1,080-line `tools` array, `src/tools.js` dispatches every registered name, and `src/workflow-plans.js` materializes static steps. Consequently, Remote Script routes that intentionally return 501 are still advertised as executable. The implementation must preserve MCP-local work and deterministic-development behavior without contacting Live during tests.

Decision:

1. Add `GET /capabilities` to both bridges. It performs no Live call and returns a normalized versioned document: `ok`, `schemaVersion`, `mode` (`deterministic-development` or `ableton-remote-script`), and `routes[]`. Every route entry contains `method`, `path`, `status: supported | conditional | unsupported`, and a non-empty `reason`. Include `GET /capabilities` itself. Reject duplicate routes, unknown statuses, missing reasons, wrong modes, and incomplete/extra route sets in the MCP validator.
2. Keep `bridge/observability.js` as the authoritative Node route-support registry and add explicit reasons for both runtimes. The development endpoint projects each entry's development status; `live_observability.py` projects Remote Script status. Python remains a compatibility copy because the Live runtime cannot import Node modules; focused parity tests compare canonical method/path/status/reason data and compare both actual HTTP route sets plus exported `src/bridge.js` actions against the Node registry. Registry-only historical entries must either gain real routing or be explicitly excluded from the mapped-route contract; silent drift is forbidden.
3. Add a focused MCP capability layer rather than growing `src/tools.js` or `src/server.js`: a tool-capability registry plus a resolver/policy service. Each MCP tool is classified as `local`, `bridge`, or `hybrid` and declares zero or more required HTTP routes. The registry also holds conditional wording and an optional target-probe tool. A parity validator requires every tool definition and dispatch name to have exactly one policy entry and every required route to exist in the Node route registry.
4. `tools/list` asynchronously resolves the active bridge capability document, validates it, and passes it to the pure policy projector. `supported` tools are listed normally; `conditional` tools remain listed with explicit `Conditional:` language, the exact bridge reason, and the probe tool when one exists; a tool with any `unsupported` required route is absent. Local tools are independent of bridge status. Hybrid tools require both their local implementation and all declared downstream routes: notably MIDI import is MCP-parsed but requires supported `POST /clips/midi`, never unsupported `POST /midi/import`.
5. Apply the same resolved policy before `tools/call`. A direct call to a currently unexposed bridge or hybrid tool fails with a stable MCP invalid-request/capability error containing the route and exact sanitized reason; it never reaches dispatch. This closes the bypass where hiding a name from discovery alone still leaves its handler callable.
6. Make workflow materialization capability-aware. `listWorkflowPlans(view)` and `getWorkflowPlan(id, view)` retain local steps, label conditional steps with `availability: "conditional"` and the exact reason/probe, and represent unsupported bridge steps as `availability: "blocked"`, `executable: false`, and the exact capability reason (or omit them only where the remaining plan stays coherent). The Remote Script render workflow must never label render, bounce, automation, reorder, or consolidation executable. Workflow catalog validation continues to verify tool/risk references and additionally verifies capability-policy coverage.
7. Use one in-flight handshake promise and a short successful-result TTL (recommended 2 seconds, configurable only in tests). Do not serve an expired successful view after refresh failure. Unreachable, timeout, malformed, wrong-mode, or incomplete responses produce a deterministic fail-closed view: expose MCP-local tools and local plan/diagnostic/risk surfaces, block all bridge/hybrid calls, and attach a stable `capability_handshake_unavailable` reason to plans/call errors. Re-listing retries after the short failure window; reconnecting clients can obtain a fresh list.

Consequences: discovery, direct invocation, and workflow guidance share one decision function, so they cannot independently overclaim. Existing bridge support catalogs gain contractual weight and stricter parity checks. The public tool list becomes runtime-dependent, which clients are already assumed to support by re-listing. A short cache can lag an in-place bridge switch by at most its TTL; fail-closed refresh behavior prevents stale success from surviving a failed handshake.

Alternatives rejected: filtering only `tools/list` leaves direct `tools/call` open; deriving support from 404/501 calls would mutate or probe Live actions and is unsafe; maintaining separate allow/deny lists for discovery and workflows guarantees drift; treating all Remote Script limitations as unsupported would hide useful conditional capabilities; treating malformed handshakes as development mode would falsely advertise writes.

## Public Capability Contract

The response shape is deliberately smaller than the existing observability snapshot:

```json
{
  "ok": true,
  "schemaVersion": "1.0.0",
  "mode": "ableton-remote-script",
  "routes": [
    {
      "method": "POST",
      "path": "/render/export",
      "status": "unsupported",
      "reason": "Remote Script render export is not supported"
    }
  ]
}
```

Route identity is the canonical uppercase method plus normalized absolute path. Reasons are required for all statuses, including supported routes, so every mapped route has an auditable assertion. The response contains no Set data, paths, process details, secrets, or target mutation. `endpointSupport` in observability/production reports may remain for compatibility, but it must be derived from the same registries and must not become a third policy source.

## Tool Ownership and Conditional Semantics

- Pure local examples: rendered-file audio/mix analysis, bridge observability from supplied/local metadata, risk evaluation/listing, and workflow-plan catalog access. These remain available when the handshake fails.
- Hybrid examples: MIDI import parses locally but requires `POST /clips/midi`; plugin diagnosis and preset matching require browser/plugin routes; playback diagnosis requires its read routes. Hybrid availability is the intersection of local ownership and all route requirements.
- Bridge examples: transport, Set reads/writes, rendering, bounce, automation, reorder, consolidation, meters, locators, snapshots, devices, and mastering operations.
- Conditional target probes: Arrangement insertion uses `ableton_get_arrangement_insertion_capabilities`; plugin-output routing uses its read-only planning tool; meter reliability comes from the meter response; device parameters require a preceding parameter read; locator mutation and snapshot/rollback limitations have no universal target probe and must say so rather than imply guaranteed support.
- Description corrections must state observable limits: snapshots restore only captured/exposed fields and are not Live Set files; plugin inventory is browser-indexed rather than proof of loadability; parameter lists contain only Live-exposed parameters and writes require an exact inspected target; mastering targets are requested goals, not measured LUFS without a real render; meters may be unavailable/zero/stale and are not guaranteed mixing evidence; locators depend on cue-point mutation support; Arrangement reads/inserts/deletes expose only host-observable clips and exact supported operations.

## Module Boundaries and Data Flow

Expected implementation surfaces:

- `bridge/observability.js`: authoritative runtime support registry, normalized capability projection, and route parity helpers.
- `bridge/http-server.js` and `bridge/development-adapter.js`: thin `GET /capabilities` wiring only.
- `ableton_remote_scripts/AbletonMcpBridge/live_observability.py`: Python-compatible Remote Script projection; `AbletonMcpBridge.py` adds a non-Live-thread route.
- `src/bridge.js`: export action/route metadata for parity and add a capability action; retain HTTP transport responsibility only.
- New focused `src/tool-capabilities.js`: tool ownership/route/probe registry plus pure list/call availability projection.
- New focused `src/capability-resolver.js`: handshake I/O, strict normalization, single-flight, TTL, and fail-closed fallback.
- `src/server.js`: await the resolver for `tools/list` and pre-dispatch `tools/call`; keep JSON-RPC framing thin. Extract a testable request-handler/server factory if needed rather than embedding policy in the stdin loop.
- `src/tools.js`: retain schemas and dispatch wiring; export definitions/dispatch names for parity. Do not add capability business logic to this existing god-file-risk surface.
- `src/workflow-plans.js`: accept a capability view and materialize availability metadata from the shared tool policy.
- Focused Node/Python fixture tests and the smallest authoritative docs/README surfaces describing dynamic discovery and conditional wording.

Data flow: `tools/list or tools/call` -> `CapabilityResolver` -> `GET /capabilities` -> `strict normalized route view` -> `tool policy projection` -> `runtime-specific definitions / call guard`; workflow tools reuse that same projection -> `step availability + exact reason`.

## Implementation Slices

Keep one story but implement in dependency order:

1. Registry contract and parity: normalized Node/Python projections, both read-only endpoints, route/action/static checks.
2. MCP policy: tool ownership mapping, strict handshake resolver/cache, dynamic list, and call guard.
3. Workflow/wording: capability-aware plan materialization and truthful conditional descriptions.
4. Deterministic contract tests and docs, then full local QA.

This ordering keeps intermediate changes testable. None of the slices authorizes a bridge call, install/restart, Set mutation, push, tag, publish, render implementation, automation implementation, reorder implementation, or consolidation implementation.

## Test Scenarios and Expected Results

| Scenario | Target surface/environment | Expected observable result | How result is obtained |
| --- | --- | --- | --- |
| Registry parity | API + local sandbox | Node registry, Python registry, development routes, Remote Script routes, bridge actions, and tool route references contain the expected unique canonical routes; every status has a reason | Static imports/parsers and Python subprocess fixture; no server at the configured active port |
| Remote Script capability response | API + local Python fixture | Mode is `ableton-remote-script`; every mapped route has supported/conditional/unsupported plus non-empty reason; handler makes zero Live-thread calls | Instantiate pure projection/handler doubles and assert counters/state unchanged |
| Development capability response | API + ephemeral development bridge | Mode is `deterministic-development`; render, bounce, automation, reorder, consolidation, and mastering routes are supported | Listen on an OS-assigned ephemeral port and GET only `/capabilities` |
| Remote Script tool list | workflow/runtime + ephemeral fixture | Unsupported-only tools are absent; supported tools, qualifying hybrid MIDI import, local rendered analysis, local observability/risk/plans, and supported diagnostics remain; conditional descriptions include exact reasons/probes | Spawn MCP with fixture base URL, send JSON-RPC initialize and repeated `tools/list`, assert exact names/descriptions |
| Development tool list | workflow/runtime + ephemeral fixture | Development render/bounce/automation/reorder/consolidation/mastering tools remain visible | Same JSON-RPC fixture against development capability projection |
| Direct-call bypass | workflow/runtime + ephemeral fixture | Calling a hidden unsupported name returns stable capability error and fixture records zero downstream action requests | JSON-RPC `tools/call` plus request counter |
| Malformed/unreachable/stale handshake | workflow/runtime + local sandbox | Only local deterministic surface remains; no Live write is claimed; expired success is not reused; later successful re-list refreshes the view; requests/timeouts are bounded | Fake clock/fetch or ephemeral fixture returning malformed/incomplete/wrong-mode responses, then connection refusal and recovery |
| Conditional tools | API + local fixtures | Tools remain discoverable only with `Conditional:` text, exact reason, observable limitation, and named probe when available | Supported/conditional route matrices plus description assertions |
| Capability-aware workflows | API + workflow/runtime | Remote Script plans mark unsupported render/bounce/automation/reorder/consolidation steps blocked/non-executable with exact reasons; local analysis steps remain executable | Call both workflow-plan MCP tools under Remote Script, development, and fail-closed fixtures |
| Full quality gate | CLI + local sandbox | Focused Node/Python contracts, registry/static checks, `py_compile`, `npm test`, and `git diff --check` each exit 0; captured fixture counters show no active bridge or Set mutation | Developer/QA command output using only ephemeral ports and in-memory/fake bridge objects |

## Acceptance-Criteria Evidence Assessment

| Criterion | Status at architect handoff | Evidence judgment |
| --- | --- | --- |
| AC1 | Not satisfied; release-blocking | Contract, source of truth, and parity checks are designed, but no capability endpoint or passing parity output exists yet. |
| AC2 | Not satisfied; release-blocking | Tool ownership/filter rules are explicit, but no Remote Script JSON-RPC fixture has proved the exact retained/absent set. |
| AC3 | Not satisfied; release-blocking | Development and fail-closed behavior are specified, but no deterministic fixture output exists. |
| AC4 | Not satisfied; release-blocking | Conditional language and probe ownership are defined; tool descriptions and assertions are not implemented. |
| AC5 | Not satisfied; release-blocking | Workflow availability semantics are designed; current static workflow plans still recommend unsupported actions as ordinary steps. |
| AC6 | Not satisfied; release-blocking | No implementation test commands were run in this architecture-only phase. QA must retain exact exit codes and prove fixture request counters never contacted the configured active bridge or mutated a Set. |

## Risks and Controls

- Registry drift across Node/Python/actual handlers: canonical parity checks fail on missing, extra, duplicate, or reasonless routes.
- Stale capability cache: short success TTL, single-flight refresh, no stale-on-error, and fake-clock recovery tests.
- Over-filtering local/hybrid tools: explicit ownership registry and golden retained-name assertions for both modes and fallback.
- Discovery/call disagreement: one pure projection guards both list and direct invocation.
- Conditional support mistaken for guarantee: mandatory `Conditional:` wording, exact reason, observable limitations, and probe references.
- Client assumptions about static lists: preserve MCP schema shape, support repeated list calls, and document reconnect/re-list behavior.
- `src/tools.js` and `AbletonMcpBridge.py` are already large adapters: new domain policy and cache logic go in focused modules; existing entry points receive thin wiring only.
- Runtime context warned that ownership-directory contents were omitted and context was trimmed. Targeted read-only inspection covered the decisive registries, routes, adapters, tool dispatch, JSON-RPC handler, workflows, tests, and manifest; implementation/QA claims remain intentionally absent.

Rollback is code-only: revert dynamic projection/call-guard wiring and the new capability route together, restoring the prior static list. Do not retain a mixed state where plans or calls use a different policy from discovery. No data migration or Set rollback exists because the feature must not mutate Live during implementation or QA.

## Consumed Context Files

- `.agent-workflow/playbooks/architect.md` — read in full; applied boundary, data-flow, integration-contract, rollback-risk, sizing, and ADR requirements.
- `AGENTS.md` — root managed workflow rules applied: health/task/pre-run checks, active workflow, evidence discipline, gate approval, and no push/release.
- `rules/development/semantic-code.md` — read in full; applied domain naming, narrow models, typed registries, thin entry points, and behavior-oriented tests.
- `rules/architecture-decisions.mdc` — read in full; applied accepted ADR format, consequences, and alternatives.
- `rules/module-boundaries.mdc` — read in full; applied size/responsibility checks and kept policy out of 1,080-line `src/tools.js` and 526-line `AbletonMcpBridge.py`.
- `rules/development-engineering.mdc` — required runtime excerpt plus full local file read; applied project-first structure, adapter boundaries, and no new framework/dependency.
- Architect runtime prompt — read completely; applied unchanged AC1-AC6, ownership paths, prohibited operations, output metadata, context warning, and lifecycle command.
- Current task, approved PO handoff, estimate, workflow render, context, plan, delegation, skills, and protocol outputs — treated as the authoritative product/workflow contract.
- Targeted sources: `package.json`, `src/server.js`, `src/tools.js`, `src/bridge.js`, `src/workflow-plans.js`, `bridge/observability.js`, `bridge/http-server.js`, `bridge/server.js`, `bridge/development-adapter.js`, `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, `http_bridge.py`, `live_observability.py`, `test/observability.mjs`, `test/workflow-plans.mjs`, and MCP spawn-based tests.
- Source-of-truth guidance selected local task/PO/code first. No vendor API research was required because this phase designs repository-owned contracts and makes no new Live API claim.
- Doc-sync guidance identified docs as a Developer deliverable and requires its audit before later handoff; no product docs were edited in this architecture-only phase.
- PR-review and chaos-resilience guidance shaped the fail-closed, malformed/unreachable/stale-cache cases and missing-evidence assessment.
- Diagram-export was considered, but no separate diagram was necessary: the single linear data flow and boundary list are clearer in text, so no diagram artifact/lint was produced.
- Oclif, Playwright, static-analysis execution, and release-readiness instructions were not applicable to this architecture-only, non-UI, non-plugin, pre-implementation phase; their relevant registry/QA/release concerns are assigned to Developer/QA.

## Commands Run

- Orchestra health, active-task list, pre-run validation, task context, plan, delegation decision, skills plan/render, protocol render, workflow render, command manifest, and task/estimate inspection — completed. Health was degraded only by non-blocking optional generated-guidance refresh warnings; workflow readiness passed.
- `orchestra doc-sync audit` returned valid with warnings for already changed documentation surfaces lacking prompt-registry coverage. No product documentation was edited here; Developer/docs review must reconcile warnings for any documentation this task actually changes.
- Read-only `rg`, `sed`, `wc`, `jq`, and file-list inspection of targeted project patterns — completed; no network, bridge, or Ableton call.
- No build, test, install, restart, render, or Live smoke command was run because the assignment is architecture-only and explicitly prohibits active-bridge contact.

## Touched Files

- `.agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787181760099-a7f5ab-architect-architect-runtime-handoff.md` — created.
- Orchestra-generated story sizing/design decisions, evidence, architect review, and runtime lifecycle records — recorded after this handoff.
- Product code, tests, docs, Ableton installation, and Live Set state — unchanged.

## Pass/Fail Summary

- Architecture definition and implementable Developer handoff: **PASS**.
- Story sizing, scope assessment, source-of-truth, module boundaries, data flow, cache/failure policy, tests, and rollback: **PASS**.
- Acceptance/release evidence: **NOT YET PASSING**; AC1-AC6 require implementation and QA proof.
- Active bridge/Ableton/Set contact or mutation: **NONE**.
