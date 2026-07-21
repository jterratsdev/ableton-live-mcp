# Bridge Observability

Bridge observability is the diagnostic contract for deciding which runtime is
loaded, which endpoints it claims to support, whether installed Remote Script
files are newer than the running runtime, and what the last bridge error was.

The deterministic JavaScript contract lives in `bridge/observability.js`. The
Remote Script mirror lives in
`ableton_remote_scripts/AbletonMcpBridge/live_observability.py` so diagnostics
can be produced without Ableton-specific imports during local tests.

## Snapshot Shape

```json
{
  "ok": true,
  "schemaVersion": "1.0.0",
  "mode": "deterministic-development-observability",
  "version": {
    "bridgeVersion": "0.1.0",
    "buildHash": "sha256-of-installed-files"
  },
  "process": {
    "pid": 12345,
    "livePid": 67890
  },
  "runtime": {
    "host": "127.0.0.1",
    "port": 9789,
    "startedAt": "2026-07-20T21:00:00.000Z"
  },
  "installedFiles": [
    {
      "path": "/Applications/Ableton Live 12 Suite.app/.../AbletonMcpBridge.py",
      "exists": true,
      "sizeBytes": 15432,
      "mtimeMs": 1784584800000,
      "sha256": "..."
    }
  ],
  "endpointSupport": {
    "count": 48,
    "development": { "supported": 47, "unsupported": 1 },
    "remoteScript": { "supported": 25, "conditional": 14, "unsupported": 9 },
    "endpoints": []
  },
  "lastError": {
    "message": "Ableton Remote Script render export is not supported by this bridge",
    "endpoint": "POST /render/export",
    "statusCode": 501,
    "at": "2026-07-20T21:05:00.000Z"
  },
  "staleRuntime": {
    "status": "stale",
    "isStale": true,
    "reason": "installed Remote Script files are newer than the running bridge runtime"
  }
}
```

## Stale Runtime Diagnosis

Ableton loads MIDI Remote Scripts into Live's Python runtime. Replacing files in
the MIDI Remote Scripts directory while Live is open does not refresh the loaded
Control Surface. Observability compares the runtime start timestamp with the
newest installed Remote Script file timestamp:

- `fresh`: the running bridge started at or after the installed file timestamps.
- `stale`: one or more installed files are newer than the running bridge.
- `unknown`: runtime start time or installed file timestamps are unavailable.

When a user reports an endpoint that should exist but still returns old behavior,
capture observability first. A stale result means the user should restart
Ableton Live before deeper debugging.

## Endpoint Support

Endpoint support is a product contract, not a live probe. `supported` means the
runtime owns the endpoint. `conditional` means the endpoint exists but may return
an explicit `501` or warning when the running Live API does not expose the
required surface. `unsupported` means callers should expect a contract-shaped
failure instead of simulated success.

Render/export endpoints are supported by the deterministic development bridge
for local product tests. The Remote Script marks render export, track bounce,
and mastering analyze-and-apply as unsupported until a safe Live API surface is
confirmed.

## Current Integration Boundary

This task defines deterministic observability data and keeps the JavaScript and
Python endpoint matrices synchronized. Wiring that snapshot to a public HTTP
endpoint or MCP tool requires follow-up edits outside this task's ownership
paths, including the bridge HTTP router, development adapter, Remote Script
request router, MCP bridge action registry, and MCP tool registry.
