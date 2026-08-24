Task id: ableton-version-gated-arrangement-insertion-20260818
Phase: po
Role: product_owner
Runtime: codex-cli
Session id: ableton-version-gated-arrangement-insertion-20260818:wfrun-1787088039539-625c87:po:codex-cli

# Product Owner Handoff

## Result

- PO refinement: **PASS — ready for architecture review**.
- Release/business acceptance: **NOT YET SATISFIED**. All six acceptance criteria require implementation and QA evidence. This is expected at the PO phase and remains release-blocking until that evidence exists.
- Close status: **PO phase complete; advance to the `po→architect` human approval gate. Do not begin architecture or implementation until the user explicitly approves the gate.**
- Backlog item: `ableton-version-gated-arrangement-insertion-20260818`.
- Dependencies: none declared; Orchestra reports dependencies satisfied, no locks, one accepted sizing decision, and an active workflow run.
- Scope assessment: the story contains three user journeys (MIDI creation, exact Session-to-Arrangement duplication, and audio-file insertion), but they share one API surface, capability contract, pre/post fingerprint, and rollback rule. Keep one story so safety semantics cannot drift between modes. If implementation cannot preserve a common contract, split into three developer child stories behind a shared capability/readback prerequisite; do not weaken the shared safety criteria.

## Refined User Story

As an MCP user working with an explicitly selected Arrangement destination, I want the bridge to report which insertion modes that exact Live host and track can execute, then perform only the explicitly requested supported mode, so I can create or place one clip at an exact beat with observable readback and verified undo recovery instead of receiving an unconditional 501 or risking an unverified Arrangement mutation.

## Business Rules and Concrete Success Criteria

1. The request selects exactly one mutually exclusive mode: `midi_notes`, `session_clip`, or `audio_file`. Missing, mixed, or mode-incompatible fields fail before mutation.
2. Capability discovery is read-only and target-specific. It reports whether `create_midi_clip`, `duplicate_clip_to_arrangement`, and `create_audio_clip` are callable on the exact resolved destination track/host surface; existence without callability is unsupported. The response must not imply that one track's capability applies to another.
3. Destination track resolution, track-kind validation, numeric start/length validation, source-slot validation, file-path validation, and complete pre-state capture happen before mutation. Unsupported or invalid inputs fail explicitly with a stable machine-readable reason and no state change.
4. MIDI mode creates exactly one Arrangement MIDI clip on the resolved MIDI-capable destination at the requested start and length, applies the supplied name when present, writes the supplied notes exactly once, and reads back exact destination track, start, length, name, and note count. On Live 11+, prefer callable modern note APIs (`add_new_notes` and, where semantically needed, `apply_note_modifications`) over deprecated `Clip.set_notes`. Any compatibility fallback to `set_notes` must be explicitly capability-gated, limited to hosts where the modern operation is unavailable, surfaced in diagnostics/provenance, and covered by deterministic tests. Empty-note behavior must be chosen explicitly by architecture and then tested; it must not be accidental.
5. Session-copy mode resolves exactly one source track and Session slot, requires an occupied source slot, duplicates only that source clip to the requested Arrangement beat, and verifies one exact observable new-clip fingerprint. The source Session clip and all non-target Arrangement content remain unchanged.
6. Audio-file mode requires a valid, permitted file path and an audio-capable destination before mutation, creates exactly one Arrangement audio clip at the requested beat, and verifies the resulting observable fingerprint. The architecture must define path normalization/validation and whether clip length/name are host-derived or request-controlled; the API must expose the observed values rather than promise unsupported control.
7. Post-mutation success requires a complete pre/post Arrangement comparison with exactly one expected clip delta and no unexpected changes. Python object identity is never acceptance evidence because Live may recreate proxies.
8. Ambiguous delta, no-op mutation, wrong-track/wrong-time result, stale precondition, unexpected post-state, note-write/readback mismatch, or any exception after mutation is failure. When `Song.undo` is callable, invoke it and verify the complete pre-state fingerprint. Report the original failure plus either verified rollback or explicit rollback failure; never claim success from an attempted undo alone.
9. If the required host method or callable undo is unavailable for a path that could mutate before full verification, fail closed. Architecture must define whether absence of callable undo blocks all real mutation or only modes whose host call cannot be proven atomic; the chosen policy must favor preventing unbounded Set damage.
10. Real Live work is two-stage: read-only capability discovery may run only after installation/restart; every insertion or intentional undo requires separate approval for an exact bounded scenario in a disposable user-approved test Set. The current production Set is categorically excluded, and the feature must not save a Set.
11. Existing MCP naming may be preserved only when its request/response contract remains unambiguous and backward-compatible. Otherwise architecture must version or explicitly reject legacy ambiguous payloads rather than silently reinterpret them.
12. Application and bridge logs must never serialize full MIDI note payloads or unsanitized audio file paths. Errors may include bounded counts, stable error codes, method/capability names, and redacted path metadata sufficient for diagnosis.

## Refined Acceptance Criteria and Evidence Required

### AC1 — Read-only, target-specific capabilities

Given an exact destination track in deterministic fake-Live fixtures and later a disposable restarted Live host, when capability discovery is requested, then the response identifies callable availability for all three host methods on that exact target, includes enough target identity/provenance to prevent cross-track inference, and a full Arrangement fingerprint before and after is equal. Evidence: focused fixture assertions plus separately obtained read-only disposable-Set before/after responses.

### AC2 — Exact MIDI insertion

Given a MIDI-capable target and a valid single-mode MIDI payload, when insertion runs, then exactly one Arrangement clip is added at the requested start and length, supplied notes are written exactly once through the preferred callable modern API, and readback equals the requested track/start/length/name and expected note count; every non-target fingerprint is unchanged. A separate legacy fixture proves `set_notes` is used only when the modern operation is unavailable and the compatibility policy allows it, with the selected note-write path observable in sanitized diagnostics. Evidence: deterministic fake-Live test output. Real-host evidence is required only in the separately approved disposable Set.

### AC3 — Exact Session clip duplication

Given an occupied exact source track/Session slot and valid destination beat, when duplication runs, then exactly one new Arrangement clip attributable to that source appears at that beat, its observable fingerprint matches the expected source-derived fields, the Session source remains present, and all non-target fingerprints are unchanged. Evidence: deterministic fresh-proxy fixture output, plus a separately approved disposable-Set scenario if the exact host method is callable.

### AC4 — Fail-closed errors and verified rollback

Parameterized fixtures cover non-callable/absent methods, wrong track kinds, empty source slots, invalid or disallowed file paths, stale state, host no-op, ambiguous/multiple deltas, wrong target/time, note/readback mismatch, and post-mutation exceptions. Every pre-mutation failure leaves complete state unchanged. Every post-mutation failure calls callable undo once and either proves the complete pre-state restored or returns an explicit rollback-failed result. No branch reports success without exact readback.

### AC5 — Local quality gate

Focused Python and Node contract tests, relevant `py_compile`, static route/schema/wiring checks, the complete deterministic `npm test` suite, and `git diff --check` all exit 0. Command logs must show no request to the active bridge/port and must identify the exact files and test cases exercised.

### AC6 — Disposable Live validation only

After the updated Remote Script is installed and Live is restarted, read-only capability discovery in a user-approved disposable Set records target-specific callable results with unchanged pre/post state. Each supported mutation scenario is separately presented and approved before execution, produces exactly one expected clip with complete before/after readback, and exercises or otherwise proves the bounded undo path. Evidence must identify the disposable Set without exposing user-sensitive paths. No response, log, or trace may show contact with the production Set.

## Assumptions, Ambiguities, and Required Architecture Decisions

- Assumption: Live may return fresh Python wrappers across reads, so stable observable coordinates and fingerprints—not `id()` or proxy equality—are required.
- Assumption: host methods and signatures can vary by Live version, edition, track kind, or exposed LOM surface. Capability truth comes from runtime callable probing on the exact target, not a hard-coded marketing-edition table.
- Ambiguity: the public request shape, response/error codes, capability provenance fields, and legacy endpoint compatibility are not yet specified. Architecture must define them before development.
- Ambiguity: audio path allow-listing, normalization, existence/readability checks, and host-derived clip attributes are not yet specified. Architecture must make them deterministic and testable.
- Ambiguity: MIDI note schema, boundary rules, duplicate notes, empty-note behavior, and float tolerance are not yet specified. Architecture must reuse an existing authoritative note contract where possible and document comparison tolerances.
- Runtime evidence: Live 12.4.3 emits a deprecation warning for `Clip.set_notes` (deprecated since Live 11). Architecture must define modern note-write capability probing and the narrow legacy fallback contract; silently defaulting to `set_notes` is not acceptable.
- Ambiguity: Session source and destination may be the same track or different tracks. The API must name both explicitly and validate each independently.
- Tradeoff: one shared endpoint reduces surface area but increases payload ambiguity. Mutually exclusive discriminated modes are required; three internal mode handlers may remain separate.
- Tradeoff: strict complete-fingerprint checks may reject concurrent legitimate edits. Fail closed and report stale/unexpected state rather than accepting an unverifiable mutation.
- Required decision: define the rollback policy when mutation is supported but callable `Song.undo` is not. PO preference is to report capability as non-executable for real mutation unless an equivalently verifiable compensation exists.

## Edge Cases

- Negative, non-finite, zero, or overflow start/length values; notes outside clip bounds; overlapping or duplicate notes.
- Track index or stable selector resolves to zero or multiple tracks, track kind changes between capability check and mutation, or the Arrangement changes concurrently.
- Modern note-write methods are partially exposed, reject the note shape, or fail after clip creation; this is a post-mutation failure and must use the same verified rollback contract. A legacy fallback must not run after a modern method has partially mutated state.
- Source Session slot is absent, empty, changes after preflight, or contains a clip type unsupported by the destination/method.
- File is missing, unreadable, directory-like, changed after validation, unsupported media, or rejected by Live despite passing local checks.
- Host method exists but is non-callable, raises, returns no object, creates no clip, creates multiple clips, or creates at a coerced time/length.
- Clip name is omitted, empty, normalized, or host-coerced; readback must state the observed value and compare according to the defined contract.
- Undo is missing/non-callable, raises, is a no-op, undoes unrelated concurrent work, or restores only part of the fingerprint.

## Non-Goals

- Saving any Live Set, GUI automation, tempo-envelope writing, arbitrary clip import, bulk insertion, clip replacement, overwrite/ripple behavior, or production-Set mutation.
- Claiming a capability solely from Live version/edition, documentation, attribute presence, or a different target track.
- Supporting Arrangement MIDI note subrange editing, whole-project rollback, or concurrent multi-client mutation reconciliation.
- Expanding track creation/duplication capacity behavior; that belongs to the separate edition-capacity task.
- General request-level exception containment, HTTP server resilience, or bulk note-read repair. New Live 12.4.3 evidence shows a bulk note-read request can terminate only the Remote Script HTTP server while Live remains stable; this must be recorded as a separate follow-up bug with its own reproduction and acceptance criteria rather than broadening Arrangement insertion.
- Release, deployment, commit, push, tag, or publication work.

## Test Scenarios and Expected Results

| Scenario | Target surface/environment | Expected observable result | How obtained / required evidence |
|---|---|---|---|
| Capability probe, supported and unsupported permutations | API + local sandbox fake Live | Per-method callable flags and exact target identity are correct; complete before/after fingerprint is equal | Required focused Python/Node fixture assertions; not run in PO phase |
| Valid MIDI insertion | API + local sandbox fake Live | Exactly one MIDI clip delta at exact target/start/length; exact name and note count; modern note-write path selected; non-target state equal | Required deterministic modern-API and legacy-fallback fixture tests; not run in PO phase |
| Valid Session duplication | API + local sandbox fake Live | Exactly one source-derived Arrangement clip delta at requested beat; source slot and non-target state equal | Required deterministic fresh-proxy fixture test; not run in PO phase |
| Valid audio insertion | API + local sandbox fake Live | Exactly one audio clip delta on audio-capable target; observed host-derived fields returned; non-target state equal | Required deterministic fixture test; not run in PO phase |
| Invalid/unsupported inputs | API + local sandbox fake Live | Stable explicit failure before mutation and byte-equivalent complete state | Required parameterized fixture tests; not run in PO phase |
| Post-mutation mismatch/no-op/exception | API + local sandbox fake Live | Failure, one callable undo attempt, complete pre-state restoration proven or `rollback_failed` surfaced | Required parameterized fixture tests; not run in PO phase |
| Local regression gate | CLI + local sandbox | All focused/static/full commands exit 0 and no active bridge is contacted | Required developer/QA command logs; not run in PO phase |
| Real capability discovery | Desktop app + integration, disposable Live Set | Exact-target callable report; no Arrangement mutation | Deferred until install/restart; requires disposable Set and read-only evidence |
| Real bounded insertion and undo | Desktop app + integration, disposable Live Set | One approved expected delta, exact readback, bounded verified undo scenario, no production-Set contact | Deferred; separate user approval required per exact scenario |
| PO artifact validation | Workflow/runtime + generated artifact | Story has testable outcomes, assumptions, non-goals, edge cases, risks, and release blockers | Obtained by task context, PO playbook, workflow render, and this handoff review |

## Acceptance-Criteria Evidence Assessment

| Criterion | Current status | Assessment |
|---|---|---|
| AC1 | **Not satisfied — release-blocking** | PO defines the observable contract; no capability fixture or disposable-Live response exists yet. |
| AC2 | **Not satisfied — release-blocking** | PO defines exact MIDI outcome; no implementation/readback test exists yet. |
| AC3 | **Not satisfied — release-blocking** | PO defines exact Session-copy outcome; no implementation/fingerprint test exists yet. |
| AC4 | **Not satisfied — release-blocking** | Failure matrix and rollback proof are defined; no executed evidence exists yet. |
| AC5 | **Not satisfied — release-blocking** | Required command matrix is defined; no developer/QA command evidence exists yet. |
| AC6 | **Not satisfied — release-blocking and intentionally deferred** | Requires install/restart, a disposable Set, and separate approval for each mutation scenario. The production Set must never be used. |

## Real Product Proof

Real mutating product proof is explicitly deferred. Owner: user. Rationale: the
updated implementation does not exist yet, and exercising Arrangement insertion
before local verification and installation could corrupt a Set. Required
environment: the user-approved disposable Live Suite test Set, never the
production Set. Next sequence after Developer and local QA pass: install the
Remote Script, restart Live, call the read-only capability endpoint and compare
the complete Arrangement fingerprint, then present each exact bounded insertion
or undo scenario for separate user approval before calling it. The current PO
phase provides real task, source-research, and user-approval evidence but does
not claim simulated handoffs as Live proof.

## Risks and Controls

- **Active-Set data loss:** wrong-track/time or unexpected deltas could corrupt Arrangement content. Control: disposable Set only, complete fingerprints, one-delta verification, callable undo, and verified restoration.
- **Live runtime compatibility:** methods/signatures may differ. Control: exact-target callable probes and explicit unsupported results; no version-only promise.
- **Stale/concurrent state:** another edit can invalidate preflight or make undo unsafe. Control: compare precondition fingerprint immediately before mutation and fail closed on any mismatch; real scenarios must be single-operator and bounded.
- **False rollback success:** an undo call is not proof. Control: complete fingerprint equality is required; otherwise surface rollback failure.
- **Path/privacy exposure:** audio file paths can leak local information. Control: validate locally, minimize/redact evidence paths, and never echo unnecessary absolute paths.
- **Sensitive/high-volume logging:** note bodies or paths in error logs can leak content and amplify failures. Control: stable codes, bounded counts, capability/method labels, and redacted path metadata only.
- **HTTP exception containment defect:** a bulk note-read request reportedly killed the Remote Script HTTP server while Live stayed stable. Control for this story: do not broaden scope; log a separate follow-up bug for request-level exception containment and sanitization, while still requiring insertion-specific failures to be safely surfaced and sanitized.
- **Oversized scope:** three modes may expand independently. Control: shared safety contract; split mode implementation only if architecture cannot keep shared behavior atomic and testable.

## Consumed Context Files

- `.agent-workflow/playbooks/po.md` — read in full; applied refinement, ambiguity, non-goal, edge-case, dependency, and scope-sizing rules.
- `AGENTS.md` — required runtime rules were provided in the runtime context and applied: Orchestra preflight, active task/workflow validation, evidence discipline, gate pause, and no push/tag/publish/deploy.
- `.agent-workflow/runs/ableton-version-gated-arrangement-insertion-20260818-wfrun-1787088039539-625c87-po-runtime-codex-cli-spawn-prompt.md` — read completely; applied return contract, metadata, lifecycle command, and no product-code/Ableton constraint.
- `ableton_remote_scripts/AbletonMcpBridge`, `bridge`, `src`, `test`, and `docs` — only directory references were present in the reduced runtime context. Raw contents were intentionally not loaded because PO refinement did not require implementation inspection. This limits claims about current code and test coverage; all implementation criteria remain release-blocking until developer/QA evidence exists.
- Primary-skill rules applied: `doc-sync` audit was run because docs are in scope. `audio-video-transcription` was not applicable because no media or transcript was provided. Developer/QA/architect-only prompt-registry, agent-learning, PR-review, source-of-truth, collection-standards, Playwright, and static-analysis actions were not applicable to this PO-only, no-code phase. Release-readiness informed the explicit rollback/release blockers but no release evaluation was performed.

## Commands Run

- `orchestra health --runtime codex-cli --json` — completed; workflow readiness passed, workspace was advisory, optional generated-guidance refresh warnings were non-blocking.
- `orchestra task list --json --status pending,blocked,in_progress` — completed; matching task found pending with dependencies satisfied.
- `orchestra validate --pre-run --task ableton-version-gated-arrangement-insertion-20260818 --json` — expected nonzero result because task evidence and review did not yet exist; task, estimate, workflow run, and active context checks passed.
- `orchestra context --task ableton-version-gated-arrangement-insertion-20260818` — completed; no prior handoff/review/evidence, one sizing decision, no locks.
- `orchestra delegation decide --task ableton-version-gated-arrangement-insertion-20260818` — completed; `single_delegate`, no blockers.
- `orchestra plan --task ableton-version-gated-arrangement-insertion-20260818` — completed; architecture depends on context, development on architecture, QA on development.
- `orchestra skills plan --task ableton-version-gated-arrangement-insertion-20260818` — completed; task-scoped skills reviewed.
- `orchestra protocol render` — completed; product-owner handoff fields confirmed.
- `orchestra workflow render --task ableton-version-gated-arrangement-insertion-20260818 --phase po --target codex --json` — completed; implementation and QA evidence remain missing as expected.
- `orchestra doc-sync audit --task ableton-version-gated-arrangement-insertion-20260818` — passed with warnings for documentation prompt-registry coverage; warnings are deferred to the developer/docs phase because no documentation was changed in this PO phase.
- `orchestra evidence add --task ableton-version-gated-arrangement-insertion-20260818 --role product_owner --type file ...` — completed; PO refinement evidence recorded.
- `orchestra review --task ableton-version-gated-arrangement-insertion-20260818 --role product_owner --result approve ...` — completed; story approved for the architecture gate while AC1–AC6 remain release-blocking.
- Final `orchestra validate --pre-run --task ableton-version-gated-arrangement-insertion-20260818 --json` — passed with `isReady=true`, active context, and no missing checks after PO evidence and review were recorded.
- `orchestra runtime spawn-lifecycle --session ableton-version-gated-arrangement-insertion-20260818:wfrun-1787088039539-625c87:po:codex-cli --status completed --agent-id codex-cli:child --artifact ...` — completed; Orchestra resumed to the architect transition and paused at the required blocked-review gate. A parent runtime action may be rendered only after explicit gate approval.

## Touched Files

- `.agent-workflow/handoffs/ableton-version-gated-arrangement-insertion-20260818-wfrun-1787088039539-625c87-po-product_owner-runtime-handoff.md` — created as the PO handoff.
- `.agent-workflow/evidence/ableton-version-gated-arrangement-insertion-20260818-1787088208781-8411f014-b0a2-41f1-ae26-d5d7143d7f22-file.md` — generated by Orchestra for PO evidence.
- `.agent-workflow/reviews/ableton-version-gated-arrangement-insertion-20260818-product_owner-review.md` — generated by Orchestra for the PO review.
- Product code, tests, documentation, and Live Set state: unchanged.

## Pass/Fail Summary

- Required context and PO refinement: **PASS**.
- Scope-size decision: **PASS; keep one story with a shared safety contract**.
- Architecture-entry readiness: **PASS, pending explicit user approval at the `po→architect` gate**.
- Implementation/QA/release acceptance: **FAIL/NOT RUN by design; release-blocking until AC1–AC6 evidence is produced**.
- Ableton contact or mutation: **NONE**.
