# Decision ableton-session-scene-tempo-signature-20260820: Capability-probed atomic Session scene overrides

- Status: accepted
- Owner: architect

## Context
Scene properties are distinct, may be absent or raise through Live descriptors, disabled values use raw -1 sentinels, proxy objects may be recreated, and partial writes can create invalid Scene override state. The operation must never launch a scene or touch Song tempo, Arrangement markers or envelopes, clips, or transport.

## Decision
Add GET /scenes/tempo-signature-capabilities and POST /scenes/tempo-signature-overrides behind the shared route-capability handshake. Keep MCP and HTTP adapters thin; place strict tagged-action validation in a focused MCP module and defense-in-depth validation, property probes, snapshots, ordered writes, fresh-index readback, reverse journal compensation, and observable rollback verification in focused Node development and Python Live Scene modules. Scene index is authoritative and name is descriptive. Mutation route support is conditional in Remote Script mode and names the read-only probe tool.

## Consequences
Capability discovery performs reads and static descriptor inspection only and never invokes a setter. All requested families preflight together. Writes are tempo then enable and numerator then denominator then enable, with tempo family before signature. Clear changes only the enable flag. Every invoked setter is journaled before invocation and compensated in reverse order; disabled pre-state restores by disabling and verifying -1 because hidden retained values are unknowable. Fresh song.scenes[index] snapshots verify success and rollback, while malformed handshakes and unsupported targets fail closed. Duplicated Python and Node runtime logic is held to one JSON contract by offline parity fixtures.
