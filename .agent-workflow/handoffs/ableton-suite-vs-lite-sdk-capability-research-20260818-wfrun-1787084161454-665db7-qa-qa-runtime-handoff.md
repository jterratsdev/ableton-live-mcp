Task id: ableton-suite-vs-lite-sdk-capability-research-20260818
Phase: qa
Role: qa
Runtime: codex-cli
Session id: ableton-suite-vs-lite-sdk-capability-research-20260818:wfrun-1787084161454-665db7:qa:codex-cli

# QA Handoff: Live Suite versus Lite SDK capabilities

## Outcome

QA approves the research report. Suite increases product capacity, installed
content, I/O, return tracks, and adds Max for Live, but the public Application
and Song LOM surfaces still do not expose Set save or Save As. The MCP save tool
must remain absent.

The report also corrects an outdated bridge assumption: the modern Track LOM
documents `create_midi_clip`, `duplicate_clip_to_arrangement`, and
`create_audio_clip`. MIDI creation and Session-to-Arrangement duplication are
corroborated in both installed Live binaries. Audio insertion is kept unknown
because the installed applications are different versions (Lite 12.4.2 and
Suite 12.4.3).

## Acceptance criteria

- AC1 pass: `docs/ableton-suite-vs-lite-sdk.md` contains the official-source
  matrix for tracks, scenes, sends/returns, I/O, instruments, effects, Packs,
  and Max for Live, verified 2026-08-18.
- AC2 pass: the report records exact documented methods or explicit absence for
  save, Arrangement insertion, tempo envelopes, plugin parameters, and routing.
- AC3 pass: every surface is classified as entitlement, shared, unsupported, or
  unknown and has a concrete MCP recommendation.
- AC4 pass: the only live request was read-only `GET /status`; no POST, DELETE,
  save, transport, clip, device, routing, or other Set mutation was invoked.

## Evidence and commands

- Official Ableton edition comparison and official Cycling '74 LOM pages were
  used as primary sources; internal binary strings are only corroborating.
- Installed versions: Live Lite 12.4.2 and Live Suite 12.4.3.
- `curl -sS --max-time 2 http://127.0.0.1:9789/status` exited 0 and returned
  `edition.name=suite`, high confidence, four audio/MIDI tracks, and unlimited
  track capacity.
- `npm test` exited 0 and ended `deterministic test suite ok`.
- `git diff --check` exited 0.
- `orchestra qa evidence-check --surface api ... --external-validation ...
  --json` returned `observableOutcome=true` with no gaps.

## Changed path and test strategy

The research artifact is `docs/ableton-suite-vs-lite-sdk.md`. No product source,
test fixture, installed Remote Script, or active Set was changed for this task.
The test strategy combined official primary sources, read-only installed-resource
inspection, an exact GET status response, full repository regression, and a
classification audit that preserves unknowns instead of inferring edition-only
behavior from unequal versions.

## Risks and next work

The installed Suite `live_editions.py` hash differs from the worktree version,
although the edition diagnostic is present and worked. Future implementation
runtime checks still require reinstall/restart. Implement Arrangement insertion
as a separate version-gated task with callable probes, exact readback, undo, and
a disposable Set. Do not restore project save, automate the GUI, or infer hidden
plugin controls from the Suite license.

## Context acknowledgement and consumed context files

QA acknowledges the task acceptance criteria, verifier contract, scope, and the
parent execution request. The runtime reported no separate context manifest, so
the task context was loaded directly with `orchestra context`. Consumed inputs:

- `AGENTS.md`
- `.agent-workflow/runs/parent-execution-af73588160a10bbcd99ccc28f06bf8b9ce3c60c364728dfb199f7a5ecaa8aedd-request.json`
- `.agent-workflow/handoffs/ableton-suite-vs-lite-sdk-capability-research-20260818-architect-to-qa.md`
- `docs/ableton-suite-vs-lite-sdk.md`
- `ableton_remote_scripts/AbletonMcpBridge/live_arrangement.py`
- Official Ableton edition comparison and official Cycling '74 Application,
  Song, Track, Device, DeviceParameter, and PluginDevice LOM references.

## Edge cases

- The two official Ableton comparison pages disagree by one Suite instrument
  and one audio effect; the report preserves both numbers and uses runtime
  browser inventory as the eventual authority.
- Lite and Suite installations differ by patch version, so the presence of the
  audio Arrangement insertion symbol in Suite alone is not called an edition
  entitlement.
- Internal template-save symbols in both binaries are explicitly rejected as
  proof of a supported public Set-save contract.
- The installed Suite Remote Script hash differs from the worktree even though
  the read-only edition diagnostic is working; no uninstalled behavior is
  claimed as runtime proof.

## E2E evidence or rationale

The applicable end-to-end check is the real Suite bridge's read-only
`GET /status`, which passed and identified Suite without mutation. An E2E save
test is impossible through the supported public LOM surface and would contradict
the scope. Arrangement insertion E2E is intentionally deferred to a separate
implementation task and a disposable Set because it is mutating and requires
rollback verification.

## Recommendation

Accept and close the research. No release, push, tag, publish, or active-Set
mutation is authorized by this handoff.
