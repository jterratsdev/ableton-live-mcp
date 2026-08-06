# Ableton Live MCP

Local MCP stdio server for inspecting and controlling Ableton Live through a
local bridge.

Current package version: `0.1.0`.

Product site: [ableton-mcp.jterrats.dev](https://ableton-mcp.jterrats.dev)

This repo does not assume a specific Ableton integration layer. The MCP server
speaks JSON-RPC over stdio to an MCP client, then forwards tool calls to a local
HTTP bridge that you can implement with Max for Live, Ableton's Extensions SDK,
a Python Remote Script helper, or another Live automation layer.

## Product Workflows

Start with [docs/product-workflows.md](docs/product-workflows.md) for end-to-end
setup, MIDI import, instrument assignment, arrangement, mixing, mastering,
validation, and export workflows. The guide also documents safe operating rules
for open user sets, destructive commands, explicit export approval, and
unsupported bridge operations.

## Tools

Read and inspect:

- `ableton_get_status`
- `ableton_get_project`
- `ableton_get_arrangement`
- `ableton_list_plugins`
- `ableton_search_browser`
- `ableton_diagnose_plugins`
- `ableton_get_production_report`
- `ableton_diagnose_playback`
- `ableton_get_meters`
- `ableton_list_returns`
- `ableton_list_buses`
- `ableton_get_clip_notes`
- `ableton_launch_clip`
- `ableton_launch_scene`
- `ableton_get_device_parameters`
- `ableton_analyze_audio`
- `ableton_analyze_mix`
- `ableton_get_bridge_observability`
- `ableton_evaluate_action_risk`
- `ableton_list_risk_policy`
- `ableton_match_preset_intent`
- `ableton_list_workflow_plans`
- `ableton_get_workflow_plan`

Project, transport, track, and clip editing:

- `ableton_create_snapshot`
- `ableton_rollback_snapshot`
- `ableton_set_tempo`
- `ableton_save_project`
- `ableton_set_signature`
- `ableton_start_transport`
- `ableton_stop_transport`
- `ableton_create_midi_track`
- `ableton_duplicate_track`
- `ableton_freeze_track`
- `ableton_flatten_track`
- `ableton_modify_track`
- `ableton_create_midi_clip`
- `ableton_consolidate_clip`
- `ableton_delete_clip`
- `ableton_humanize_clip`
- `ableton_quantize_clip`
- `ableton_apply_groove`
- `ableton_import_midi`

Devices, routing, returns, arrangement, mastering, and export:

- `ableton_load_device`
- `ableton_load_master_device`
- `ableton_select_vst_for_midi`
- `ableton_set_device_parameter`
- `ableton_reorder_device`
- `ableton_delete_device`
- `ableton_set_automation`
- `ableton_create_return_track`
- `ableton_modify_return`
- `ableton_delete_return_track`
- `ableton_modify_master`
- `ableton_apply_mastering_chain`
- `ableton_analyze_and_apply_mastering`
- `ableton_export_render`
- `ableton_bounce_tracks`
- `ableton_insert_arrangement_clip`
- `ableton_add_locator`

## Production Workflow

For meaningful LLM control, the recommended sequence is:

1. `ableton_get_status`, `ableton_get_project`,
   `ableton_get_arrangement`, and `ableton_get_production_report` to inspect
   transport, tracks, devices, clips, locators, routing, meters, returns, and
   mixer state.
2. `ableton_create_snapshot` before broad edits. For real user sets, also save
   or duplicate the `.als` file before destructive, export, or mastering work.
3. `ableton_list_plugins` and `ableton_search_browser` so the LLM can choose
   available instruments, effects, presets, samples, racks, grooves, plugins,
   and Max devices. Use `ableton_match_preset_intent` first when the request is
   musical, such as realistic violin, concert piano, classical guitar, flute,
   or concert hall mastering.
4. `ableton_import_midi`, `ableton_create_midi_clip`, or both.
5. `ableton_humanize_clip`, `ableton_quantize_clip`, or `ableton_apply_groove` for controlled MIDI timing edits.
6. `ableton_select_vst_for_midi`, `ableton_load_device`, or
   `ableton_load_master_device` to assign sounds and processing.
7. `ableton_duplicate_track`, `ableton_consolidate_clip`,
   `ableton_insert_arrangement_clip`, `ableton_add_locator`,
   `ableton_modify_track`, `ableton_modify_return`,
   `ableton_modify_master`, `ableton_set_device_parameter`, and
   `ableton_set_automation` for arrangement and mix moves.
8. `ableton_freeze_track` and `ableton_flatten_track` when committing tracks to audio is supported by the active bridge.
9. `ableton_apply_mastering_chain` for master bus preparation.
10. `ableton_export_render`, `ableton_bounce_tracks`, and
    `ableton_analyze_audio`, and `ableton_analyze_mix` for approved export,
    stem, and audio-validation workflows. File analysis runs locally in the MCP
    process and does not depend on Ableton's Remote Script meters.

Risk tiers and default blocking recommendations are documented in
[docs/risk-policy.md](docs/risk-policy.md) and exposed through
`ableton_evaluate_action_risk` and `ableton_list_risk_policy`. High-level
plan-only workflows are exposed through `ableton_list_workflow_plans` and
`ableton_get_workflow_plan`. Render/export support is documented in
[docs/render-export-plan.md](docs/render-export-plan.md); the current Python
Remote Script bridge returns explicit `501` unsupported responses for
render-backed routes instead of simulating Live renders.

## Quick Start

From npm:

```sh
npx -y @jterrats/ableton-live-mcp --help
```

Install the bundled Ableton Remote Script:

```sh
npx -y @jterrats/ableton-live-mcp install-remote-script --app-path "/Applications/Ableton Live 12 Lite.app"
```

Then restart Ableton Live, select `AbletonMcpBridge` in Preferences -> Link,
Tempo & MIDI, and verify the installation:

```sh
npx -y @jterrats/ableton-live-mcp doctor --app-path "/Applications/Ableton Live 12 Lite.app"
```

Run the MCP stdio server:

```sh
npx -y @jterrats/ableton-live-mcp
```

Local development from this repo:

```sh
npm run smoke
```

Run the server:

```sh
npm start
```

Run the deterministic local development bridge:

```sh
npm run bridge
```

For dry-run development without Ableton:

```sh
ABLETON_MCP_DRY_RUN=1 npm start
```

## MCP Client Config

Use this shape in an MCP client that supports stdio servers:

```json
{
  "mcpServers": {
    "ableton-live": {
      "command": "npx",
      "args": ["-y", "@jterrats/ableton-live-mcp"],
      "env": {
        "ABLETON_BRIDGE_URL": "http://127.0.0.1:9789"
      }
    }
  }
}
```

Set `ABLETON_MCP_DRY_RUN=1` in `env` when you want the tools to return the
intended bridge calls without touching Ableton.

## Bridge

The local bridge must listen on `ABLETON_BRIDGE_URL` and implement the HTTP
contract in [docs/ableton-bridge-contract.md](docs/ableton-bridge-contract.md).

This repo includes a deterministic development bridge for local MCP integration
tests. It listens on `127.0.0.1:9789` by default, or on `ABLETON_BRIDGE_PORT`
when configured, and implements the product workflow surface without requiring
Ableton Live.

For the real Ableton Live adapter, install the Python Remote Script documented
in [docs/ableton-python-remote-script.md](docs/ableton-python-remote-script.md).
That script runs inside Ableton and exposes the same bridge endpoints on
`127.0.0.1:9789`.

On this machine Ableton Live was detected at `/Applications/Ableton Live 12 Lite.app`.
Install the bundled Remote Script with:

```bash
npx -y @jterrats/ableton-live-mcp install-remote-script --app-path "/Applications/Ableton Live 12 Lite.app"
```

If macOS rejects writes to `/Applications` with `Operation not permitted`, close
Ableton and retry with `sudo -E npx -y @jterrats/ableton-live-mcp
install-remote-script --app-path "/Applications/Ableton Live 12 Lite.app"`.
If sudo is still blocked, grant App Management or Full Disk Access to your
terminal app in System Settings -> Privacy & Security, then rerun the installer.
Finder manual copy with authentication is also valid.

Release readiness checks are documented in
[docs/release-checklist.md](docs/release-checklist.md).

Keep the bridge local-only. Do not bind it to a public network interface unless
you add authentication and understand the risk of remote DAW control.
