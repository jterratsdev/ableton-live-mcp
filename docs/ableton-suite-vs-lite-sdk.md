# Live Suite versus Lite: MCP and SDK capability research

Verified 2026-08-18. This report separates product entitlements from the Live
Object Model (LOM) exposed to Remote Scripts and Max for Live.

## Executive result

Suite does not expose a public Set `save` or `save_as` operation that Lite lacks.
The official `Application` and `Song` LOM function lists contain no Set-save
function. Installing Suite therefore does not justify restoring the removed MCP
save tool.

Suite materially improves capacity and available content, and it includes Max for
Live. It does not give the Remote Script broader access to hidden VST/AU controls:
the shared `Device.parameters` surface still exposes only automatable parameters.

The important unexpected finding is version-related, not edition-related: current
LOM documentation now exposes Arrangement insertion primitives that this bridge
still returns as unsupported. This deserves a separate implementation task.

## Product entitlements

| Capability | Live 12 Lite | Live 12 Suite | Classification | MCP consequence |
| --- | ---: | ---: | --- | --- |
| Audio + MIDI tracks | 8 | Unlimited | Edition entitlement | Suite removes the eight-track host ceiling. |
| Scenes | 16 | Unlimited | Edition entitlement | Session workflows can grow beyond Lite's scene cap. |
| Send/return tracks | 2 | 12 | Edition entitlement | Suite permits larger bus and plugin-output routing layouts. |
| Mono audio inputs | 8 | 256 | Edition entitlement | More physical/input routing choices may be observable. |
| Mono audio outputs | 8 | 256 | Edition entitlement | More hardware/output routing choices may be observable. |
| Software instruments | 5 | 20 on the Lite-inclusive upgrade page | Edition entitlement | Browser inventory and exact native-device loading have many more valid targets. |
| Audio effects | 16 | 58 on the Lite-inclusive upgrade page | Edition entitlement | More native mix/master devices become valid targets. |
| MIDI effects | 10 | 14 | Edition entitlement | More native MIDI processing choices. |
| Packs | 2 | 33 | Edition entitlement | Much larger preset/sample inventory. |
| Factory content | 1.3+ GB | 71+ GB | Edition entitlement | Browser search sees substantially more content. |
| Max for Live | No | Yes | Edition entitlement | Enables purpose-built Max devices as an alternative integration surface. |
| VST2/VST3/AU support | Yes | Yes | Shared feature | Suite does not itself reveal more parameters from the same third-party plugin. |

Primary source: [Ableton's Lite/Intro/Standard/Suite upgrade comparison](https://www.ableton.com/en/upgrade-live/).
The separate [three-edition comparison](https://www.ableton.com/en/live/compare-editions/)
currently lists 21 Suite instruments and 59 audio effects, one more than the
Lite-inclusive page. This report preserves the discrepancy instead of guessing;
the browser inventory in the running installation is authoritative for loadable
items.

## SDK surface findings

| Current MCP concern | Exact documented/installed surface | Classification | Recommendation |
| --- | --- | --- | --- |
| Save current Set / Save As | `Application`: version getters, `get_document`, dialog inspection; `Song`: no `save` or `save_as`. Both installed binaries contain internal `push_live_model` template-save messages, but these are not public LOM calls. | Unsupported public SDK surface | Keep MCP save removed. Do not treat internal binary strings or GUI menu automation as a supported contract. |
| Insert MIDI into Arrangement | `Track.create_midi_clip(start_time, length)` creates an empty Arrangement MIDI clip; `Track.duplicate_clip_to_arrangement(clip, destination_time)` copies an existing clip. Both exact message symbols occur in Lite 12.4.2 and Suite 12.4.3 binaries. | Shared SDK surface, version-gated | Replace the unconditional 501 with capability-probed insertion, note write, full readback, and undo rollback in a separate task. |
| Insert audio into Arrangement | `Track.create_audio_clip(file_path, position)` is documented. Its exact message symbol occurs in installed Suite 12.4.3 but not Lite 12.4.2. | Version/availability unknown; not proven edition-only | Test on equal Live versions or introspect the callable at runtime. Implement only behind an exact callable probe and readback. |
| Delete Arrangement clips | `Track.arrangement_clips` and `Track.delete_clip(clip)` are documented. | Shared SDK surface | Existing exact-plan/readback/undo approach is appropriate and not Suite-specific. |
| Write Arrangement tempo envelope | `Song.tempo` is get/set/observe and `MixerDevice.song_tempo` is a `DeviceParameter`; the LOM has no documented Arrangement automation-envelope breakpoint object or write method. `Scene.tempo` is writable only for Session scenes. | Unsupported public SDK surface | Keep direct tempo set; do not claim breakpoint writing. Scene tempo can model Session changes but is not an Arrangement envelope. |
| Read/write device parameters | `Device.parameters` is a list of `DeviceParameter`; official docs explicitly limit it to automatable parameters. `value` is get/set/observe. `PluginDevice` adds preset selection, not hidden parameter enumeration. | Shared SDK surface | Keep exact exposed-parameter access. Report hidden controls as unavailable rather than edition-limited. |
| Gateway, SSD and similar private mixers | Only controls published by the plugin as automatable parameters are in `Device.parameters`. Plugin-owned internal buses may appear through track routing dictionaries when Live exposes them. | Plugin/host exposure, not edition entitlement | Use exposed parameters plus verified `available_input_routing_*` dictionaries. For missing controls, prefer vendor MIDI/automation, a plugin multi-output receiver layout, or a custom Max for Live wrapper. |
| Native device insertion | `Track.insert_device(device_name, target_index)` exists since Live 12.3, but official docs restrict it to native Live devices and exclude Max for Live devices and plug-ins. | Shared SDK surface plus edition inventory | Suite increases which native names are installed, not the insertion method. Continue exact browser/inventory resolution; never infer availability from edition alone. |
| Track routing and plugin outputs | `available_input_routing_types/channels`, `input_routing_type/channel`, and corresponding output dictionaries are documented get/set surfaces. | Shared SDK surface; available options depend on host, device and edition capacity | Preserve exact identifier matching and fail on ambiguous/unavailable options. Suite's larger return/I/O entitlement allows more layouts but does not synthesize missing plugin channels. |

Official LOM references:

- [Application](https://docs.cycling74.com/apiref/lom/application/)
- [Song](https://docs.cycling74.com/apiref/lom/song/)
- [Track](https://docs.cycling74.com/apiref/lom/track/)
- [Device](https://docs.cycling74.com/apiref/lom/device/)
- [DeviceParameter](https://docs.cycling74.com/apiref/lom/deviceparameter/)
- [PluginDevice](https://docs.cycling74.com/apiref/lom/plugindevice/)

## Installed application evidence

- `/Applications/Ableton Live 12 Lite.app`: 12.4.2.
- `/Applications/Ableton Live 12 Suite.app`: 12.4.3.
- Both applications contain an `AbletonMcpBridge` directory.
- A read-only `GET /status` against the restarted Suite bridge identified Live
  Suite with high confidence, reported four audio/MIDI tracks, and reported the
  track capacity as unlimited. No mutating or save endpoint was called.
- The installed Suite `live_editions.py` hash does not match the current source
  hash. The edition diagnostic is available at runtime, but later source changes
  still require an explicit reinstall/restart before runtime verification.
- Binary symbols are corroborating implementation evidence only. Internal
  `push_live_model` save messages are not a supported LOM API.

## Recommended follow-up order

1. Keep project save absent from MCP.
2. Open a version-gated Arrangement insertion task for MIDI and existing Session
   clips; include undo, exact readback, and a disposable Set test.
3. Probe `Track.create_audio_clip` on matched versions before classifying it as
   version- or edition-dependent.
4. Use Suite's Max for Live entitlement for purpose-built adapters only where a
   plugin offers MIDI, automation, OSC, or another documented control surface.
5. Extend edition diagnostics later for scene and return-track capacity, but do
   not hard-code device availability; query the running browser inventory.
