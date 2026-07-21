# Ableton Bridge Contract

The MCP server does not talk to Ableton Live directly. It sends small HTTP
requests to a local bridge at `ABLETON_BRIDGE_URL`, defaulting to
`http://127.0.0.1:9789`.

That bridge can be implemented as a Max for Live device, an Ableton Extension
SDK extension, a Python Remote Script helper, or any local process that can
control Live and expose these endpoints.

The repository ships a deterministic development bridge at `bridge/server.js`
for local testing. It intentionally keeps the adapter boundary small so a real
Ableton adapter can replace the development adapter without changing the MCP
HTTP client.

## Endpoints

### `GET /status`

Returns a compact status object.

```json
{
  "ok": true,
  "tempo": 124,
  "playing": false,
  "tracks": [
    { "index": 0, "name": "Drums", "type": "midi" }
  ]
}
```

### `GET /project`

Returns enough structure for an LLM to reason before editing.

```json
{
  "ok": true,
  "tempo": 124,
  "timeSignature": "4/4",
  "tracks": [
    {
      "index": 0,
      "name": "Piano",
      "type": "midi",
      "volumeDb": -6,
      "devices": [{ "index": 0, "name": "Wavetable", "kind": "instrument" }],
      "clips": [{ "slot": 0, "name": "Verse", "lengthBeats": 16 }]
    }
  ],
  "locators": [{ "beat": 0, "name": "Intro" }]
}
```

### `GET /arrangement`

Returns arrangement timeline state that the bridge can observe: locators, song
length, derived sections, and timeline clips when the host runtime exposes them.

```json
{
  "ok": true,
  "lengthBeats": 64,
  "sections": [
    { "name": "Intro", "startBeat": 0, "endBeat": 16, "lengthBeats": 16 },
    { "name": "Verse", "startBeat": 16, "endBeat": 64, "lengthBeats": 48 }
  ],
  "locators": [
    { "beat": 0, "name": "Intro" },
    { "beat": 16, "name": "Verse" }
  ],
  "clips": [
    {
      "trackIndex": 0,
      "trackName": "Piano",
      "name": "Verse Piano",
      "startBeat": 16,
      "lengthBeats": 8,
      "endBeat": 24
    }
  ]
}
```

The deterministic development bridge stores arrangement clips in memory and
derives sections from locators when explicit sections are not present. The
Python Remote Script reads `song.cue_points` and any arrangement clip collection
exposed by the running Live API; when arrangement clips are not exposed, it
returns an empty `clips` array plus a warning instead of fabricating timeline
clips from session slots.

### `POST /project/snapshot`

Saves a copy/checkpoint before broad edits.

```json
{ "label": "before MIDI import and mastering pass" }
```

```json
{
  "ok": true,
  "snapshot": {
    "id": "snap-1784361445655-1-before-midi-import",
    "label": "before MIDI import and mastering pass",
    "mode": "deterministic-development-memory",
    "trackCount": 4
  }
}
```

### `POST /project/rollback`

Restores a previously created bridge snapshot.

```json
{ "snapshotId": "snap-1784361445655-1-before-midi-import" }
```

The deterministic development bridge restores the full in-memory project state.
The Python Remote Script stores snapshots in memory while the Control Surface is
loaded and restores tempo, time signature, and MIDI clips that it can read and
rewrite through Ableton's Python API. Arbitrary device/plugin state, routing,
audio clips, undo history, and saved `.als` file state are outside the current
Remote Script rollback surface. Missing snapshot IDs return `404`.

### `GET /plugins`

Returns searchable devices, presets, racks, VSTs, and Audio Units. In real bridge
mode, the MCP server forwards optional `kind` and `query` filters as query
parameters. In dry-run mode, they are returned in the dry-run payload.

```json
{
  "ok": true,
  "filters": { "kind": "vst", "query": "kontakt" },
  "count": 1,
  "plugins": [
    {
      "id": "vst:kontakt-8",
      "name": "Kontakt 8",
      "kind": "vst",
      "type": "instrument",
      "source": "vst3",
      "tags": ["sampler", "piano", "orchestral"]
    }
  ]
}
```

Supported `kind` filters are `instrument`, `audio_effect`, `midi_effect`,
`rack`, `preset`, `vst`, `au`, and `any`. The deterministic development bridge
includes fixed fixtures across all of those categories so tests can verify
filtering without depending on a local Ableton installation.

### `GET /browser/search`

Returns loadable browser results across Live devices, presets, samples, racks,
grooves, plugins, and Max devices. Query parameters:

```text
kind=sample&query=clap&limit=3
```

Supported `kind` filters are `instrument`, `audio_effect`, `midi_effect`,
`rack`, `preset`, `sample`, `groove`, `plugin`, `vst`, `au`, `max_device`, and
`any`. Results are capped at 50.

```json
{
  "ok": true,
  "filters": { "kind": "sample", "query": "clap", "limit": 3 },
  "count": 1,
  "capped": false,
  "results": [
    {
      "ref": "sample:tight-clap",
      "name": "Tight Clap.wav",
      "kind": "sample",
      "type": "sample",
      "source": "core-library",
      "path": "Samples/Drums/Claps/Tight Clap.wav",
      "tags": ["drums", "clap"],
      "loadable": true
    }
  ]
}
```

### `POST /analysis/audio`

Analyzes a rendered local audio file with real local audio tooling. The bridge
validates that `path` is absolute, points to a readable audio file, and uses a
supported extension (`wav`, `aif`, `aiff`, `flac`, `mp3`, `m4a`, or `aac`).
If `ffmpeg` or `ffprobe` is unavailable, the bridge returns `501` instead of
simulating metrics.

```json
{ "path": "/Users/example/Music/render.wav" }
```

```json
{
  "ok": true,
  "path": "/Users/example/Music/render.wav",
  "format": "wav",
  "durationSeconds": 123.4,
  "lufs": -18.2,
  "truePeakDb": -1.1,
  "rmsDb": -21.7,
  "crestFactorDb": 20.6,
  "clipping": {
    "detected": false,
    "thresholdDb": -0.1,
    "peakDb": -1.1
  }
}
```

### `POST /tempo`

```json
{ "bpm": 124 }
```

### `POST /project/save`

Saves the current Live set when the bridge runtime exposes a compatible Live API
save method. `path` is optional and requests Save As behavior when supported.

```json
{
  "path": "/Users/example/Music/song.als",
  "label": "after separated MIDI import"
}
```

If the host API cannot save, the bridge returns `501` with an explanatory error.

### `POST /signature`

Sets the Live set time signature.

```json
{
  "numerator": 3,
  "denominator": 4
}
```

### `POST /transport/start`

Starts playback.

```json
{}
```

### `POST /transport/stop`

Stops playback.

```json
{}
```

### `POST /tracks/midi`

Creates a MIDI track.

```json
{ "name": "Bass", "color": "blue" }
```

### `POST /tracks/duplicate`

Duplicates an existing track. `trackIndex` is required; `name` is optional and
renames only the duplicated track.

```json
{
  "trackIndex": 0,
  "name": "Piano Double"
}
```

```json
{
  "ok": true,
  "duplicated": true,
  "sourceTrackIndex": 0,
  "newTrackIndex": 1,
  "track": { "index": 1, "name": "Piano Double", "devices": [], "clips": [] }
}
```

The deterministic development bridge inserts the duplicate after the source and
deep-copies devices, clips, sends, and observable track state. The Python Remote
Script calls Ableton's real `duplicate_track` API when present and returns `501`
if the running Live version does not expose duplication or does not report a new
track.

### `POST /tracks/freeze`

Freezes a track where the bridge can perform a real freeze.

```json
{ "trackIndex": 0 }
```

The development bridge marks `track.frozen = true` and returns the updated
track. The Python Remote Script calls a real track/song freeze API only when it
exists; otherwise it returns `501`.

### `POST /tracks/flatten`

Flattens a track to audio where the bridge can perform a real flatten.

```json
{ "trackIndex": 0 }
```

The development bridge makes the operation observable by marking the track
frozen and flattened, setting `type` to `audio`, and clearing devices. Remote
Script adapters must call a real Live flatten API or return `501`; they must not
return `ok: true` for a no-op.

### `POST /tracks/modify`

Changes mixer, naming, routing, or sends for one track.

```json
{
  "trackIndex": 0,
  "name": "Piano Main",
  "volumeDb": -8,
  "pan": 0,
  "muted": false,
  "solo": false,
  "armed": false,
  "sends": { "Reverb": -12 }
}
```

The bridge applies supported fields and returns the observed post-change track
state plus an `applied` object. Unknown return-send names, unavailable routing
targets, and out-of-range mixer values return non-2xx errors. Write payloads use
real dB fields such as `volumeDb` and send values. Live readback must not feed
raw parameter values back into those dB write fields: the Python Remote Script
exposes raw parameter values as `volumeRaw` and `sendsRaw`; `volumeDb` and
`sendsDb` are only populated from Live display strings when Live exposes a
parseable dB display.

```json
{
  "ok": true,
  "track": {
    "index": 0,
    "name": "Piano Main",
    "volumeDb": -8,
    "pan": -0.2,
    "solo": true,
    "sends": { "Reverb": -18 }
  },
  "applied": {
    "volumeDb": -8,
    "pan": -0.2,
    "sends": { "Reverb": -18 }
  }
}
```

### `GET /returns`

Lists return tracks, mixer state, and loaded devices.

```json
{
  "ok": true,
  "count": 1,
  "returns": [
    {
      "index": 0,
      "name": "Reverb",
      "type": "return",
      "volumeDb": -10,
      "pan": 0,
      "devices": [
        { "index": 0, "name": "Hybrid Reverb", "kind": "audio_effect" },
        { "index": 1, "name": "EQ Eight", "kind": "audio_effect" }
      ]
    }
  ]
}
```

### `POST /returns/create`

Creates a return track. `name` is required. `returnIndex` is optional; when
omitted the bridge appends the return after existing returns. When present,
`returnIndex` must be between `0` and the current return count.

```json
{
  "name": "Parallel Crush",
  "returnIndex": 2
}
```

Successful responses include the observed created return:

```json
{
  "ok": true,
  "created": true,
  "returnIndex": 2,
  "count": 3,
  "return": {
    "index": 2,
    "name": "Parallel Crush",
    "type": "return",
    "volumeDb": 0,
    "pan": 0,
    "devices": []
  }
}
```

Invalid names return `400`. Out-of-range insert indices return `400`. If the
Remote Script is running inside a Live version without return-track creation
support, it returns `501` with `{ "ok": false, "error": "..." }`.

### `POST /returns/modify`

Changes return-track mixer state.

```json
{
  "returnIndex": 0,
  "volumeDb": -14,
  "pan": 0.25,
  "muted": false,
  "solo": false
}
```

### `DELETE /returns`

Deletes a return track by `returnIndex`.

```json
{
  "returnIndex": 2
}
```

Successful responses include the deleted return summary and the remaining
return count.

```json
{
  "ok": true,
  "deleted": true,
  "returnIndex": 2,
  "count": 2,
  "return": { "index": 2, "name": "Parallel Crush", "type": "return" }
}
```

Invalid indices return `400`; indices outside the current return range return
`404`. If Live does not expose a supported delete API, the Remote Script returns
`501` instead of reporting a no-op success.

### `GET /routing/buses`

Lists master, return buses, and per-track routing options exposed by the bridge.

```json
{
  "ok": true,
  "master": { "name": "Master", "volumeDb": 0 },
  "buses": [
    { "name": "Master", "type": "master" },
    { "name": "Reverb", "type": "return", "returnIndex": 0 }
  ],
  "trackRouting": [
    {
      "trackIndex": 0,
      "name": "Piano",
      "inputRouting": "All Ins",
      "outputRouting": "Master",
      "availableOutputs": ["Master"]
    }
  ]
}
```

### `GET /meters`

Reads observable output meter values for regular tracks, return tracks, and the
master channel.

The response shape is stable even when a bridge runtime cannot observe a meter
field. Each target always includes `meter.left`, `meter.right`, and
`meter.level`; unavailable fields are `null` and are also listed in `warnings`.
Bridge implementations must not fabricate levels from volume, clip state, or
transport state.

```json
{
  "ok": true,
  "tracks": [
    {
      "index": 0,
      "name": "Piano",
      "type": "midi",
      "meter": { "left": 0.12, "right": 0.1, "level": 0.13 },
      "warnings": []
    }
  ],
  "returns": [
    {
      "index": 0,
      "name": "Reverb",
      "type": "return",
      "meter": { "left": null, "right": null, "level": null },
      "warnings": [
        "returns[0].meter.left is not exposed by this Ableton Live API",
        "returns[0].meter.right is not exposed by this Ableton Live API",
        "returns[0].meter.level is not exposed by this Ableton Live API"
      ]
    }
  ],
  "master": {
    "name": "Master",
    "type": "master",
    "meter": { "left": 0.2, "right": 0.18, "level": 0.21 },
    "warnings": []
  },
  "warnings": [
    "returns[0].meter.left is not exposed by this Ableton Live API",
    "returns[0].meter.right is not exposed by this Ableton Live API",
    "returns[0].meter.level is not exposed by this Ableton Live API"
  ]
}
```

The deterministic development bridge reads explicit meter values from state
when present, including `meter.left/right/level`, `outputMeterLeft/Right/Level`,
or `output_meter_left/right/level`. Its default fixture does not simulate audio
meters, so defaults return `null` meter fields with warnings.

### `POST /master/modify`

Changes master mixer state where the bridge runtime supports it.

```json
{
  "volumeDb": -2,
  "pan": 0,
  "cueVolumeDb": -18,
  "muted": false,
  "solo": false
}
```

The bridge applies supported fields and returns the observed master state plus
an `applied` object. Unsupported master controls, such as mute/solo on Live API
surfaces that do not expose them, are validated and reported as warnings instead
of silent success.

```json
{
  "ok": true,
  "master": { "name": "Master", "type": "master", "volumeDb": -2, "pan": 0 },
  "applied": { "volumeDb": -2, "pan": 0, "cueVolumeDb": -18 },
  "warnings": []
}
```

### `POST /clips/midi`

Creates or replaces a MIDI clip.

```json
{
  "trackIndex": 0,
  "clipSlotIndex": 0,
  "lengthBeats": 4,
  "notes": [
    { "pitch": 60, "start": 0, "duration": 1, "velocity": 100 }
  ]
}
```

### `POST /clips/consolidate`

Consolidates a beat range on one track into a new clip. `clipSlotIndex` is
optional; when omitted, bridges may choose the next available slot.

```json
{
  "trackIndex": 0,
  "startBeat": 0,
  "lengthBeats": 8,
  "clipSlotIndex": 7,
  "name": "Consolidated Verse"
}
```

Successful development responses either include the consolidated clip:

```json
{
  "ok": true,
  "consolidated": true,
  "range": { "startBeat": 0, "lengthBeats": 8, "endBeat": 8 },
  "sourceClipSlots": [0, 1],
  "clip": { "slot": 7, "name": "Consolidated Verse", "lengthBeats": 8 }
}
```

or a clear no-source shape:

```json
{
  "ok": true,
  "consolidated": false,
  "reason": "No clips overlap the requested range",
  "clip": null
}
```

The Python Remote Script returns `501` unless the running Live API exposes a
consolidation operation with a safe signature for this bridge.

### `DELETE /clips/midi`

Deletes a clip from a track slot. The operation is idempotent: deleting an empty
slot returns `deleted: false` instead of an error.

```json
{
  "trackIndex": 0,
  "clipSlotIndex": 2
}
```

```json
{
  "ok": true,
  "deleted": true,
  "clip": { "slot": 2, "name": "Old take", "lengthBeats": 144 },
  "track": { "index": 0, "name": "Piano" }
}
```

### `GET /clips/notes`

Reads MIDI note events from an existing clip.

Query parameters:

```text
trackIndex=0&clipSlotIndex=0
```

```json
{
  "ok": true,
  "clip": { "slot": 0, "name": "Theme", "lengthBeats": 249, "noteCount": 473 },
  "track": { "index": 0, "name": "Piano" },
  "notes": [
    { "pitch": 60, "start": 0, "duration": 1, "velocity": 100, "muted": false }
  ]
}
```

### `POST /clips/humanize`

Rewrites MIDI notes in an existing editable clip with deterministic bounded
variation. `seed` makes the same source notes and payload repeatable.

```json
{
  "trackIndex": 0,
  "clipSlotIndex": 0,
  "timingAmountBeats": 0.03,
  "durationAmountBeats": 0.01,
  "velocityAmount": 8,
  "seed": "take-2"
}
```

`timingAmountBeats` is limited to `0..0.25`, `durationAmountBeats` to `0..0.5`,
and `velocityAmount` to `0..64`. Rewritten notes are clamped to non-negative
starts, positive durations within the clip, and velocity `1..127`.

### `POST /clips/quantize`

Quantizes MIDI note start times in an existing editable clip.

```json
{
  "trackIndex": 0,
  "clipSlotIndex": 0,
  "grid": "1/16",
  "strength": 0.75
}
```

Supported grids are `1/4`, `1/8`, `1/16`, `1/32`, and `1/64`; `strength` is
`0..1` and defaults to `1` at the bridge layer.

### `POST /groove/apply`

Applies a swing-style groove by delaying odd grid subdivisions in an existing
editable MIDI clip.

```json
{
  "trackIndex": 0,
  "clipSlotIndex": 0,
  "grid": "1/16",
  "amount": 0.6,
  "swing": 0.5
}
```

`amount` and optional `swing` are both `0..1`. Successful clip rewrite responses
include `changedNoteCount`, the updated clip summary, and the rewritten note
events. Bridges that cannot rewrite MIDI notes must return a non-2xx failure,
typically `501`; they must not return `ok: true` for a no-op.

### `POST /midi/import`

Imports a `.mid` or `.midi` file.
The MCP server parses Standard MIDI files itself for the real Ableton Remote
Script path, then sends the decoded note events to `POST /clips/midi`. Bridge
implementations may still expose this endpoint directly for native import or
deterministic development behavior.

```json
{
  "path": "/Users/example/Music/song.mid",
  "trackIndex": 0,
  "clipSlotIndex": 0,
  "createTracks": false,
  "quantize": "1/16"
}
```

### `POST /devices/load`

Loads a device, preset, plugin, or rack according to bridge capabilities.

```json
{
  "trackIndex": 0,
  "query": "Kontakt 8 cinematic piano",
  "kind": "instrument",
  "position": "replace_instrument",
  "role": "piano",
  "rationale": "Best available realistic piano for imported MIDI."
}
```

### `POST /devices/load-master`

Loads an audio effect, preset, plugin, or rack directly onto the master track.
The bridge must report only the device that was actually resolved and loaded.
Missing browser items return `404`.

```json
{
  "query": "EQ Eight",
  "kind": "audio_effect",
  "position": "append",
  "rationale": "Clean corrective EQ before limiter."
}
```

```json
{
  "ok": true,
  "device": {
    "target": "master",
    "query": "EQ Eight",
    "kind": "audio_effect",
    "position": "append",
    "selectedDevice": "EQ Eight",
    "loadedDevice": {
      "index": 0,
      "name": "EQ Eight",
      "kind": "audio_effect",
      "parameters": {}
    }
  }
}
```

### `POST /devices/parameter`

Sets a device/plugin parameter.

```json
{
  "trackIndex": 0,
  "deviceIndex": 0,
  "parameter": "Filter Frequency",
  "normalizedValue": 0.72
}
```

The bridge resolves the target device by `deviceIndex` or `deviceName`, then
resolves `parameter` by exact normalized name. Missing devices or parameters
return `404`; invalid values return `400`.

```json
{
  "ok": true,
  "parameter": {
    "trackIndex": 0,
    "deviceIndex": 0,
    "deviceName": "Wavetable",
    "parameter": "Filter Frequency",
    "previousValue": 0.5,
    "value": 0.72
  }
}
```

### `GET /devices/parameters`

Lists device parameters before mutation. Query parameters:

```text
trackIndex=0&deviceIndex=0
```

`deviceIndex` and `deviceName` are optional. When neither is provided, all
devices on the track are returned.

```json
{
  "ok": true,
  "track": { "index": 0, "name": "Piano" },
  "count": 1,
  "devices": [
    {
      "index": 0,
      "name": "Wavetable",
      "kind": "instrument",
      "parameterCount": 1,
      "parameters": [
        { "name": "Filter Frequency", "value": 0.72, "min": 0, "max": 1, "isEnabled": true }
      ]
    }
  ]
}
```

### `POST /devices/reorder`

Moves a device inside a single device chain. The stable target grammar is:

```json
{
  "location": { "target": "track", "trackIndex": 0 },
  "deviceIndex": 1,
  "toIndex": 0
}
```

`location.target` must be `track`, `return`, or `master`. Track locations require
`trackIndex`; return locations require `returnIndex`; master locations do not
take an index. Invalid chain or device indices return contract-shaped errors.

```json
{
  "ok": true,
  "reordered": true,
  "location": { "target": "track", "trackIndex": 0 },
  "fromIndex": 1,
  "toIndex": 0,
  "device": { "index": 0, "name": "EQ Eight", "kind": "audio_effect" },
  "devices": [
    { "index": 0, "name": "EQ Eight", "kind": "audio_effect" },
    { "index": 1, "name": "Wavetable", "kind": "instrument" }
  ]
}
```

The Remote Script validates the same payload and may return `501` when the
running Live API does not expose a reliable device reorder operation.

### `DELETE /devices`

Deletes a device from a track, return, or master chain.

```json
{
  "location": { "target": "return", "returnIndex": 0 },
  "deviceIndex": 1
}
```

```json
{
  "ok": true,
  "deleted": true,
  "location": { "target": "return", "returnIndex": 0 },
  "device": { "index": 1, "name": "Hybrid Reverb", "kind": "audio_effect" },
  "deviceIndex": 1,
  "count": 1,
  "devices": [{ "index": 0, "name": "EQ Eight", "kind": "audio_effect" }]
}
```

### `POST /automation`

Writes automation points. The deterministic development bridge stores real
automation state in memory and exposes it through `GET /project` as
`automation`. A write replaces the existing lane for the same target and returns
points sorted by ascending beat.

Supported target grammar:

- `tempo` for song tempo, using BPM values between `20` and `999`.
- `volume` for a track volume lane, using dB values between `-70` and `12`.
- `pan` for a track pan lane, using values between `-1` and `1`.
- `send:<name>` for a named return send on the target track, using dB values
  between `-70` and `12`.
- `device:<deviceIndex>:<parameter>` for an existing track device parameter,
  using normalized values between `0` and `1`.

```json
{
  "trackIndex": 0,
  "target": "volume",
  "points": [
    { "beat": 0, "value": -12 },
    { "beat": 16, "value": -7 }
  ]
}
```

```json
{
  "ok": true,
  "written": true,
  "replaced": false,
  "mode": "deterministic-development-automation",
  "pointCount": 2,
  "automation": {
    "laneId": "track:0:volume",
    "target": "volume",
    "kind": "track_volume",
    "trackIndex": 0,
    "points": [
      { "beat": 0, "value": -12 },
      { "beat": 16, "value": -7 }
    ]
  }
}
```

Remote Script bridges must return `501` unless they can mutate Live automation
envelopes and verify the mutation. The bundled Remote Script currently returns
`501` because Ableton's Python API does not expose a reliable cross-version
envelope mutation surface for these lanes.

### `POST /mastering/apply`

Applies a master bus chain or mastering intent. The bridge reports only devices
that were actually loaded/configured. If no requested mastering device can be
loaded or configured, the endpoint returns a non-2xx error instead of `ok: true`.

```json
{
  "style": "transparent",
  "targetLufs": -14,
  "truePeakDb": -1,
  "chain": [
    { "device": "EQ Eight", "settings": { "highPassHz": 25 } },
    { "device": "Limiter", "settings": { "ceilingDb": -1 } }
  ]
}
```

```json
{
  "ok": true,
  "loadedDevices": [
    {
      "index": 0,
      "device": "EQ Eight",
      "requestedDevice": "EQ Eight",
      "settings": { "Low Cut": 0.25 },
      "warnings": []
    }
  ],
  "warnings": []
}
```

### `POST /render/export`

Exports the master, selected tracks, all tracks, or stems. The deterministic
development bridge writes real WAV files so downstream analysis can run during
tests. Remote Script adapters that cannot access a safe Live export API must
return `501` instead of reporting a simulated render.

```json
{
  "outputPath": "/Users/example/Music/renders/master.wav",
  "scope": "master",
  "sampleRate": 48000,
  "bitDepth": 24,
  "normalize": false
}
```

```json
{
  "ok": true,
  "rendered": true,
  "mode": "deterministic-development-render",
  "request": {
    "outputPath": "/Users/example/Music/renders/master.wav",
    "scope": "master",
    "sampleRate": 48000,
    "bitDepth": 24,
    "normalize": false,
    "includeReturnTracks": false
  },
  "range": {
    "startBeat": 0,
    "lengthBeats": 4,
    "durationSeconds": 1.935
  },
  "files": [
    { "path": "/Users/example/Music/renders/master.wav", "scope": "master" }
  ]
}
```

### `POST /arrangement/locators`

Creates or updates arrangement markers. Existing locators are matched by beat or
name. Successful changes are reflected by both `GET /project` and
`GET /arrangement`.

```json
{ "beat": 32, "name": "Chorus" }
```

```json
{
  "ok": true,
  "locator": { "beat": 32, "name": "Chorus" },
  "locators": [
    { "beat": 0, "name": "Intro" },
    { "beat": 32, "name": "Chorus" }
  ]
}
```

The Python Remote Script uses `song.set_or_delete_cue` and `song.cue_points`
when those APIs are available. If Live does not expose cue creation or updating,
the endpoint returns `501`.

### `POST /arrangement/insert`

Places an existing clip or audio/MIDI reference on the arrangement timeline.

```json
{
  "trackIndex": 0,
  "clipSlotIndex": 0,
  "startBeat": 16,
  "lengthBeats": 8,
  "name": "Verse Piano"
}
```

`trackIndex` and `startBeat` are required. The source must be one of
`clipSlotIndex`/`sourceClipSlotIndex`, `sourcePath`, or `sourceRef`. When a
session clip slot is used, the bridge validates that the clip exists. When
`lengthBeats` is omitted, session clip insertion uses the source clip length;
file/reference insertion requires an explicit length.

The deterministic development bridge records the timeline reference in memory.
The current Python Remote Script returns `501` for insertion because Ableton's
Remote Script API does not expose a reliable arrangement clip insertion method
through this bridge surface.

### `GET /production/report`

Returns a production snapshot that aggregates project structure, routing,
meters, arrangement data, and explicit risks.

```json
{
  "ok": true,
  "summary": {
    "tempo": 124,
    "timeSignature": "4/4",
    "trackCount": 2,
    "returnCount": 2,
    "masterDeviceCount": 1
  },
  "risks": ["Some meter values are unavailable"]
}
```

### `POST /tracks/bounce`

Composes render/export for selected tracks or stems. The deterministic
development bridge writes WAV artifacts; Remote Script adapters that cannot
export audio return `501`.

```json
{
  "outputPath": "/Users/example/Music/bounces",
  "trackIndices": [0, 1],
  "scope": "stems",
  "lengthBeats": 16,
  "sampleRate": 48000,
  "bitDepth": 24
}
```

### `POST /mastering/analyze-and-apply`

Runs a deterministic render, analyzes the rendered audio, and applies bounded
mastering adjustments that are visible in the returned master state. Each
skipped adjustment includes a warning.

```json
{
  "outputPath": "/Users/example/Music/renders/master-analysis.wav",
  "targetLufs": -16,
  "truePeakDb": -1,
  "chain": [
    { "device": "Limiter", "settings": { "Ceiling": -1 } }
  ]
}
```

## Response Shape

Successful responses should return JSON:

```json
{ "ok": true }
```

Bridge failures should use a non-2xx status with JSON or plain text. The MCP
server will return that failure as an MCP tool error.
