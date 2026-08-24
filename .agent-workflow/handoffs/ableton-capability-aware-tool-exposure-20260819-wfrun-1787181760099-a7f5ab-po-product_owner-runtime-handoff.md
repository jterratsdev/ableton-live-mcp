Task id: ableton-capability-aware-tool-exposure-20260819
Phase: po
Role: product_owner
Runtime: codex-cli
Session id: ableton-capability-aware-tool-exposure-20260819:wfrun-1787181760099-a7f5ab:po:codex-cli

# Product Owner Recovery Handoff

## Outcome

The previously user-approved AC1–AC6 product contract was re-read and validated without material change. It remains internally consistent with the active Orchestra task goal, scope, assumptions, architecture approval, risk gate, and verifier contract. This recovery run replaces a stale downstream session; it does not reopen product scope.

- Backlog item: `ableton-capability-aware-tool-exposure-20260819`
- Goal: make MCP discovery and workflow guidance truthful for the active bridge without hiding MCP-owned local value.
- Priority: high because the public MCP contract can otherwise advertise operations that the Remote Script cannot execute.
- Dependencies: satisfied; the completed read-only capability-gap audit remains the discovery authority.
- Size/split: preserve the approved medium, single-release-unit framing. The capability handshake, route/tool mapping, discovery, workflow guidance, copy, docs, and parity tests must agree atomically. Architecture may create implementation subtasks, but AC1–AC6 remain one acceptance unit.
- Material scope changes: none.
- Close status: PO recovery phase complete; task remains open and not release-ready.

## Product Rules

1. `supported` means the active bridge mode declares the mapped HTTP route executable without an additional target-level capability probe.
2. `unsupported` means a tool whose only execution path requires that route is absent from `tools/list`. The capability response and any blocked workflow step retain the bridge's exact non-empty reason.
3. `conditional` means the tool may remain discoverable only when its MCP description names the condition and observable limitation. Where a target-level read-only probe exists, execution guidance must require it before mutation.
4. `mcp-local` means useful work owned by the MCP process is not removed merely because a similarly named direct bridge route is unsupported. This preserves local MIDI-file parsing/import orchestration, rendered-file analysis, diagnostics, and risk/planning tools, subject to any supported downstream route actually required.
5. A missing, unreachable, schema-invalid, unknown-status, duplicate-route, or otherwise malformed capability handshake fails closed. The deterministic fallback exposes MCP-local tools plus non-mutating bridge capability/status diagnostics only; it exposes no tool requiring a Live write route whose support is unknown.
6. Capability state is scoped to the active bridge connection. A reconnect or bridge-mode change cannot reuse a previous bridge's support claims. Clients may request `tools/list` again to observe the new state.
7. The Remote Script hard-unsupported set includes device reorder, automation writing, render export, track/stem bounce, render-backed analyze-and-apply mastering, and clip consolidation. Corresponding tools must not be exposed as executable in Remote Script mode. Development mode retains them when its fixture declares support.
8. Save and Save As remain out of scope and absent; this story must not introduce them.

## Refined Acceptance Criteria — Preserved Contract

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
- plugin parameters: only parameters exposed by Live, including existing automatable/exposed limitations, may be listed or set;
- mastering: support depends on the exact master-chain target, loadability, exposed parameters, and route support; it does not imply render support;
- meters: only host-observable meter values are reported and absence/staleness is explicit;
- locators: create/update support is capability-gated and does not imply broader Arrangement editing;
- Arrangement insertion/deletion: exact track/slot/time target probes, readback, plan-token, rollback/undo, and host-method limits remain explicit.

Descriptions must not use unconditional verbs such as “will render,” “will reorder,” or “will restore the project” when declared support is conditional.

### AC5 — Capability-aware workflow plans

Given each high-level workflow plan and a Remote Script fixture, when the plan is returned through MCP, then a step requiring an unsupported route is either omitted or represented as non-executable/blocked with the exact capability reason from the handshake. It is never presented as an executable recommendation. Remote Script plan assertions explicitly cover render, bounce, automation writing, device reorder, and consolidation. Local post-render analysis may remain only as a step consuming an already-existing user-supplied file; it cannot imply that Remote Script created that file. The equivalent development fixture retains executable steps it declares supported.

### AC6 — Offline verification and no-Live safety

Given only ephemeral Node/Python fixtures and repository files, when the focused capability-handshake, route parity, `tools/list`, conditional-description, reconnect/cache, and workflow-plan contracts run, then each reports its documented success marker and exits 0. `py_compile`, configured static/registry checks, `npm test`, and `git diff --check` also exit 0. Captured evidence must list exact commands and prove no request was sent to the active bridge, no Remote Script was installed or restarted, and no Live Set was read, saved, or mutated.

## Assumptions

- MCP `tools/list` resolution may be asynchronous and clients can refresh the list after reconnect.
- The bridge capability response is authoritative for bridge-route support; MCP ownership metadata is authoritative for local tools.
- Method plus normalized path is the route identity; query parameters and target identifiers do not create separate registry keys.
- Exact capability reasons are stable enough to propagate into blocked workflow steps; transport framing may be normalized in tests, but the substantive reason may not be replaced.
- Conditional target probes are read-only before mutation, and existing risk/approval controls remain in force.

## Non-Goals

- Do not implement render, bounce, save/Save As, automation writing, device reordering, consolidation, or new Live SDK behavior.
- Do not infer bridge support from Live edition or host version when the capability response does not prove it.
- Do not contact the active bridge, inspect the user's current Set, install/reinstall the Remote Script, restart Live, or mutate/save any Set.
- Do not turn MCP-local tools into Remote Script routes solely to simplify filtering.
- Do not promise exhaustive plugin discovery, full snapshot rollback, complete meter availability, or general Arrangement editing.
- Do not push, publish, deploy, or release as part of this story.

## Ambiguities, Interpretations, and Tradeoffs

- An unsupported route does not automatically remove a similarly named MCP-local tool; ownership and complete execution path decide exposure.
- Conditional does not mean supported; it requires explicit discovery copy and a target probe/readback where one exists.
- The conservative fallback is neither empty nor the development list: it retains local and non-mutating diagnostics while hiding route-dependent writes with unknown support.
- Exact capability reason means the substantive active-handshake reason, not a generic MCP rewrite.
- Workflow plans may retain blocked steps for explanation only when they are structurally non-executable and are not phrased as recommendations.
- Dynamic, per-connection exposure adds cache complexity but is required; static global discovery is not truthful.
- Explicit ownership metadata avoids over-filtering MCP-local value, while fail-closed route handling avoids under-filtering unsafe writes.

## Edge Cases for Architecture and QA

- A tool requires multiple routes and only one is unsupported.
- Multiple tools share one route, or one tool can choose between local and route-backed paths.
- Duplicate method/path entries declare conflicting statuses.
- A syntactically valid response omits a newly registered Node route.
- The bridge changes mode during a long-lived MCP process.
- Stale capability state survives reconnect, timeout, process restart, or schema-version change.
- A conditional global route is supported but the exact target probe is unsupported or unavailable.
- A workflow mixes unsupported rendering with valid analysis of an existing user-supplied file.
- Direct `/midi/import` is unsupported while MCP-local parsing plus supported clip creation remains usable.

## Test Scenarios and Expected Results

| Scenario | Target surface/environment | Expected observable result | How obtained in this PO recovery phase |
|---|---|---|---|
| Contract preservation | Generated artifact, workflow/runtime | AC1–AC6 and product rules retain the approved semantics with no material additions or removals | Exact comparison against the prior approved PO handoff and active task context; no product execution claimed |
| Remote Script registry parity | API, local sandbox | Mode and all method/path entries have valid statuses/reasons; Node and Python key sets match bidirectionally | Preserved as AC1; implementation evidence pending |
| Remote Script filtering | API, integration, local sandbox | Six named hard-unsupported tools are absent; representative supported and MCP-local tools remain | Preserved deny/retain assertions in AC2; implementation evidence pending |
| Development and handshake failures | API, integration, workflow/runtime | Development support stays visible; malformed/unreachable handshakes fail closed deterministically; reconnect invalidates stale state | Preserved positive/negative/cache matrix in AC3; implementation evidence pending |
| Conditional descriptions | Generated artifact, API | Snapshot, plugin, mastering, meter, locator, and Arrangement copy states exact limits and probes | Preserved contract in AC4; implementation evidence pending |
| Workflow filtering | API, workflow/runtime | Unsupported Remote Script steps are omitted or blocked with the exact reason; development-supported steps remain executable | Preserved contract in AC5; implementation evidence pending |
| Offline safety | CLI, local sandbox | Focused/full checks exit 0 and prove no active bridge or Live contact or mutation | Preserved command/evidence gate in AC6; execution belongs to developer and QA |

## Acceptance-Criterion Evidence Assessment

| Criterion | PO evidence status | Release assessment |
|---|---|---|
| AC1 | Approved contract preserved; no implementation/test output | Blocking until handshake and bidirectional parity tests pass |
| AC2 | Approved deny/retain contract preserved; no `tools/list` output | Blocking until Remote Script fixture assertions pass |
| AC3 | Approved development/failure/cache contract preserved; no runtime output | Blocking until deterministic fixture assertions pass |
| AC4 | Approved conditional-language contract preserved; no product-copy evidence | Blocking until description/probe contracts pass |
| AC5 | Approved workflow semantics preserved; no plan-output evidence | Blocking until Remote Script and development workflow assertions pass |
| AC6 | Approved offline gate preserved; implementation checks not run in PO scope | Blocking until developer and QA attach exact passing command evidence |

No product acceptance criterion is claimed satisfied by this recovery handoff. Evidence is sufficient only to complete PO recovery and return the unchanged contract to architecture. No release risk is accepted.

## Risks

- Over-filtering can hide valid MCP-local tools or supported development-only behavior.
- Under-filtering can expose a mutation tool that the Remote Script deterministically rejects.
- Stale or cross-bridge state can make discovery truthful at startup but false after reconnect.
- Descriptions and workflow plans can drift from the registry even when filtering is correct.
- A partial capability response can look valid unless parity is bidirectional and duplicate-aware.
- Recovery risk: a downstream rerun could accidentally reinterpret approved scope. This handoff prevents that by preserving AC1–AC6 and explicitly recording no material change.

## Documentation Contract

Implementation must update the smallest authoritative user-facing surfaces that imply unavailable behavior and keep compatibility/bridge documentation aligned with the normalized capability contract. The Doc Sync audit passed with pre-existing prompt-registry warnings for several README/docs surfaces; those warnings must be reconciled by implementation when those surfaces are edited. This PO recovery changes no product documentation or prompt registry.

## Consumed Context Files

- `.agent-workflow/runs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787181760099-a7f5ab-po-runtime-codex-cli-spawn-prompt.md` — read completely; applied role, scope, required metadata, return contract, safety constraints, and lifecycle command.
- `.agent-workflow/playbooks/po.md` — read completely; applied testable outcomes, assumptions, non-goals, ambiguities, tradeoffs, sizing/split, dependencies, and edge cases.
- `AGENTS.md` — read completely; applied preflight, active-context validation, evidence/review, lifecycle, gate, and no-push rules.
- `skills/doc-sync/SKILL.md` — read completely; applied documentation-surface and audit requirements. Product docs were not changed because implementation is out of PO scope.
- `.agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787123719806-3f4a90-po-product_owner-runtime-handoff.md` — read completely and used as the user-approved AC1–AC6 authority for this recovery run.
- `.agent-workflow/reviews/ableton-capability-aware-tool-exposure-20260819-product_owner-review.md` and `.agent-workflow/evidence/ableton-capability-aware-tool-exposure-20260819-1787123962235-b1344415-a40f-40bd-8a16-a918e505adc6-file.md` — read completely; validated prior PO approval and the absence of implementation claims.
- Orchestra task/context, delegation, plan, skills, protocol, validation, and PO workflow-render output — used as the active control-plane context.
- Directory references `src`, `bridge`, `ableton_remote_scripts/AbletonMcpBridge`, `docs`, and `test` remained reduced in the runtime packet. No deeper product-file inspection was needed because recovery scope was contract preservation, not implementation verification.

Required rules not applicable: product-code edits, implementation commands, tests, README/docs or prompt-register edits, installation/restart, active bridge calls, Live Set operations, benchmark, release, push, tag, publish, and deployment were outside this PO recovery assignment.

## Touched Files

- `.agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787181760099-a7f5ab-po-product_owner-runtime-handoff.md`
- `.agent-workflow/evidence/ableton-capability-aware-tool-exposure-20260819-1787181979122-f357cdb5-a0f6-4b0f-9dde-230a14514185-file.md`
- `.agent-workflow/reviews/ableton-capability-aware-tool-exposure-20260819-product_owner-review.md`
- Orchestra lifecycle record generated by the required completion self-report.

## Commands Run

- `orchestra health --runtime codex-cli --json` — pass; workflow ready, with non-blocking optional generated-guidance refresh warnings.
- `orchestra task list --json --status pending,blocked,in_progress` — pass; matching active task and recovery phase task found.
- `orchestra validate --pre-run --task ableton-capability-aware-tool-exposure-20260819 --json` — pass; task, estimate, workflow run, evidence, review, and active context present.
- `orchestra context --task ableton-capability-aware-tool-exposure-20260819` — pass; prior PO evidence/review and user-approved architecture/risk context confirmed.
- `orchestra delegation decide --task ableton-capability-aware-tool-exposure-20260819` — pass; single Product Owner delegate recommended.
- `orchestra plan --task ableton-capability-aware-tool-exposure-20260819` — pass.
- `orchestra skills plan --task ableton-capability-aware-tool-exposure-20260819` — pass; Doc Sync applicable to Product Owner.
- `orchestra protocol render` — pass.
- `orchestra workflow render --task ableton-capability-aware-tool-exposure-20260819 --phase po --target codex --json` — pass.
- `orchestra doc-sync audit --task ableton-capability-aware-tool-exposure-20260819` — pass with pre-existing prompt-registry coverage warnings; no product documentation changed in this phase.
- `orchestra evidence add --task ableton-capability-aware-tool-exposure-20260819 --role product_owner --type file --summary ...` — pass; recovery handoff and no-product/no-Live safety evidence recorded.
- `orchestra review --task ableton-capability-aware-tool-exposure-20260819 --role product_owner --result approve ...` — pass; approved only for architecture continuation, with AC1–AC6 still release-blocking.
- Final recurring `orchestra health`, active-task-list, and `orchestra validate --pre-run` checks — pass/ready; active context remained true and all required workflow checks were present.
- Read-only `sed` commands — pass; required context, prior handoff, review, and evidence were loaded.

## Pass/Fail Result

- PO contract preservation and validation: pass.
- Material scope change check: pass; none found or introduced.
- Product implementation acceptance: not executed/fail for release purposes; AC1–AC6 remain release-blocking.
- Safety constraints: pass. No product code was edited, no active bridge or Live Set was contacted, and nothing was installed, restarted, saved, mutated, pushed, tagged, published, or deployed.
