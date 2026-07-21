# High-Level Workflow Plans

`src/workflow-plans.js` defines deterministic, plan-only workflows above raw
MCP tool calls. The module does not dispatch to the bridge and does not mutate
Ableton Live. Callers can inspect a plan, show the user the ordered tool steps,
apply approval gates from `src/risk-policy.js`, and then execute only the steps
the user has accepted.

Every generated step includes:

- `toolName`: an existing MCP tool from `src/tools.js`.
- `argsTemplate`: deterministic placeholders for the caller to fill.
- `riskTier` and `risk`: metadata derived from the canonical risk policy.
- `summary`: the musical reason for that tool call.

## Operating Rules

- Always inspect before writing: status, project, arrangement, meters, returns,
  buses, and production report are read steps in the relevant plans.
- Treat `executionMode: "plan-only"` literally. The plan catalog is a recipe,
  not an executor.
- Create a snapshot before multi-step safe-write workflows.
- Stop for explicit approval before `export` or `destructive` steps.
- Treat unsupported bridge responses as product output. Do not retry by
  broadening the mutation.
- Re-read MCP state after each batch of changes and compare it to the plan.

## Workflow Catalog

| Workflow | Goal | Default risk tiers |
| --- | --- | --- |
| `classical_session_setup` | Create a reversible starting point for a classical MIDI session. | `read`, `safe-write` |
| `instrument_assignment` | Choose and load instruments from observed device and browser inventory. | `read`, `safe-write` |
| `mix_balancing` | Make bounded level, pan, routing, send, return, and master moves. | `read`, `safe-write` |
| `reverb_cleanup` | Reduce excessive ambience through reversible sends, return levels, and known wet parameter edits. | `read`, `safe-write` |
| `mastering_prep` | Prepare a transparent master chain and target headroom without requiring render support. | `read`, `safe-write` |
| `render_validation` | Validate approved render or stem artifacts, or record explicit unsupported behavior. | `read`, `export` |

## Classical Session Setup

Use `classical_session_setup` when starting from a score, MIDI file, or blank
set intended for orchestral or chamber production.

Plan shape:

1. Read bridge status, project, arrangement, and production context.
2. Create a snapshot labeled for session setup.
3. Set the requested tempo and time signature.
4. Create named MIDI tracks for orchestral roles.
5. Add score locators for sections such as Intro, Theme, Development, and Coda.
6. Re-read project state.

This workflow intentionally uses safe-write steps only after inspection and a
snapshot. It does not save the `.als` file.

## Instrument Assignment

Use `instrument_assignment` when MIDI tracks need realistic or role-appropriate
sound sources.

Plan shape:

1. Read current track roles and devices.
2. List available instruments and search browser inventory.
3. Load the selected instrument with `ableton_select_vst_for_midi`.
4. Inspect device parameters before tuning.
5. Set only known, bounded parameters.
6. Re-read the project.

The caller should fill `query`, `role`, and `rationale` from observed inventory
and user intent. It should not guess plugin names without a list or search step.

## Mix Balancing

Use `mix_balancing` for bounded level, pan, routing, sends, returns, and master
headroom changes.

Plan shape:

1. Read project, meters, returns, and routing buses.
2. Create a mix snapshot.
3. Modify track volume, pan, routing, or sends.
4. Create or modify return tracks when a shared bus is needed.
5. Adjust master headroom.
6. Re-read meters and production diagnostics.

The default plan avoids `ableton_save_project`, `ableton_flatten_track`, and
other destructive commit steps.

## Reverb Cleanup

Use `reverb_cleanup` when a session is too wet, washed out, or unclear.

Plan shape:

1. Read project, return tracks, and meters to locate ambience sources.
2. Create a cleanup snapshot.
3. Lower track sends feeding excessive ambience.
4. Lower reverb return level instead of deleting return devices.
5. Inspect device parameters before changing wet, decay, or size controls.
6. Adjust only known reverb parameters with bounded values.
7. Re-read production diagnostics.

This workflow avoids destructive device deletion by default. If the user wants
to remove devices, route that through the risk policy as a separate destructive
approval.

## Mastering Prep

Use `mastering_prep` before final listening, export, or external mastering.

Plan shape:

1. Read production report and meters.
2. Search available master devices or racks.
3. Create a mastering snapshot.
4. Load the selected master device.
5. Apply a structured mastering chain with target LUFS and true peak.
6. Set conservative master headroom.
7. Re-read production diagnostics.

This workflow prepares the chain but does not render. Render-backed mastering
belongs behind export approval.

## Render Validation

Use `render_validation` when the user has approved an output path and scope, or
when the workflow needs to document unsupported render behavior.

Plan shape:

1. Read production diagnostics before export.
2. Request the approved master or stem render with `ableton_export_render`.
3. Request selected-track or stem bounces with `ableton_bounce_tracks` when
   needed.
4. Analyze each real rendered audio file with `ableton_analyze_audio`.
5. Re-read production diagnostics and record unsupported bridge responses.

The render and bounce steps are `export` risk. The caller must ask for explicit
approval of output path, scope, beat range, sample rate, bit depth,
normalization, and return-track inclusion before execution.

## Validation

Run `node test/workflow-plans.mjs` to verify that:

- every required high-level workflow exists;
- generated plans use only registered MCP tool names;
- every generated step declares risk metadata from `src/risk-policy.js`;
- generated plans remain immutable plan-only data.
