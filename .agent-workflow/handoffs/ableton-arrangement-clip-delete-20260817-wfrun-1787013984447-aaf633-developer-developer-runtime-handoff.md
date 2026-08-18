# Developer Handoff: Safe Arrangement Clip Deletion

- Task: `ableton-arrangement-clip-delete-20260817`
- Run: `wfrun-1787013984447-aaf633`
- Phase: developer
- Role: developer
- Status: ready for QA

## Outcome

Implemented separate read-only planning and destructive deletion contracts for exact Arrangement clips. The Remote Script uses the official `Track.arrangement_clips` collection and calls `Track.delete_clip(clip)` only with an exact object re-resolved from the owning track. The full selection is validated before any mutation, deletion order is deterministic and reverse-timeline, and a fresh timeline read reports per-clip absence verification.

No active Ableton bridge endpoint was called and the user's Set was not read or mutated. Real Live deletion remains deferred until the updated Remote Script is installed/restarted, the read-only plan is reviewed, and the user separately approves the exact identities.

Primary capability evidence remains the architect-recorded official Live 12.3.5 LOM sources:

- Track: https://docs.cycling74.com/apiref/lom/track/
- Clip: https://docs.cycling74.com/apiref/lom/clip/

## Changed Components

- `bridge/development/arrangement-clip-delete.js`: focused deterministic plan/delete policy with ephemeral object identity, whole-plan fingerprinting, exact selection validation, deterministic deletion, and readback.
- `ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py`: fake-Live-verifiable Remote Script implementation using `Track.arrangement_clips`, exact `Clip` objects, `Track.delete_clip`, and fail-closed 409/501 errors.
- `bridge/development-adapter.js`, `bridge/http-server.js`, `src/bridge.js`, `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, `ableton_remote_scripts/AbletonMcpBridge/live_api.py`: thin route/action wiring for `GET /arrangement/clips/delete-plan` and `DELETE /arrangement/clips`.
- `src/tools.js`: listed `ableton_plan_arrangement_clip_deletion` and `ableton_delete_arrangement_clips`, strict destructive input validation, and dispatch wiring.
- `src/risk-policy.js`: planning is `read`; deletion is blocked-by-default `destructive` and requires explicit approval/snapshot policy.
- `bridge/observability.js`, `ableton_remote_scripts/AbletonMcpBridge/live_observability.py`: synchronized conditional host capability metadata.
- `docs/ableton-bridge-contract.md`, `docs/ableton-compatibility.md`, `docs/ableton-python-remote-script.md`, `docs/risk-policy.md`: exact contract, compatibility, fail-closed behavior, and risk documentation.
- `test/arrangement-clip-delete.mjs`, `test/live_arrangement_delete_test.py`, `test/deterministic.mjs`, `test/remote-script-static.mjs`: focused Node/Python fake-Live coverage and full-suite registration/static compile coverage.

All changed files map to the task's declared `src`, `bridge`, `ableton_remote_scripts/AbletonMcpBridge`, `test`, and `docs` ownership paths.

## Behavior Changed

- Planning is read-only and returns `planToken` plus candidates containing `trackIdentity`, `clipIdentity`, `trackIndex`, `arrangementIndex`, `startBeat`, `lengthBeats`, name, and capability status.
- Identities combine ephemeral in-process object identity with observable timing/name/index fields. Recreated look-alike objects are stale even if visible metadata matches.
- Deletion accepts only a current plan token and a non-empty duplicate-free list of exact clip identities.
- Stale plan, missing identity, duplicate selection, unsupported identity fields, inaccessible `arrangement_clips`, or any selected track lacking callable `delete_clip` fails before mutation.
- Session clips are never used for resolution or deletion. Unselected Arrangement clips remain untouched.
- Successful responses include one `deleted` and `verifiedAbsent` result per requested identity.

## Unit Tests and Commands Run

- `node test/arrangement-clip-delete.mjs` — exit 0, `arrangement clip deletion contracts ok`.
- `python3 test/live_arrangement_delete_test.py` — exit 0, `live arrangement delete fake-Live tests ok`.
- `npm test` — exit 0, `deterministic test suite ok`.

The tests cover no-mutation planning, exact multi-delete, preservation of unselected Arrangement and Session clips, reverse-timeline order, per-clip readback, stale metadata, object replacement, missing identities, duplicate identities, partial method support, MCP dispatch/schema separation, risk tiers, static Remote Script compilation, observability/compatibility synchronization, and the full regression suite.

Evidence:

- `.agent-workflow/evidence/ableton-arrangement-clip-delete-20260817-1787014570390-b2fbac10-7910-4f1b-8ea3-38178b498c8f-command.md`
- `.agent-workflow/evidence/ableton-arrangement-clip-delete-20260817-1787014570565-eb9190d2-5e56-4ecb-b444-b1c3780b783a-command.md`
- `.agent-workflow/evidence/ableton-arrangement-clip-delete-20260817-1787014570740-3a59bb42-d556-4ebf-9c5e-f75dde13ec2a-command.md`
- `.agent-workflow/evidence/ableton-arrangement-clip-delete-20260817-1787014570908-a7671502-b160-46db-b22f-9ab4125beecb-file.md`

## Goal-to-Verification Map

| Acceptance criterion | Verification |
| --- | --- |
| Read-only listed planning tool returns exact identity/timing without state change | Node planning test compares the complete state before/after; Python fake-Live test compares Arrangement and Session collections; schema/dispatch/risk checks confirm listing and read classification. |
| Separate destructive tool deletes every selected exact clip and preserves all unselected/Session clips | Node and Python exact multi-delete tests select two clips, retain the unselected clip and Session clip, assert deterministic order, and verify all selected identities absent. |
| Stale, missing, duplicated, ambiguous, or partially unsupported selections fail closed and results are per clip | Node/Python tests cover stale metadata, object replacement, missing/duplicate identities, and mixed supported/unsupported tracks with unchanged pre-mutation state; success results assert per-identity `verifiedAbsent`. Candidate identity collisions are rejected as ambiguous by production guards. |
| Focused Node/Python and npm test exit 0 without active Set mutation | All three commands exited 0. Tests use only the development adapter and fake Python objects; no request was made to the active Ableton bridge. |

## Simplicity Review

The diff is surgical around one two-stage workflow. Safety rules live in one focused JS module and one focused Python module because the existing `src/tools.js` and Remote Script adapters are already large entry points; those files receive only schema/dispatch/route wiring. No dependency, framework, GUI automation, Session deletion change, transport/mixer/device/save change, speculative generalized selector engine, or unrelated cleanup was introduced.

The workspace contains concurrent unrelated user/agent changes. They were preserved and are not claimed by this handoff.

## Architectural Concerns (inherited)

None. The implementation follows the approved architect decision and official `Track.delete_clip(clip)` design.

## Architectural Concerns (self-imposed)

- Two new public MCP/HTTP surfaces and two focused policy modules were introduced. Existing `ableton_get_arrangement` cannot carry a short-lived destructive authorization fingerprint, and existing Session `ableton_delete_clip` targets clip slots rather than Arrangement `Clip` objects; reusing either would blur risk classification and permit unsafe selectors.
- Ephemeral Python/JS object identity participates in the plan fingerprint. This is intentionally process-local and never persisted; it is required to reject a deleted-and-recreated look-alike whose visible timing/name metadata is identical. If a Live version returns unstable proxy wrappers for the same `Clip`, deletion will fail stale rather than target a different object.

```json
{
  "architecturalConcerns": {
    "inherited": [],
    "selfImposed": [
      {
        "concern": "Separate plan/delete MCP and HTTP surfaces with focused JS/Python policy modules",
        "rationale": "Existing Arrangement read and Session-slot delete contracts cannot safely express exact short-lived Arrangement object authorization."
      },
      {
        "concern": "Ephemeral in-process object identity is included in fingerprints",
        "rationale": "Observable metadata alone cannot distinguish an original clip from an identical delete-and-recreate replacement; unstable proxies fail closed."
      }
    ]
  }
}
```

## Known Gaps and QA Notes

- Real Live read-only planning is intentionally deferred until install/restart. Any real deletion remains separately approval-gated and must not be exercised during automated QA.
- The preprocessed runtime context warned that directory contents were omitted. Targeted source files under every changed path were inspected directly; unrelated directory contents were not exhaustively reviewed.
- QA should rerun the three commands above and inspect the destructive risk classification. Real active-Set mutation is out of scope.
