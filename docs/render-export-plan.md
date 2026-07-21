# Render And Export Product Contract

This contract defines what the product can promise today for render/export and
what remains blocked by Ableton Live Remote Script feasibility.

## Supported Product Surfaces

### Master Export

- Endpoint/tool: `POST /render/export` through `ableton_export_render`.
- Scope: `master`.
- Output: one WAV file at `outputPath`.
- Development bridge behavior: writes a deterministic silent WAV so downstream
  audio analysis and product workflow tests can inspect a real file.
- Remote Script behavior: returns `501` with an unsupported message. It must not
  report a simulated Live render.

### Selected-Track Export

- Endpoint/tool: `POST /render/export` with scope `selected_tracks`; high-level
  workflow: `POST /tracks/bounce` through `ableton_bounce_tracks`.
- Output: one WAV file when exporting a selected-track mix.
- Selection rule: selected-track export must have an explicit selection. The
  development bridge accepts `trackIndices[]` at the bridge layer or
  `selectedTrackIndices` in deterministic state. `ableton_bounce_tracks`
  exposes `trackIndices[]` as the stable MCP path today.
- Development bridge behavior: writes one deterministic silent WAV and returns
  the selected track targets in `targets`.
- Remote Script behavior: returns `501` until a safe Live export API and
  selection mapping are confirmed.

### Stem Export

- Endpoint/tool: `POST /render/export` with scope `stems`; high-level workflow:
  `POST /tracks/bounce` through `ableton_bounce_tracks`.
- Output: one WAV file per target track in an output directory.
- Selection rule: omitted `trackIndices[]` means all regular tracks; explicit
  `trackIndices[]` limits stems to those tracks. `includeReturnTracks: true`
  appends return tracks.
- Development bridge behavior: writes deterministic silent WAV stems with stable
  filenames such as `01-track-0-Piano.wav`.
- Remote Script behavior: returns `501` until a safe Live render/export
  implementation exists.

## Response Contract

Development render responses include:

- `ok: true` and `rendered: true`.
- `mode: "deterministic-development-render"`.
- `request`: normalized request values.
- `contract`: product scope, artifact kind, selection source, deterministic
  development support, and Remote Script unsupported status.
- `targets`: master, track, or return targets included in the render.
- `range`: beat range and calculated duration.
- `files`: generated artifact paths and target metadata.

Remote Script render-backed routes must return `501` rather than a successful
placeholder for:

- `POST /render/export`.
- `POST /tracks/bounce`.
- `POST /mastering/analyze-and-apply`.

## Live API Limitation

The current Remote Script bridge does not call Ableton Live's export/render
surface. The project has not confirmed a safe cross-version Python API that can
render master output, selected-track mixes, or stems without blocking Live,
mutating user sets unexpectedly, or reporting false success.

## Next Implementation Surface

If Remote Script cannot safely render directly, the next implementation should
be a separate local automation surface that can:

- run an isolated export command against a disposable or explicitly approved
  Live set;
- stream progress, cancellation, and final file metadata back to the bridge;
- preserve the same response contract and `501` fallback when unsupported;
- keep destructive or long-running export actions behind an explicit risk gate.
