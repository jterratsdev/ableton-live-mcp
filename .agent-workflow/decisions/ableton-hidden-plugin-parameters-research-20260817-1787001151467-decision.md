# Decision ableton-hidden-plugin-parameters-research-20260817: Hidden plugin control strategy

- Status: accepted
- Owner: architect

## Context
Official Ableton guidance supports Configure, plugin-native host automation, MIDI learn, and CC-enabled Max for Live workarounds. Vendor docs support SSD5 multi-out and Ample CPC MIDI CC/automation.

## Decision
Use Live Configure/default configurations first; use SSD5 multi-output routing for drum mixing; use plugin-native host automation or MIDI CC with a future Max for Live CC bridge for controls that remain hidden; use Youlean CLI or rendered-file analysis for loudness.

## Consequences
Near-term setup is manual but stable. MCP metadata can be enriched separately. MIDI CC automation requires a new device/endpoint and real-set safety gates. Direct AU/VST attachment and GUI automation are rejected.
