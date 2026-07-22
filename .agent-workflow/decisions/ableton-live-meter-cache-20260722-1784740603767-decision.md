# Decision ableton-live-meter-cache-20260722: Meter read strategy

- Status: accepted
- Owner: architect

## Context
Live validation showed status.playing=true and audible playback but ten direct /meters samples returned zero. Ableton meter properties are likely not reliable as one-shot direct reads in this runtime unless observed.

## Decision
Use Live output_meter listeners to maintain a cache, and have /meters prefer cached listener values over direct one-shot reads when available.

## Consequences
The Remote Script owns listener lifecycle and exposes cache freshness/metadata; MCP callers still use the same read-only /meters contract.
