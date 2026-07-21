# VST And Preset Intelligence

The preset intelligence layer turns a musical request into ranked Ableton
browser targets. It is local, deterministic, and does not require Ableton Live
for matching tests.

## Catalog Format

The source of truth is `bridge/presets/catalog.js`. Each entry describes one
loadable candidate:

- `id`: stable catalog identifier.
- `name`: display name for users and handoffs.
- `kind`: `instrument` or `effect`.
- `deviceKind`: Ableton browser category such as `vst`, `au`, `preset`,
  `rack`, or `audio_effect`.
- `source`: local source such as `vst3`, `audio-unit`, `live`, or
  `user-library`.
- `load`: bridge-ready `{ kind, query }` values for a future
  `ableton_load_device` or `ableton_load_master_device` call.
- `tags`: searchable musical and production descriptors.
- `roles`: canonical musical roles such as `violin`, `concert_piano`,
  `classical_guitar`, `flute`, `mastering`, or `concert_hall`.
- `realism`: a 0..1 score plus hints such as sampled dynamics, legato
  transitions, breath noise, or transparent hall behavior.
- `classicalIntent`: classical production metadata with ensemble role,
  production intent, and use cases.

`PRESET_CATALOG_SCHEMA` documents the required fields and is validated by
`test/preset-intelligence.mjs`.

## Matching Behavior

`bridge/presets/matcher.js` exposes pure functions:

- `validatePresetCatalog(catalog)`: verifies the local catalog shape, unique
  IDs, load queries, realism hints, and classical production intent.
- `normalizePresetIntent(intent)`: lowercases, tokenizes, and expands musical
  aliases such as `concert piano`, `classical guitar`, and
  `concert hall mastering`.
- `matchPresetIntent(intent, options)`: scores catalog entries and returns
  ranked matches with the load target, matched tokens, realism metadata, and
  scoring reasons.

Scoring favors role matches, exact classical production intent, realism when
the user asks for realism, and effects when the request is about mastering,
hall, reverb, EQ, or space. Ties are deterministic: higher realism wins, then
name order.

## Covered Classical Intents

- `realistic violin` ranks `BBC Symphony Orchestra - Solo Violin Legato`
  first because it matches violin role, realistic violin intent, legato
  realism hints, and sampled orchestral tags.
- `concert piano` ranks `Kontakt 8 - Concert Grand` first, with
  `Concert Grand.adg` available as a local preset fallback.
- `classical guitar` ranks `Nylon Guitar.adg` first through nylon,
  plucked-string, acoustic, and classical guitar intent aliases.
- `flute` ranks `BBC Symphony Orchestra - Flute Legato` first through
  flute and woodwind role matching.
- `concert hall mastering` ranks `Concert Hall Master Bus Rack` first and
  keeps `Hybrid Reverb - Concert Hall` plus `EQ Eight - Classical Cleanup`
  as supporting effect candidates.

## Current Scope

This task defines the local catalog and deterministic scoring behavior only.
It does not add a new MCP tool or bridge endpoint. Future integration can call
`matchPresetIntent`, inspect the top candidate, and pass `match.load.kind` and
`match.load.query` to the existing device-loading tools after user approval and
project risk checks.
