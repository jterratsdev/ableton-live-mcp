# Ableton Compatibility Matrix

This matrix sets expectations for the Ableton MCP bridge across Ableton Live
editions and major versions. It separates product limitations from bridge bugs:
when the Python Remote Script cannot safely perform an operation, callers should
expect an explicit `501` unsupported response instead of a simulated success.

## Source Baseline

- Ableton's Live 12 upgrade comparison lists Live Lite, Intro, Standard, and
  Suite feature limits, including tracks, scenes, returns, devices, Packs, and
  Max for Live availability:
  https://www.ableton.com/en/upgrade-live/
- Ableton's Live 12 edition comparison covers Intro, Standard, and Suite
  features and confirms that Standard and Suite have expanded feature/content
  sets:
  https://www.ableton.com/en/live/compare-editions/
- Ableton's third-party Remote Script guidance says Live 11 and later use
  Python 3 for custom scripts:
  https://help.ableton.com/hc/en-us/articles/209072009-Installing-third-party-remote-scripts
- Ableton's Live minimum requirements page currently lists Live 11 and Live 12
  as supported current major versions:
  https://help.ableton.com/hc/en-us/articles/115001663530-Live-Minimum-System-Requirements
- Ableton's Max for Live FAQ says Max for Live is included with Suite, available
  as an add-on for Standard, and not supported in Lite or Intro:
  https://help.ableton.com/hc/en-us/articles/206407124-Buying-Max-for-Live

## Edition Expectations

| Edition | Expected MCP bridge behavior |
| --- | --- |
| Live Lite | Supported for Python Remote Script control, subject to Lite limits: 8 Audio/MIDI tracks, 16 scenes, 2 sends/returns, 8 mono inputs, 8 mono outputs, reduced included devices/content, VST/AU plug-ins supported, Max for Live unavailable. Track, scene, return, browser, and device-load operations can fail because the edition has reached a product limit. |
| Live Standard | Supported for Python Remote Script control, subject to the user's installed content and optional Max for Live license. Standard has unlimited tracks/scenes, 12 sends/returns, 256 mono inputs/outputs, expanded devices/content, and Max for Live only with an add-on license. |
| Live Suite | Supported for Python Remote Script control with the broadest built-in content surface. Suite has unlimited tracks/scenes, 12 sends/returns, 256 mono inputs/outputs, Suite devices/content, and Max for Live included. |

The Python Remote Script bridge is not a Max for Live device. Max for Live
licensing matters only for operations that search, load, or edit Max devices.

## Version Expectations

| Version | Expected MCP bridge behavior |
| --- | --- |
| Live 11 | Supported target for this repository's Python Remote Script path. Live 11 uses Python 3 for third-party scripts. Host API gaps should return `501` when the bridge has a route but the running Live API does not expose the needed mutation surface. |
| Live 12 | Supported target for this repository's Python Remote Script path. Live 12 keeps the Python 3 Remote Script expectation and adds edition/content differences such as Live 12 browser tags, newer MIDI Tools, and current Suite-only stem separation. |

Live 10 and earlier are outside this matrix because Live 10 and earlier used
Python 2 Remote Scripts, while this repository targets the Live 11+ Python 3
script path.

## Support Terms

| Term | Meaning |
| --- | --- |
| `supported` | Expected to work through the Python Remote Script in Live 11 and Live 12 when the payload is valid. |
| `supported_with_limits` | Expected to work, but Ableton edition limits or installed content can make a specific request fail. |
| `host_dependent_501` | The route exists, but Live's Python API may not expose the needed operation in every version/context. A `501` response is an expected unsupported result. |
| `unsupported_501` | The current Remote Script intentionally rejects this behavior with `501`. This is a product contract, not a bug. |
| `local_bridge_only` | Not an Ableton Live API operation. Use the development/local bridge or MCP-side implementation instead of expecting the Python Remote Script to own it. |

## Endpoint Groups

### Expected Supported Reads

`GET /status`, `GET /project`, `GET /production/report`, `GET /returns`,
`GET /routing/buses`, `GET /meters`, and `GET /devices/parameters` are expected
to work across Lite, Standard, and Suite on Live 11 and Live 12.

`GET /arrangement`, `GET /clips/notes`, `GET /plugins`, and
`GET /browser/search` are supported with Live API or edition/content caveats.
For example, Lite exposes less bundled content than Standard or Suite, and clip
note reads depend on the running Live API exposing editable MIDI note access.

### Expected Supported Writes With Limits

Transport, tempo, signature, track creation/modification, MIDI clip creation,
device loading, device parameter changes, return/master modification, and
mastering-chain application are expected to work when the target edition has
capacity and the requested device/content exists. Lite can hit track, return,
input/output, and content limits sooner than Standard or Suite.

### Expected 501 Unsupported Or Host-Dependent Results

The current Remote Script has explicit `501` expectations for:

- `POST /automation`
- `POST /midi/import`
- `POST /render/export`
- `POST /tracks/bounce`
- `POST /mastering/analyze-and-apply`
- `POST /arrangement/insert`
- `POST /devices/reorder`

Other host-dependent mutation routes, such as Save As, track flattening,
return-track creation/deletion, locator creation, device deletion, clip
consolidation, and MIDI note rewrites, may also return `501` when the running
Live API does not expose the required function. Treat those responses as
compatibility limits unless the route returns malformed data or contradicts the
contract below.

## Machine-Readable Metadata

The fenced JSON block below is the compatibility source of truth for
deterministic checks.

```json compatibility-metadata
{
  "schemaVersion": 1,
  "sourceReviewedAt": "2026-07-20",
  "unsupportedHttpStatus": 501,
  "editions": {
    "liveLite": {
      "label": "Live Lite",
      "support": "supported_with_limits",
      "tracks": 8,
      "scenes": 16,
      "sendReturnTracks": 2,
      "monoInputs": 8,
      "monoOutputs": 8,
      "maxForLive": "unsupported",
      "pluginSupport": "vst2_vst3_au",
      "notes": "Python Remote Script control is expected; edition limits can block track, return, routing, browser, and content-loading requests."
    },
    "liveStandard": {
      "label": "Live Standard",
      "support": "supported_with_limits",
      "tracks": "unlimited",
      "scenes": "unlimited",
      "sendReturnTracks": 12,
      "monoInputs": 256,
      "monoOutputs": 256,
      "maxForLive": "optional_add_on",
      "pluginSupport": "vst2_vst3_au",
      "notes": "Python Remote Script control is expected; installed Packs, plug-ins, and optional Max for Live licensing determine browser and device-load results."
    },
    "liveSuite": {
      "label": "Live Suite",
      "support": "supported",
      "tracks": "unlimited",
      "scenes": "unlimited",
      "sendReturnTracks": 12,
      "monoInputs": 256,
      "monoOutputs": 256,
      "maxForLive": "included",
      "pluginSupport": "vst2_vst3_au",
      "notes": "Python Remote Script control is expected with the broadest built-in content and Max for Live surface."
    }
  },
  "versions": {
    "live11": {
      "label": "Live 11",
      "support": "supported",
      "remoteScriptRuntime": "python3",
      "notes": "Live 11 and later require Python 3 third-party Remote Scripts."
    },
    "live12": {
      "label": "Live 12",
      "support": "supported",
      "remoteScriptRuntime": "python3",
      "notes": "Live 12 is supported; newer Live 12 browser tags, devices, MIDI Tools, and Suite-only features depend on the installed edition."
    }
  },
  "endpointExpectations": [
    {
      "route": "DELETE /clips/midi",
      "tier": "destructive",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can delete MIDI clips, subject to valid track and clip-slot targets.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "DELETE /devices",
      "tier": "destructive",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can expose device chains; Lite has fewer bundled devices and Max for Live is unavailable.",
      "versionImpact": "May return 501 on Live APIs that do not expose reliable device deletion for the target chain."
    },
    {
      "route": "DELETE /returns",
      "tier": "destructive",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "Lite is limited to 2 return tracks; Standard and Suite are limited to 12.",
      "versionImpact": "May return 501 when the running Live API does not expose return-track deletion."
    },
    {
      "route": "GET /arrangement",
      "tier": "read",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "All editions expose arrangement/cue-point state where the Live API makes it observable.",
      "versionImpact": "Expected on Live 11 and Live 12; arrangement clips can be empty with a warning when not exposed."
    },
    {
      "route": "GET /browser/search",
      "tier": "read",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "Search results depend on installed Packs, plug-ins, Max for Live licensing, and Lite/Standard/Suite content.",
      "versionImpact": "Expected on Live 11 and Live 12; Live 12 browser tags can improve available metadata."
    },
    {
      "route": "GET /clips/notes",
      "tier": "read",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can read MIDI notes when the clip target exists.",
      "versionImpact": "May return 501 when the running Live API does not expose the required MIDI note read surface."
    },
    {
      "route": "GET /devices/parameters",
      "tier": "read",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can inspect parameters for devices that exist in the set; device availability differs by edition/content.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "GET /meters",
      "tier": "read",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can report observable track, return, and master meters; Lite has fewer tracks/returns.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "GET /plugins",
      "tier": "read",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "Inventory depends on installed Packs, VST/AU plug-ins, and Max for Live availability.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "GET /production/report",
      "tier": "read",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can report derived production diagnostics from observable set state.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "GET /project",
      "tier": "read",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can report project structure; Lite projects naturally have lower track/return/content ceilings.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "GET /returns",
      "tier": "read",
      "remoteScriptExpectation": "supported",
      "editionImpact": "Lite exposes up to 2 return tracks; Standard and Suite expose up to 12.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "GET /routing/buses",
      "tier": "read",
      "remoteScriptExpectation": "supported",
      "editionImpact": "Available buses depend on edition I/O limits and the user's audio/MIDI configuration.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "GET /status",
      "tier": "read",
      "remoteScriptExpectation": "supported",
      "editionImpact": "No edition-specific limitation known.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /analysis/audio",
      "tier": "read",
      "remoteScriptExpectation": "local_bridge_only",
      "editionImpact": "No edition-specific limitation; this analyzes a local audio artifact rather than controlling Live.",
      "versionImpact": "Use the development/local bridge path; the Python Remote Script does not need to own local audio analysis."
    },
    {
      "route": "POST /arrangement/insert",
      "tier": "safe-write",
      "remoteScriptExpectation": "unsupported_501",
      "unsupportedStatus": 501,
      "editionImpact": "Edition is not the limiting factor; the current Remote Script lacks a reliable arrangement insertion surface.",
      "versionImpact": "Expected 501 in the current Remote Script on Live 11 and Live 12."
    },
    {
      "route": "POST /arrangement/locators",
      "tier": "safe-write",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can use locators when the Live API exposes cue-point mutation.",
      "versionImpact": "May return 501 when locator creation or update is not exposed."
    },
    {
      "route": "POST /automation",
      "tier": "unsupported",
      "remoteScriptExpectation": "unsupported_501",
      "unsupportedStatus": 501,
      "editionImpact": "Edition is not the limiting factor; reliable cross-version automation envelope writing is unsupported.",
      "versionImpact": "Expected 501 in the current Remote Script on Live 11 and Live 12."
    },
    {
      "route": "POST /clips/consolidate",
      "tier": "destructive",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can consolidate clips only when the target clip and API function are available.",
      "versionImpact": "May return 501 when clip consolidation is unavailable or has an unsupported signature."
    },
    {
      "route": "POST /clips/humanize",
      "tier": "safe-write",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can rewrite MIDI notes when the target clip exists and editable-note APIs are exposed.",
      "versionImpact": "May return 501 when MIDI note rewrite support is unavailable."
    },
    {
      "route": "POST /clips/midi",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can create or replace MIDI clips while respecting Lite track/scene limits.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /clips/quantize",
      "tier": "safe-write",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can rewrite MIDI notes when the target clip exists and editable-note APIs are exposed.",
      "versionImpact": "May return 501 when MIDI note rewrite support is unavailable."
    },
    {
      "route": "POST /devices/load",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "Device, preset, Rack, plug-in, and Max for Live availability differs by Lite, Standard, Suite, installed content, and licenses.",
      "versionImpact": "Expected on Live 11 and Live 12 when the browser item is loadable."
    },
    {
      "route": "POST /devices/load-master",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "Master-device loading depends on installed devices, plug-ins, Packs, and Max for Live licensing.",
      "versionImpact": "Expected on Live 11 and Live 12 when the browser item is loadable."
    },
    {
      "route": "POST /devices/parameter",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can set parameters for devices that exist and expose the parameter.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /devices/reorder",
      "tier": "safe-write",
      "remoteScriptExpectation": "unsupported_501",
      "unsupportedStatus": 501,
      "editionImpact": "Edition is not the limiting factor; reliable device reordering is not exposed by this Remote Script.",
      "versionImpact": "Expected 501 in the current Remote Script on Live 11 and Live 12."
    },
    {
      "route": "POST /groove/apply",
      "tier": "safe-write",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "Groove application depends on MIDI clip edit support and available groove/source material.",
      "versionImpact": "May return 501 when MIDI note rewrite support is unavailable."
    },
    {
      "route": "POST /master/modify",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can modify observable master mixer parameters.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /mastering/analyze-and-apply",
      "tier": "export",
      "remoteScriptExpectation": "unsupported_501",
      "unsupportedStatus": 501,
      "editionImpact": "Edition is not the limiting factor; the current Remote Script does not render/analyze/apply as one operation.",
      "versionImpact": "Expected 501 in the current Remote Script on Live 11 and Live 12."
    },
    {
      "route": "POST /mastering/apply",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "Mastering device choices depend on installed devices, Packs, plug-ins, and Max for Live licensing.",
      "versionImpact": "Expected on Live 11 and Live 12 when requested devices are loadable."
    },
    {
      "route": "POST /mastering/remove-reverb",
      "tier": "destructive",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can remove matching master reverb devices when present.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /midi/import",
      "tier": "unsupported",
      "remoteScriptExpectation": "unsupported_501",
      "unsupportedStatus": 501,
      "editionImpact": "Edition is not the limiting factor; raw bridge MIDI file import is intentionally rejected.",
      "versionImpact": "Expected 501 in the current Remote Script; use the MCP parser path that writes through POST /clips/midi."
    },
    {
      "route": "POST /project/rollback",
      "tier": "destructive",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "Rollback coverage is bounded by what each edition/API exposes; device/plugin state and saved files are not fully restorable.",
      "versionImpact": "Expected on Live 11 and Live 12 within the documented snapshot surface."
    },
    {
      "route": "POST /project/save",
      "tier": "destructive",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can save sets when authorized and the Live API exposes save or save-as.",
      "versionImpact": "May return 501 when save or Save As is not exposed by the running Live API."
    },
    {
      "route": "POST /project/snapshot",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "All editions can create bridge snapshots, but rollback depth is limited to observable/rewritable state.",
      "versionImpact": "Expected on Live 11 and Live 12 within the documented snapshot surface."
    },
    {
      "route": "POST /render/export",
      "tier": "export",
      "remoteScriptExpectation": "unsupported_501",
      "unsupportedStatus": 501,
      "editionImpact": "Edition is not the limiting factor; the current Remote Script must not simulate audio export.",
      "versionImpact": "Expected 501 in the current Remote Script on Live 11 and Live 12."
    },
    {
      "route": "POST /returns/create",
      "tier": "safe-write",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "Lite can have up to 2 return tracks; Standard and Suite can have up to 12.",
      "versionImpact": "May return 501 when the running Live API does not expose return-track creation."
    },
    {
      "route": "POST /returns/modify",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can modify existing return tracks within their return-track limits.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /signature",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "No edition-specific limitation known.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /tempo",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "No edition-specific limitation known.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /tracks/bounce",
      "tier": "export",
      "remoteScriptExpectation": "unsupported_501",
      "unsupportedStatus": 501,
      "editionImpact": "Edition is not the limiting factor; the current Remote Script must not simulate stem or track bounce.",
      "versionImpact": "Expected 501 in the current Remote Script on Live 11 and Live 12."
    },
    {
      "route": "POST /tracks/duplicate",
      "tier": "safe-write",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "Lite can hit the 8-track limit; Standard and Suite are unlimited.",
      "versionImpact": "May return 501 when the running Live API does not expose track duplication."
    },
    {
      "route": "POST /tracks/flatten",
      "tier": "destructive",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions can flatten only when the target track and Live API operation are available.",
      "versionImpact": "May return 501 when the running Live API does not expose flattening."
    },
    {
      "route": "POST /tracks/freeze",
      "tier": "safe-write",
      "remoteScriptExpectation": "host_dependent_501",
      "unsupportedStatus": 501,
      "editionImpact": "All editions support freeze semantics when the target track and API operation are available.",
      "versionImpact": "May return 501 when freeze is not exposed by the running Live API."
    },
    {
      "route": "POST /tracks/midi",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported_with_limits",
      "editionImpact": "Lite can create tracks until the 8-track limit; Standard and Suite are unlimited.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /tracks/modify",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "All editions can modify existing tracks; routing options depend on edition I/O and user configuration.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /transport/start",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "No edition-specific limitation known.",
      "versionImpact": "Expected on Live 11 and Live 12."
    },
    {
      "route": "POST /transport/stop",
      "tier": "safe-write",
      "remoteScriptExpectation": "supported",
      "editionImpact": "No edition-specific limitation known.",
      "versionImpact": "Expected on Live 11 and Live 12."
    }
  ]
}
```
