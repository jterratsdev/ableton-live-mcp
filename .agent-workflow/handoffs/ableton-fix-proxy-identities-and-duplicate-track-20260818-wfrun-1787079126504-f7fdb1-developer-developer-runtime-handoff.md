Task id: ableton-fix-proxy-identities-and-duplicate-track-20260818
Phase: developer
Role: developer
Runtime: codex-cli
Session id: ableton-fix-proxy-identities-and-duplicate-track-20260818:wfrun-1787079126504-f7fdb1:developer:codex-cli

# Developer Handoff: Stable Arrangement Deletion and Exact Duplication

## Required context acknowledgement

Complete. The active task, acceptance criteria, architecture/risk decision, existing implementation, existing regression coverage, shared-worktree state, installation contract, and real bridge baseline were inspected before delivery.

## Consumed context files

- `AGENTS.md`
- Orchestra task context, plan, protocol, workflow render, architect decision, and architect review for this task
- `ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py`
- `ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py`
- `bridge/development/arrangement-clip-delete.js`
- Existing focused/deterministic tests and both bridge contract documents
- `scripts/install-ableton-remote-script.sh` and three real read-only bridge responses

## Outcome

Implementation and deterministic verification are complete. Arrangement plan identities now hash only stable observable track index/name plus clip position/name/timing. Every successful `delete_clip` call is followed by a complete Arrangement reread; a surviving identity is a 500 verification failure and is never reported as deleted. Exceptions after a possible mutation infer compensation count from observable absence, then reuse the existing bounded `Song.undo` and full fingerprint restoration contract.

Track duplication no longer compares Python proxy identity or scans for the first apparently new wrapper. It requires callable `Song.undo`, resolves only `sourceTrackIndex + 1`, verifies exactly one inserted track, preserves all pre-existing names by positional readback, verifies the requested destination name, and performs up to the bounded number of mutation undos while stopping as soon as the original observable fingerprint is restored.

The corrected Remote Script is installed on disk and source/installed hashes match. The current Live process still has the old modules loaded: three read-only plans returned different tokens. No live mutation or save occurred. Restart plus post-restart live QA remain.

## Changed files

- `ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py`: stable observable identities, immediate absence proof, no-op detection, mutation-aware rollback count.
- `ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py`: exact duplicate destination, complete name-sequence verification, callable-undo preflight, bounded verified rollback.
- `bridge/development/arrangement-clip-delete.js`: identity parity without WeakMap/object identity.
- `test/live_arrangement_delete_test.py`: recreated proxies, three-plan stability, exact deletion, observable stale change, no-op deletion.
- `test/live_track_operations_test.py` and `test/live-track-operations.mjs`: nonzero fresh-proxy duplicate, wrong insertion rollback, ignored rename rollback, missing undo preflight.
- `test/arrangement-clip-delete.mjs` and `test/deterministic.mjs`: stable equivalent object contract and suite registration.
- `docs/ableton-bridge-contract.md` and `docs/ableton-python-remote-script.md`: stable identity, exact insertion, readback, and rollback contracts. These files already contain the separate uncommitted save-tool removal and that work was preserved.

## Changed-file traceability

- AC1: `ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py`, `bridge/development/arrangement-clip-delete.js`, `test/live_arrangement_delete_test.py`, and `test/arrangement-clip-delete.mjs` remove object identity and prove repeated equivalent reads.
- AC2: `live_arrangement_delete.py` implements immediate complete readback, no-op rejection, observable stale detection, and mutation-aware rollback; `test/live_arrangement_delete_test.py` asserts each path.
- AC3: `ableton_remote_scripts/AbletonMcpBridge/live_track_operations.py` implements exact `sourceIndex + 1`, positional preservation, name verification, and bounded rollback; `test/live_track_operations_test.py` asserts a nonzero source plus failure modes.
- AC4: `test/live-track-operations.mjs` and `test/deterministic.mjs` register the new Remote Script fixture in the full suite; the existing Arrangement Node suite invokes the expanded Python fixture.
- AC5: both docs state the deployed contract; the two production modules were installed with matching hashes and the pre-restart real baseline was captured.

## Simplicity review

The correction stays in the two existing Remote Script domain modules and the existing development parity module. It adds no endpoint, dependency, generalized transaction framework, speculative abstraction, or unrelated cleanup. Two small focused test files are the minimum isolated harness for newly recreated proxies. Unrelated save-tool removal and Orchestra changes in the dirty worktree were preserved without modification beyond already-shared docs.

## Commands and Results

- `python3 test/live_arrangement_delete_test.py` — exit 0, `live arrangement delete fake-Live tests ok`.
- `python3 test/live_track_operations_test.py` — exit 0, `live track operations fresh-proxy tests ok`.
- `node test/arrangement-clip-delete.mjs` — exit 0.
- `node test/live-track-operations.mjs` — exit 0.
- `python3 -m py_compile ...` for both production modules and focused Python tests — exit 0.
- `npm test` — exit 0; all suites passed, ending `deterministic test suite ok`.
- `git diff --check` — exit 0.
- Source/installed `shasum` for both production modules — exact matches.
- Three pre-restart `GET /arrangement/clips/delete-plan` calls — old runtime reproduced different tokens `0ac293...`, `8dcaef...`, and `97bd72...`; read-only, no mutation.

## Goal-to-verification map

| Criterion | Evidence |
| --- | --- |
| Stable plans over fresh wrappers | Python asserts three identical plan, track, and clip identities; Node asserts equivalent object replacement is stable. |
| Exact deletion and honest absence | Fresh-proxy deletion succeeds only after reread; a no-op delete returns 500, reports no success, calls undo zero times, and preserves the clip. Observable timing change is stale. |
| Exact nonzero duplication and rollback | Source index 1 produces only index 2 and preserves all existing names; wrong insertion and ignored rename are detected and restored; missing undo fails before mutation. |
| Focused and full regression | All listed local commands exit 0 without using the active bridge. |
| Current-Set verification | Installation hashes match. Old runtime baseline captured; restart, three stable plans, exact duplicate, and separately confirmed deletion are pending QA. |

## Real product proof

The installed `live_arrangement_delete.py` and `live_track_operations.py` hashes exactly equal their source hashes. Against the actual current eight-track Set, three pre-restart read-only deletion plans returned distinct tokens (`0ac293...`, `8dcaef...`, `97bd72...`), reproducing the old loaded runtime without mutation. Post-restart real proof is an accepted deferral owned by the user because only the user can decide how to handle unsaved baseline work during Live restart; QA resumes with three read-only plans before any mutation. The exact real deletion remains candidate-confirmation-gated.

## Risks and Deferrals

- Live must be restarted by the user so any unsaved baseline is handled explicitly; forced termination was not used.
- The real duplicate mutation is authorized after restart. A real Arrangement delete remains separately gated on showing the exact candidate, as stated to the user.
- Live undo grouping is host-dependent. Rollback checks after every undo and stops immediately at the original fingerprint, avoiding extra undo when Live groups operations.
- Shared worktree contains unrelated save-tool removal and Orchestra artifacts. No unrelated change was reverted, committed, or pushed.

## Architectural Concerns

Inherited: Live recreates Python wrappers and host calls are non-transactional. Resolution uses observable coordinates and every mutation is followed by observable verification. Self-imposed: requiring callable `Song.undo` may make duplication return 501 on Live versions that expose duplicate but not undo; this is intentional fail-closed behavior for active-Set safety.

```json
{
  "status": "ready_for_qa_after_live_restart",
  "changedComponents": ["stable Arrangement identities", "verified deletion", "exact track duplication", "bounded rollback", "fresh-proxy tests", "docs"],
  "behaviorChanged": "No Python object identity participates in either target operation; successful mutations require exact observable readback.",
  "unitTests": "focused Python/Node, py_compile, diff-check, and full npm test all pass",
  "commandsRun": ["python3 test/live_arrangement_delete_test.py", "python3 test/live_track_operations_test.py", "node test/arrangement-clip-delete.mjs", "node test/live-track-operations.mjs", "npm test", "git diff --check"],
  "liveState": "installed hashes match; old runtime reproduced before restart; no mutation or save",
  "remaining": ["restart Live", "three stable plans", "nonzero duplicate readback", "exact-candidate deletion approval and readback"]
}
```
