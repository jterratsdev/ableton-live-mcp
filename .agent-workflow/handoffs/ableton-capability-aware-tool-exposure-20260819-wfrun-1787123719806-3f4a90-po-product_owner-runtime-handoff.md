Task id: ableton-capability-aware-tool-exposure-20260819
Phase: po
Role: product_owner
Runtime: codex-cli
Session id: ableton-capability-aware-tool-exposure-20260819:wfrun-1787123719806-3f4a90:po:codex-cli

# Product Owner Handoff

## Outcome

The capability-gap audit is refined into a testable product contract. The backlog item is ready for architecture review, but the product acceptance criteria are not yet implemented or verified and remain release-blocking.

- Backlog item: `ableton-capability-aware-tool-exposure-20260819`
- Goal: make MCP discovery and workflow guidance truthful for the active bridge without hiding MCP-owned local value.
- Priority: high. The current public MCP contract can recommend or expose operations that the real Remote Script deterministically rejects.
- Dependencies: the completed read-only audit `ableton-mcp-capability-gap-audit-20260819`; no incomplete task dependency.
- Recommended size: medium. The work crosses the capability handshake, route/tool mapping, `tools/list`, workflow plans, descriptions, documentation, and two-language contract tests.
- Split decision: keep one story. These surfaces must share one capability contract and parity gate; splitting them would permit a release where discovery, invocation guidance, and documentation disagree. Architecture may create implementation subtasks, but all six acceptance criteria remain one release unit.
- Close status: PO phase complete; task open and not release-ready.

## Product Rules

1. `supported` means the active bridge mode declares the mapped HTTP route executable without an additional target-level capability probe.
2. `unsupported` means a tool whose only execution path requires that route is absent from `tools/list`. The capability response and any blocked workflow step retain the bridge's exact non-empty reason.
3. `conditional` means the tool may remain discoverable only when its MCP description names the condition and observable limitation. Where a target-level read-only probe exists, execution guidance must require it before mutation.
4. `mcp-local` means the useful work is owned by the MCP process and is not removed merely because a similarly named direct bridge route is unsupported. This preserves local MIDI-file parsing/import orchestration, rendered-file analysis, diagnostics, and risk/planning tools, subject to any actual supported downstream route they require.
5. A missing, unreachable, schema-invalid, unknown-status, duplicate-route, or otherwise malformed capability handshake fails closed. The deterministic fallback exposes MCP-local tools plus non-mutating bridge capability/status diagnostics only; it exposes no tool that requires a Live write route whose support is unknown.
6. Capability state is scoped to the active bridge connection. A reconnect or bridge-mode change cannot reuse a previous bridge's support claims. Clients may request `tools/list` again to observe the new state.
7. The Remote Script hard-unsupported set includes device reorder, automation writing, render export, track/stem bounce, render-backed analyze-and-apply mastering, and clip consolidation. Their corresponding tools must not be exposed as executable in Remote Script mode. Development mode retains them when its capability fixture declares support.
8. Save and Save As remain out of scope and absent; this story must not introduce them.

## Refined Acceptance Criteria

### AC1 — Normalized capability handshake and registry parity

Given either bridge implementation starts under an ephemeral fixture, when its capability endpoint is read, then the response contains a versioned schema, the active bridge mode, and exactly one entry for every mapped HTTP method/path pair. Every entry has one of `supported`, `conditional`, or `unsupported` plus a non-empty reason for non-supported status. A parity test compares the complete method/path key set with the Node route registry in both directions and fails on a missing, extra, or duplicate entry.

### AC2 — Truthful Remote Script `tools/list` with local-value preservation

Given a valid Remote Script fixture containing supported, conditional, and unsupported route entries, when JSON-RPC `initialize` and `tools/list` run, then every tool whose complete execution path is hard-unsupported is absent. At minimum, Remote Script discovery omits `ableton_reorder_device`, `ableton_set_automation`, `ableton_export_render`, `ableton_bounce_tracks`, `ableton_analyze_and_apply_mastering`, and `ableton_consolidate_clip`. The same response retains tools backed by supported routes and retains MCP-owned local MIDI import/orchestration, rendered-file analysis, diagnostics, production-risk/planning tools, and capability/status diagnostics. Tests assert both the deny set and representative retained tools so filtering cannot pass by returning an empty or over-filtered list.

### AC3 — Development parity and conservative handshake failure

Given the deterministic development bridge fixture, when `tools/list` runs, then development-supported render, bounce, automation, device reorder, consolidation, and mastering tools remain present. Given unreachable, timeout, non-JSON, wrong-version, missing-mode, missing-route, duplicate-route, unknown-status, or incomplete capability responses, repeated `tools/list` calls return the same conservative fallback list, do not throw an unhandled JSON-RPC error, and expose no Live-write tool whose support is unknown. A reconnect to a different bridge mode invalidates prior capability state and a subsequent `tools/list` reflects the new fixture.

### AC4 — Conditional capability language and target probes

Given a tool depends on host-, edition-, object-, device-, or target-specific support, when it remains discoverable, then its description identifies the condition, the required preflight/readback where available, and the observable limit. Contract assertions cover at least:

- snapshots: bridge-owned, in-memory/partial rollback metadata; not an `.als` save, full project backup, or guarantee that every field can be restored;
- plugin inventory: Ableton browser/index results are not an exhaustive inventory of every file installed on disk;
- plugin parameters: only parameters exposed by Live, including the existing automatable/exposed limitations, may be listed or set;
- mastering: support depends on the exact master-chain target, loadability, exposed parameters, and route support; it does not imply render support;
- meters: only host-observable meter values are reported and absence/staleness is explicit;
- locators: create/update support is capability-gated and does not imply broader Arrangement editing;
- Arrangement insertion/deletion: exact track/slot/time target probes, readback, plan-token, rollback/undo, and host-method limits remain explicit.

The descriptions must not use unconditional verbs such as “will render,” “will reorder,” or “will restore the project” when the declared support is conditional.

### AC5 — Capability-aware workflow plans

Given each high-level workflow plan and a Remote Script fixture, when the plan is returned through MCP, then a step requiring an unsupported route is either omitted or represented as non-executable/blocked with the exact capability reason from the handshake. It is never presented as an executable recommendation. Remote Script plan assertions explicitly cover render, bounce, automation writing, device reorder, and consolidation. Local post-render analysis may remain only as a step that consumes an already-existing user-supplied file; it cannot imply that Remote Script created that file. The equivalent development fixture retains executable steps it declares supported.

### AC6 — Offline verification and no-Live safety

Given only ephemeral Node/Python fixtures and repository files, when the focused capability-handshake, route parity, `tools/list`, conditional-description, reconnect/cache, and workflow-plan contracts run, then each reports its documented success marker and exits 0. `py_compile`, configured static/registry checks, `npm test`, and `git diff --check` also exit 0. Captured evidence must list exact commands and prove no request was sent to the active bridge, no Remote Script was installed or restarted, and no Live Set was read, saved, or mutated.

## Assumptions

- MCP `tools/list` resolution may be asynchronous and clients can refresh the list after reconnect.
- The bridge capability response is the authority for bridge-route support; MCP ownership metadata is the authority for local tools.
- Method plus normalized path is the route identity. Query parameters and target identifiers do not create separate registry keys.
- Exact capability reasons are stable enough to propagate into blocked workflow steps; tests may normalize transport framing but not replace the substantive reason.
- Conditional target probes are read-only before any mutation and existing risk/approval controls remain in force.

## Non-Goals

- Do not implement render, bounce, save/Save As, automation writing, device reordering, consolidation, or new Live SDK behavior.
- Do not make bridge support claims by inferring Live edition or host version when the capability response does not prove them.
- Do not contact the active bridge, inspect the user's current Set, install/reinstall the Remote Script, restart Live, or mutate/save any Set.
- Do not turn MCP-local tools into Remote Script routes solely to simplify filtering.
- Do not promise exhaustive plugin discovery, full snapshot rollback, complete meter availability, or general Arrangement editing.
- Do not push, publish, deploy, or release as part of this story.

## Ambiguities Resolved

- “Unsupported route” does not automatically mean “remove the similarly named MCP tool”: local MIDI import and rendered-file analysis are preserved when their actual execution path is MCP-owned.
- “Conditional” is not equivalent to “supported”: it requires explicit discovery copy and a target-level probe/readback where one exists.
- “Conservative deterministic list” is not an empty list and is not the development list. It keeps local/non-mutating diagnostics while making unknown Live writes undiscoverable.
- “Exact capability reason” means the substantive reason supplied by the active handshake, not a generic MCP rewrite such as “unsupported.”
- Workflow plans may show a blocked step for explanation, but a blocked step must be structurally non-executable and cannot be phrased as a recommendation to call the tool.

## Competing Interpretations and Tradeoffs

- Static global tool exposure is simpler but preserves misleading promises; dynamic per-connection exposure is required despite cache and reconnect complexity.
- Removing every tool associated with an unsupported direct route is safer-looking but destroys valid MCP-local workflows; explicit ownership metadata is required instead.
- Hiding conditional tools would minimize runtime errors but make valid target-specific behavior undiscoverable; truthful conditional descriptions plus probes preserve value.
- Falling back to the development registry maximizes discoverability but can claim unsupported Live writes. Failing closed on route-dependent writes is the accepted tradeoff.

## Edge Cases for Architecture and QA

- One tool requires multiple routes and only one is unsupported.
- Multiple tools share one route, or one tool can choose between local and route-backed execution paths.
- Capability response has duplicate method/path entries with conflicting statuses.
- Capability response is internally valid but omits a newly registered Node route.
- Bridge changes from development to Remote Script, or vice versa, during a long-lived MCP process.
- A stale cache survives reconnect, timeout, process restart, or capability schema-version change.
- A conditional tool's global route is supported but the exact target probe is unsupported or unavailable.
- A workflow mixes unsupported rendering with valid analysis of a user-provided existing file.
- A direct `/midi/import` route is unsupported while MCP-local parsing plus supported MIDI clip creation remains usable.

## Test Scenarios and Expected Results

| Scenario | Target surface/environment | Expected observable result | How obtained in this PO phase |
|---|---|---|---|
| Remote Script registry parity | API, local sandbox | Mode and all method/path entries have valid status/reasons; Node and Python route key sets are equal | Refined from the completed audit and recorded as AC1; implementation evidence pending |
| Remote Script tool filtering | API, integration, local sandbox | Six named hard-unsupported tools are absent; representative supported and MCP-local tools remain | Deny/retain assertions specified in AC2; implementation evidence pending |
| Development capability preservation | API, integration, local sandbox | Development-supported render/bounce/automation/reorder/consolidation/mastering tools remain | Positive fixture specified in AC3; implementation evidence pending |
| Handshake failure and reconnect | Workflow/runtime, integration, local sandbox | Malformed/unreachable handshakes fail closed deterministically; bridge-mode change invalidates stale state | Negative matrix and cache observable specified in AC3; implementation evidence pending |
| Conditional descriptions | Generated artifact, API | Snapshot/plugin/mastering/meter/locator/Arrangement descriptions state exact limits and probes | Required copy assertions specified in AC4; implementation evidence pending |
| Workflow-plan filtering | API, workflow/runtime | Unsupported Remote Script steps are omitted or structurally blocked with exact reason; development-supported steps remain | Plan matrix specified in AC5; implementation evidence pending |
| Offline safety gate | CLI, local sandbox | All focused/full checks exit 0 and evidence proves no active bridge/Live contact or mutation | Required command/evidence contract specified in AC6; execution belongs to developer/QA |

## Acceptance-Criterion Evidence Assessment

| Criterion | PO evidence status | Release assessment |
|---|---|---|
| AC1 | Contract refined; no implementation/test output | Blocking until handshake and bidirectional parity tests pass |
| AC2 | Exact deny/retain behavior defined; no `tools/list` output | Blocking until Remote Script fixture assertions pass |
| AC3 | Development and failure matrices defined; no cache/reconnect output | Blocking until deterministic fixture assertions pass |
| AC4 | Required conditional language and surfaces defined; product descriptions unchanged | Blocking until description/probe contracts pass |
| AC5 | Workflow behavior defined; plan outputs unchanged | Blocking until Remote Script and development workflow assertions pass |
| AC6 | Offline safety and command gate defined; commands not executed in PO scope | Blocking until developer and QA attach exact passing command evidence |

No product acceptance criterion is claimed satisfied by this PO artifact. The evidence is sufficient only to complete backlog refinement and proceed to the `po→architect` human gate. No risk is accepted for releasing without the downstream evidence.

## Risks

- Over-filtering can hide valid MCP-local tools or supported development-only behavior.
- Under-filtering can expose a mutation tool that deterministically returns 501 in Remote Script mode.
- Stale or cross-bridge cache state can make `tools/list` truthful at startup but false after reconnect.
- User-facing descriptions and workflow plans can drift from the registry even when filtering is correct.
- A partial capability response can look valid unless parity is bidirectional and duplicate-aware.

## Documentation Contract

Implementation must update the smallest authoritative user-facing surfaces that currently imply unavailable behavior, including MCP tool descriptions and workflow guidance, and keep compatibility/bridge documentation aligned with the normalized capability contract. The Doc Sync audit is required before the implementation handoff. This PO phase changes no product documentation or prompt registry because it changes only the workflow handoff artifact.

## Consumed Context Files

- `.agent-workflow/runs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787123719806-3f4a90-po-runtime-codex-cli-spawn-prompt.md` — read completely; applied scope, return contract, allowed behavior, required metadata, and lifecycle command.
- `.agent-workflow/playbooks/po.md` — read completely; applied testable outcomes, assumptions, non-goals, ambiguity, tradeoffs, sizing/split, dependencies, and edge cases.
- `AGENTS.md` — read completely; applied Orchestra preflight, active workflow, validation/bypass record, evidence/review, gate, and no-push rules.
- `skills/doc-sync/SKILL.md` — read completely; applied documentation-surface and audit requirements. Product docs were not changed because implementation is out of PO scope.
- Orchestra task/context, plan, delegation, skills, protocol, and PO workflow render outputs — applied as the active control-plane context.
- `.agent-workflow/evidence/ableton-mcp-capability-gap-audit-20260819-1787122982712-29f62771-6f5c-4efa-9c6d-f0cf5d82d4ca-report.md` and `.agent-workflow/reviews/ableton-mcp-capability-gap-audit-20260819-qa-review.md` — used as the completed audit authority.
- Targeted `src/tools.js` and `src/workflow-plans.js` inspection — used only because the reduced context omitted exact public tool names and workflow surfaces; no file was edited.
- Directory references `src`, `bridge`, `ableton_remote_scripts/AbletonMcpBridge`, `docs`, and `test` were reduced in the runtime context. Only targeted read-only inspection was used; implementation and verification confidence therefore remain intentionally unclaimed.

Required rules not applicable: no product code, README/docs, prompt registry, tests, installation, restart, active bridge call, Live Set operation, benchmark, release, publish, or deployment action was authorized for this PO assignment.

## Touched Files

- `.agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787123719806-3f4a90-po-product_owner-runtime-handoff.md`
- `.agent-workflow/decisions/ableton-capability-aware-tool-exposure-20260819-1787123795885-decision.md`
- `.agent-workflow/evidence/ableton-capability-aware-tool-exposure-20260819-1787123962235-b1344415-a40f-40bd-8a16-a918e505adc6-file.md`
- `.agent-workflow/reviews/ableton-capability-aware-tool-exposure-20260819-product_owner-review.md`
- Orchestra lifecycle records created by the required completion self-report.

## Commands Run

- `orchestra health --runtime codex-cli --json` — pass with non-blocking generated-guidance warnings; workspace workflow ready.
- `orchestra task list --json --status pending,blocked,in_progress` — pass; matching active task found.
- `orchestra validate --pre-run --task ableton-capability-aware-tool-exposure-20260819 --json` — expected fail for missing phase-output evidence/review; estimate and workflow run present, active context true.
- `orchestra context --task ableton-capability-aware-tool-exposure-20260819 --json` — pass.
- `orchestra delegation decide --task ableton-capability-aware-tool-exposure-20260819 --json` — pass; single Product Owner delegate recommended.
- `orchestra plan --task ableton-capability-aware-tool-exposure-20260819 --json` — pass.
- `orchestra skills plan --task ableton-capability-aware-tool-exposure-20260819 --json` — pass; Doc Sync applicable to Product Owner.
- `orchestra protocol render --json` — pass.
- `orchestra workflow render --task ableton-capability-aware-tool-exposure-20260819 --phase po --target codex --json` — pass.
- `orchestra context --task ableton-mcp-capability-gap-audit-20260819 --json` — pass; completed audit context loaded.
- `orchestra validate --pre-run --task ableton-capability-aware-tool-exposure-20260819 --bypass --bypass-rationale ... --json` — pass/allowed; bypass records that evidence and review are outputs of this non-product PO phase.
- `orchestra doc-sync audit --task ableton-capability-aware-tool-exposure-20260819` — pass with pre-existing prompt-registry coverage warnings for README and several docs; no product documentation changed in PO scope, so implementation must reconcile warnings for any surface it edits.
- `orchestra evidence add --task ableton-capability-aware-tool-exposure-20260819 --role product_owner --type file --summary ...` — pass; PO handoff evidence recorded.
- `orchestra review --task ableton-capability-aware-tool-exposure-20260819 --role product_owner --result approve ...` — pass; PO refinement approved for architecture review only, with AC1–AC6 still release-blocking.
- Final `orchestra validate --pre-run --task ableton-capability-aware-tool-exposure-20260819 --json` — pass; task, estimate, active workflow, PO evidence, and PO review are all present.
- Read-only `sed`/`rg` commands — pass; loaded required files, audit artifacts, and exact tool/workflow names.

## Pass/Fail Result

- PO refinement: pass.
- Product implementation acceptance: fail/not yet executed; all AC1–AC6 release blockers remain.
- Safety constraints: pass. No product code was edited, no active bridge or Live Set was contacted, and nothing was installed, restarted, saved, mutated, pushed, published, or deployed.
