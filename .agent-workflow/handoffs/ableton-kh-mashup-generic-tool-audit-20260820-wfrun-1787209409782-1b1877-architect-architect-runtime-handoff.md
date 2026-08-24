Task id: ableton-kh-mashup-generic-tool-audit-20260820
Phase: architect
Role: architect
Runtime: codex-cli
Session id: ableton-kh-mashup-generic-tool-audit-20260820:wfrun-1787209409782-1b1877:architect:codex-cli

# Architect audit: KH mash-up scripts as generic Ableton MCP capabilities

## Result

Pass for the Architect research phase, with implementation deliberately not started. All 16 Python files directly under `/Users/polux/Documents/gp/kh_mash_up/tools` were statically inventoried, including the backup script. No script was executed, no audio or `.als` content was read, no Live/bridge endpoint was called, and no source file in either project was changed.

The dominant conclusion is: do not copy these scripts into the MCP. Most Live-facing scripts are project recipes composed from tools that already exist. The reusable gaps are narrower contracts around truthful MIDI inspection/import, exact-target clip replacement, and planned multi-slot Session segmentation. Musical authorship, reference-corpus analysis, fixed preset/mix recipes, and audition flows remain local.

Committed MCP comparison baseline: Git commit `b47fa41344db5513e5a610c065a98ee1e0517273`.

## Source-selection and inspection boundary

- Source project: direct `.py` files under `/Users/polux/Documents/gp/kh_mash_up/tools` only.
- MCP project: committed tool definitions, dispatch, capability registry, risk policy, local MIDI parser/import, bridge support matrix, Remote Script clip/device/mixer/snapshot/Scene modules, and authoritative local docs.
- Static inspection only: text/symbol/constant/side-effect review. The scripts were never imported or run.
- Explicitly excluded: audio contents, Ableton Set contents, GUI automation, direct `.als` parsing, Live calls, bridge calls, installs, restarts, commits, pushes, tags, publishing, and copying source.
- No GUI automation or direct `.als` mutation was found in the 16 scripts. The absence is an audit finding, not permission to add either behavior.

## Complete script-by-script matrix

| Script | Purpose and inputs | Outputs, dependencies, and side effects | Ableton/MCP interaction, assumptions, overlap | Classification |
| --- | --- | --- | --- | --- |
| `add_clean_guitar_ab.py` | Reads `clean.mid`; filters an outro from beat 390; uses fixed track/preset names and fixed mixer values. | Creates two MIDI tracks, loads presets, replaces Session clips, changes mixer state, stops/launches transport and Scene 0, creates/deletes a temporary audition clip, polls meters. Stdlib plus `push_to_live`. Partial failure only renames/mutes the newly created track. | Direct HTTP to `/project`, `/tracks/midi`, `/devices/load`, `/clips/midi`, `/tracks/modify`, `/clips/launch`, `/scenes/launch`, `/meters`, and clip delete. All operations already map to MCP tools. Meter `> 0` is not universally reliable; track names, beat 390, presets, sends, and mix values are project-specific. | **Compose from existing tools** for approved A/B workflows; keep this recipe local. Reject automatic audition as proof. |
| `add_pack_ab_tracks.py` | Reads several fixed MIDI files and builds four/five fixed Pack alternatives around beats 280–294. Browser-probes named presets. | Creates tracks, loads devices, replaces clips, changes mixer state, and may repurpose a placeholder track. Checks encoded body against a fixed limit. Stdlib plus `push_to_live`. Partial failure renames/mutes only a new track. | Existing browser search, track creation, device load, MIDI clip creation/import, project read, and mixer tools overlap completely. Assumes the first eight track names/order, exact Pack names, one clip per track, and KH section boundaries. | **Compose from existing tools**; keep recipe local. Reusable transaction semantics feed the track-blueprint proposal. |
| `analyze_arrangement_refs.py` | CLI accepts 1..N MusicXML paths and optional `--compact`; parses score structure, parts, roles, pitches, time/tempo/labels/harmony, section density, and texture changes. | Read-only XML parsing; prints JSON or text. Stdlib only. Role classification is heuristic English/Spanish substring matching. No Live effects. | No current MCP overlap and no Ableton SDK dependency. It analyses notation, not a Live Set. Role taxonomy and interpretation are music-analysis policy. | **Keep as local workflow**. A future score-analysis plugin could adopt it, but it should not enter the Ableton core MCP. |
| `build_drums_midi.py` | Reads fixed `drums.mid`, validates/remaps ten GM pitches with a fixed SSD5/kit map, and preserves velocities. | Overwrites fixed `drums_live.mid`; binary Standard MIDI parsing/writing; stdout report. Stdlib only. Historical velocity/section tables are unused by the actual transform but remain project context. | No Live call. Partial overlap with the MCP MIDI parser, but MCP has no generic local MIDI transform/export tool. The identity/remap table and instrument claims are project/plugin-specific. | **Adopt after prerequisite** only as a separate bounded local MIDI-transform contract; keep this concrete map local. |
| `build_hybrid_solo.BACKUP-20260819-before-original-reuse.py` | Extracts exact measures/parts from fixed Bloom/Marigold MusicXML files in `~/Downloads`, transposes fixed cells, and re-fingers for guitar strings 1–3. | Overwrites `solo-hybrid.musicxml`; imports `build_mashup` and calls its private helpers. Reads user transcription XML. | No Live/MCP interaction. Encodes copyrighted/user-owned source selection, exact measures, harmony, fingering, and arrangement decisions. | **Reject as generic Ableton tool**; retain as project-specific composition code and historical backup. |
| `build_hybrid_solo.py` | Same domain as the backup, now also combines fixed measures from `solo-mash-up.xml`, splices bespoke phrases, bends, and harmonics. | Overwrites `solo-hybrid.musicxml`; imports private `build_mashup` functions; reads fixed sources including `~/Downloads`. | No Live/MCP interaction. Entire value is musical authorship and provenance tied to this arrangement. | **Reject as generic Ableton tool**; keep local. |
| `build_mashup.py` | 4,513-line authoritative score/MIDI generator. Reads two fixed song transcriptions and `solo-hybrid.musicxml`; builds a 122-bar B-minor prog-metal arrangement with fixed harmony, lyrics, instrumentation, rhythms, dynamics, microtiming, ranges, and sections. | Overwrites one MusicXML and 14 MIDI files; parses/writes XML and MIDI; verifies score ranges, durations, lyrics, harmony, drums, tuning, and exports deterministic humanized performances. Stdlib only. | No bridge call. Contains useful pure primitives (MIDI writing, range validation, deterministic timing) but they are inseparable here from KH content and private project invariants. Existing MCP humanize/quantize/groove overlap only at a high level. | **Keep as local workflow**; reject wholesale genericization. General notation/MIDI libraries belong in a separate package, not MCP tool contracts. |
| `compare_refs.py` | Reads a fixed 10-score corpus from `~/Downloads` plus the mash-up MusicXML; chooses parts by heuristic names and compares density, silence, durations, intervals, range, and directional change. Optional role is taken directly from `sys.argv`. | Read-only XML; prints a comparison table. Missing/malformed references are silently skipped. No Live effects. | No current MCP overlap or Live SDK dependency. Corpus, role rules, duplicate-voice workaround, and artistic benchmark are project-specific. | **Keep as local workflow**. Do not advertise its heuristics as a generic Ableton capability. |
| `coverage.py` | Reads seven fixed MIDI outputs and dynamically imports/executes `build_mashup.py` to obtain section/harmony globals; produces per-bar part coverage, saves JSON, or compares a snapshot by section label. | Reads MIDI; `--save` writes to an arbitrary caller path without overwrite/path bounds; dynamic import executes top-level project code and reads source XML. | No Live call. Generic “inspect MIDI note coverage” is useful, but arbitrary dynamic Python loading is unsafe and must never become an MCP surface. | **Reject this implementation**; its bounded MIDI-statistics idea is covered by the read-only MIDI inspection proposal. |
| `extract_musicxml_part_midi.py` | CLI reads caller-supplied MusicXML part, selects the most fingered voice, preserves ties/bends, applies project velocity logic, and writes MIDI to a caller path. | Writes/overwrites arbitrary output; imports private `build_mashup` helpers and project bar map. No bounds on input size/output location. | No Live call. MusicXML-to-MIDI conversion is not an Ableton SDK capability and current semantics depend on this arrangement. | **Keep as local workflow**; a future isolated converter must use an explicit no-overwrite output policy and public library boundary. |
| `mix_pack_tracks.py` | Activates fixed Pack alternatives, mutes originals, sets fixed faders/sends/device parameters, replaces a transition clip, relaunches Scene 0, and polls meters for 30 seconds. | Broad Live mutation across seven named tracks plus playback. Verifies mixer write flags and some mute/clip readback; parameter calls are not independently read back here. | Existing project/mixer/parameter/clip/scene/meter tools overlap. Assumes exact track and parameter names. Meters may be unavailable/zero/stale and cannot prove mix quality. Snapshot rollback cannot restore device/plugin state or routing. | **Compose from existing tools**; keep recipe local. Do not productize fixed mixes or meter-gated success. |
| `mix_transition_fx.py` | Applies fixed settings to track indices 7 and 8 after a weak name substring check; optional audition writes/deletes slot 1, launches Scene 1, polls meters, stops transport. | Changes track names/mix; optional destructive temporary clip replacement/delete and playback. No snapshot. | Existing tools overlap. Fixed indices, filenames, names, beats 320–328, and settings are project-specific. A pre-existing slot 1 could be destroyed. | **Reject generic audition pattern**; mixer changes may be composed explicitly after exact target checks. |
| `push_to_live.py` | Reads a fixed name→MIDI file→track index→expected name map; compact-encodes note payloads; checks the 1 MiB body limit; replaces slot 0 for selected entries. | Direct `/project` read and `/clips/midi` writes. Imports/executes `build_mashup` to derive length. Checks name substring before write, but if Live is unreachable it explicitly “pushes blind.” Per-file failures are printed and the process can still end successfully. | Strong overlap with `ableton_import_midi`, `ableton_create_midi_clip`, and `ableton_get_project`. Reveals gaps: exact target planning, payload preflight, batch failure semantics, and replacement rollback. The current MCP MIDI importer accepts/echoes `createTracks` and `quantize` but does not implement them. | **Replace with improved existing MCP import flow**. Do not adopt blind fallback or fixed mappings. |
| `setup_piano_glitch.py` | Ensures one fixed piano-glitch track, loads exact Piano and Auto Pan devices, sets exact parameter names/values and mixer settings. | Stops transport, creates a track, loads devices, sets parameters/mixer; prints project readback. No rollback. | All actions overlap existing tools. Assumes device order 0/1 and exact preset/parameter names; device load target success is not proven by browser search alone. | **Compose from existing tools**; keep musical recipe local. Track-blueprint contract can generalize orchestration later. |
| `setup_split_guitars.py` | Ensures two named guitar tracks with exact Pack/VST choices, effects, mix settings; optional temporary-clip meter audition. | Creates tracks/devices/mix; partial failure renames/mutes; optional slot-1 replacement/delete and playback. | Existing MCP tools overlap. Fixed Gateway plugin, preset names, sends, filenames, and mix are project-specific. Browser load and meters are conditional target/runtime evidence. | **Compose from existing tools**; keep recipe local and reject automatic audition as completion proof. |
| `split_scenes.py` | Reads 14 exact MIDI tracks and source slot 0, splits notes at seven fixed boundaries, creates/deletes clips in slots 0..6, applies per-Scene tempo/signature overrides, verifies notes/mixer, writes a JSON backup, and rolls back snapshot on failure. Default “dry-run” still contacts Live and reads every clip/capability. | Broad destructive Session rewrite (up to 98 slots), Scene overrides, JSON backup under a fixed project directory, and snapshot rollback. Refuses occupied destination slots and muted notes. | Composes project, clip-note read, clip create/delete, snapshot/rollback, and Scene override tools. Its pure overlap splitter is reusable. However current Scene-override work is QA-blocked by target-identity ambiguity with duplicate names/proxy replacement; snapshots are partial; clip create deletes before replacement; muted-note preservation is unsupported in the current clip schema. | **Adopt after prerequisites** as plan/apply Session segmentation, never by copying this script. |

## Cross-cutting hazards found

### Unsafe or destructive patterns

- Eight scripts call the bridge directly with no MCP capability/risk gate: `add_clean_guitar_ab.py`, `add_pack_ab_tracks.py`, `mix_pack_tracks.py`, `mix_transition_fx.py`, `push_to_live.py`, `setup_piano_glitch.py`, `setup_split_guitars.py`, and `split_scenes.py`.
- `POST /clips/midi` is replacement, not append. In the Remote Script, `create_midi_clip` deletes an occupied slot before creating and populating the new clip. This makes occupied-slot replacement materially destructive even though the current endpoint/tool risk is classified `safe-write`.
- Temporary audition slots are deleted without first proving they were empty in `add_clean_guitar_ab.py`, `mix_transition_fx.py`, and `setup_split_guitars.py`.
- `push_to_live.py` falls back to writing by fixed index when `/project` cannot be read, exactly when identity cannot be established.
- Track-creation/device-load recipes can leave new tracks and devices behind. Renaming/muting an incomplete track is containment, not rollback.
- `split_scenes.py` performs a large multi-object transaction, but the Remote Script snapshot cannot restore devices, routing, audio clips, automation, undo history, or `.als` state. Its local JSON is evidence, not an executable full rollback artifact.
- File writers overwrite fixed or caller-supplied paths without a universal no-overwrite/atomic-write contract: the score/solo/MIDI builders, `coverage.py --save`, and MusicXML extraction.
- `coverage.py` and `push_to_live.py` dynamically import and execute `build_mashup.py`. Arbitrary Python/script execution must not become a generic MCP tool.

### Fixed assumptions that must never become defaults

- KH song titles, musical material, lyrics, harmony, B minor, 100/103/106/109 BPM, bar/beat boundaries, arrangement sections, and player ranges.
- Fixed track counts (8 or 14), exact indices, ordering, Spanish track names, clip slots 0..6, Scene 0/1, and exact sends.
- Pack/plugin/device names including Upright Piano, Reverse Piano Pad, String Quartet, Swish Ascend, SSD5, Gateway, Guitar Multi String, Auto Pan-Tremolo, and their parameter names/values.
- `~/Downloads`, local corpus filenames, source part IDs/measures, project root filenames, and backup directory `backups/MASH-035`.
- The claim that a non-zero meter proves an instrument or mix is valid. It only proves an observed signal when the meter capability says it is reliable.

### Explicit required categories

- Unsafe GUI automation: **none found**. Do not add GUI clicking/menu automation as a fallback for save, render, device order, or missing SDK calls.
- Direct `.als` mutation: **none found**. The scripts do not parse or edit Ableton Set files.
- Fixed tracks/plugins: pervasive in all Live-facing setup/mix scripts; excluded from generic contracts.
- Unbounded file writes: arbitrary output paths in `coverage.py --save` and `extract_musicxml_part_midi.py`; fixed overwrite paths in builders. A generic local tool must require an absolute allowed path, file-size bounds, atomic create, and `overwrite:false` by default.
- Destructive operations: clip replacement/delete, broad Session segmentation, rollback, track/device creation with incomplete compensation, and caller-path overwrite.

## Current MCP overlap and truthful SDK/API boundary

The committed MCP already exposes the narrow operations used by the recipes: project/status reads, snapshots, rollback, browser search, track creation/modify, clip create/delete/read/launch, Scene launch and Scene tempo/signature override, local MIDI import, device load/parameter read/write, mixer writes, and meters. `src/tool-capabilities.js`, `bridge/observability.js`, and `src/risk-policy.js` already provide the correct ownership/capability/risk layering to extend.

Truthful boundaries from committed source and docs:

- Session MIDI clip creation and exact note readback are supported only when the active Live note API is available. Muted-note preservation is absent from the current public clip note schema.
- Scene tempo/signature overrides are Session launch-time state, not Arrangement automation. They must be target-probed, do not launch the Scene, and current implementation work has an unresolved exact-target identity defect.
- Device parameters expose only host/Live automatable parameters. Hidden plugin controls are not discoverable by inference.
- Browser results do not prove a device is loadable on a specific target. The track device-load path currently returns the selected browser item without a post-load device-chain delta/readback equivalent to the master path.
- Meters may be missing, zero-only, stale, or unreliable. Never make `level > 0` a universal success requirement, and never use live meters as measured mix/loudness evidence.
- Remote Script automation-envelope writing, reliable cross-version device reorder, clip consolidation, render/export, bounce, and render-backed mastering are unsupported. Do not recreate them through GUI automation or simulated success.
- The public SDK does not expose save/save-as. Bridge snapshots are in-memory and partial; they are not `.als` backups.
- Local MIDI/MusicXML parsing and file generation are MCP-process responsibilities, not Live SDK features.

One documentation conflict should be corrected before relying on rollback copy: `docs/snapshot-rollback.md` says Remote Script track mixer state is recorded but not restored, while committed `live_snapshots.py` contains verified mixer restoration logic and its response surface. The audit does not resolve which documentation statement is current runtime truth; implementation/QA must reconcile it with tests before claiming rollback coverage.

## Prioritized generic-tool proposals

### P0 — Correct `ableton_import_midi` truthfulness and replacement risk

**Classification:** adopt now as a correction to an existing tool; owner `developer` with `qa` verification. Target ownership: MCP local parser/orchestrator in `src/midi.js` and `src/midi-import.js`, existing bridge clip route in both bridge modes, capability/risk registries in `src/tool-capabilities.js` and `src/risk-policy.js`.

Current issue: `createTracks` and `quantize` are accepted and echoed but ignored. `trackIndex` defaults to 0. The imported occupied slot is replaced by a bridge implementation that deletes first. The tool description therefore overclaims.

Minimal corrected schema:

```json
{
  "path": "/absolute/file.mid",
  "target": {"trackIndex": 3, "clipSlotIndex": 0},
  "mode": "require_empty|replace",
  "expectedTarget": {"trackName": "Bass", "trackType": "midi"},
  "planToken": "token-from-preflight"
}
```

- Reject `createTracks` and `quantize` until implemented; do not echo them as completed.
- Require absolute `.mid`/`.midi` path, regular-file/readability/size bounds, supported SMF timing, 1..8192 notes, finite normalized notes, and computed serialized payload below the active bridge limit.
- Read-only preflight: parse file; read `/project`; when replacing, read `/clips/notes`; return source hash, exact target descriptor, occupied state, prior-clip readability, expected note count/length, payload bytes, capability status, and short-lived plan token.
- Risk: `read` for preflight; `safe-write` only for `require_empty`; **destructive** for occupied `replace`, with explicit approval and snapshot/real Set copy guidance.
- Receiver verification: reacquire target by exact index plus preflight fingerprint, then exact normalized note multiset/count/length readback through `GET /clips/notes`. Project name is descriptive, never fuzzy resolution.
- Rollback: for readable previous MIDI clip, compensate by recreating its exact captured length/notes and verify; otherwise block replacement. Bridge snapshot is additional protection, not the sole transaction.

### P1 — `ableton_inspect_midi_file`

**Classification:** adopt now; quick win. Target ownership: MCP-local `src/midi-inspection.js`, with shared parser primitives extracted from `src/midi.js`. No bridge route. Risk tier `read`.

Minimal schema:

```json
{
  "path": "/absolute/file.mid",
  "include": ["tracks", "channels", "ranges", "coverage", "payloadEstimate"],
  "maxBars": 4096
}
```

Read-only probe is the operation itself. Return SHA-256, bytes, SMF format/PPQ/track count, note count, per-track/channel counts, pitch/velocity/range, first/last beat, open/unmatched-note warnings, tempo/time-signature metadata when parsed, estimated clip JSON bytes, and bounded beat/bar coverage. It must not import arbitrary Python or read audio.

Verification: independently recompute aggregate totals from returned per-track data; deterministic fixture hashes; malformed/truncated/SMPTE/oversized cases fail closed. Rollback: none (read-only). Sources: `build_drums_midi.py`, `coverage.py`, `push_to_live.py`, and `extract_musicxml_part_midi.py` demonstrate the need.

### P2 — `ableton_transform_midi_file`

**Classification:** adopt after P1; separate optional local capability, not a Live bridge method. Target ownership: MCP-local MIDI domain/service plus explicit file gateway. Risk tier `export` because it writes an artifact.

Minimal schema:

```json
{
  "inputPath": "/absolute/in.mid",
  "outputPath": "/absolute/out.mid",
  "overwrite": false,
  "transforms": [
    {"type": "pitch_map", "map": {"51": 51, "52": 52}},
    {"type": "velocity_scale", "factor": 0.9, "minimum": 1, "maximum": 127}
  ]
}
```

Preflight through P1; bound file size, event count, output directory, transform count, pitch/velocity domains, and reject unknown voices unless policy says pass-through. Use atomic temporary-file rename and default no overwrite. Verification: parse output and assert expected event count/duration/channel/tempo preservation plus transform-specific invariants; return input/output hashes. Rollback: delete only the newly created output or restore an explicitly backed-up prior output when overwrite was separately approved. The fixed SSD5 map, section dynamics, and song length from `build_drums_midi.py` remain excluded.

### P3 — `ableton_apply_track_blueprint`

**Classification:** adopt after prerequisites; medium feature. It replaces repeated setup scripts, not their presets. Target ownership: MCP orchestration service; no new Remote Script primitive unless a true transaction/undo surface is proven. Risk tier `safe-write` for empty-track creation, elevated to destructive if replacing an instrument/device.

Minimal schema:

```json
{
  "target": {"action": "create", "trackType": "midi", "name": "Lead"},
  "devices": [
    {"query": "chosen preset", "kind": "instrument", "position": "append", "parameters": [{"name": "Tone", "value": 68}]}
  ],
  "mixer": {"volumeDb": -6, "pan": 0, "muted": false, "sends": {"A-Reverb": -18}},
  "clipImport": {"planToken": "optional-P0-token"}
}
```

Preflight: edition capacity, exact browser candidates, target/device-parameter inventory, mixer contract safety, clip plan, and snapshot/rollback coverage report. Do not infer device availability from browser metadata alone.

Verification: exact created-track delta and name/type; post-load device-chain delta and loaded device identity; exact exposed parameter readback; mixer `writeVerification`; optional clip exact note readback. Rollback: delete the newly created track only if a verified deletion/undo operation is available; otherwise fail before first write or require a disposable Set/real Set copy. Existing snapshot rollback cannot remove created devices/tracks or restore routing, so this proposal is blocked until compensation is real. Fixed recipes in `add_*`, `setup_*`, and `mix_pack_tracks.py` remain local inputs supplied by users, never catalog defaults.

### P4 — `ableton_plan_session_segmentation` + `ableton_apply_session_segmentation`

**Classification:** adopt after prerequisites; large feature, split into plan and apply. Target ownership: MCP domain planner plus bridge-backed exact clip/Scene operations in both modes. Risk tier `read` for plan and `destructive` for apply.

Minimal plan schema:

```json
{
  "sources": [{"trackIndex": 0, "clipSlotIndex": 0}],
  "segments": [
    {"destinationSceneIndex": 0, "startBeat": 0, "endBeat": 32,
     "tempo": {"action": "set", "bpm": 100},
     "timeSignature": {"action": "set", "numerator": 4, "denominator": 4}}
  ],
  "crossingNotes": "split",
  "emptyDestination": "leave_empty",
  "occupiedDestination": "reject"
}
```

Apply accepts only a short-lived plan token and exact source/destination fingerprints. No fixed track count, Scene count, slot range, bars, names, or tempos.

Prerequisites:

1. Resolve the QA-blocking Scene identity defect in `ableton-session-scene-tempo-signature-20260820` so proxy replacement/duplicate names cannot redirect setters.
2. Complete P0 exact clip replacement planning/compensation.
3. Add muted-note schema support or reject any source containing fields the destination cannot preserve.
4. Reconcile snapshot/mixer rollback truth and require a real Set copy when unsupported state is in scope.

Read-only plan: capability-probe every Scene property, read every source/destination clip, validate non-overlapping finite boundaries, bound total slots/notes/payloads, preserve crossing notes deterministically, report occupied/unreadable/muted state, and produce complete expected receiver state.

Verification: exact per-slot length and normalized note multiset, exact empty-slot state, full unchanged mixer/device/routing fingerprint, and exact Scene override readback. Rollback: reverse journal of each successfully written slot using captured readable clips, clear/restore Scene overrides, verify the complete initial observable fingerprint, and report every compensation failure. Never report success after partial verification.

### P5 — Score/reference analysis extension

**Classification:** keep as local workflow or a separate opt-in notation plugin, not Ableton MCP core. `analyze_arrangement_refs.py`, `compare_refs.py`, the solo builders, and `build_mashup.py` demonstrate substantial score-domain functionality, but it has no Live SDK dependency and carries heuristic/musical policy. If later extracted, define a separate `musicxml_inspect` package with bounded XML parsing and no external entity/network resolution. Do not couple it to Live mutation tools.

## Roadmap and technical slices

1. **Immediate/P0:** correct `ableton_import_midi` unsupported option claims and reclassify occupied clip replacement; add failing contract tests first.
2. **Quick win/P1:** add local read-only MIDI inspection and payload estimation by extracting parser primitives.
3. **Safety foundation/P0 extension:** add exact target replacement plan/apply, previous-clip capture, deterministic readback, and compensation.
4. **Optional/P2:** bounded local MIDI transformation/export with atomic no-overwrite defaults.
5. **Medium/P3:** track blueprint only after verified post-load device readback and a real created-track compensation path.
6. **Large/P4:** Session segmentation only after Scene identity, clip transaction, muted-note, and snapshot-truth prerequisites.
7. **Out of core/P5:** notation/reference tooling remains local or becomes a separate plugin/package.

Do not combine P0–P4 into one story. Suggested owners: `developer` for P0/P1/P2, `architect` + `developer` for P3/P4 contracts, `qa` for independent parity/failure/rollback verification, and `product_owner` for deciding whether notation tooling belongs in product scope.

## Test Scenarios and Expected Results

| Surface/environment | Scenario | Expected observable | How obtained in this phase |
| --- | --- | --- | --- |
| Generated artifact / local sandbox | Direct script coverage | Exactly 16 direct `.py` paths appear once, including the backup. | `rg --files -g '*.py'` plus `wc -l`; every file statically inspected. |
| Generated artifact / local sandbox | Side-effect classification | Each script reports file writes, network/Live writes, destructive replacement/delete, external deps, and project assumptions. | Full text review of 15 smaller scripts plus structured symbols/I/O and targeted build/verify/export sections of `build_mashup.py`. |
| Integration contract / committed repository | Current overlap | Every proposed overlap names existing MCP tool/capability/risk/bridge surfaces at commit `b47fa4…`. | Static review of `src/tools.js`, `src/tool-capabilities.js`, `src/risk-policy.js`, `src/midi*.js`, `bridge/observability.js`, Remote Script domain modules, and docs. |
| API / generated artifact | MIDI import truthfulness | Audit identifies that `createTracks` and `quantize` are accepted/reported but not applied and that occupied clip replacement deletes first. | Static source comparison of `src/midi-import.js`, `src/tools.js`, and `live_clips.py`; no runtime call. |
| Workflow/runtime | SDK honesty | No proposal claims save, render, automation, reorder, consolidation, hidden plugin parameters, or reliable meters where committed capability/docs mark them unsupported/conditional. | Static capability and authoritative-doc cross-check. |
| Generated artifact | Safety contract completeness | Each recommended core candidate includes name, minimal schema, probe/preflight, risk, receiver verification, rollback, and owner. | Manual architecture matrix review in this handoff. |
| Local sandbox | No prohibited mutation | Source-project and MCP product-source diffs remain untouched; only Orchestra state/handoff/decision/evidence artifacts are created. | `git status --short`; no script execution or endpoint command issued. |

No functional tests were run because this is a read-only research phase and executing mash-up scripts or calling the bridge was expressly prohibited. Independent QA must validate completeness and proposal consistency, not Live behavior.

## Acceptance criteria assessment

1. **Every script inventoried:** satisfied. Sixteen direct Python files are individually covered with purpose, inputs, outputs, dependencies, side effects, Live interactions, project assumptions, overlap, and classification.
2. **Reusable behavior classified:** satisfied. Each script is marked adopt now, adopt after prerequisite, compose from existing tools, keep local, or reject, with feasibility/safety rationale.
3. **Candidate contracts complete:** satisfied. P0–P4 include proposed names/contracts, minimal schemas, probes, risk, receiver verification, rollback, and ownership.
4. **Hazards and SDK honesty explicit:** satisfied. GUI and `.als` absence is stated; fixed names/paths, file writes, destructive actions, meter limits, hidden parameters, and unsupported Live surfaces are explicit.
5. **Prioritized roadmap and exact citations:** satisfied. Quick wins and larger features are separated; source scripts and current MCP modules are named; no source or Live mutation occurred.

Release-blocking implementation prerequisites are intentionally listed under P0/P3/P4. They do not block completion of this research artifact, but they must block any feature release that depends on them.

## Consumed Context Files

Required files read and applied:

- `/Users/polux/dev/ableton-mcp/AGENTS.md`: Orchestra workflow, evidence, gate, and no-push rules.
- `/Users/polux/Documents/gp/kh_mash_up/AGENTS.md`: musical-project boundary, score-verification discipline, and performer/project context. Applied by keeping musical assumptions local and avoiding score/audio/ALS inspection beyond script text.
- `.agent-workflow/runs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-architect-runtime-codex-cli-spawn-prompt.md`: exact scope, return contract, and lifecycle command.
- `.agent-workflow/playbooks/architect.md`: boundaries, contracts, rollback, sizing, and split recommendation.
- `rules/development/semantic-code.md`: narrow domain names and typed contracts.
- `rules/architecture-decisions.mdc`: recorded sizing, genericization boundary, and MIDI safety decisions.
- `rules/module-boundaries.mdc`: proposed local domain/service/adapters rather than larger command handlers.
- `rules/development-engineering.mdc`: explicit schemas, transaction boundaries, bounded batch/file behavior, and external integration error semantics.
- `skills/proactive-orchestra/SKILL.md`: preflight, task reuse, validation, evidence/review workflow.
- `skills/source-of-truth/SKILL.md`: local committed sources first and conflict disclosure.

Required/selected rules not applicable:

- Diagram export: no diagram materially improves this script-to-capability matrix; no diagram artifact created.
- Oclif plugin development: no CLI plugin is being designed or implemented; only generic MCP contracts are proposed.
- Audio/video transcription: prohibited media access and no media evidence.
- Playwright/UI evidence: no UI, GUI automation, or browser surface in scope.
- Prompt registry/doc sync: only the workflow handoff and Orchestra records are authorized; product docs/source were not changed.
- Static analysis: no product code changed and scripts could not be executed. Static source inspection is recorded instead.
- Release readiness: no releasable implementation exists in this phase.

## Touched files

- Added this exact Architect handoff artifact.
- Orchestra created task-scoped decision/evidence/review/lifecycle records under `.agent-workflow/`.
- No `src`, `bridge`, `ableton_remote_scripts`, `docs`, `test`, or `/Users/polux/Documents/gp/kh_mash_up` source file was changed.

## Commands run

- `orchestra health --runtime codex-cli --json`
- `orchestra task list --json --status pending,blocked,in_progress`
- `orchestra validate --pre-run --task ableton-kh-mashup-generic-tool-audit-20260820 --json`
- `orchestra context`, `delegation decide`, `plan`, `skills plan`, `protocol render`, and `workflow render` for the task
- Read-only `sed`, `rg`, `wc`, and Git metadata/status commands for instructions, script inventory, committed MCP contracts, and documentation
- `orchestra decision add` for story sizing, genericization boundary, and MIDI import safety prerequisites
- No Python script, Node implementation/test command, bridge endpoint, or Live operation was run

## Risks and close status

- Residual evidence limitation: this is static analysis; it does not prove runtime behavior. That is correct for the authorized phase.
- The context pack was unavailable because the context index was not fresh; required raw instruction/rule files and targeted local sources were read directly, so this does not leave an acceptance gap.
- The current worktree contains unrelated Orchestra and project artifacts owned by other tasks; none were modified intentionally by this audit except task-scoped Orchestra records.
- Close status: **Architect research complete / approve handoff to independent QA.** No implementation or release approval is implied.
