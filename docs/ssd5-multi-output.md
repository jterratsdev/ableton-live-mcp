# SSD5 multi-output routing

The MCP exposes a two-step workflow for routing SSD Sampler 5 outputs into named Ableton Live audio tracks:

1. `ableton_plan_plugin_output_routing` reads an exact source track, exact SSD5 device name, and exact Live source-routing display name or identifier. It never changes the Set.
2. `ableton_apply_plugin_output_routing` accepts the same source identity plus an explicit `routes` array of `{ outputChannel, trackName }` entries. It creates only missing audio tracks, sets Audio From and the exact output channel, selects Monitor In, and returns observed readback.

The apply operation is idempotent only when an existing receiver with the requested name already has the exact routing and Monitor In state. A same-name track with different routing is an error. If any new receiver cannot be configured or verified, every receiver created by that request is deleted in reverse creation order; pre-existing tracks are never rewritten or deleted.

## Read-only discovery bootstrap

Live exposes `available_input_routing_channels` for a receiver's **currently selected** input routing type. The plan tool therefore cannot safely discover SSD5 channel labels when no audio track is already receiving from the SSD5 source. It returns:

```json
{
  "discoveryStatus": "receiver_required",
  "availableOutputChannels": [],
  "receiverRequired": {
    "required": true,
    "reason": "Live exposes plugin output-channel choices only for a receiver's currently selected input routing type."
  }
}
```

In that case, create or reuse one audio track in Live and manually set **Audio From** to the SSD5 source track. Run the plan again; it will then report only the channel labels Live actually exposes. Assign SSD5 mixer pieces to those outputs inside the plugin UI before applying the proposed receiver map.

Routing matching is fail-closed: the source routing type must equal either a Live routing identifier or its exact display name, and output channels must equal exact display names. If a display name resolves to different identifiers, the request fails as ambiguous; an exact identifier can still select its unique source option. A missing source routing type is an error, not a `receiver_required` bootstrap result. No fuzzy matching or inferred channel labels are used.

Automated tests use fake Live objects and do not invoke the running Ableton bridge. Applying to an active Set remains a separate, explicitly approved step after reinstalling/restarting the updated Remote Script and reviewing the proposed map.
