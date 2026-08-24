Task id: ableton-kh-mashup-generic-tool-audit-20260820
Phase: qa
Role: qa
Runtime: codex-cli
Session id: ableton-kh-mashup-generic-tool-audit-20260820:wfrun-1787209409782-1b1877:qa:codex-cli

# QA review of the KH mash-up generic-tool audit

## Result

**Pass / approve the Architect research handoff.** Independent read-only inspection supports the handoff's inventory, classifications, overlap analysis, safety findings, SDK honesty, and P0-P4 contract completeness against committed baseline `b47fa41344db5513e5a610c065a98ee1e0517273`.

This approves only the static research artifact. It does not approve an implementation or release of P0-P4. Their stated prerequisites remain blocking for any dependent product feature.

No mash-up script was imported or executed. No audio, MusicXML score content, or `.als` content was opened beyond Python source text. No Live or bridge endpoint was called. No install, restart, commit, push, tag, publish, or product-code edit occurred.

## Findings

No release-blocking defect was found in the research artifact.

1. **Verified documentation conflict; implementation blocker, not audit blocker.** At baseline `b47fa4…`, `docs/snapshot-rollback.md` says Remote Script track mixer state is recorded but not restored, while `ableton_remote_scripts/AbletonMcpBridge/live_snapshots.py` calls `restore_mixer_state` and verifies supported track/return/master mixer fields. The Architect handoff explicitly discloses this conflict and correctly requires reconciliation before relying on rollback coverage.
2. **Non-blocking editorial duplication.** The Architect `Test Scenarios and Expected Results` table repeats the SDK-honesty row. This does not weaken coverage or alter the conclusion.
3. **P5 is intentionally not a recommended core candidate.** P5 is classified as keep-local or a possible separate notation plugin, so the full schema/probe/risk/readback/rollback/ownership requirement applies to the recommended P0-P4 core candidates. P0-P4 each contain those elements; P4 separately defines plan/apply risk and says apply accepts only a plan token plus exact fingerprints.
4. **Generic evidence-check mismatch.** `orchestra qa evidence-check` reported missing rendered/visual assertions because it applies a generic visual-generated-artifact checklist. The reviewed artifact is Markdown static research with no diagram/UI/rendered surface. Direct source enumeration, committed-source comparison, content-section checks, and prohibited-action checks are the appropriate evidence.

## Independent verification summary

- Exactly 16 direct Python files exist under `/Users/polux/Documents/gp/kh_mash_up/tools`, including `build_hybrid_solo.BACKUP-20260819-before-original-reuse.py`. All 16 appear exactly once in the Architect matrix.
- Static source inspection supports every row's purpose, inputs/outputs, dependencies, side effects, Live interaction, project assumptions, overlap, and classification. `build_mashup.py` was checked through its inputs/constants, build/verify/export sections, I/O sites, and symbol inventory because it is 4,513 lines.
- Eight scripts directly use the HTTP bridge: `add_clean_guitar_ab.py`, `add_pack_ab_tracks.py`, `mix_pack_tracks.py`, `mix_transition_fx.py`, `push_to_live.py`, `setup_piano_glitch.py`, `setup_split_guitars.py`, and `split_scenes.py`.
- No GUI automation library/clicking path and no direct `.als` parsing or mutation appears in the 16 scripts.
- Fixed indices, Spanish track names, preset/plugin names, sends, clip slots, scene indices, musical boundaries, BPM values, local corpus paths, and KH-specific authorship are pervasive where the handoff says they are and are excluded from generic defaults.
- Destructive patterns are accurately identified: occupied clip replacement deletes first, audition slots can overwrite/delete prior content, `push_to_live.py` can write by index after project-read failure, track/device creation has incomplete compensation, Session segmentation is broad mutation, and caller/fixed output paths overwrite without a universal atomic no-overwrite contract.
- `coverage.py` and `push_to_live.py` dynamically load and execute `build_mashup.py`; the handoff correctly rejects arbitrary Python execution as a generic MCP capability.
- Baseline `src/tools.js` exposes `createTracks` and `quantize` for `ableton_import_midi`; `src/midi-import.js` neither applies them nor creates tracks but echoes both, defaults the target to track/slot 0, and invokes clip creation.
- Baseline `live_clips.py` deletes an occupied clip before creating its replacement and the public create-note schema omits `muted`; the handoff correctly elevates occupied replacement risk and blocks muted-note-loss paths.
- Baseline `bridge/observability.js`, `src/tool-capabilities.js`, and `src/risk-policy.js` support the stated ownership/capability/risk layering and mark Remote Script automation, reorder, consolidation, render, bounce, and render-dependent mastering unsupported or conditional as described.
- Baseline capability/docs support the stated limits: Scene overrides are exact-index Session launch-time properties and do not launch a Scene; browser search is not target-load proof; device inventory exposes only Live-visible parameters; meters may be unavailable/zero/stale and are not universal mix evidence; snapshots are in-memory partial recovery rather than `.als` backups.
- P0-P4 each define a proposed tool/contract, minimal schema, read-only probe/preflight, risk tier, receiver-state verification, rollback/compensation, and ownership. The roadmap separates immediate correction/read-only inspection from transform export, track blueprint, and destructive Session segmentation.

## Acceptance criteria to evidence matrix

| Acceptance criterion | Test type and setup | Expected observable | Actual result and evidence | Status |
| --- | --- | --- | --- | --- |
| Every Python script is inventoried with purpose, I/O, dependencies, side effects, interactions, assumptions, and overlap. | Generated-artifact/static review. Enumerate direct `*.py` paths, count lines, compare each basename and source behavior to the 16-row matrix. | Sixteen unique direct files, including backup, each represented once with all required dimensions. | Sixteen paths found; matrix has sixteen unique rows. Static reads and I/O/network/import searches support every row. | Pass |
| Reusable behavior is classified into the required outcomes with feasibility and safety rationale. | Manual contract/classification review against script source and baseline MCP surfaces. | Every script has one defensible classification and project constants remain local. | All rows classify as adopt now/after prerequisite, compose, keep local, or reject; rationale matches actual dependencies and mutation risks. | Pass |
| Recommended candidates define name, schema, probe, risk, verification, rollback, and ownership without project constants. | P0-P4 section audit. Check every contract field and scan schemas for KH titles, fixed tracks/plugins/paths/tempi. | P0-P4 contain all seven contract dimensions and no KH constants. | Complete for P0-P4. P5 is explicitly out-of-core/keep-local, not a recommended core contract. | Pass |
| Audit identifies unsafe GUI automation, `.als` mutation, fixed names, writes, destructive operations, and unsupported SDK behavior. | Static pattern/source review plus committed capability/docs comparison. | Presence/absence and limitations are explicit and truthful. | No GUI or `.als` mutation found; fixed assumptions, overwrite risks, destructive operations, partial rollback, and unsupported/conditional SDK surfaces are explicitly documented. | Pass |
| Roadmap distinguishes quick wins from larger features, cites scripts/modules, and contacts/changes neither source nor Live. | Artifact structure/source citations plus Git/product diff and command review. | Ordered P0-P5 roadmap; exact source/module references; no product/source/Live mutation. | Roadmap is prioritized and split; baseline commit and modules are cited; product-path diffs are empty and no endpoint/script execution command was issued. | Pass |

## Test Scenarios and Expected Results

| Surface/environment | Scenario | Expected observable result | How obtained / actual result |
| --- | --- | --- | --- |
| Generated artifact / local sandbox | Inventory parity | Exactly 16 direct Python paths and exactly 16 unique matrix entries. | `rg --files`, `wc -l`, matrix-row `rg`; pass. |
| Generated artifact / local sandbox | Per-script content truth | Matrix descriptions match source imports, paths, writes, network calls, fixed constants, readbacks, and failure behavior. | Full reads of the smaller scripts plus targeted 4,513-line generator sections and pattern searches; pass. |
| Integration contract / committed repository | MCP overlap at exact baseline | Existing tools, routes, ownership, risk, and limitations match the audit. | `git show`/`git grep` at `b47fa41344db5513e5a610c065a98ee1e0517273`; pass. |
| API contract / generated artifact | MIDI import honesty and replacement risk | Unsupported options are accepted/echoed but unapplied; occupied replacement deletes first; muted notes cannot be preserved by create schema. | Static comparison of baseline `src/tools.js`, `src/midi-import.js`, `src/midi.js`, and `live_clips.py`; pass. |
| Generated artifact | Candidate completeness and wrong-target exclusion | P0-P4 each contain schema/probe/risk/readback/rollback/ownership and exclude KH constants/paths. | Manual section-by-section contract review and schema scan; pass. |
| Workflow/runtime | Prohibited-action guardrails | No mash-up execution, audio/ALS access, Live/bridge contact, install/restart, product edit, or Git publication. | Command history and product-path diff review; pass. Functional Live behavior intentionally not tested. |
| Generated artifact | Negative SDK honesty | No candidate claims Remote Script save/render/automation/reorder/consolidation, hidden parameters, target-load proof, reliable meters, or full snapshot safety. | Baseline capability/docs/source cross-check; pass, with snapshot documentation conflict retained as an implementation prerequisite. |

## Regression, edge, and implementation follow-up

No product behavior changed, so no build/unit/functional suite was run. Running mash-up scripts or bridge tests against Live would violate the assignment and would be a weaker or unsafe surrogate for this static audit.

Future implementation must add deterministic fixtures for malformed/truncated/SMPTE/oversized MIDI, stale/wrong target fingerprints, occupied/readable/unreadable clip replacement, muted notes, payload limits, atomic file no-overwrite behavior, device-load chain deltas, duplicate/replaced Scene proxies, partial-write compensation, and compensation failure reporting. Those are follow-up requirements already represented in P0-P4, not evidence of implemented behavior today.

## Consumed Context Files

Required files read and applied:

- `/Users/polux/dev/ableton-mcp/AGENTS.md`: Orchestra preflight, active workflow, evidence, gate, and no-publication rules.
- `/Users/polux/Documents/gp/kh_mash_up/AGENTS.md`: musical-project boundary and prohibition on treating score labels as verified content. Applied by inspecting only Python source and not score/audio/ALS contents.
- `.agent-workflow/runs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-qa-runtime-codex-cli-spawn-prompt.md`: exact QA scope, return contract, and lifecycle command.
- `.agent-workflow/playbooks/qa.md`: AC-to-evidence matrix, generated-artifact assertions, negative cases, residual-risk statement.
- `rules/development/semantic-code.md`: narrow candidate names and ownership boundaries.
- `rules/testing-discipline.mdc`: deterministic/static evidence and explicit functional-test deferral.
- `rules/delivery-quality-gates.mdc`: commands, results, risks, and release-boundary reporting.
- `rules/agent-collaboration.mdc`: finding severity, affected artifacts, expected/actual risk, recommendation, and exact handoff.
- `skills/proactive-orchestra/SKILL.md`: health, task list, validation, task context, and evidence/review flow.
- `skills/source-of-truth/SKILL.md`: local committed baseline as authority and explicit snapshot-doc conflict reporting.
- Architect handoff under review: `.agent-workflow/handoffs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-architect-architect-runtime-handoff.md`.
- Direct Python source files under `/Users/polux/Documents/gp/kh_mash_up/tools` and targeted committed MCP files at `b47fa41344db5513e5a610c065a98ee1e0517273`.

Required/selected rules not applicable:

- Prompt registry: no product source/docs/prompt content was generated or changed; only the required workflow QA handoff was added.
- Oclif plugin development: no CLI plugin was implemented or packaged. P5 is only an out-of-core scope note.
- Audio/video transcription: media access was prohibited and irrelevant to Python-source audit evidence.
- Playwright evidence: there is no UI/browser surface.
- Diagram export: no diagram was produced or needed for a 16-row source matrix.
- Static-analysis implementation gate: no product code changed; targeted static source comparison was performed instead of executing prohibited scripts.
- Release readiness: no implementation exists to release; QA approval is limited to the research artifact.

## Touched files

- Added `.agent-workflow/handoffs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-qa-qa-runtime-handoff.md`.
- Orchestra evidence, review, event, active-runtime, and lifecycle records created by the required commands.
- No file under `src`, `bridge`, `ableton_remote_scripts`, `docs`, `test`, or `/Users/polux/Documents/gp/kh_mash_up/tools` was edited by QA.

## Commands run

- `orchestra health --runtime codex-cli --json`
- `orchestra task list --json --status pending,blocked,in_progress`
- `orchestra validate --pre-run --task ableton-kh-mashup-generic-tool-audit-20260820 --json`
- Task `context`, `delegation decide`, `plan`, `skills plan`, `protocol render`, and `workflow render` commands.
- Read-only `sed`, `rg`, `wc`, `git rev-parse`, `git cat-file`, `git ls-tree`, `git show`, `git grep`, `git diff`, and `git status` checks.
- `orchestra qa evidence-check` for the Architect Markdown; generic visual gaps were judged not applicable as documented above.
- `orchestra evidence add` with report/file evidence and structured `kh-script-genericization-audit` verifier-contract assertions.
- `orchestra review --role qa --result approve` with findings and implementation-blocking prerequisites.
- `orchestra qa coverage --task ableton-kh-mashup-generic-tool-audit-20260820 --json` (the generic style mapper still reports AC1-AC5 missing despite the structured verifier evidence; see risks).
- Required `orchestra runtime spawn-lifecycle ... --status completed` command for the QA session.
- No Python/Node mash-up script, product build/test, bridge request, Live call, install, restart, commit, push, tag, or publish command.

## Risks and close status

- Evidence is static by explicit scope. It validates audit completeness and source consistency, not future runtime behavior.
- The snapshot documentation/code conflict must be reconciled before any P0/P3/P4 implementation claims rollback coverage.
- P0/P3/P4 prerequisites remain release-blocking for dependent features; no release approval is implied.
- Lifecycle completion auto-resumed the workflow, which paused at blocked review with `real verifier evidence is required before continuation`. Structured verifier evidence was then recorded successfully, but `orchestra qa coverage` still does not associate it with its generic shell/integration style mapping. The parent must resolve or explicitly review this workflow gate; QA did not self-approve or resume it.
- The workspace already contains unrelated dirty/untracked artifacts from other tasks. QA preserved them and touched only task-scoped Orchestra records.
- Close status: **QA complete / lifecycle completed / approve Architect research handoff; parent workflow gate remains paused.**
