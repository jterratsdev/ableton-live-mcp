Task id: ableton-session-scene-tempo-signature-20260820
Phase: architect
Role: architect
Runtime: codex-cli
Session id: ableton-session-scene-tempo-signature-20260820:wfrun-1787185194034-63cc7d:architect:codex-cli

# Architect Handoff

## Result

- Architecture review: **PASS for Developer implementation** against the user-approved PO contract.
- Story size: **m / 5 points**. Preserve the recorded estimate of 1.5 solo days, 0.8 AI-unguided days, and 0.35 AI-guided days. The feature is one externally atomic vertical slice and should not be split into separately releasable capability and mutation stories.
- Product code, tests, and product documentation were not changed. Only Orchestra decisions, this handoff, and a supplemental Mermaid source were created.
- No active bridge endpoint was called. Ableton was not installed, restarted, launched, saved, or mutated. No Set, global Song state, clip, transport, Arrangement marker, or Arrangement envelope was touched.
- Close status: architect phase complete. AC1-AC9 remain release-blocking until Developer and QA provide implementation and offline command evidence.

## Architecture Decision

### Decision: capability-probed atomic Session Scene overrides

Status: accepted for implementation.

Context: The existing capability-aware implementation already makes `bridge/observability.js` and `live_observability.py` the route-support sources, projects the active bridge handshake through `src/capability-resolver.js`, and uses `src/tool-capabilities.js` to keep `tools/list` and direct `tools/call` consistent. The current Scene support is limited to launch. The large `src/tools.js`, `bridge/development-adapter.js`, `AbletonMcpBridge.py`, and `live_clips.py` files are adapter or god-file risks and must not own new probing, transaction, or rollback policy. Live Scene fields are independently exposed, disabled fields return raw `-1`, descriptor access may raise, and Scene proxies may be recreated.

Decision: Extend the shared route-capability registry with one read-only target route and one conditional mutation route. Add focused Scene modules in the MCP, deterministic-development bridge, and Python Remote Script. Resolve only `song.scenes[sceneIndex]`; use names solely as returned descriptions. Validate tagged actions before any setter, capture a complete observable snapshot and capability matrix, preflight every requested family as one transaction, journal every setter before invocation, write in deterministic order, reacquire the exact index for readback, and compensate journal entries in reverse order on any setter, resolution, readback, or verification failure. Verify the full observable pre-state after compensation. Never launch a Scene or fall back to global Song or Arrangement writes.

Consequences: The Python and Node runtimes necessarily have separate implementations, but one JSON contract and parity fixtures constrain drift. Static descriptor inspection can prove only structurally exposed write support; opaque or incompatible descriptors fail closed. A disabled pre-state cannot reveal its retained hidden value, so rollback restores `enabled=false` and verifies the documented raw `-1` sentinel rather than claiming to recover hidden data. Per-target support remains conditional even when the route itself is callable.

Alternatives rejected:

- Adding logic directly to `src/tools.js`, `bridge/development-adapter.js`, `AbletonMcpBridge.py`, or `live_clips.py` would deepen existing multi-purpose adapter files and make the transaction hard to test.
- Inferring support from Live edition or documentation would violate the target-specific capability contract.
- Testing writability by assigning the current value would make the read-only probe mutating and unsafe.
- Separate tempo and signature mutation routes would weaken combined-request atomicity.
- Using `Song.undo` as the only rollback mechanism would couple an exact four-field Scene transaction to global undo history and would not expose field-level rollback failures.
- Using Scene name as identity would be ambiguous for duplicate or empty names and would fail across proxy recreation.

## Focused Module Boundaries

1. `src/scene-tempo-signature-tools.js` owns the two MCP tool definitions, strict nested tagged-union validation, and thin dispatch creation. `src/tools.js` only spreads the definitions/dispatch and calls the focused validator; it does not gain transaction logic.
2. `src/tool-capabilities.js` adds route policies for both tools. The mutation entry is conditional in Remote Script mode, carries the read-only tool as `probeTool`, and states that overrides take effect only on a later explicit Scene launch.
3. `src/bridge.js` adds two action mappings only. `src/risk-policy.js` classifies the GET route as read and the POST route as safe-write; it must not reuse the unrelated launch risk entry.
4. `bridge/observability.js` and `ableton_remote_scripts/AbletonMcpBridge/live_observability.py` add the two canonical route entries. Development reports both supported. Remote Script reports GET supported and POST conditional with a non-empty reason naming per-property target probing. Route/action/tool parity remains enforced by the existing capability tests.
5. `bridge/development/scene-tempo-signature.js` owns deterministic Scene state projection, the same validation and transaction invariants, and an injectable Scene access port for failure/recreated-proxy tests. `bridge/development/default-state.js` adds Scene records with separate retained values and enable flags. `bridge/development-adapter.js` and `bridge/http-server.js` only delegate.
6. `ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py` owns exact-index resolution, non-mutating property probes, observable snapshot projection, preflight, ordered writes, transaction journal, compensation, and verification. `live_api.py` re-exports the focused functions. `AbletonMcpBridge.py` adds two thin Live-thread routes.
7. Tests belong in focused `test/scene-tempo-signature.mjs`, `test/scene-tempo-signature-mcp.mjs`, and `test/live_scene_tempo_signature_test.py`, with minimal additions to capability parity, static Remote Script, deterministic aggregate, and risk-policy tests.
8. Authoritative user copy belongs in `docs/ableton-bridge-contract.md`, `docs/ableton-python-remote-script.md`, `docs/ableton-compatibility.md`, and the smallest relevant README/tool-description surfaces. Copy must distinguish Session Scene launch-time overrides from Arrangement automation and global Song tempo/signature.

Dependency direction is MCP adapter -> bridge HTTP adapter -> focused Scene service -> Live/development Scene access port. Capability registries describe route availability; they do not implement target-property policy. No new dependency or framework is required.

## Exact MCP Contracts

Tool 1: `ableton_get_scene_tempo_signature_capabilities`

```json
{
  "sceneIndex": 0
}
```

Its schema is an object with `additionalProperties: false`; `sceneIndex` is required, integer, and minimum zero. It dispatches to `GET /scenes/tempo-signature-capabilities?sceneIndex=0`. The description says it is read-only, names `sceneIndex` as authoritative, and says values affect playback only when that Session Scene is later launched.

Tool 2: `ableton_set_scene_tempo_signature_overrides`

```json
{
  "sceneIndex": 0,
  "tempo": { "action": "set", "bpm": 128 },
  "timeSignature": { "action": "set", "numerator": 7, "denominator": 8 }
}
```

Top-level and nested schemas use `additionalProperties: false`. `sceneIndex` is required and at least one of `tempo` or `timeSignature` is required. Tempo is exactly one of `{action:"set", bpm}` or `{action:"clear"}`. Time signature is exactly one of `{action:"set", numerator, denominator}` or `{action:"clear"}`. Set fields are required only for set; clear accepts no value fields. Runtime validation repeats JSON Schema checks so unknown actions, extra clear values, booleans, fractional/non-finite numbers, BPM outside inclusive 20..999, numerator outside integer 1..32, and denominators outside `1,2,4,8,16,32` fail with JSON-RPC `-32602` before `bridge.invoke`.

Successful MCP `tools/call` keeps the repository convention: one text content item containing the exact HTTP JSON body. Bridge errors keep `isError: true` and preserve the serialized HTTP error body, including rollback diagnostics. A capability-handshake failure prevents listing and direct invocation of both bridge tools. In Remote Script mode the mutation tool is listed as conditional and names `ableton_get_scene_tempo_signature_capabilities` as the probe; in deterministic-development mode both tools are listed as supported.

## Exact HTTP Contracts

### Read-only capability and observation

`GET /scenes/tempo-signature-capabilities?sceneIndex=N`

The query accepts exactly one non-negative decimal integer `sceneIndex`; missing, repeated, signed, fractional, non-decimal, name-only, or extra targeting input is rejected. Resolution is exactly the current `list(song.scenes)[N]`. Out-of-range is 404. The handler runs on the Live thread but performs zero setters.

```json
{
  "ok": true,
  "readOnly": true,
  "target": { "sceneIndex": 0, "name": "Intro" },
  "targetFingerprint": {
    "sceneIndex": 0,
    "sceneCount": 8,
    "name": "Intro",
    "propertyShape": {
      "tempo": { "readable": true, "writable": true },
      "tempoEnabled": { "readable": true, "writable": true },
      "timeSignatureNumerator": { "readable": true, "writable": true },
      "timeSignatureDenominator": { "readable": true, "writable": true },
      "timeSignatureEnabled": { "readable": true, "writable": true }
    }
  },
  "capabilities": {
    "tempo": { "readable": true, "writable": true, "reason": null },
    "tempoEnabled": { "readable": true, "writable": true, "reason": null },
    "timeSignature": {
      "readable": true,
      "writable": true,
      "reason": null,
      "components": {
        "numerator": { "readable": true, "writable": true, "reason": null },
        "denominator": { "readable": true, "writable": true, "reason": null }
      }
    },
    "timeSignatureEnabled": { "readable": true, "writable": true, "reason": null }
  },
  "observed": {
    "tempo": { "value": 128, "enabled": true, "raw": { "value": 128, "enabled": true } },
    "timeSignature": {
      "value": { "numerator": 7, "denominator": 8 },
      "enabled": true,
      "raw": { "numerator": 7, "denominator": 8, "enabled": true }
    }
  }
}
```

Unavailable raw observations are `null` and are disambiguated by the capability object. A disabled readable family normalizes `value` to `null`, retains `enabled:false`, and preserves Live's exact raw `-1` observations. Every property object always contains `readable`, `writable`, and `reason`; `reason` is null only when both axes are true and is non-empty when either is false. Composite signature readability/writability is the conjunction of numerator and denominator, with a reason derived from failed components.

### Atomic mutation

`POST /scenes/tempo-signature-overrides`

The body is exactly the MCP tagged-action input. The bridge repeats strict validation before resolving or writing. A valid success returns:

```json
{
  "ok": true,
  "target": { "sceneIndex": 0, "name": "Intro" },
  "requested": {
    "tempo": { "action": "set", "bpm": 128 },
    "timeSignature": { "action": "clear" }
  },
  "status": "changed",
  "changed": true,
  "noOp": false,
  "changedFields": ["tempo", "tempo_enabled", "time_signature_enabled"],
  "observed": {
    "tempo": { "value": 128, "enabled": true, "raw": { "value": 128, "enabled": true } },
    "timeSignature": {
      "value": null,
      "enabled": false,
      "raw": { "numerator": -1, "denominator": -1, "enabled": false }
    }
  },
  "capabilities": {}
}
```

`capabilities` has exactly the capability shape from the GET response. `requested` includes only provided families. `status` is `changed` when at least one setter returned normally and `no-op` when every requested field already matched. An idempotent request still performs complete preflight and fresh readback. `changedFields` is transaction order, not request-object key order.

HTTP error classes:

- 400 `invalid_request`: malformed tagged action, bounds, extra fields, or invalid integer syntax; zero setters.
- 404 `scene_not_found`: current index is outside `song.scenes`; zero setters.
- 409 `scene_target_changed`: fresh target fingerprint differs, or a requested value/enable readback mismatches.
- 501 `scene_override_unsupported`: any operation-required property is unreadable or not structurally writable; the response lists every missing requirement; zero setters and combined requests fail as a whole.
- 500 `scene_override_transaction_failed`: setter, target re-resolution, readback, verification, or compensation failure after a setter was invoked.

Transaction errors include `target`, `requested`, `originalFailure {stage,field,message}`, `rollback {attempted,succeeded,failures,hiddenValueRestoration,finalObserved,verification}`, and `journal` entries containing only field, family, invocation order, and outcome. They never claim success after verification failure and never expose arbitrary Python object representations.

## Property Probing Semantics

For each of `tempo`, `tempo_enabled`, `time_signature_numerator`, `time_signature_denominator`, and `time_signature_enabled`:

1. Resolve a fresh exact-index Scene and obtain a static attribute descriptor with `inspect.getattr_static`; this must not execute its getter or setter.
2. Read the property once with `getattr` inside an isolated exception boundary. Missing attributes, incompatible descriptors, getter exceptions, non-finite tempo, invalid numerator/denominator, non-boolean enable fields, or invalid sentinel combinations produce `readable:false` and a sanitized non-empty reason.
3. Report `writable:true` only when the static descriptor exposes a callable setter (`property.fset` or descriptor `__set__`) compatible with the Scene class. Do not assign the current value to test writability. Instance-only fields, opaque dynamic attributes, missing descriptors, read-only properties, and descriptor-inspection exceptions fail closed with `writable:false` and a reason.
4. The deterministic-development adapter uses an explicit fixture capability matrix rather than pretending plain JavaScript object fields prove Live writability. Full support is the default; tests override individual read/write axes and reasons.
5. A composite time signature is readable only when both components are readable and writable only when both are writable. Enable capability remains separate.

The capability call snapshots state before and after probing and asserts identical target fingerprint and raw observations. Any drift returns an error rather than a read-only success.

## Preflight, Journal, Rollback, and Readback Invariants

- Validation completes before any property setter. Target resolution and one complete observable snapshot follow validation.
- Set tempo requires readable/writable `tempo` and `tempo_enabled`. Clear tempo requires readable `tempo` plus readable/writable `tempo_enabled`.
- Set signature requires readable/writable numerator, denominator, and enable. Clear signature requires readable numerator and denominator plus readable/writable enable.
- Combined requests aggregate missing requirements and fail with zero setter calls if either family is unsupported. Idempotent requests do not bypass this rule.
- Deterministic order is tempo value, tempo enable true, signature numerator, signature denominator, signature enable true. Clear performs only the relevant enable false. Tempo family always precedes signature family.
- Before each setter invocation, append a journal entry. This treats a setter that mutates and then raises as potentially written and therefore compensable. Entries distinguish attempted, returned, failed, compensated, and compensation-failed.
- On success path, reacquire `song.scenes[sceneIndex]`, verify the stable target fingerprint, then read every property fresh. Set requires exact requested values and `enabled:true`. Clear requires `enabled:false` and exact raw `-1` sentinels normalized to null.
- On failure, visit every attempted setter in reverse order. Reacquire the exact index before each compensation so recreated proxies remain valid. For a pre-enabled family, restore its captured values and enable state. For a pre-disabled family, never write raw `-1` into a value property; ensure enable false and mark hidden retained-value restoration as unobservable.
- After compensation, reacquire again and compare target fingerprint plus every property that was readable in the pre-state. A disabled family matches only when enable is false and its exact raw sentinels are `-1`. Any missing target, shape/name/count change, unreadable formerly-readable field, value mismatch, or compensation exception makes rollback unsuccessful.
- Rollback failure diagnostics preserve the original failure and every compensation failure. The operation never touches another Scene, even if names match.

## Development Parity

`createDevelopmentState` gains `scenes`, independent of global `tempo` and `timeSignature`. Each Scene record keeps `name`, retained tempo, retained numerator/denominator, enable flags, and an optional explicit capability matrix. Projection emits raw `-1` when disabled without discarding retained values. The focused Node module operates through a small port (`resolve`, `probe`, `read`, `write`) so tests can recreate proxy wrappers, inject exceptions before/after writes, and force readback mismatch without putting test hooks in HTTP adapters. Development responses and errors must be byte-shape compatible with Python apart from sanitized runtime-specific error text.

The capability handshake represents route implementation, not target support. Therefore development marks GET and POST supported; Remote Script marks GET supported and POST conditional. A malformed, incomplete, wrong-mode, or unreachable handshake uses the existing fail-closed resolver and hides both tools. A valid conditional route lists the mutation tool with its exact reason and probe-tool instruction; target preflight still decides whether a particular Scene can execute it.

## Offline QA Plan

| Scenario | Target surface/environment | Expected observable result | How result is obtained |
| --- | --- | --- | --- |
| Full/partial capability matrix | API + Python fake Live + Node local sandbox | Each property has independent read/write/reason; composite signature is conjunctive; probe performs zero setters and no state drift | Descriptor-backed fake Scenes and explicit development port matrices with setter counters |
| Missing/raising/incompatible properties | API + Python fake Live | Missing descriptor, raising getter, read-only descriptor, opaque dynamic field, invalid value, and invalid sentinel combinations fail closed with non-empty reasons | Focused Python assertions, no Live import/runtime required |
| Strict request grammar | MCP + HTTP adapters | Negative/fractional/stale indexes, names, unknown actions, extra clear values, non-finite/out-of-range values, and empty requests fail before any setter/downstream mutation | MCP dispatch fixture and bridge service counters |
| Exact index identity | Python/Node services | Duplicate and empty names are accepted; only the requested zero-based index changes; out-of-range/stale index is rejected | Multi-Scene fixtures and full before/after snapshots |
| Ordered set and combined set | Python/Node services | Setter log is tempo, tempo enable, numerator, denominator, signature enable; response raw/normalized observations match | Recording access ports and fake descriptors |
| Idempotency | Python/Node services | Full preflight and fresh readback occur, setter count is zero, status is no-op | Resolution/read counters plus empty setter log |
| Clear semantics | Python/Node services | Only enable false is written; retained hidden value is not overwritten; public value is null and raw values are -1 | Retained-value development model and fake Live sentinel getters |
| Mid-sequence setter failure | Python/Node services | Every attempted setter is compensated in reverse order and full observable pre-state verifies | Fail-before-return and mutate-then-raise setter fixtures |
| Rollback failure | Python/Node services | Original error, attempted rollback, failed compensation entries, final observation, and verification mismatches are all reported; no success | Compensation-throwing and target-disappearing fixtures |
| Recreated proxy | Python fake Live + Node port | Fresh wrappers for the same exact index succeed; another index or changed fingerprint fails | Resolver returns new wrappers on each call |
| Readback mismatch | Python/Node services | Mutation is rejected, rollback is attempted and verified or reported failed | Getter override after write |
| Capability/tool/route parity | MCP + static Python/Node | New routes exist exactly once in Node registry, Python registry, both HTTP dispatchers, actions, risk policy, and tool policy | Extend `test/capability-aware-tools.mjs`, `test/live_capabilities_test.py`, `test/remote-script-static.mjs`, and risk tests |
| Malformed handshake | MCP runtime fixture | Both Scene tools are absent and direct calls fail before downstream action | Existing capability resolver fixture expanded with new tool assertions |
| Docs and copy | Generated artifact + local sandbox | Tool and authoritative docs say later Session Scene launch is required and deny Arrangement/global/launch side effects | Static string assertions and doc-sync audit |
| Full offline gate | CLI + local sandbox | Focused tests, Python compile, `npm test`, and `git diff --check` exit zero; no request uses the configured active bridge | Captured Developer and QA command evidence |

Required Developer/QA commands, after implementation:

```text
node test/scene-tempo-signature.mjs
node test/scene-tempo-signature-mcp.mjs
python3 test/live_scene_tempo_signature_test.py
python3 test/live_capabilities_test.py
python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py
node test/capability-aware-tools.mjs
node test/remote-script-static.mjs
npm test
git diff --check
```

All HTTP tests must use direct handler calls or OS-assigned ephemeral ports and an explicit fixture base URL. They must record action/setter counters proving the configured active bridge was never contacted. Real Live mutation, installation, restart, and disposable-Set validation remain a separate later approval gate.

## Acceptance-Criteria Evidence Assessment

| Criterion | Architect evidence status | Release judgment |
| --- | --- | --- |
| AC1 | Contract, probe semantics, response shape, and zero-setter tests are defined; no implementation output exists | Not satisfied; release-blocking |
| AC2 | Exact MCP/HTTP tagged unions, bounds, targeting, and pre-write validation are defined | Not satisfied; release-blocking |
| AC3 | Exact-index resolution and stable structural fingerprint are defined, including duplicate/empty names and recreated proxies | Not satisfied; release-blocking |
| AC4 | Complete snapshot and per-action capability matrix are defined with combined fail-closed semantics | Not satisfied; release-blocking |
| AC5 | Physical setter order, clear/no-op rules, raw/normalized observations, and fresh readback are defined | Not satisfied; release-blocking |
| AC6 | Before-invocation journal, reverse compensation, disabled-state limitation, and full observable verification are defined | Not satisfied; release-blocking |
| AC7 | Response shape, route/tool policy, development parity, and malformed-handshake behavior are defined | Not satisfied; release-blocking |
| AC8 | Required tool/doc copy and explicit non-goals are defined | Not satisfied; release-blocking |
| AC9 | Deterministic scenario matrix and exact offline commands are defined; none were run as implementation evidence | Not satisfied; release-blocking |

The architect phase passes because the design and implementation contract are complete. It does not claim that any product acceptance criterion has been implemented or verified.

## Risks and Controls

- False-positive writability: allow only compatible static setters; opaque/dynamic properties fail closed.
- Setter mutates then raises: journal before invocation and compensate attempted entries.
- Hidden retained values: never claim restoration; disable and verify raw sentinel only.
- Proxy recreation or Scene-list churn: reacquire by exact index and compare stable fingerprint on every verification/compensation boundary.
- Concurrent external edits: full observable rollback verification detects drift and reports rollback failure rather than overwriting another Scene.
- Node/Python contract drift: canonical fixtures assert identical response/error shapes and route registry parity.
- Adapter growth: all behavior lives in focused modules; existing large files get imports and delegation only.
- Discovery/call mismatch: reuse the existing capability resolver and tool policy for both listing and invocation.
- Diagram validation: the supplemental Mermaid source was inspected semantically, but Orchestra lint could not run because `mmdc` is absent. This is non-blocking because the diagram is explanatory, not executable or acceptance evidence. Install guidance from Orchestra is `npm install -D @mermaid-js/mermaid-cli`; no dependency was installed in this phase.
- Runtime context warned that ownership directories were omitted and context was trimmed. Targeted read-only inspection covered the decisive capability registries, MCP handler, tools, bridge actions and HTTP routes, development adapter/state, Remote Script dispatcher, property/rollback patterns, tests, manifest, and authoritative local SDK report.

Rollback for the future implementation is code-only: remove both Scene routes, both MCP tools, their registry/risk entries, and both focused runtime modules together. Do not leave discovery, call guard, development behavior, or Remote Script behavior on different contracts. No data migration exists. A real Set rollback is outside this implementation because Developer and QA must remain offline.

## Touched Files

- `.agent-workflow/decisions/ableton-session-scene-tempo-signature-20260820-1787186469167-decision.md` — accepted ADR.
- `.agent-workflow/decisions/ableton-session-scene-tempo-signature-20260820-1787186469172-decision.md` — accepted architect sizing decision.
- `.agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-architecture-sequence.mmd` — supplemental semantic sequence source; lint blocked by missing `mmdc`.
- `.agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787185194034-63cc7d-architect-architect-runtime-handoff.md` — this exact handoff.
- Orchestra-managed task, event, evidence, review, and lifecycle files are updated by CLI commands.

## Commands Run and Results

- `orchestra health --runtime codex-cli --json` — pass with non-blocking generated-guidance warning; workflow ready.
- `orchestra task list --json --status pending,blocked,in_progress` — matching active task found.
- `orchestra validate --pre-run --task ableton-session-scene-tempo-signature-20260820 --json` — ready, allowed, active context true, no missing checks.
- `orchestra context`, `delegation decide`, `plan`, `skills plan`, `protocol render`, and `workflow render` for the task — read successfully; context warned that it was trimmed and directory contents were omitted.
- Required runtime prompt and all required architect/rule files — read completely.
- Targeted `rg`, `sed`, `wc`, and `git status` inspections — completed without contacting a bridge or changing product files.
- Two `orchestra decision add` commands — passed; sizing and ADR recorded.
- `orchestra diagrams lint --file .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-architecture-sequence.mmd --task ableton-session-scene-tempo-signature-20260820 --json` — failed only because `mmdc` is not installed; evidence artifact records the missing tool and install hint. No install was attempted.
- Product tests were intentionally not run because this was an architecture-only phase with no implementation.

## Consumed Context Files

- `.agent-workflow/playbooks/architect.md` — read fully; applied boundaries, data flow, oversize check, preferred patterns, sizing, and ADR requirements.
- `AGENTS.md` — applied Orchestra preflight, active workflow, gate approval, evidence, lifecycle, and no push/release rules.
- `rules/development/semantic-code.md` — read fully; applied narrow domain names, focused modules, typed contracts, and behavior-oriented tests.
- `rules/architecture-decisions.mdc` — read fully; applied ADR context, decision, consequences, alternatives, and traceability.
- `rules/module-boundaries.mdc` — read fully; applied file-size and adapter responsibility checks and kept domain logic out of large entry points.
- `rules/development-engineering.mdc` — read fully; applied project-first structure, strict public contracts, adapter boundaries, deterministic testing, and evidence requirements.
- Architect runtime spawn prompt — read all 889 lines; applied the exact ACs, allowed scope, prohibited operations, metadata, handoff sections, and lifecycle command.
- Task context, PO handoff, accepted PO decisions, gate approval state, estimate, plan, workflow, protocol, and capability-aware architect/developer handoffs — treated as authoritative workflow/product context.
- Local source-of-truth files: `package.json`, `src/server.js`, `src/mcp-handler.js`, `src/tools.js`, `src/tool-capabilities.js`, `src/capability-resolver.js`, `src/bridge.js`, `src/risk-policy.js`, `bridge/observability.js`, `bridge/http-server.js`, `bridge/development-adapter.js`, `bridge/development/default-state.js`, `bridge/development/arrangement-insert.js`, `bridge/development/arrangement-clip-delete.js`, `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, `http_bridge.py`, `live_core.py`, `live_observability.py`, `live_arrangement.py`, `live_arrangement_delete.py`, `live_snapshots.py`, capability/static tests, and `docs/ableton-suite-vs-lite-sdk.md`.
- `skills/source-of-truth/SKILL.md` — applied local task, code, and accepted research as primary sources; no new vendor claim required web research.
- `skills/pr-review/SKILL.md` — applied behavior, tests, risk, rollback, and missing-evidence review before pass recommendation.
- `skills/diagram-export/SKILL.md` — applied a semantic service-exchange sequence diagram and ran the required Orchestra lint; missing `mmdc` is explicitly reported.
- `skills/doc-sync/SKILL.md` — identified the smallest future authoritative doc surfaces and copy constraints. It did not require a prompt-registry update or doc-sync audit in this phase because no product documentation or generated prompt was changed.
- Primary skills not applicable to Architect execution: agent-learning, collection-standards, prompt-registry, Playwright evidence, and static-analysis are Developer/QA-owned in the rendered skill plan; model-evaluation is unrelated because no model/provider routing changes; release-readiness is deferred until implementation and QA evidence exist.

## Developer Handoff

Implement the four ordered slices in one story:

1. Add exact MCP schemas/validation, canonical route/action/risk/tool registries, and parity assertions.
2. Add focused development and Python Scene services with probe, snapshot, journal, compensation, and fresh-index verification; keep adapters thin.
3. Wire deterministic state and MCP-to-HTTP behavior, preserving current handshake fail-closed semantics.
4. Add the complete offline failure matrix and authoritative Session-versus-Arrangement copy, run the exact commands above, and record real evidence.

Do not contact the configured active bridge, install or restart Ableton, mutate a Set, launch a Scene, write global Song tempo/signature, write Arrangement automation/markers, push, tag, publish, or claim live validation.
