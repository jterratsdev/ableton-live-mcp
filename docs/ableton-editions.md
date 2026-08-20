# Ableton edition capabilities

Verified on 2026-08-18 against Ableton's official edition comparison:

| Edition | Audio + MIDI tracks | MCP behavior |
| --- | ---: | --- |
| Live Lite | 8 | Create/duplicate is rejected before mutation when 8 tracks are already observable. |
| Live Intro | 16 | Create/duplicate is rejected before mutation when 16 tracks are already observable. |
| Live Standard | Unlimited | No bridge-defined track cap; Live remains authoritative. |
| Live Suite | Unlimited | No bridge-defined track cap; Live remains authoritative. |
| Unknown | Unknown | No guessed cap; Live remains authoritative. |

Source: [Ableton's current edition and upgrade comparison](https://www.ableton.com/en/upgrade-live/).
The source URL and verification date are also included in the bridge response.

## Detection and provenance

The documented Live Object Model Application surface exposes Live version methods,
but not a reliable edition field. The Remote Script therefore recognizes an edition
only when its own installation path contains an exact Live application segment such
as `Ableton Live 12 Suite.app`. See the official
[Live Object Model Application reference](https://docs.cycling74.com/apiref/lom/application/).

Detection never chooses an edition merely because that application is installed.
This matters when Lite and Suite coexist: the path of the Remote Script loaded by the
running Live process is the evidence. Nonstandard installations that do not contain
an exact edition segment are reported as `unknown` and do not inherit the Lite cap.

`GET /status` includes `editionCapabilities` with:

- edition name, display name, detection flag, provenance, confidence, evidence, and source;
- observable audio/MIDI track `current`, `maximum`, `remaining`, `finiteLimit`,
  `atLimit`, and `status` values;
- `null` maximum/remaining for Standard, Suite, and unknown rather than a guessed number.

At a verified finite cap, `POST /tracks/midi` and `POST /tracks/duplicate` return HTTP
409 with `errorCode: edition_track_capacity_reached`, the operation name, and the full
capability snapshot. The guard runs before the Live mutation API.

This profile intentionally covers only the audio/MIDI track limit relevant to the
current MCP create/duplicate operations. Device, instrument, Pack, Max for Live,
return-track, scene, and I/O availability are not inferred from the edition name.
