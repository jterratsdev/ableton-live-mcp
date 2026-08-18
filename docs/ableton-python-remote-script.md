# Ableton Python Remote Script Adapter

This repository includes `ableton_remote_scripts/AbletonMcpBridge`, an Ableton
MIDI Remote Script that runs inside Ableton Live and exposes the same local HTTP
bridge contract used by the MCP server.

## Install

Copy the folder:

```text
ableton_remote_scripts/AbletonMcpBridge
```

to Ableton's MIDI Remote Scripts directory. Common macOS locations are:

```text
/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/MIDI Remote Scripts/AbletonMcpBridge
/Applications/Ableton Live 11 Suite.app/Contents/App-Resources/MIDI Remote Scripts/AbletonMcpBridge
```

This repo also includes an installer helper:

```sh
ableton-live-mcp install-remote-script --app-path "/Applications/Ableton Live 12 Lite.app"
```

If macOS rejects writes to `/Applications` with `Operation not permitted`, close
Ableton and retry with `sudo -E npx -y @jterrats/ableton-live-mcp
install-remote-script --app-path "/Applications/Ableton Live 12 Lite.app"`.
On recent macOS versions, sudo can still fail until the terminal app is allowed
to modify applications. Open System Settings -> Privacy & Security and grant App
Management or Full Disk Access to Terminal, iTerm, or the terminal host you are
using. Then rerun the installer. You can also copy the folder manually in Finder
and authenticate when prompted.

Restart Ableton Live, then open Preferences -> Link, Tempo & MIDI and select
`AbletonMcpBridge` as a Control Surface. Input and Output can remain `None`.

Verify the installation and runtime health with:

```sh
ableton-live-mcp doctor --app-path "/Applications/Ableton Live 12 Lite.app"
```

The doctor reports the selected Ableton app path, installed Remote Script path,
whether the installed files match the bundled `AbletonMcpBridge`, the detected
Ableton Live PID, the bridge `/status` result, and a stale-runtime diagnosis.
Use JSON output when attaching diagnostics to a bug report:

```sh
ableton-live-mcp doctor --app-path "/Applications/Ableton Live 12 Lite.app" --json
```

If the doctor says Ableton Live started before the installed Remote Script was
updated, restart Ableton Live. Ableton loads Python Remote Scripts into its own
runtime, so copying fresh files while Live is already open does not refresh the
running script.

When loaded, the script starts a local HTTP server on:

```text
http://127.0.0.1:9789
```

## Supported Endpoints

The Remote Script currently implements:

- `GET /status`
- `GET /project`
- `GET /arrangement`
- `GET /arrangement/clips/delete-plan`
- `DELETE /arrangement/clips`
- `POST /project/snapshot`
- `POST /project/rollback`
- `GET /plugins?kind=...&query=...`
- `GET /browser/search?kind=...&query=...&limit=...`
- `POST /tempo`
- `POST /project/save`
- `POST /signature`
- `POST /transport/start`
- `POST /transport/stop`
- `POST /clips/launch`
- `POST /scenes/launch`
- `POST /tracks/duplicate`
- `POST /tracks/freeze`
- `POST /tracks/flatten`
- `POST /devices/load`
- `POST /devices/load-master`
- `GET /devices/parameters?target=track|return|master&trackIndex=...&returnIndex=...&deviceIndex=...`
- `POST /devices/parameter`
- `POST /devices/reorder`
- `DELETE /devices`
- `POST /tracks/modify`
- `GET /returns`
- `POST /returns/create`
- `POST /returns/modify`
- `DELETE /returns`
- `GET /routing/buses`
- `GET /meters`
- `POST /master/modify`
- `POST /arrangement/insert`
- `POST /arrangement/locators`
- `GET /production/report`
- `POST /mastering/apply`
- `POST /render/export`
- `POST /tracks/bounce`
- `POST /mastering/analyze-and-apply`
- `POST /clips/midi`
- `POST /clips/consolidate`
- `DELETE /clips/midi`
- `GET /clips/notes?trackIndex=...&clipSlotIndex=...`
- `POST /clips/humanize`
- `POST /clips/quantize`
- `POST /groove/apply`
- `POST /midi/import`

Live API work is queued back onto Ableton's Control Surface thread before
reading or mutating the Live set. The HTTP thread only parses requests and waits
for the queued result.

## Smoke Test Against Live

With Ableton Live running and `AbletonMcpBridge` selected as a Control Surface:

```sh
ABLETON_BRIDGE_URL=http://127.0.0.1:9789 npm run smoke:bridge
```

This exercises the MCP server against the real bridge without
`ABLETON_MCP_DRY_RUN`.

Run `ableton-live-mcp doctor --app-path "/Applications/Ableton Live 12 Lite.app"` first when the
smoke test cannot connect. The doctor separates install freshness, Live process,
and bridge reachability issues before deeper MCP smoke testing.

## Known Limits

- Browser inventory uses Ableton's Python browser roots for instruments, audio
  effects, MIDI effects, racks, presets/sounds, VSTs, and Audio Units when those
  roots are exposed by the Live version. If a plugin does not appear as a
  loadable browser item in Ableton, the bridge cannot list or load it. Results
  are capped at 50 items per request to keep HTTP responses small.
- `GET /browser/search` extends browser inventory to samples, grooves, racks,
  plugin aliases, and Max for Live roots when those browser roots are exposed by
  the running Live version. Missing categories return warnings with empty
  results instead of fabricated items.
- `POST /returns/create` uses Ableton's return-track creation API when exposed
  and returns `501` when the selected Live version does not provide it.
  `DELETE /returns` similarly requires a supported return-track deletion API;
  unsupported deletion is contract-shaped failure, not `ok: true` no-op.
- `POST /tracks/modify`, `POST /returns/modify`, and `POST /master/modify`
  apply mixer state through
  Ableton's `mixer_device`, including volume, panning, mute/solo, track arm when
  supported, sends, master cue volume when exposed, and routing names exposed by
  the Live API. Unknown sends or unavailable routing names return
  contract-shaped errors. Unsupported master mute/solo controls are returned as
  warnings after payload validation.
- `GET /meters` reads Live `output_meter_left`, `output_meter_right`, and
  `output_meter_level` during the Control Surface `update_display` cycle, which
  matches the polling path used by Ableton's bundled Mackie Control script.
  Polling is limited to tracks where Live reports `has_audio_output=true`; the
  bridge also keeps property listeners as a secondary observation path. Missing,
  stale, or unobserved fields are surfaced with `meterCache`, `meterSource`,
  `meterObserved`, and warnings; `signalTargetCount` distinguishes a successful
  zero-valued poll from actual non-zero signal. Root diagnostics also separate
  `listenerObservedTargetCount` from `displayPollObservedTargetCount`. The Remote
  Script does not synthesize levels from mixer volume or playback state.
  `reliableForMixing` remains false until Live produces a non-zero observation;
  zero-only polling during active Session playback is reported explicitly as
  `meterCapability.status: zero-only-during-active-playback`.
- `POST /clips/launch` and `POST /scenes/launch` call Live's Session View
  `fire()` APIs. They change playback state only; they do not create, delete, or
  edit clips. Use `ableton_diagnose_playback` first when transport is running
  but meters are silent.
- `POST /tracks/duplicate` uses Ableton's `duplicate_track` API when exposed
  and verifies that Live reports a new track. Unsupported duplication returns
  `501`.
- `POST /tracks/freeze` and `POST /tracks/flatten` call real freeze/flatten
  methods only when the running Live API exposes them. If no compatible method
  exists, the endpoint returns `501` rather than a simulated success.
- `POST /clips/consolidate` validates `trackIndex`, `startBeat`,
  `lengthBeats`, and optional `clipSlotIndex`, then returns `501` unless Live
  exposes a consolidation API with a signature this bridge can call safely.
- `GET /arrangement` reads `song.cue_points`, derives sections from locators,
  and reports arrangement clips only when the running Live API exposes an
  arrangement clip collection on tracks. Missing arrangement clip access returns
  an empty `clips` array with a warning, not session-clip guesses.
- `GET /arrangement/clips/delete-plan` reads only `Track.arrangement_clips` and
  returns exact track/clip identities, start beat, length, and a short-lived
  plan token without changing the Set.
- `DELETE /arrangement/clips` accepts only identities from a current plan,
  validates the whole selection before mutation, calls `Track.delete_clip(clip)`
  on exact track-owned objects in reverse timeline order, and rereads the
  timeline for per-clip verification. Missing capabilities return `501`; stale,
  duplicated, missing, or ambiguous selections fail closed. The endpoint also
  requires callable `Song.undo` before mutation. If a later deletion fails, it
  undoes every completed deletion and verifies the full original Arrangement
  state with observable fingerprints that do not depend on Python proxy
  identity. Undo/readback/fingerprint failures are returned explicitly as
  rollback failures.
- `POST /arrangement/locators` uses `song.set_or_delete_cue` and
  `song.cue_points` when exposed. Unsupported cue creation/updating returns
  `501`.
- `POST /arrangement/insert` returns `501` in the Remote Script because this
  bridge does not currently have a reliable Ableton Python API surface for
  placing clips into arrangement view. The deterministic development bridge
  supports insertion as in-memory timeline references for tests.
- `GET /devices/parameters` lists current parameter names, values, ranges, and
  enablement before mutation. `POST /devices/parameter` applies an existing
  device parameter by normalized parameter name. Plugin parameter names vary by
  vendor; missing names return `404` instead of being silently ignored.
- `DELETE /devices` removes a device from a track, return, or master chain using
  Live's `delete_device` method when that chain exposes it. The Remote Script
  verifies that Live reports the deletion; unsupported or non-mutating surfaces
  return explicit errors instead of `ok: true`.
- `POST /devices/reorder` validates the same device-chain location grammar and
  source/target indices, then returns `501` in the Remote Script because Live's
  Python API does not expose a reliable cross-version device reorder method for
  track, return, and master chains.
- `POST /automation` returns `501` in the Remote Script because this bridge has
  not identified a reliable cross-version Ableton Python API for mutating
  automation envelopes for tempo, track mixer lanes, sends, or device
  parameters. The deterministic development bridge supports these lanes as real
  in-memory automation state for tests and local integration.
- `POST /mastering/apply` loads matching audio effects onto the master track
  when browser items can be found, then attempts to apply requested settings to
  existing parameters on the newly loaded device. If no device is actually
  loaded, the endpoint returns an error instead of `ok: true`.
- `POST /devices/load-master` loads a single matching browser item onto the
  master track and returns the device Ableton reports as newly added. Ableton's
  Python browser load API appends to the selected track; if exact master-chain
  reordering is required, use a follow-up device reorder endpoint once enabled.
- `POST /render/export` returns `501` in the Remote Script until a safe Live
  render/export API is confirmed. Use the deterministic development bridge for
  local render artifacts in tests.
- `GET /production/report` aggregates Remote Script project, routing, and meter
  data. Missing meter values are surfaced as risks.
- `POST /tracks/bounce` and `POST /mastering/analyze-and-apply` return `501` in
  the Remote Script until safe render/export support exists. The deterministic
  development bridge supports both workflows for local validation.
- `ableton_import_midi` parses Standard MIDI files in the MCP process and sends
  the resulting notes to `POST /clips/midi`. Direct `POST /midi/import` in the
  Remote Script is reserved for bridge-contract compatibility.
- `POST /clips/humanize`, `POST /clips/quantize`, and `POST /groove/apply`
  rewrite existing MIDI notes only when the running Live API exposes readable
  notes through `get_notes_extended` and a replacement path such as
  `replace_selected_notes` or remove+`set_notes`. If those APIs are unavailable,
  the Remote Script returns `501` instead of reporting a successful no-op.
- `POST /project/save` selects `save` or `save_as` from the available Song or
  Application API, reports the invoked method, and returns `501` when no
  compatible method exists. Host exceptions return `500`; success means the API
  call returned without throwing, not that the bridge independently reopened the
  `.als` file from disk.
- Snapshot/rollback is in-memory while the Remote Script is loaded. It restores
  tempo, time signature, and MIDI clips that can be read and rewritten through
  Ableton's Python API. Device/plugin state, audio clips, routing, undo history,
  and saved `.als` file state remain outside this rollback surface.
- Render export remains a follow-up endpoint for the Remote Script.
