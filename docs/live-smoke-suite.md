# Live Ableton Smoke Suite

The live smoke suite runs the MCP server against a real local Ableton bridge.
It is separate from the deterministic dry-run and development-bridge tests
because it can observe, and in higher tiers mutate, the open Live set.

## Risk Tiers

| Tier | Script | Mutates Live set | Required gate |
| --- | --- | --- | --- |
| Read-only | `npm run smoke:live:readonly` | No | `ABLETON_LIVE_SMOKE=1` |
| Safe-write | `npm run smoke:live:safe-write` | Minimal idempotent writes | `ABLETON_LIVE_SMOKE=1 ABLETON_LIVE_SMOKE_SAFE_WRITE=1` |
| Destructive | `npm run smoke:live:destructive` | Creates and deletes a return track | `ABLETON_LIVE_SMOKE=1 ABLETON_LIVE_SMOKE_SAFE_WRITE=1 ABLETON_LIVE_SMOKE_DESTRUCTIVE=I_UNDERSTAND_THIS_CAN_MUTATE_OR_DELETE_LIVE_SET` |

All tiers reject `ABLETON_MCP_DRY_RUN=1`. Set `ABLETON_BRIDGE_URL` when the live
bridge is not listening on the default `http://127.0.0.1:9789`.

## Read-only Coverage

The read-only suite calls:

- `ableton_get_status`
- `ableton_get_project`
- `ableton_get_meters`
- `ableton_search_browser`
- `ableton_get_arrangement`
- `ableton_list_returns`
- `ableton_list_buses`
- `ableton_get_device_parameters` when the project reports at least one device

The device-parameter probe is skipped when the open set has no devices. A `501`
from the bridge is reported as unsupported so Live API coverage gaps are visible
without pretending a read succeeded.

## Safe-write Coverage

The safe-write suite runs the read-only checks first, then:

- creates a bridge snapshot labeled `live smoke safe-write checkpoint`
- sets tempo to the currently observed tempo and verifies the observed tempo did
  not change

This tier is intended for a disposable validation set. It avoids transport
changes and avoids adding tracks, clips, locators, devices, or returns.

## Destructive Coverage

The destructive suite runs read-only and safe-write checks first, then creates a
temporary return track and deletes it. If the bridge returns `501` for return
creation, the destructive operation is reported as unsupported and cleanup is
skipped because no return was created.

Only run this tier on a throwaway Live set. Save or close any user work first.

## Examples

Read-only validation:

```sh
ABLETON_LIVE_SMOKE=1 npm run smoke:live:readonly
```

Safe-write validation against an explicit bridge:

```sh
ABLETON_BRIDGE_URL=http://127.0.0.1:9789 \
ABLETON_LIVE_SMOKE=1 \
ABLETON_LIVE_SMOKE_SAFE_WRITE=1 \
npm run smoke:live:safe-write
```

Destructive validation:

```sh
ABLETON_LIVE_SMOKE=1 \
ABLETON_LIVE_SMOKE_SAFE_WRITE=1 \
ABLETON_LIVE_SMOKE_DESTRUCTIVE=I_UNDERSTAND_THIS_CAN_MUTATE_OR_DELETE_LIVE_SET \
npm run smoke:live:destructive
```

Optional timeout override:

```sh
ABLETON_LIVE_SMOKE_RESPONSE_TIMEOUT_MS=30000 ABLETON_LIVE_SMOKE=1 npm run smoke:live:readonly
```
