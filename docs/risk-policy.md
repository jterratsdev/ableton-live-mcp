# Ableton MCP Risk Policy

This policy classifies MCP tools and bridge HTTP endpoints before callers expose
or execute operations that can mutate Ableton Live state.

## Risk Tiers

- `read`: Reads Live state or local artifacts without mutating Live.
- `safe-write`: Mutates Live state in a bounded, inspectable way. These actions
  are allowed by default after the caller confirms context, and a snapshot is
  recommended before user-facing automation chains.
- `destructive`: Deletes, flattens, rolls back, consolidates, or persists state
  in a way that can lose current work. These actions are blocked by default
  until the user explicitly approves the exact operation.
- `export`: Writes or bounces audio artifacts, may be long-running, and may be
  unsupported in the Live Remote Script bridge. These actions are blocked by
  default until the user approves the export target and scope.
- `unsupported`: Known unsupported or unknown surfaces. These actions are
  blocked by default and should return an explicit unsupported result instead of
  pretending success.

## Default Recommendations

| Tier | Blocked by default | Explicit approval | Snapshot |
| --- | --- | --- | --- |
| `read` | No | No | No |
| `safe-write` | No | No | Recommended |
| `destructive` | Yes | Yes | Required when feasible |
| `export` | Yes | Yes | No |
| `unsupported` | Yes | Yes | No |

The reusable module lives at `src/risk-policy.js`. Callers can use
`evaluateActionRisk`, `shouldBlockByDefault`, or `requireAllowedByDefault`
before dispatching a tool or endpoint.

```js
import { requireAllowedByDefault } from "./risk-policy.js";

const classification = requireAllowedByDefault({ toolName: "ableton_modify_track" });
```

`requireAllowedByDefault` throws `RiskPolicyError` for destructive, export, and
unsupported actions. A caller with a user approval flow can inspect
`evaluateActionRisk(action)` and continue only when the approval satisfies the
classification.

## MCP Tool Classification

### Read

- `ableton_get_status`
- `ableton_get_project`
- `ableton_get_arrangement`
- `ableton_list_plugins`
- `ableton_search_browser`
- `ableton_diagnose_plugins`
- `ableton_analyze_audio`
- `ableton_get_production_report`
- `ableton_diagnose_playback`
- `ableton_list_returns`
- `ableton_list_buses`
- `ableton_get_meters`
- `ableton_get_clip_notes`
- `ableton_get_device_parameters`

### Safe-Write

- `ableton_create_snapshot`
- `ableton_set_tempo`
- `ableton_set_signature`
- `ableton_start_transport`
- `ableton_stop_transport`
- `ableton_launch_clip`
- `ableton_launch_scene`
- `ableton_create_midi_track`
- `ableton_duplicate_track`
- `ableton_freeze_track`
- `ableton_modify_track`
- `ableton_create_return_track`
- `ableton_modify_return`
- `ableton_modify_master`
- `ableton_create_midi_clip`
- `ableton_humanize_clip`
- `ableton_quantize_clip`
- `ableton_apply_groove`
- `ableton_import_midi`
- `ableton_load_device`
- `ableton_load_master_device`
- `ableton_select_vst_for_midi`
- `ableton_set_device_parameter`
- `ableton_reorder_device`
- `ableton_apply_mastering_chain`
- `ableton_insert_arrangement_clip`
- `ableton_add_locator`

### Destructive

- `ableton_rollback_snapshot`
- `ableton_save_project`
- `ableton_flatten_track`
- `ableton_delete_return_track`
- `ableton_consolidate_clip`
- `ableton_delete_clip`
- `ableton_delete_device`

### Export

- `ableton_export_render`
- `ableton_bounce_tracks`
- `ableton_analyze_and_apply_mastering`

### Unsupported

- `ableton_set_automation`
- Unknown MCP tool names

## HTTP Endpoint Classification

### Read

- `GET /status`
- `GET /project`
- `GET /arrangement`
- `GET /arrangement/clips/delete-plan`
- `GET /plugins`
- `GET /browser/search`
- `POST /analysis/audio`
- `POST /analysis/mix`
- `GET /production/report`
- `GET /returns`
- `GET /routing/buses`
- `GET /meters`
- `GET /clips/notes`
- `GET /devices/parameters`

### Safe-Write

- `POST /project/snapshot`
- `POST /tempo`
- `POST /signature`
- `POST /transport/start`
- `POST /transport/stop`
- `POST /clips/launch`
- `POST /scenes/launch`
- `POST /tracks/midi`
- `POST /tracks/duplicate`
- `POST /tracks/freeze`
- `POST /tracks/modify`
- `POST /returns/create`
- `POST /returns/modify`
- `POST /master/modify`
- `POST /clips/midi`
- `POST /clips/humanize`
- `POST /clips/quantize`
- `POST /groove/apply`
- `POST /devices/load`
- `POST /devices/load-master`
- `POST /devices/parameter`
- `POST /devices/reorder`
- `POST /mastering/apply`
- `POST /arrangement/insert`
- `POST /arrangement/locators`

### Destructive

- `POST /project/rollback`
- `POST /project/save`
- `POST /tracks/flatten`
- `DELETE /returns`
- `POST /clips/consolidate`
- `DELETE /clips/midi`
- `DELETE /arrangement/clips`
- `DELETE /devices`
- `POST /mastering/remove-reverb`

### Export

- `POST /render/export`
- `POST /tracks/bounce`
- `POST /mastering/analyze-and-apply`

### Unsupported

- `POST /automation`
- `POST /midi/import`
- Unknown HTTP routes

## Notes

`ableton_import_midi` is classified as safe-write because the MCP path parses a
local MIDI file and writes clips through supported operations. The raw
`POST /midi/import` HTTP endpoint is classified as unsupported because the
Remote Script explicitly rejects it and tells callers to use the MCP parser path.

Render and bounce endpoints are classified as `export` even when the Remote
Script returns `501`, because export approval should be explicit before any
future bridge implementation writes audio files.
