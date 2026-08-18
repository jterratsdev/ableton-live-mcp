Task id: ableton-ssd-multi-output-workflow-20260817
Phase: qa
Role: qa
Runtime: codex-cli
Session id: ableton-ssd-multi-output-workflow-20260817:wfrun-1787002057777-44ad19:qa:codex-cli

# QA handoff: safe SSD5 multi-output MCP workflow

## Result

Approved after remediation. All four acceptance criteria now have deterministic observable evidence. The Remote Script and development adapter reject ambiguous exact display names, preserve exact identifier selection, reject unavailable source routing selectors before returning bootstrap guidance, and leave project state unchanged on each failure path.

No request was sent to the active Ableton bridge at `127.0.0.1:9789`. The focused Node integration used only an ephemeral development bridge, which started successfully without sandbox `EPERM`. Ableton was not installed, restarted, or mutated, and nothing was pushed, published, or deployed. Runtime validation in the user's Live version remains deferred as planned and active-Set apply still requires separate explicit approval.

## Findings

### QA-1 — Resolved — ambiguous exact display names now fail closed

- Affected artifact: `ableton_remote_scripts/AbletonMcpBridge/live_routing_options.py`, `resolve_routing`.
- Setup: two routing dictionaries have the same exact `display_name` (`Batería`) but different identifiers (`track-0`, `track-9`).
- Action: resolve/apply the duplicate display name, then repeat with the explicit `track-other` identifier.
- Expected: the display selector raises a 409-style ambiguity error with no mutation; the unique identifier selects its matching option.
- Actual: named Python tests and Node parity assertions pass. Ambiguous source and output labels are rejected, original track identities/state are preserved, and `track-other` is selected only when explicitly requested.
- Residual risk: Live's real routing objects and legacy property family remain unexecuted until the updated Remote Script is installed and Live is restarted; the shared resolver is covered locally with routing dictionaries.

### QA-2 — Resolved — plan rejects unavailable source routing type

- Affected artifact: `ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py`, `_source_context` / `_source_routing_option`.
- Setup: the fake Live song exposes `Batería` / `track-0`; the plan request supplies `sourceRoutingType: not-a-route`.
- Action: call `plan_plugin_output_routing` with `missing-routing-type` while no receiver is routed to the source.
- Expected: reject the unavailable exact routing selector before `receiver_required` and preserve project state.
- Actual: named Python and Node tests pass, asserting the unavailable error and byte-for-byte/identity-equivalent state preservation.
- Residual risk: none in the deterministic selector contract.

## Acceptance Criteria Coverage

| AC | Test type and fixture | Expected observable | Actual result | Status |
| --- | --- | --- | --- | --- |
| AC1: listed read-only plan asserts source and outputs | MCP/development fixture plus Python fake Live; plan-state identity check, ambiguous/unavailable-source cases, and exact identifier case | Tools list contains plan; state is unchanged; valid source returns channels/map; ambiguous/unavailable selectors reject; identifier is exact | Listing, no-mutation, valid map, fail-closed selectors, bootstrap distinction, and identifier precedence all pass | **Pass** |
| AC2: explicit apply creates exact named Monitor In receivers with readback | MCP-to-ephemeral-bridge and Python modern routing dictionaries | Exact names/type/channel, Monitor In `0`, `verified: true`; ambiguous source/output labels fail closed | Normal apply/readback passes; ambiguous source/output cases reject with unchanged/rolled-back state | **Pass** |
| AC3: unsupported/partial failure leaves no new tracks; retry is idempotent | Node and Python isolated state with unsupported channel, routing/name failures, conflicts, and repeated apply | Original identities/count remain after failure; second apply creates zero tracks | All supplied deterministic assertions pass | **Pass** |
| AC4: focused Node/Python and full gate pass without active mutation | Local sandbox and ephemeral loopback fixture | Every command exits 0; no request targets port 9789 | Focused suites, static checks, compile, diff check, and `npm test` exit 0; ephemeral listener succeeds | **Pass** |

## Test Scenarios and Expected Results

### Local sandbox / MCP integration fixture

- Setup: `DevelopmentAbletonAdapter`, ephemeral `127.0.0.1` port assigned by the OS, MCP dispatch, exact `Batería`/SSD5 fixture, and two output channels.
- Action: list/dispatch plan and apply, repeat apply, request unsupported channel, inject partial routing failure.
- Expected: read-only plan, exact verified receiver state, zero duplicates, and complete rollback.
- Obtained by: `node test/plugin-output-routing.mjs` exited 0 with `plugin output routing ok`.

### Local sandbox / Python fake-Live integration

- Setup: modern routing dictionaries, audio-track creation/deletion, name/routing failure injection, and monitoring readback.
- Action: execute all 11 unit/integration cases.
- Expected: plan no mutation, exact normal apply, idempotence, unsupported/conflict rejection, and identity-preserving rollback.
- Obtained by: `python3 test/live_plugin_routing_test.py` exited 0; 11 tests passed.

### Local sandbox / remediated ambiguous routing selectors

- Setup: two routing dictionaries with `display_name: Batería` and identifiers `track-0` / `track-9`.
- Action: run the named ambiguous-source, exact-identifier, and ambiguous-output tests.
- Expected: ambiguous display names reject without mutation; the explicit unique identifier succeeds; ambiguous output failure leaves no new receiver.
- Actual: all three named tests pass.

### Local sandbox / remediated unavailable source selector

- Setup: standard fake song whose only SSD source routing is `Batería` / `track-0`, with no routed observer.
- Action: run `test_unavailable_source_routing_type_is_not_a_bootstrap_diagnostic`.
- Expected: unavailable selector error before bootstrap guidance and unchanged song state.
- Actual: named test passes.

### Local sandbox / full regression gate

- Setup: current shared dirty worktree, preserving every pre-existing change.
- Action: run `npm test`.
- Expected: all deterministic suites pass without reaching the active Ableton bridge.
- Actual: exit 0; suite ended with `deterministic test suite ok`.

The selected surface is sufficient for deterministic contract, validation, routing mutation, rollback, and MCP wiring checks. Real Ableton runtime behavior is separately deferred because the updated Remote Script is not installed/restarted and active-Set apply requires explicit user approval. This planned deferral is not part of the task's local acceptance gate.

## Commands Run

- `orchestra health --runtime codex-cli --json` — completed; workflow ready, optional guidance drift only.
- `orchestra task list --json --status pending,blocked,in_progress` — active task found.
- `orchestra validate --pre-run --task ableton-ssd-multi-output-workflow-20260817 --json` — `isReady: true`, active context present.
- `python3 test/live_plugin_routing_test.py PluginOutputRoutingTest.test_duplicate_source_display_names_fail_closed_without_mutation PluginOutputRoutingTest.test_exact_identifier_selects_one_of_duplicate_display_names PluginOutputRoutingTest.test_unavailable_source_routing_type_is_not_a_bootstrap_diagnostic PluginOutputRoutingTest.test_duplicate_output_display_names_fail_and_rollback` — exit 0; 4 remediation tests passed.
- `node test/plugin-output-routing.mjs` — exit 0, `plugin output routing ok` with JavaScript parity and ephemeral MCP bridge.
- `python3 test/live_plugin_routing_test.py` — exit 0, 15 tests passed.
- `node test/remote-script-static.mjs` — exit 0.
- `node test/risk-policy.mjs` — exit 0.
- `node test/observability.mjs` — exit 0.
- `python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing_validation.py ableton_remote_scripts/AbletonMcpBridge/live_routing_options.py` — exit 0.
- `git diff --check` — exit 0.
- `npm test` — exit 0; all deterministic suites passed.

## Touched Files

- `.agent-workflow/handoffs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-qa-qa-runtime-handoff.md` — this QA evidence and findings artifact.
- `.generated-prompts/tests.md` — Prompt Registry entry for this substantial QA evidence package.
- Orchestra evidence/review/lifecycle state generated by the required workflow commands.

No product implementation or test source was changed by QA.

## Consumed Context Files

- `.agent-workflow/runs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-qa-runtime-codex-cli-spawn-prompt.md` — read completely and applied.
- `.agent-workflow/runs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-qa-runtime-codex-cli-context-manifest.json` — inspected; directory sources were intentionally reduced and the targeted files were then read directly.
- `.agent-workflow/playbooks/qa.md` — full AC matrix, observable evidence, regression, and release-blocking requirements applied.
- `AGENTS.md` — Orchestra preflight, active-workflow, evidence, gate, and no-push rules applied.
- `rules/development/semantic-code.md` — naming/module-boundary review applied.
- `rules/testing-discipline.mdc` — focused-before-full, deterministic fixture, collection, and QA evidence rules applied.
- `rules/delivery-quality-gates.mdc` — developer handoff, blocking evidence gaps, and cross-review requirements applied.
- `rules/agent-collaboration.mdc` — explicit findings and handoff contract applied.
- `skills/collection-standards/SKILL.md` — applied to duplicate collections, bounded routes, and shared fixture/source-of-truth review.
- `skills/qa-evidence-pack/SKILL.md` — applied to AC mapping, command observables, integration effects, and deferral handling.
- `skills/prompt-registry/SKILL.md` — applied; `.generated-prompts/tests.md` was read fully and updated.
- `skills/source-of-truth/SKILL.md` — applied; local task, code, tests, docs, and workflow evidence were authoritative.
- `skills/pr-review/SKILL.md` — applied; findings lead the review and cover behavior, tests, risks, and rollback.
- `skills/static-analysis/SKILL.md` — applied; configured focused checks preceded the full gate.
- `audio-video-transcription`, `oclif-plugin-development`, `playwright-evidence`, `release-readiness`, `diagram-export`, `doc-sync`, and `model-evaluation` were selected heuristically by Orchestra but were not applicable: this QA had no media, oclif plugin, UI, diagram, release execution, documentation change, or model/provider behavior. No required context file was missing.

## Risks and Remaining Work

- Both prior High findings are resolved with focused negative/positive assertions and full regression evidence.
- Deferred runtime validation (owner: user/project): install/restart the updated Remote Script, run only the read-only plan against the active Set, and separately approve any apply call. SSD5's internal mixer assignments remain manual.
- The legacy Live routing property family shares the tested resolver but was not separately instantiated by the fake-Live suite; validate it only if the installed Live version selects that compatibility branch.
- Before `qa→release`, Orchestra still requires BA/PO acceptance comparison and Architect contract review; QA approval alone is not a release authorization.

## Close Status

QA remediation revalidation completed with **approve**. All task acceptance criteria pass locally with observable evidence. Preserve the explicit real-Live runtime deferral and do not apply routing to the active Set without separate user approval.
