Task id: ableton-edition-aware-capacity-guards-20260818
Phase: developer
Role: developer
Runtime: codex-cli
Session id: ableton-edition-aware-capacity-guards-20260818:wfrun-1787082981538-1d39f2:developer:codex-cli

# Developer Handoff: Edition-Aware Track Capacity

## Required context acknowledgement

Complete. AGENTS.md, active Orchestra context, acceptance criteria, architecture decision, official source evidence, shared dirty-worktree state, and current Lite/Suite installation state were reviewed before implementation.

## Consumed context files

- `AGENTS.md`
- Orchestra task context, plan, protocol, workflow render, architect handoff, decision, review, and official-source evidence
- `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, `http_bridge.py`, and `live_track_operations.py`
- `bridge/development-adapter.js`, development state/track operations, error and HTTP transport
- Existing focused/static/deterministic tests and bridge documentation

## Outcome

The Remote Script and development adapter now report edition provenance and observable audio/MIDI capacity in `GET /status`. Exact installation-path detection recognizes Lite, Intro, Standard, and Suite; nonstandard paths remain unknown. Only verified finite limits block: Lite 8 and Intro 16. Standard, Suite, and unknown have no bridge-defined finite cap.

At a verified cap, create and duplicate return structured HTTP 409 `edition_track_capacity_reached` before the mutation API. The response includes operation, edition evidence/source, and current/maximum/remaining. Generic Live host failures remain separate. The local machine now has both Lite and Suite; detection follows the path loaded by the running process rather than installed-app inventory.

## Changed files

- `ableton_remote_scripts/AbletonMcpBridge/live_editions.py`: official profile, exact path detection, capacity calculation, guard.
- `AbletonMcpBridge.py`, `http_bridge.py`, `live_track_operations.py`: status wiring, pre-mutation create/duplicate checks, structured error details.
- `bridge/development/edition-capabilities.js`, `default-state.js`, `track-operations.js`, `development-adapter.js`, `errors.js`, `http-server.js`: deterministic parity and HTTP propagation.
- `test/live_edition_capabilities_test.py`, `test/edition-capacity.mjs`, `test/live_track_operations_test.py`, static/deterministic registries: exact edition detection, Lite/Intro guards, no-mutation HTTP response, Standard/Suite/unknown fallthrough, and Suite host-failure classification.
- `docs/ableton-editions.md`, bridge/Remote Script docs, README: source matrix, verified date, provenance, unknown behavior, and Suite install example.

## Changed-file traceability

AC1 maps to the centralized source profile and `docs/ableton-editions.md`. AC2 maps to both adapters' status assertions. AC3 maps to Python/Node before-after assertions and real HTTP 409 body. AC4 maps to Standard/Suite/unknown fixtures plus the Suite host rejection test. AC5 maps to focused tests, py_compile, full npm test, diff check, and docs.

## Simplicity review

The implementation adds one small pure capability module per runtime and wires only status, create, duplicate, and structured error propagation. It adds no dependency, endpoint, generalized entitlement framework, speculative device gating, or unrelated cleanup. Existing save-removal and Arrangement work in shared files was preserved.

## Goal-to-verification map

| Criterion | Concrete verification |
| --- | --- |
| Official profile and unknown behavior | `test/live_edition_capabilities_test.py` asserts exact Lite/Intro/Standard/Suite paths, limits, source-bearing payload, and unrelated-path unknown. |
| Status diagnostics | `test/edition-capacity.mjs` calls `getStatus()` and asserts edition provenance plus current/maximum/remaining/status. |
| Pre-mutation capacity failure | Python guard and Node adapter/HTTP tests assert 409 `edition_track_capacity_reached` and byte-identical before/after tracks. |
| No false Lite cap | Node fixtures duplicate at eight tracks in Standard, Suite, and unknown; Python Suite host rejection remains a 500 host failure with unchanged names. |
| Regression and docs | Focused commands, py_compile, `npm test`, and `git diff --check` exit 0; `docs/ableton-editions.md` states source date and limitations. |

## Research report

Ableton's official comparison, verified 2026-08-18, reports Lite 8, Intro 16, Standard Unlimited, and Suite Unlimited audio/MIDI tracks. Cycling '74's official Live Object Model Application reference exposes version getters but no edition property. The accepted consequence is exact installation-path provenance with an explicit unknown fallback; only verified finite limits can block.

## Commands and results

- `python3 test/live_edition_capabilities_test.py` — exit 0.
- `node test/edition-capacity.mjs` — exit 0, including ephemeral localhost HTTP contract.
- `python3 test/live_track_operations_test.py` — exit 0.
- `python3 -m py_compile ...` for changed Remote Script modules — exit 0.
- `npm test` — exit 0, all deterministic suites, ending `deterministic test suite ok`.
- `git diff --check` — exit 0.

No active Ableton endpoint was called and the open Set was not mutated.

## Risks and deferrals

The Live Object Model has no documented edition property, so renamed/nonstandard installations deliberately report unknown. Official limits can change; the response and docs carry source URL and verification date. Real Suite proof is deferred: install the updated Remote Script into `/Applications/Ableton Live 12 Suite.app`, launch/restart Suite, then call only `GET /status`. Creating or duplicating in the current Set is not required for QA.

The shared worktree contains unrelated save-tool removal, Arrangement deletion/undo, proxy-safe duplication, and Orchestra artifacts. They were preserved and must be isolated during release packaging.

```json
{
  "status": "ready_for_qa",
  "acceptanceCriteria": {"AC1": "pass", "AC2": "pass", "AC3": "pass", "AC4": "pass", "AC5": "pass"},
  "realProductProof": "deferred pending Remote Script install/restart in Suite; read-only GET /status only",
  "activeSetMutated": false,
  "tests": ["focused Python", "focused Node HTTP", "py_compile", "npm test", "git diff --check"],
  "releaseConcern": "isolate this task from unrelated dirty-worktree changes"
}
```
