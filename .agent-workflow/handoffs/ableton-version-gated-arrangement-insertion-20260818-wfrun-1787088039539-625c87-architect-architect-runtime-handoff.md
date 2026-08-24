Task id: ableton-version-gated-arrangement-insertion-20260818
Phase: architect
Role: architect
Runtime: codex-cli
Session id: ableton-version-gated-arrangement-insertion-20260818:wfrun-1787088039539-625c87:architect:codex-cli

# Architect Handoff

## Result

- Architecture review: **PASS for development**.
- Story size: **m / 5 points**, already recorded and still appropriate. Keep the three modes in one story because capability, fingerprint, readback, and rollback semantics must remain shared.
- Product code, tests, docs, and Ableton state were not changed. No bridge or Live endpoint was called.
- Close status: architect phase complete. AC1–AC5 and AC7 remain unproved until Developer/QA evidence exists. AC6 real-product proof is explicitly deferred to the user-approved disposable Set after local QA and install/restart.

## Architecture Decision

### Decision: explicit version-gated insertion service with a shared safety envelope

Status: accepted for implementation.

Context: the existing Remote Script endpoint in `ableton_remote_scripts/AbletonMcpBridge/live_arrangement.py` unconditionally returns 501, while the MCP and deterministic bridge accept an ambiguous legacy source union. Current Live surfaces may expose `Track.create_midi_clip`, `Track.duplicate_clip_to_arrangement`, and `Track.create_audio_clip` differently by host and exact track. Live may recreate Python proxies, so object identity is not stable evidence.

Decision:

1. Preserve `ableton_insert_arrangement_clip` and `POST /arrangement/insert`, but require an explicit discriminator: `mode: "midi_notes" | "session_clip" | "audio_file"`. Reject legacy payloads lacking `mode` with `legacy_payload_unsupported`; never infer a mode from `kind`, `sourceRef`, or overlapping source fields.
2. Add a separate read-only MCP action and route, `ableton_get_arrangement_insertion_capabilities` → `GET /arrangement/insertion-capabilities?trackIndex=N`. It resolves one exact destination track and returns target identity plus per-method `callable`, `applicable`, and `executable` flags. `callable` means `callable(getattr(exact_track, method, None))`; `executable` additionally requires correct track kind and callable `Song.undo`. The response includes `readOnly: true`, an Arrangement fingerprint, and no mutation.
3. Put Live-specific behavior in a focused `live_arrangement_insert.py` service rather than growing `live_arrangement.py`. Reuse or extract canonical observable Arrangement summaries/fingerprints shared with deletion. Keep `AbletonMcpBridge.py`, `live_api.py`, HTTP routing, `src/bridge.js`, and MCP dispatch thin. Do not add business rules to the 1,114-line `src/tools.js`; place discriminator validation/normalization in a focused JS contract module and leave only schema registration/dispatch wiring in `src/tools.js`.
4. Resolve and validate all inputs and capture the complete canonical pre-state immediately before mutation. Recheck that fingerprint immediately before the host call. All real insertion modes require callable `Song.undo`; absent undo makes the method visible as callable but `executable: false` and mutation fails closed.
5. After mutation, enumerate fresh proxies and require exactly one canonical clip delta on the exact target. Compare stable observables, never Python identity. Any no-op, multiple delta, wrong target/time/length, stale fingerprint, note mismatch, readback exception, or unexpected non-target change is a post-mutation failure.
6. On post-mutation failure, invoke only the bounded undo operations attributable to the request, reading the full canonical fingerprint after each. Stop as soon as the exact pre-state fingerprint is restored. MIDI has at most two attributable mutation stages (clip creation and note write); Session/audio have one. If restoration is not exact, return `rollback_failed` with the original sanitized failure. Never attempt the legacy note method after a modern note call has begun or failed.

Consequences: the public insert contract becomes intentionally strict; old ambiguous calls fail visibly. A new read-only capability surface is added. The insertion service owns mutation safety and readback, while adapters remain thin. Callable support is reported independently from executability, preventing a method on the wrong track or a host without undo from being presented as safely usable.

Alternatives rejected: extending `GET /arrangement` cannot be target-specific without changing its current semantics; inferring a mode from legacy fields remains ambiguous; version/edition tables become stale; object identity fails with rewrapped Live proxies; accepting mutation without callable undo cannot satisfy verified recovery.

## Public Contract

Common insert fields are `mode`, `trackIndex`, and `startBeat`. Requests use `additionalProperties: false` and enforce exactly the fields for the selected mode.

- `midi_notes`: requires `lengthBeats` and non-empty `notes`; optional non-empty `name`. Reuse the current MIDI note schema and maximum count. Every note must have pitch 0–127, start >= 0, duration > 0, velocity 1–127, and `start + duration <= lengthBeats` within the existing numeric epsilon. Exact duplicate/overlapping notes remain valid and count independently. Empty notes are rejected before mutation, matching the existing authoritative Session MIDI creation contract.
- `session_clip`: requires explicit `sourceTrackIndex` and `sourceClipSlotIndex`; no file or MIDI fields. Because the documented host call is track-owned, v1 requires `sourceTrackIndex === trackIndex`; cross-track copy fails before mutation as `cross_track_session_copy_unsupported`. The slot must exist, remain occupied, and expose the same source fingerprint immediately before mutation.
- `audio_file`: requires `sourcePath`; no requested length because Live derives duration, and optional requested name is not supported in v1. Normalize with `realpath`; require a readable regular file and a case-insensitive allow-listed extension (`wav`, `aif`, `aiff`, `flac`, `mp3`). Pass the normalized path to Live but return/log only redacted basename/extension metadata. The destination must be audio-capable. Readback exposes host-observed name and length.

Successful insertion returns `ok`, `mode`, exact target identity, the observed clip summary, `beforeFingerprint`, `afterFingerprint`, `deltaCount: 1`, and capability provenance. MIDI additionally returns `noteCount` and `noteWriteMethod`.

Failures use stable machine-readable codes with sanitized messages: `invalid_request`, `target_not_found`, `wrong_track_kind`, `unsupported_method`, `undo_unavailable`, `source_slot_empty`, `source_stale`, `file_not_permitted`, `precondition_stale`, `mutation_noop`, `ambiguous_readback`, `unexpected_post_state`, `readback_mismatch`, and `rollback_failed`. Do not serialize note bodies or absolute paths.

## Live Adapter and Fingerprint Contract

Canonical Arrangement state is an ordered list across all normal tracks. Each entry contains `trackIndex`, stable track display name, per-track `arrangementIndex`, observed clip name, `startBeat`, `lengthBeats`, `endBeat`, and observable MIDI/audio kind when exposed. Hash canonical JSON with deterministic separators. The full state, not merely the target track, is compared before/after and after rollback.

- MIDI: call exact destination `create_midi_clip(startBeat, lengthBeats)`. Prefer callable `clip.add_new_notes` and construct the host's modern note specifications. Use `clip.set_notes` only when `add_new_notes` is not callable before mutation. Return `noteWriteMethod: "add_new_notes" | "set_notes"`. Read note count through the best callable read API; failure to establish exact count is a readback failure.
- Session: resolve the exact occupied Session slot and call `track.duplicate_clip_to_arrangement(source_clip, startBeat)`. Verify the source slot fingerprint is unchanged and the one new Arrangement delta matches target track, requested beat, source name/kind, and host-observed duration.
- Audio: call `track.create_audio_clip(normalizedPath, startBeat)`. Verify one audio delta at the exact target/start and return its host-derived name and length.

Use a small float epsilon only when comparing host-returned beats; preserve raw observed values in the response. Do not use the returned clip object as proof: always re-enumerate Arrangement clips.

## Module Boundaries and Data Flow

`MCP schema/validation` → `bridge action/HTTP route` → `Live insertion service` → `exact target capability/preflight` → `canonical pre-fingerprint` → `one mode adapter` → `fresh full readback/delta` → `success`, or `bounded Song.undo` → `full restoration fingerprint` → `verified failure/rollback_failed`.

Expected implementation surfaces:

- `ableton_remote_scripts/AbletonMcpBridge/live_arrangement_insert.py`: capability probing, mode validation, host calls, delta verification, rollback orchestration.
- A focused shared Arrangement fingerprint helper extracted from the current insertion/deletion readers if reuse is clean; preserve deletion behavior and tests.
- `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py` and `live_api.py`: thin route/import wiring only.
- `bridge/development/arrangement-insert.js`: deterministic equivalent contract; `bridge/development/arrangement.js` remains snapshot/locator-focused.
- `src/arrangement-insertion.js`: MCP-side discriminated validation/normalization; `src/tools.js`, `src/bridge.js`, risk policy, observability, and docs receive thin registrations.
- Focused Python fake-Live and Node contract tests plus existing full regression suite.

## Test Scenarios and Expected Results

| Scenario | Target surface/environment | Expected observable result | How result is obtained |
| --- | --- | --- | --- |
| Exact-target capability probe | API + local fake Live | Three exact method callable flags, target identity, executability, `readOnly: true`, and identical full fingerprints | Focused Python fixture and Node route/schema contract |
| Live 12 MIDI | API + local fake Live | One exact delta; requested timing/name/note count; `add_new_notes`; zero `set_notes` calls | Fresh-proxy fake-Live test |
| Legacy MIDI | API + local fake Live | One exact delta; `set_notes` selected only because modern method is non-callable | Legacy capability fixture |
| Session duplication | API + local fake Live | One source-derived delta at requested beat; source slot and every non-target entry unchanged | Exact source/slot and fresh-proxy fixture |
| Audio insertion | API + local fake Live | One audio delta at requested beat with host-derived length/name; path absent from logs/response | Temp readable audio fixture and redaction assertions |
| Preflight failures | API + local fake Live | Stable explicit error and byte-equivalent canonical state; no undo because no mutation occurred | Parameterized missing method, wrong kind, empty slot, invalid path, mixed/legacy payload tests |
| Post-mutation failures | API + local fake Live | Bounded undo invoked; exact pre-state restored or `rollback_failed`; never false success | No-op, multiple delta, wrong timing, note mismatch, readback exception, undo no-op/raise fixtures |
| AC5 local quality gate | CLI + local sandbox | Focused Python/Node tests, relevant `py_compile`, static route/schema/wiring checks, `npm test`, and `git diff --check` each exit 0 with success markers and no active bridge request | Captured Developer/QA command output; exact commands finalized from repository scripts |
| AC6 real capability | Desktop app + integration, disposable Set | Target-specific capabilities and identical before/after state | Deferred until install/restart; read-only call only in the named disposable Set |
| AC6 real bounded mutation/undo | Desktop app + integration, disposable Set | Separately approved one-clip delta and exact readback; bounded recovery shown without production-Set contact | Deferred per scenario; user approval required before each mutation/intentional undo |

## Acceptance-Criteria Evidence Assessment

| Criterion | Status at architect handoff | Evidence judgment |
| --- | --- | --- |
| AC1 | Not satisfied; release-blocking | Contract is defined, but no capability fixture or disposable-Live before/after evidence exists. |
| AC2 | Not satisfied; release-blocking | MIDI method selection and exact readback are designed, not implemented or executed. |
| AC3 | Not satisfied; release-blocking | Exact same-track Session source/delta contract is designed, not tested. |
| AC4 | Not satisfied; release-blocking | Failure taxonomy and bounded verified rollback are designed, not tested. |
| AC5 | Not satisfied; release-blocking | This criterion is now observable: QA must retain exit codes and success markers for every named command and prove logs contain no active-bridge request. No such command evidence exists yet. |
| AC6 | Not satisfied; intentionally deferred and release-blocking | Product Owner/user accepted deferral to the disposable Live Suite Set after implementation, local QA, install, and restart. Read-only discovery comes first; each bounded mutation/undo needs separate approval. Production Set contact is forbidden. |
| AC7 | Not satisfied; release-blocking | Mapped explicitly to two fixtures: Live 12 must assert one `add_new_notes` call and zero deprecated `set_notes` calls; legacy must assert modern non-callability, one `set_notes` call, and response provenance in both cases. |

## Risks and Controls

- Undo can affect concurrent user work. Real validation must be single-operator in a disposable Set; compare a fresh precondition immediately before mutation and bound undo attempts to request-owned mutation stages.
- Host wrappers and ordering can change. Canonical observable summaries and exact one-delta comparison replace proxy identity.
- MIDI creation plus note writing is multi-stage. No fallback after a modern call begins; all later failure flows through verified rollback.
- Absolute paths and note bodies are sensitive/high-volume. Redact them from responses, logs, and error strings.
- `src/tools.js` and `live_clips.py` are already large. Do not add insertion business logic there; use focused modules and thin wiring.
- The runtime context bundle omitted raw ownership-directory contents and trimmed reviews/evidence. Targeted source inspection plus the authoritative current task and PO handoff resolved the design questions, but implementation claims remain intentionally absent.

## Real Product Proof Deferral

Accepted owner: user. Environment: disposable user-approved Live Suite test Set only. Rationale: the implementation does not yet exist and premature Arrangement mutation risks Set corruption. Sequence: local deterministic QA → install updated Remote Script → restart Live → read-only target capability/fingerprint proof → present one exact bounded scenario → obtain separate approval → mutate/read back → separately approve undo evidence as needed. Never contact or save the production Set.

## Consumed Context Files

- `.agent-workflow/playbooks/architect.md` — read in full; applied boundaries, data flow, integration contracts, rollback risk, sizing, and ADR rules.
- `AGENTS.md` — required excerpt and repository instructions applied: Orchestra preflight/context validation, active workflow, evidence discipline, gate behavior, and no push/release.
- `rules/development/semantic-code.md` — applied domain naming, narrow contracts, thin entry points, and behavior-oriented test names.
- `rules/architecture-decisions.mdc` — applied ADR status/context/decision/consequences/alternatives format.
- `rules/module-boundaries.mdc` — applied file-size check and focused service/contract modules; existing 1,114-line `src/tools.js` is a god-file risk.
- `rules/development-engineering.mdc` — supplied excerpt was truncated after entry-point guidance; the available project-context, layering, and thin-adapter rules were applied. The omitted tail limits no architecture conclusion because no implementation was performed.
- Architect runtime spawn prompt — read completely; applied return contract, corrected task ACs, context warning, no product-code/Ableton rule, and lifecycle command.
- Current task record and PO handoff — authoritative criteria, including observable AC5, explicit AC7 mapping, and user-approved disposable-Set deferral.
- Targeted local sources: `live_arrangement.py`, `live_arrangement_delete.py`, `live_clips.py`, `AbletonMcpBridge.py`, `live_api.py`, `bridge/development/arrangement.js`, `bridge/development/arrangement-clip-delete.js`, `bridge/http-server.js`, `bridge/server.js`, `src/bridge.js`, `src/tools.js`, and `docs/ableton-suite-vs-lite-sdk.md`.
- Source-of-truth guidance applied: local task/PO/research and project code were authoritative; official vendor findings already recorded in the approved local research report were used, with runtime callability remaining authoritative.
- PR-review guidance applied to behavior, tests, risk, rollout, rollback, and missing evidence. Doc-sync applies in Developer/Docs work; no docs changed here. Audio/video transcription and model-evaluation were not applicable because no media or model-routing work exists.

## Commands Run

- Orchestra health, active-task list, pre-run validation, task context, delegation decision, plan, skills plan, protocol render, workflow render, task show, and command help — completed. Health was degraded only by non-blocking optional generated-guidance refresh warnings; workflow readiness passed.
- Targeted `rg`, `wc -l`, and `sed` source inspection — completed read-only; no bridge request or Ableton contact.
- No implementation test was run because this is an architecture-only assignment. Developer/QA command evidence remains mandatory under AC5.

## Touched Files

- `.agent-workflow/handoffs/ableton-version-gated-arrangement-insertion-20260818-wfrun-1787088039539-625c87-architect-architect-runtime-handoff.md` — created.
- Orchestra-generated architecture decision, evidence, review, and lifecycle records — recorded after this handoff.
- Product code, tests, docs, and Live Set state — unchanged.

## Pass/Fail Summary

- Architecture definition and developer handoff: **PASS**.
- Scope sizing and module-boundary review: **PASS**.
- Acceptance/release proof: **NOT YET PASSING**; AC1–AC5 and AC7 await implementation/QA, and AC6 remains explicitly deferred to the disposable Set workflow.
- Ableton contact or mutation: **NONE**.
