# Product Workflows

This guide describes how to use Ableton Live MCP as a product surface: inspect
the open set, make bounded changes, validate the result, and export only when
the active bridge supports it. The MCP server talks to a local bridge, so every
workflow starts by confirming which bridge is running and which endpoints it can
actually execute.

## Operating Model

1. Start Ableton Live and open the target set.
2. Start the local bridge. For deterministic development, run `npm run bridge`.
   For a real Live set, use the Python Remote Script bridge documented in
   [ableton-python-remote-script.md](ableton-python-remote-script.md).
3. Start the MCP server with `npm start`, or configure an MCP client to run
   `src/server.js` over stdio.
4. Inspect before changing anything: call `ableton_get_status`,
   `ableton_get_project`, `ableton_get_arrangement`, and
   `ableton_get_production_report`. Use `ableton_get_bridge_observability` when
   you need endpoint support or stale-runtime diagnostics.
5. Create a snapshot before any production edit with `ableton_create_snapshot`.
   For real user work, also save or duplicate the `.als` file before broad
   device, routing, clip, return, or master-chain changes.
6. Execute the smallest useful change, then re-read the affected surface.
7. Validate with the deterministic test suite, live smoke suite, audio analysis,
   or manual playback depending on the risk tier.

Use `ABLETON_MCP_DRY_RUN=1 npm start` when you want to inspect intended bridge
requests without touching Ableton.

## Safe Operating Rules

Open user sets should be treated as production data.

- Prefer a disposable copy of the set for automation, safe-write smoke tests,
  destructive smoke tests, render trials, and mastering experiments.
- Do not run destructive commands on an unsaved user set unless the user has
  explicitly approved the exact operation, target, and rollback plan.
- Always take `ableton_create_snapshot` before broad writes. Remote Script
  rollback is partial; it is not a complete `.als` backup.
- Treat `ableton_rollback_snapshot`, `ableton_flatten_track`, `ableton_delete_clip`,
  `ableton_delete_return_track`, `ableton_delete_device`, and
  `ableton_consolidate_clip` as destructive.
- Treat `ableton_export_render`, `ableton_bounce_tracks`, and
  `ableton_analyze_and_apply_mastering` as explicit export actions because they
  can write files or become long-running in a future bridge.
- Treat `ableton_set_automation` as unsupported until the active bridge returns
  a real implementation. Unsupported commands should return explicit unsupported
  results, not simulated success.
- When a bridge returns `501`, stop and document the unsupported capability
  instead of retrying with broader mutations.

See [risk-policy.md](risk-policy.md) for the canonical MCP tool and HTTP
endpoint risk tiers.

## Setup Workflow

Goal: reach a known server, bridge, and Live state before asking an LLM to edit
music.

1. Run `npm run smoke` to verify the MCP server can start and expose tools.
2. Run `npm run bridge` for local development, or install and select the Python
   Remote Script in Ableton Preferences for real Live control.
3. Confirm the bridge with `ableton_get_status`.
4. Confirm the project model with `ableton_get_project`.
5. Confirm timeline context with `ableton_get_arrangement`.
6. Confirm production context with `ableton_get_production_report`,
   `ableton_get_meters`, `ableton_list_returns`, and `ableton_list_buses`.
7. If the bridge is connected to a real set, make an Ableton-level backup before
   write or export work.

Expected result: the client can see tempo, transport, tracks, devices, clips,
returns, routing, meters, and arrangement metadata, or it gets explicit warnings
for Live API fields the bridge cannot observe.

## MIDI Import Workflow

Goal: bring MIDI into a set without losing track context or overwriting clips
accidentally.

1. Inspect `ableton_get_project` and choose a target track and clip slot, or
   decide to create tracks from the file.
2. Create a snapshot labeled for the import.
3. Use `ableton_import_midi` with an absolute `.mid` or `.midi` path. Provide
   `trackIndex` and `clipSlotIndex` for a targeted import, or `createTracks`
   when the file should create tracks.
4. Re-read the project and clip notes with `ableton_get_project` and
   `ableton_get_clip_notes`.
5. Apply timing only when needed: `ableton_quantize_clip` for grid correction,
   `ableton_humanize_clip` for subtle timing and velocity variance, or
   `ableton_apply_groove` for swing.
6. Re-read clip notes after timing edits.

Expected result: imported MIDI appears in the requested track or new tracks, and
the note data remains inspectable before instrument or mix decisions.

## Instrument Assignment Workflow

Goal: pick and load sounds from the user's available devices rather than
guessing names.

1. Read the current track roles from `ableton_get_project`.
   If `mixerContract.safeForAutomatedMixing` is not `true`, stop before writing
   mixer values and reinstall/restart the Ableton Remote Script. Legacy
   responses can expose raw Live values as `volumeDb`.
2. Search available devices with `ableton_list_plugins` and
   `ableton_search_browser`. Use `kind` and `query` filters to narrow the
   selection. If expected VST/AU plugins are installed on disk but absent from
   Ableton's results, use `ableton_diagnose_plugins` before attempting to load
   them; it compares disk plugin bundles with Ableton's index and recommends a
   safe rescan path when needed.
3. Use `ableton_match_preset_intent` for musical requests such as realistic
   violin, concert piano, classical guitar, flute, or concert hall mastering,
   then verify the chosen query exists in the user's browser.
4. For MIDI roles, call `ableton_select_vst_for_midi` with the chosen role,
   query, and rationale. For general device placement, call
   `ableton_load_device`.
5. Inspect parameters with `ableton_get_device_parameters` before changing a
   device. Use `target: "track"`, `target: "return"`, or `target: "master"`
   to address the intended device chain.
6. Use `ableton_set_device_parameter` only for known parameters and bounded
   values.
7. Use `ableton_reorder_device` when chain order matters. Use
   `ableton_delete_device` only after explicit destructive approval.
8. Re-read `ableton_get_project` and the relevant device parameters.

Expected result: each MIDI track has an intentional instrument or rack, and any
parameter changes can be tied to observed device metadata.

## Arrangement Workflow

Goal: make timeline changes that are readable and reversible.

1. Read `ableton_get_arrangement` and identify existing locators, sections, and
   timeline clips.
2. Create a snapshot before inserting or consolidating material.
3. Use `ableton_insert_arrangement_clip` to place an existing clip, MIDI/audio
   source path, or bridge/browser source reference on the timeline.
4. Use `ableton_add_locator` to name sections such as Intro, Verse, Chorus, and
   Outro.
5. Use `ableton_consolidate_clip` only after destructive approval because it can
   replace or commit material.
6. Re-read `ableton_get_arrangement` and `ableton_get_project`.

Expected result: the arrangement has named sections and inspectable timeline
placements, with destructive timeline commits explicitly approved.

## Mixing Workflow

Goal: make bounded level, pan, routing, send, and return changes with observable
meter feedback.

1. Inspect `ableton_get_project`, `ableton_get_meters`, `ableton_list_returns`,
   and `ableton_list_buses`.
2. If transport is running but meters are silent, call
   `ableton_diagnose_playback`. When the set relies on Session View clips, use
   `ableton_launch_clip` or `ableton_launch_scene` explicitly before making
   meter-guided mix decisions.
3. Create a snapshot before mix changes.
4. Use `ableton_modify_track` for track name, color, volume, pan, mute, solo,
   arm, routing, and sends.
5. Use `ableton_create_return_track` and `ableton_modify_return` for return
   setup. Use `ableton_delete_return_track` only after destructive approval.
6. Use `ableton_modify_master` for master volume, pan, cue volume, mute, or solo.
7. Re-read meters and routing after each batch of changes.
8. If committing a track is necessary, use `ableton_freeze_track` first. Use
   `ableton_flatten_track` only after destructive approval and only when the
   active bridge exposes real flatten support.

Expected result: track, return, and master state match the requested mix moves,
and meter reads provide observable feedback without fabricated values.

Do not copy `volumeRaw`, `cueVolumeRaw`, or `sendsRaw` values from
`ableton_get_project` into write fields. Writes use real dB values:
`volumeDb`, `cueVolumeDb`, and send values are dB targets, while raw readback is
only diagnostic Live parameter state.
After every mixer write, inspect `writeVerification`. Continue an automated pass
only when the observed display value is within tolerance; otherwise apply one
bounded correction or stop for manual calibration. Use the default `0.5 dB`
tolerance unless the session has been calibrated more tightly.

## Mastering Workflow

Goal: prepare a master chain while keeping render and analysis limitations
explicit.

1. Inspect `ableton_get_production_report`, `ableton_get_meters`, and
   `ableton_list_buses`.
2. Search available master devices with `ableton_search_browser` or
   `ableton_list_plugins`.
3. Load master devices with `ableton_load_master_device`, or apply a structured
   chain with `ableton_apply_mastering_chain`. The default `mode` is
   `replace_matching`, which removes existing matching master devices before
   loading the requested chain. Use `append` only when deliberate stacking is
   wanted.
   If the master already has duplicated processing, use `mode: "replace_all"`
   after taking a snapshot and explicit approval.
4. Use `ableton_modify_master` for bounded master mixer changes.
5. If an audio artifact already exists, run `ableton_analyze_audio` with an
   absolute path to check LUFS, true peak, RMS, crest factor, and clipping.
6. Use `ableton_analyze_and_apply_mastering` only after export approval and only
   with a bridge that can render. The current Python Remote Script bridge
   returns `501` for render-backed mastering.
7. Re-read the production report and meters.

Expected result: the master chain and master mixer state are observable, and any
audio analysis is based on a real local audio file.

## Validation Workflow

Goal: prove the workflow worked without relying on claims from the LLM.

1. For local deterministic validation, run `npm test`.
2. For read-only real Live validation, run
   `ABLETON_LIVE_SMOKE=1 npm run smoke:live:readonly`.
3. For safe-write validation, run the safe-write suite only on a disposable set:
   `ABLETON_LIVE_SMOKE=1 ABLETON_LIVE_SMOKE_SAFE_WRITE=1 npm run smoke:live:safe-write`.
4. For destructive validation, use a throwaway set and the explicit destructive
   gate documented in [live-smoke-suite.md](live-smoke-suite.md).
5. Re-read MCP state after every production change and compare it to the
   requested plan.
6. Use `ableton_evaluate_action_risk` or `ableton_list_risk_policy` when a
   workflow planner needs explicit approval or snapshot guidance.
7. Use `ableton_list_workflow_plans` and `ableton_get_workflow_plan` to inspect
   plan-only product workflows before executing individual tools.
8. For rendered audio, run `ableton_analyze_audio` against the output file and
   inspect the file path and metrics.

Expected result: each acceptance check has command output, MCP readback, audio
analysis, or a documented unsupported result.

## Export Workflow

Goal: produce audio artifacts when supported, or fail honestly when the active
bridge cannot render.

1. Decide the export scope: `master`, `selected_tracks`, `all_tracks`, or
   `stems`.
2. Get explicit approval for output path, scope, beat range, sample rate, bit
   depth, normalization, and whether return tracks are included.
3. Create or confirm a final production snapshot and an Ableton-level backup for
   real user sets.
4. Use `ableton_export_render` for master, selected-track, all-track, or stem
   render requests.
5. Use `ableton_bounce_tracks` when the workflow needs selected tracks or stems
   as review artifacts.
6. If the bridge returns files, validate them with `ableton_analyze_audio` and
   filesystem inspection.
7. If the bridge returns `501`, record export as unsupported for that bridge.
   The current Python Remote Script bridge must not simulate a render.

Expected result: deterministic development mode can produce inspectable silent
WAV artifacts for tests; the Remote Script bridge returns explicit unsupported
results until a safe Live render surface exists.

## Handoff Checklist

- Source set, bridge type, and `ABLETON_BRIDGE_URL`.
- Snapshot ID and Ableton-level backup location when applicable.
- Tools called, arguments used, and readback results.
- Risk tier for every write, destructive, unsupported, or export action.
- Validation command output or unsupported result.
- Export paths and audio analysis metrics when artifacts were produced.
