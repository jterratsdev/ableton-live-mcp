Task id: ableton-session-scene-tempo-signature-20260820
Phase: architect
Role: architect
Runtime: codex-cli
Session id: ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:architect:codex-cli

# Architect Handoff

## Outcome

- Result: **pass for Developer verification/correction**.
- Close status: architect phase complete. This handoff authorizes the scoped offline implementation/verification phase; it does not approve QA, release, tag, push, publish, deployment, Remote Script installation, Ableton restart, or Live Set mutation.
- Story sizing: **m / 5 points**, recorded for this run. Keep the feature as one vertical story because discovery, exact targeting, mutation atomicity, route exposure, documentation, and parity tests are one safety contract.
- Architecture correction: all forward and compensation setters use the exact Scene receiver captured during preflight. Fresh `song.scenes[sceneIndex]` resolution is readback/verification-only and must never choose a mutation receiver.
- Current-source inspection found this invariant already expressed in both focused services: `bridge/development/scene-tempo-signature.js` captures `pinnedTarget`, and `ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py` captures `pinned_scene`; both use the pinned receiver for forward and compensation writes. Developer must treat the current tree as evidence to revalidate, not as proof that the new workflow's QA gate is complete.
- No product, test, or documentation source was changed in this architecture phase. No bridge endpoint was contacted.

## Accepted Architecture Decision

### Pin transaction mutations to the preflight Scene receiver

Status: accepted.

Context: `sceneIndex`, scene count, name, property shape, and even partially overlapping observed values are not a unique identity. A same-name, same-shape replacement can occupy the same index without changing any structural fingerprint. Re-resolving the index before a forward or rollback setter can therefore redirect the transaction to a replacement Scene and falsely report success.

Decision:

1. Validate the complete tagged request before resolving a target or invoking a setter.
2. Resolve `song.scenes[sceneIndex]` exactly once for preflight and retain that receiver as `pinnedTarget`/`pinned_scene` for the transaction lifetime.
3. Capture the complete observable pre-state and per-property capabilities from that receiver before any write.
4. Use only the pinned receiver for every planned forward setter and every compensation setter. Journal immediately before each invocation so a setter that mutates and then raises is compensable.
5. Re-resolve `song.scenes[sceneIndex]` only after forward execution or compensation, to obtain canonical observation and diagnostics. Structural fingerprint equality is necessary for verification but never sufficient to authorize a setter.
6. A stale pinned receiver may raise. Preserve that as the original failure, attempt compensation only against the same pinned receiver, and report rollback failures plus canonical final observation. Never redirect to the current-index replacement.
7. Success requires a fresh exact-index observation matching the preflight structural fingerprint and the complete requested post-state. Rollback success requires a fresh exact-index observation matching the complete observable pre-state, subject only to the documented disabled-family hidden-value limitation.

This decision supersedes only the earlier phrase that compensation should reacquire the exact index before each setter. It preserves the existing public MCP/HTTP schemas, ordered set/clear behavior, capability gates, normalized/raw response shapes, error taxonomy, route registries, and Session-versus-Arrangement documentation boundary.

## Boundaries and Data Flow

- `src/scene-tempo-signature-tools.js` remains the source of strict MCP tagged-action validation and tool definitions. `src/tools.js` stays a thin registry/dispatch adapter.
- `src/tool-capabilities.js`, `src/capability-resolver.js`, `bridge/observability.js`, and `ableton_remote_scripts/AbletonMcpBridge/live_observability.py` remain the route/tool exposure sources. Handshake validity gates listing and invocation; target-property support remains a per-request preflight concern.
- `bridge/development/scene-tempo-signature.js` owns deterministic transaction planning, pinned writes, rollback, and verification. `bridge/development/scene-tempo-signature-observation.js` owns target capture/observation and the injectable port.
- `ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py` owns the equivalent Live-facing transaction. `AbletonMcpBridge.py`, `live_api.py`, and HTTP adapters remain thin routing surfaces.
- Canonical flow: MCP validation -> HTTP adapter -> focused Scene service -> capture exact request-time receiver and snapshot -> capability preflight -> ordered writes on pinned receiver -> fresh exact-index readback -> success or reverse compensation on pinned receiver -> fresh exact-index rollback verification.
- No new abstraction, dependency, data migration, persistence layer, global identity registry, or Stable Live Scene ID is introduced.

## Transaction and Rollback Invariants

- Exact zero-based `sceneIndex` is authoritative only for serialized request targeting and canonical readback. Names are descriptive and may be empty or duplicated.
- Set order remains tempo value, tempo enable, signature numerator, signature denominator, signature enable. Clear writes only the respective enable flag. Tempo family precedes signature family.
- Combined requests fail before all writes when any required capability is unavailable. Idempotent requests still perform full preflight and fresh readback.
- The journal is append-before-call and records the invoked field, family, invocation order, and outcome. Rollback visits all attempted entries in reverse order against the pinned receiver.
- A replacement Scene at the original index must receive **zero setters**, whether replacement occurs before a later forward setter, before compensation, or during final verification.
- A removed or shifted target, target-shape drift, readback mismatch, getter error, setter error, or stale pinned-proxy error cannot return success.
- Recreated proxies are acceptable only as readback wrappers for the same logical current-index target whose complete expected observation verifies. They never become transaction writers.
- A disabled pre-state has no readable retained value. Compensation disables the family and verifies Live's `-1` sentinel; diagnostics must not claim hidden retained-value restoration.

## Alternatives Rejected

- Re-resolve by index before every setter: unsafe because a replacement Scene can receive writes.
- Authorize writes with structural fingerprints or evolving observed values: unsafe because both can collide.
- Match by Scene name: unsafe for duplicate or empty names.
- Add a synthetic stable identity: unsupported by the current Live contract and would create a false guarantee.
- Abort without compensation after a stale-proxy error: insufficient because earlier setters on the pinned receiver may already have succeeded.
- Use global `Song.undo`: too broad, coupled to user undo history, and incapable of field-level diagnostics.

## Developer Contract

The Developer should perform a surgical current-tree audit, changing code only if the inspected implementation diverges from these invariants:

1. Confirm both Node and Python capture the preflight receiver once and pass that same receiver to every forward and compensation write.
2. Confirm all later index resolution is observation-only. Remove any helper path that can turn a fresh resolution or fingerprint match into a setter receiver.
3. Preserve the existing focused service/observation split and keep adapters thin.
4. Preserve or add adversarial Node and Python tests for same-name, same-shape, unchanged-count replacement after the first setter. Assert original Scene A receives the attempted forward/compensation writes, replacement Scene B receives `[]`, the call cannot report success, and rollback truthfully reports canonical mismatch when applicable.
5. Preserve removal/shift, missing-target, recreated-proxy, readback-mismatch, setter-failure, rollback-failure, idempotency, validation, capability, route parity, malformed-handshake, and documentation assertions.
6. Run and record the exact offline validation suite. Do not contact the configured active bridge or mutate a Live Set.

## Test Scenarios and Expected Results

| Scenario | Target surface / environment | Expected observable result | How result was obtained / must be proven |
| --- | --- | --- | --- |
| Same-fingerprint replacement after first setter | Integration, Node local sandbox | Scene A receives all attempted forward/compensation setters; replacement Scene B receives zero setters; result is never success after canonical mismatch | Architecture derived from the reproduced P0; existing `test/scene-tempo-signature.mjs` contains the adversarial shape and must pass in Developer/QA evidence |
| Same-fingerprint replacement after first setter | Integration, Python fake Live | Identical isolation guarantee and failure semantics as Node | Architecture derived from the reproduced P0; existing `test/live_scene_tempo_signature_test.py` contains the adversarial shape and must pass |
| Removal or index shift during transaction | Integration, Node/Python fake Live | No other Scene receives a setter; original failure is target re-resolution/readback; incomplete rollback is explicit | Existing focused tests were inspected by name; rerun required |
| Pinned proxy becomes stale | Integration, Node/Python fake Live | Setter/compensation exception is reported; no fallback receiver is selected; earlier writes are still journaled and compensated where possible | Required new-run assertion or explicit mapping to an existing fixture |
| Recreated proxy for same logical current-index Scene | Integration, Node/Python fake Live | Fresh readback may succeed only when structural fingerprint and exact requested values match; proxy object identity is not required for observation | Existing recreated-proxy scenario; rerun required |
| Invalid request and unsupported combined request | MCP/HTTP API, local sandbox | Zero setters; deterministic 400/501 contract and complete missing-requirement diagnostics | Existing focused MCP and service tests; rerun required |
| Set/clear/idempotent/rollback matrix | Integration, local sandbox | Exact setter order, clear-only enable writes, raw `-1` sentinels, no-op verification, reverse compensation, and truthful rollback diagnostics | Existing Node/Python focused suites; rerun required |
| Capability/tool/route parity and malformed handshake | Workflow/runtime, local sandbox | Tool is listed/invoked only when route handshake is valid; absent/malformed/unreachable state fails closed | Existing registry/static suites; rerun required |
| Documentation boundary | Generated artifact / docs | Copy says override takes effect only after a later explicit Session Scene launch and denies launch, Arrangement automation, and global Song fallback | Static inspection and doc-sync audit in Developer/QA |
| Full offline gate | CLI, local sandbox | All focused tests, Python compile, full npm regression, package-relevant checks, and `git diff --check` exit zero without active bridge traffic | Must be captured as current Developer/QA command evidence |

Required Developer/QA commands:

```text
node test/scene-tempo-signature.mjs
node test/scene-tempo-signature-mcp.mjs
PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_scene_tempo_signature_test.py
PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_capabilities_test.py
PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py
node test/capability-aware-tools.mjs
node test/remote-script-static.mjs
npm test
git diff --check
orchestra doc-sync audit --task ableton-session-scene-tempo-signature-20260820
```

## Acceptance-Criteria Evidence Assessment

| AC | Architect assessment | Release status |
| --- | --- | --- |
| AC1 | Capability/observation boundaries remain unchanged and are architecturally sound; no current-run command evidence was produced | Not proven in this phase; release-blocking until Developer/QA evidence |
| AC2 | Strict validation remains upstream of target capture and writes | Not proven in this phase; release-blocking until zero-setter tests pass |
| AC3 | Pinned mutation receiver plus fresh observation-only resolution resolves the same-fingerprint replacement ambiguity while retaining exact-index API and recreated-proxy readback | Design satisfied; implementation evidence still release-blocking |
| AC4 | One complete preflight snapshot and combined fail-closed capability checks remain required | Not proven in this phase; release-blocking until matrix tests pass |
| AC5 | Ordered writes, clear semantics, no-op checks, and canonical fresh readback remain required | Not proven in this phase; release-blocking until focused tests pass |
| AC6 | Forward and rollback mutation ownership is now unambiguous: all setters are pinned, all verification is freshly resolved | Design satisfied; adversarial and rollback evidence still release-blocking |
| AC7 | Public response and capability-handshake contracts are unchanged | Not proven in this phase; release-blocking until parity/handshake tests pass |
| AC8 | Session-only, no-launch, no-Arrangement, no-global-fallback boundary is unchanged | Not proven in this phase; release-blocking until docs/static review passes |
| AC9 | Exact offline command matrix is specified above | Not satisfied by architecture-only work; all commands require current Developer/QA evidence |

The architecture phase passes because the P0 correction is unambiguous, fits existing module boundaries, and has concrete adversarial verification. It does not claim release readiness or substitute an earlier QA summary for current-run evidence.

## Risks

- Primary residual risk: a Live proxy may become stale after partial mutation. Pinning prevents redirection but cannot guarantee compensation will execute on a stale receiver; failure must remain explicit and release evidence must cover this path.
- Structural fingerprint is diagnostic, not identity. Future code must not promote it into write authorization.
- Node/Python behavioral drift remains possible; equivalent adversarial fixtures and full registry/static parity are mandatory.
- The context pack was unavailable and the runtime bundle omitted raw ownership-directory contents. Targeted inspection covered the decisive focused services, adversarial tests, PO handoff, accepted decision, and current QA review, but implementation/QA must re-run exact evidence rather than relying on this architectural sampling.
- Real Live validation remains deferred and requires separate explicit approval, a disposable or backed-up Set, updated Remote Script installation/restart, and a later risk decision. Offline AC9 does not prove real-Live property behavior.

## Consumed Context Files

- `.agent-workflow/runs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-architect-runtime-codex-cli-spawn-prompt.md` — read completely; applied goal, AC1-AC9, ownership, context policy, architect playbook, return contract, and lifecycle requirement.
- `.agent-workflow/playbooks/architect.md` — read fully; applied boundary, data-flow, oversize, pattern reuse, sizing, and ADR rules.
- `AGENTS.md` — user supplied full project instructions; applied Orchestra preflight, active workflow/gate, evidence, lifecycle, and no-push/tag/publish rules.
- `rules/development/semantic-code.md` — read fully; applied domain naming, focused modules, typed contracts, and behavior-oriented tests.
- `rules/architecture-decisions.mdc` — read fully; applied concise accepted decisions with context, consequences, alternatives, and supersession.
- `rules/module-boundaries.mdc` — read fully; applied focused services and logicless adapters; no new entry-point logic is proposed.
- `rules/development-engineering.mdc` — read fully; applied project-first architecture, narrow transaction boundary, error preservation, external-side-effect restrictions, testing, and handoff requirements.
- `.agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-product_owner-runtime-handoff.md` — read fully; treated as the authoritative refined product contract and accepted pinned-writer clarification.
- `.agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787185194034-63cc7d-architect-architect-runtime-handoff.md` — read fully; preserved the original public/module design and explicitly superseded its reacquire-before-compensation wording.
- `.agent-workflow/decisions/ableton-session-scene-tempo-signature-20260820-1787204648881-decision.md` — read fully; confirmed the previously accepted pinned-receiver correction.
- `.agent-workflow/reviews/ableton-session-scene-tempo-signature-20260820-qa-review.md` — read fully as historical supporting context, not a substitute for new-run command evidence.
- `bridge/development/scene-tempo-signature.js` and `ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py` — targeted current-source inspection confirmed the focused services capture and use pinned transaction receivers.
- `test/scene-tempo-signature.mjs` and `test/live_scene_tempo_signature_test.py` — targeted search confirmed same-fingerprint replacement, removal/missing-target, recreated-proxy, readback, and rollback scenarios exist; they were not executed in this architecture phase.
- Orchestra task context, delegation decision, role plan, skills plan, protocol, workflow render, and pre-run validation — loaded successfully; context reported a trimmed bundle and unavailable fresh context pack.
- Rendered source-of-truth and PR-review guidance was applied by prioritizing local task/decision/code/test sources and leading with the P0 safety finding. Diagram export was not used because the corrected invariant is clearer as a short linear contract and no new topology was introduced. Doc-sync informs the required downstream audit. Model evaluation and Playwright evidence are not applicable because no model routing or UI flow changes.

## Touched Files

- `.agent-workflow/decisions/ableton-session-scene-tempo-signature-20260820-1787519636352-decision.md` — recorded m / 5-point story sizing.
- `.agent-workflow/decisions/ableton-session-scene-tempo-signature-20260820-1787519644301-decision.md` — recorded the pinned transaction receiver architecture correction.
- `.agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-architect-architect-runtime-handoff.md` — this handoff.
- `.agent-workflow/evidence/ableton-session-scene-tempo-signature-20260820-1787519763554-82beaa05-38f7-4124-81ca-670daca99eb4-file.md` — Orchestra file evidence pointing to this handoff.
- Orchestra-managed runtime/task/event artifacts updated by official commands.
- No product, bridge, test, docs, package, release, Git, or Ableton artifact was changed.

## Commands Run

- `orchestra health --runtime codex-cli --json` — pass for package, workspace, Node, npm, Git, browser tooling, and workflow; overall degraded only by non-blocking optional generated-guidance refresh warnings.
- `orchestra task list --json --status pending,blocked,in_progress` — matching blocked task located among active work.
- `orchestra validate --pre-run --task ableton-session-scene-tempo-signature-20260820 --json` — pass: ready, allowed, active context true, no missing checks.
- `orchestra context`, `delegation decide`, `plan`, `skills plan`, `protocol render`, and architect `workflow render` — pass; task and role context loaded.
- Read-only `sed`, `rg`, `ls`, and `git status --short` inspections — pass; no active bridge call or product mutation.
- Two `orchestra decision add` commands — pass; sizing and corrected mutation-boundary decisions recorded.
- `orchestra evidence add --type file` — pass; this architect handoff was registered as task evidence.
- Product tests were intentionally not run because this assignment is architecture-only and explicitly prohibits implementation work; current-run execution evidence belongs to Developer and QA.

## Final Recommendation

Proceed to Developer with a narrow audit-and-verify pass. Preserve the public feature and focused module design; do not redesign or remove capability. The only authorized mutation receiver is the preflight-captured Scene object. Any fresh exact-index resolution is observation-only. After Developer evidence, require independent offline QA for AC1-AC9 and the human `qa→release` gate before any release action.
