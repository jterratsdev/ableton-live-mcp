import { importMidi } from "./midi-import.js";
import {
  classifyEndpointRisk,
  classifyToolRisk,
  listEndpointRiskClassifications,
  listToolRiskClassifications
} from "./risk-policy.js";
import { getWorkflowPlan, listWorkflowPlans } from "./workflow-plans.js";
import { collectInstalledFileMetadata, createBridgeObservabilitySnapshot } from "../bridge/observability.js";
import { matchPresetIntent } from "../bridge/presets/matcher.js";
import { PRESET_CATALOG } from "../bridge/presets/catalog.js";
import { diagnosePlugins } from "./plugin-diagnostics.js";
import { diagnosePlayback } from "./playback-diagnostics.js";
import { analyzeAudioFile, analyzeRenderedMix } from "../bridge/audio-analysis.js";
import {
  createPluginOutputRoutingDispatch,
  pluginOutputRoutingTools,
  validatePluginOutputRoutingToolInput
} from "./plugin-output-routing-tools.js";
import {
  arrangementInsertionTools,
  createArrangementInsertionDispatch,
  validateArrangementInsertionToolInput
} from "./arrangement-insertion.js";
import { MAX_MIDI_CLIP_NOTES } from "./midi-constants.js";
import {
  createSceneTempoSignatureDispatch,
  sceneTempoSignatureTools,
  validateSceneTempoSignatureToolInput
} from "./scene-tempo-signature-tools.js";

export { MAX_MIDI_CLIP_NOTES } from "./midi-constants.js";

export const tools = [
  ...arrangementInsertionTools,
  ...sceneTempoSignatureTools,
  tool("ableton_get_status", "Read Ableton Live transport and session status.", {}),
  tool("ableton_get_project", "Read project structure: tracks, clips, devices, locators, routing, and mixer state.", {}),
  tool("ableton_get_arrangement", "Read arrangement timeline clips, locators, song length, and derived sections.", {}),
  tool("ableton_plan_arrangement_clip_deletion", "Read exact Arrangement clip identities and a short-lived deletion plan token without changing the Set.", {}),
  tool("ableton_delete_arrangement_clips", "Delete only exact Arrangement clips from a current read-only deletion plan and verify each is absent.", {
    planToken: stringProp("Short-lived token returned by ableton_plan_arrangement_clip_deletion."),
    clipIdentities: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: stringProp("Exact clip identity returned by ableton_plan_arrangement_clip_deletion.")
    }
  }, ["planToken", "clipIdentities"]),
  tool("ableton_create_snapshot", "Save a project snapshot before broad edits.", {
    label: stringProp("Human-readable reason for the snapshot.")
  }, ["label"]),
  tool("ableton_rollback_snapshot", "Rollback the project to a previously created bridge snapshot.", {
    snapshotId: stringProp("Snapshot ID returned by ableton_create_snapshot.")
  }, ["snapshotId"]),
  tool("ableton_list_plugins", "List instruments, effects, racks, presets, VSTs, and Audio Units.", {
    kind: enumProp(["instrument", "audio_effect", "midi_effect", "rack", "preset", "vst", "au", "any"], "Optional category filter."),
    query: stringProp("Optional text filter.")
  }),
  tool("ableton_search_browser", "Search Ableton browser items with loadable metadata for presets, samples, racks, grooves, plugins, and Max devices.", {
    kind: enumProp(["instrument", "audio_effect", "midi_effect", "rack", "preset", "sample", "groove", "plugin", "vst", "au", "max_device", "any"], "Optional browser category filter."),
    query: stringProp("Optional text filter."),
    limit: { type: "integer", minimum: 1, maximum: 50 }
  }),
  tool("ableton_diagnose_plugins", "Compare plugins installed on disk against Ableton's indexed plugin/browser results and recommend rescan actions.", {
    query: stringProp("Single plugin search term, such as Valhalla, Youlean, or Kotelnikov."),
    queries: {
      type: "array",
      items: stringProp("Plugin search term.")
    },
    pluginDirectories: {
      type: "array",
      items: stringProp("Additional absolute plugin directory to scan.")
    },
    includeDefaultDirectories: { type: "boolean" }
  }),
  tool("ableton_analyze_audio", "Analyze a rendered audio file for LUFS, true peak, RMS, crest factor, and clipping.", {
    path: stringProp("Absolute local path to a rendered audio file.")
  }, ["path"]),
  tool("ableton_analyze_mix", "Analyze a rendered master and optional stems using verified offline audio measurements.", {
    masterPath: stringProp("Absolute local path to the rendered master audio file."),
    stems: {
      type: "array",
      maxItems: 128,
      items: objectSchema({
        name: stringProp("Unique stem name."),
        path: stringProp("Absolute local path to the rendered stem audio file.")
      }, ["name", "path"])
    }
  }, ["masterPath"]),
  tool("ableton_get_production_report", "Summarize tracks, buses, devices, meters, arrangement, and production risks.", {}),
  tool("ableton_diagnose_playback", "Diagnose silent playback from transport, Session clips, Arrangement clips, meters, routing, mute, and solo state.", {}),
  tool("ableton_get_bridge_observability", "Read local bridge version, endpoint support, stale-runtime, and installed-file diagnostics.", {
    runtimeStartedAt: stringProp("Optional runtime start timestamp for stale runtime diagnosis."),
    livePid: nonNegativeInteger(),
    installedFilePaths: {
      type: "array",
      items: stringProp("Installed Remote Script file path.")
    },
    lastError: { type: "object", additionalProperties: true }
  }),
  tool("ableton_evaluate_action_risk", "Evaluate the risk tier and approval recommendation for a tool or HTTP endpoint.", {
    toolName: stringProp("MCP tool name to classify."),
    route: stringProp("HTTP route such as POST /tracks/modify."),
    method: stringProp("HTTP method when path is provided separately."),
    path: stringProp("HTTP path when method is provided separately.")
  }),
  tool("ableton_list_risk_policy", "List risk classifications for all known MCP tools and bridge HTTP endpoints.", {}),
  tool("ableton_match_preset_intent", "Match a musical intent to local VST, preset, rack, or effect catalog candidates.", {
    intent: stringProp("Musical intent such as realistic violin, concert piano, classical guitar, flute, or concert hall mastering."),
    limit: { type: "integer", minimum: 1, maximum: 20 }
  }, ["intent"]),
  tool("ableton_list_workflow_plans", "List high-level plan-only production workflows and their risk tiers.", {}),
  tool("ableton_get_workflow_plan", "Read a high-level plan-only production workflow by id.", {
    workflowId: stringProp("Workflow id returned by ableton_list_workflow_plans.")
  }, ["workflowId"]),
  tool("ableton_set_tempo", "Set Ableton Live tempo in BPM.", {
    bpm: { type: "number", minimum: 20, maximum: 999 }
  }, ["bpm"]),
  tool("ableton_set_signature", "Set Ableton Live time signature.", {
    numerator: { type: "integer", minimum: 1, maximum: 32 },
    denominator: { type: "integer", enum: [1, 2, 4, 8, 16, 32] }
  }, ["numerator", "denominator"]),
  tool("ableton_start_transport", "Start Ableton Live playback.", {}),
  tool("ableton_stop_transport", "Stop Ableton Live playback.", {}),
  tool("ableton_create_midi_track", "Create a MIDI track in Ableton Live.", {
    name: stringProp("Optional track name."),
    color: stringProp("Optional Ableton color value supported by the bridge.")
  }),
  tool("ableton_duplicate_track", "Duplicate an existing Ableton Live track and return the new track index.", {
    trackIndex: nonNegativeInteger(),
    name: stringProp("Optional name for the duplicated track.")
  }, ["trackIndex"]),
  tool("ableton_freeze_track", "Freeze an Ableton Live track when the bridge exposes a real freeze operation.", {
    trackIndex: nonNegativeInteger()
  }, ["trackIndex"]),
  tool("ableton_flatten_track", "Flatten a frozen Ableton Live track to audio when the bridge exposes a real flatten operation.", {
    trackIndex: nonNegativeInteger()
  }, ["trackIndex"]),
  tool("ableton_modify_track", "Modify track name, color, mixer state, mute/solo/arm, routing, or sends.", {
    trackIndex: nonNegativeInteger(),
    name: { type: "string" },
    color: { type: "string" },
    volumeDb: { type: "number", minimum: -70, maximum: 12 },
    verifyToleranceDb: { type: "number", minimum: 0, maximum: 12 },
    pan: { type: "number", minimum: -1, maximum: 1 },
    muted: { type: "boolean" },
    solo: { type: "boolean" },
    armed: { type: "boolean" },
    sends: { type: "object", additionalProperties: { type: "number" } },
    inputRouting: { type: "string" },
    outputRouting: { type: "string" }
  }, ["trackIndex"]),
  tool("ableton_list_returns", "List Ableton return tracks and their mixer/device state.", {}),
  tool("ableton_create_return_track", "Create an Ableton return track.", {
    name: stringProp("Return track name."),
    returnIndex: nonNegativeInteger()
  }, ["name"]),
  tool("ableton_modify_return", "Modify a return track mixer state.", {
    returnIndex: nonNegativeInteger(),
    name: { type: "string" },
    volumeDb: { type: "number", minimum: -70, maximum: 12 },
    verifyToleranceDb: { type: "number", minimum: 0, maximum: 12 },
    pan: { type: "number", minimum: -1, maximum: 1 },
    muted: { type: "boolean" },
    solo: { type: "boolean" }
  }, ["returnIndex"]),
  tool("ableton_delete_return_track", "Delete an Ableton return track.", {
    returnIndex: nonNegativeInteger()
  }, ["returnIndex"]),
  tool("ableton_list_buses", "List master, return buses, and track routing options.", {}),
  ...pluginOutputRoutingTools,
  tool("ableton_get_meters", "Read observable output meters for tracks, return tracks, and the master channel.", {}),
  tool("ableton_modify_master", "Modify master mixer state such as volume, pan, or cue volume.", {
    volumeDb: { type: "number", minimum: -70, maximum: 12 },
    verifyToleranceDb: { type: "number", minimum: 0, maximum: 12 },
    pan: { type: "number", minimum: -1, maximum: 1 },
    cueVolumeDb: { type: "number", minimum: -70, maximum: 12 },
    muted: { type: "boolean" },
    solo: { type: "boolean" }
  }),
  tool("ableton_create_midi_clip", "Create or replace a MIDI clip with note events.", {
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger(),
    lengthBeats: { type: "number", minimum: 0.25 },
    notes: {
      type: "array",
      maxItems: MAX_MIDI_CLIP_NOTES,
      items: objectSchema({
        pitch: { type: "integer", minimum: 0, maximum: 127 },
        start: { type: "number", minimum: 0 },
        duration: { type: "number", exclusiveMinimum: 0 },
        velocity: { type: "integer", minimum: 1, maximum: 127 }
      }, ["pitch", "start", "duration"])
    }
  }, ["trackIndex", "clipSlotIndex", "lengthBeats", "notes"]),
  tool("ableton_consolidate_clip", "Consolidate a beat range on a track into a new clip where the bridge supports it.", {
    trackIndex: nonNegativeInteger(),
    startBeat: { type: "number", minimum: 0 },
    lengthBeats: { type: "number", exclusiveMinimum: 0 },
    clipSlotIndex: nonNegativeInteger(),
    name: stringProp("Optional name for the consolidated clip.")
  }, ["trackIndex", "startBeat", "lengthBeats"]),
  tool("ableton_delete_clip", "Delete a Session View clip and report whether Live confirms the slot is empty.", {
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger()
  }, ["trackIndex", "clipSlotIndex"]),
  tool("ableton_get_clip_notes", "Read MIDI notes from an existing Ableton Live clip.", {
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger()
  }, ["trackIndex", "clipSlotIndex"]),
  tool("ableton_launch_clip", "Launch a Session View clip so transport can produce audible playback.", {
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger()
  }, ["trackIndex", "clipSlotIndex"]),
  tool("ableton_launch_scene", "Launch a Session View scene by clip slot index.", {
    sceneIndex: nonNegativeInteger()
  }, ["sceneIndex"]),
  tool("ableton_humanize_clip", "Apply deterministic MIDI note humanization to an existing editable clip.", {
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger(),
    timingAmountBeats: { type: "number", minimum: 0, maximum: 0.25 },
    durationAmountBeats: { type: "number", minimum: 0, maximum: 0.5 },
    velocityAmount: { type: "integer", minimum: 0, maximum: 64 },
    seed: stringProp("Optional deterministic seed for repeatable humanization.")
  }, ["trackIndex", "clipSlotIndex"]),
  tool("ableton_quantize_clip", "Quantize MIDI note start times in an existing editable clip.", {
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger(),
    grid: gridProp(),
    strength: { type: "number", minimum: 0, maximum: 1 }
  }, ["trackIndex", "clipSlotIndex", "grid"]),
  tool("ableton_apply_groove", "Apply a measurable swing groove to MIDI note start times in an existing editable clip.", {
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger(),
    grid: gridProp(),
    amount: { type: "number", minimum: 0, maximum: 1 },
    swing: { type: "number", minimum: 0, maximum: 1 }
  }, ["trackIndex", "clipSlotIndex", "amount"]),
  tool("ableton_import_midi", "Import a MIDI file into a target track/clip slot or create tracks from the file.", {
    path: stringProp("Absolute path to a .mid or .midi file."),
    trackIndex: nonNegativeInteger(),
    clipSlotIndex: nonNegativeInteger(),
    createTracks: { type: "boolean" },
    quantize: stringProp("Optional grid such as 1/16.")
  }, ["path"]),
  tool("ableton_load_device", "Load a Live device, preset, plugin, VST, AU, or rack onto a track.", {
    trackIndex: nonNegativeInteger(),
    query: stringProp("Device, preset, plugin, or rack search string."),
    kind: enumProp(["instrument", "audio_effect", "midi_effect", "rack", "preset", "vst", "au", "any"]),
    position: enumProp(["append", "prepend", "replace_instrument"])
  }, ["trackIndex", "query"]),
  tool("ableton_load_master_device", "Load an audio effect, preset, plugin, or rack onto the master track.", {
    query: stringProp("Device, preset, plugin, or rack search string."),
    kind: enumProp(["audio_effect", "rack", "preset", "vst", "au", "any"]),
    position: enumProp(["append", "prepend"]),
    rationale: stringProp("Short reason for the master-chain selection.")
  }, ["query"]),
  tool("ableton_select_vst_for_midi", "Load the LLM-chosen instrument/plugin for a MIDI role after inventory inspection.", {
    trackIndex: nonNegativeInteger(),
    role: stringProp("Musical role such as piano, bass, pad, lead, drums, or strings."),
    query: stringProp("Chosen VST/device/preset search string."),
    rationale: stringProp("Short reason for the selection.")
  }, ["trackIndex", "role", "query"]),
  tool("ableton_set_device_parameter", "Set a device/plugin parameter on a track.", {
    location: deviceLocationSchema(),
    target: enumProp(["track", "return", "master"], "Device chain target."),
    trackIndex: nonNegativeInteger(),
    returnIndex: nonNegativeInteger(),
    deviceIndex: nonNegativeInteger(),
    deviceName: { type: "string" },
    parameter: { type: "string" },
    value: { type: "number" },
    normalizedValue: { type: "number", minimum: 0, maximum: 1 }
  }, ["parameter"]),
  tool("ableton_get_device_parameters", "List parameters exposed by devices on a track, return, or master chain before changing them.", {
    location: deviceLocationSchema(),
    target: enumProp(["track", "return", "master"], "Device chain target."),
    trackIndex: nonNegativeInteger(),
    returnIndex: nonNegativeInteger(),
    deviceIndex: nonNegativeInteger(),
    deviceName: { type: "string" }
  }),
  tool("ableton_reorder_device", "Move a device within a track, return, or master device chain.", {
    location: deviceLocationSchema(),
    deviceIndex: nonNegativeInteger(),
    toIndex: nonNegativeInteger()
  }, ["location", "deviceIndex", "toIndex"]),
  tool("ableton_delete_device", "Delete a device from a track, return, or master device chain.", {
    location: deviceLocationSchema(),
    deviceIndex: nonNegativeInteger()
  }, ["location", "deviceIndex"]),
  tool("ableton_set_automation", "Write automation points for mixer, device, or tempo targets.", {
    trackIndex: nonNegativeInteger(),
    target: stringProp("Target such as volume, pan, device:0:filter_freq, or tempo."),
    points: {
      type: "array",
      items: objectSchema({
        beat: { type: "number", minimum: 0 },
        value: {}
      }, ["beat", "value"])
    }
  }, ["target", "points"]),
  tool("ableton_apply_mastering_chain", "Apply or update a mastering chain on the master channel.", {
    style: stringProp("Mastering style such as transparent, loud, warm, cinematic, or club."),
    targetLufs: { type: "number", minimum: -24, maximum: -5 },
    truePeakDb: { type: "number", minimum: -6, maximum: 0 },
    referencePath: { type: "string" },
    chain: {
      type: "array",
      items: objectSchema({
        device: { type: "string" },
        kind: enumProp(["audio_effect", "rack", "preset", "vst", "au", "any"]),
        settings: { type: "object", additionalProperties: true }
      }, ["device"])
    },
    mode: enumProp(["replace_matching", "replace_all", "append"], "Master-chain application mode. Defaults to replace_matching.")
  }),
  tool("ableton_export_render", "Export a master render, selected tracks, all tracks, or stems.", {
    outputPath: stringProp("Absolute output file path or directory for stems."),
    scope: enumProp(["master", "selected_tracks", "all_tracks", "stems"]),
    startBeat: { type: "number", minimum: 0 },
    lengthBeats: { type: "number", minimum: 0 },
    sampleRate: { type: "integer", enum: [44100, 48000, 88200, 96000, 192000] },
    bitDepth: { type: "integer", enum: [16, 24, 32] },
    normalize: { type: "boolean" },
    includeReturnTracks: { type: "boolean" },
    trackIndices: { type: "array", items: nonNegativeInteger() }
  }, ["outputPath", "scope"]),
  tool("ableton_bounce_tracks", "Bounce selected tracks or stems into audio artifacts for production review.", {
    outputPath: stringProp("Absolute output directory for stems or WAV path for single render."),
    trackIndices: { type: "array", items: nonNegativeInteger() },
    scope: enumProp(["selected_tracks", "all_tracks", "stems"]),
    startBeat: { type: "number", minimum: 0 },
    lengthBeats: { type: "number", minimum: 0 },
    sampleRate: { type: "integer", enum: [44100, 48000, 88200, 96000, 192000] },
    bitDepth: { type: "integer", enum: [16, 24, 32] },
    normalize: { type: "boolean" },
    includeReturnTracks: { type: "boolean" }
  }, ["outputPath"]),
  tool("ableton_analyze_and_apply_mastering", "Render, analyze, and apply deterministic mastering adjustments to the master chain.", {
    outputPath: stringProp("Absolute WAV path for the analysis render."),
    targetLufs: { type: "number", minimum: -24, maximum: -5 },
    truePeakDb: { type: "number", minimum: -6, maximum: 0 },
    startBeat: { type: "number", minimum: 0 },
    lengthBeats: { type: "number", minimum: 0 },
    sampleRate: { type: "integer", enum: [44100, 48000, 88200, 96000, 192000] },
    bitDepth: { type: "integer", enum: [16, 24, 32] },
    chain: {
      type: "array",
      items: objectSchema({
        device: { type: "string" },
        settings: { type: "object", additionalProperties: true }
      }, ["device"])
    }
  }, ["targetLufs", "truePeakDb"]),
  tool("ableton_add_locator", "Add or update an arrangement locator/marker.", {
    beat: { type: "number", minimum: 0 },
    name: { type: "string" }
  }, ["beat", "name"])
];

export function createDispatch(bridge, options = {}) {
  const resolveCapabilities = options.resolveCapabilities;
  return {
    ...createPluginOutputRoutingDispatch(bridge),
    ...createArrangementInsertionDispatch(bridge),
    ...createSceneTempoSignatureDispatch(bridge),
    ableton_get_status: () => bridge.invoke("get_status"),
    ableton_get_project: async () => annotateProjectMixerContract(await bridge.invoke("get_project")),
    ableton_get_arrangement: () => bridge.invoke("get_arrangement"),
    ableton_plan_arrangement_clip_deletion: () => bridge.invoke("plan_arrangement_clip_deletion"),
    ableton_delete_arrangement_clips: (args) => bridge.invoke("delete_arrangement_clips", args),
    ableton_create_snapshot: (args) => bridge.invoke("create_snapshot", args),
    ableton_rollback_snapshot: (args) => bridge.invoke("rollback_snapshot", args),
    ableton_list_plugins: (args) => bridge.invoke("list_plugins", args),
    ableton_search_browser: (args) => bridge.invoke("search_browser", args),
    ableton_diagnose_plugins: (args) => diagnosePlugins(bridge, args),
    ableton_analyze_audio: (args) => bridge.dryRun ? bridge.invoke("analyze_audio", args) : analyzeAudioFile(args),
    ableton_analyze_mix: (args) => bridge.dryRun ? bridge.invoke("analyze_mix", args) : analyzeRenderedMix(args),
    ableton_get_production_report: async () => annotateProductionReport(await bridge.invoke("get_production_report")),
    ableton_diagnose_playback: () => diagnosePlayback(bridge),
    ableton_get_bridge_observability: (args) => getBridgeObservability(args),
    ableton_evaluate_action_risk: (args) => evaluateRisk(args),
    ableton_list_risk_policy: () => ({
      ok: true,
      tools: listToolRiskClassifications(),
      endpoints: listEndpointRiskClassifications()
    }),
    ableton_match_preset_intent: async (args) => {
      const inventory = await resolvePresetCatalogInventory(bridge);
      return matchPresetIntent(args.intent, { limit: args.limit, inventory });
    },
    ableton_list_workflow_plans: async () => {
      const capabilityView = resolveCapabilities ? await resolveCapabilities() : undefined;
      const workflows = listWorkflowPlans(capabilityView);
      return { ok: true, count: workflows.length, workflows };
    },
    ableton_get_workflow_plan: async (args) => ({
      ok: true,
      workflow: getWorkflowPlan(args.workflowId, resolveCapabilities ? await resolveCapabilities() : undefined)
    }),
    ableton_set_tempo: (args) => bridge.invoke("set_tempo", { bpm: args.bpm }),
    ableton_set_signature: (args) => bridge.invoke("set_signature", {
      numerator: args.numerator,
      denominator: args.denominator
    }),
    ableton_start_transport: () => bridge.invoke("start_transport"),
    ableton_stop_transport: () => bridge.invoke("stop_transport"),
    ableton_create_midi_track: (args) => bridge.invoke("create_midi_track", args),
    ableton_duplicate_track: (args) => bridge.invoke("duplicate_track", args),
    ableton_freeze_track: (args) => bridge.invoke("freeze_track", args),
    ableton_flatten_track: (args) => bridge.invoke("flatten_track", args),
    ableton_modify_track: (args) => bridge.invoke("modify_track", args),
    ableton_list_returns: () => bridge.invoke("list_returns"),
    ableton_create_return_track: (args) => bridge.invoke("create_return", args),
    ableton_modify_return: (args) => bridge.invoke("modify_return", args),
    ableton_delete_return_track: (args) => bridge.invoke("delete_return", {
      returnIndex: args.returnIndex
    }),
    ableton_list_buses: () => bridge.invoke("list_buses"),
    ableton_get_meters: () => bridge.invoke("get_meters"),
    ableton_modify_master: (args) => bridge.invoke("modify_master", args),
    ableton_create_midi_clip: (args) => bridge.invoke("create_midi_clip", normalizeClipArgs(args)),
    ableton_consolidate_clip: (args) => bridge.invoke("consolidate_clip", args),
    ableton_delete_clip: (args) => bridge.invoke("delete_clip", {
      trackIndex: args.trackIndex,
      clipSlotIndex: args.clipSlotIndex
    }),
    ableton_get_clip_notes: (args) => bridge.invoke("get_clip_notes", {
      trackIndex: args.trackIndex,
      clipSlotIndex: args.clipSlotIndex
    }),
    ableton_launch_clip: (args) => bridge.invoke("launch_clip", args),
    ableton_launch_scene: (args) => bridge.invoke("launch_scene", args),
    ableton_humanize_clip: (args) => bridge.invoke("humanize_clip", args),
    ableton_quantize_clip: (args) => bridge.invoke("quantize_clip", args),
    ableton_apply_groove: (args) => bridge.invoke("apply_groove", args),
    ableton_import_midi: (args) => importMidi(bridge, args),
    ableton_load_device: (args) => bridge.invoke("load_device", args),
    ableton_load_master_device: (args) => bridge.invoke("load_master_device", args),
    ableton_get_device_parameters: (args) => bridge.invoke("get_device_parameters", deviceParameterArgs(args)),
    ableton_reorder_device: (args) => bridge.invoke("reorder_device", args),
    ableton_delete_device: (args) => bridge.invoke("delete_device", args),
    ableton_select_vst_for_midi: (args) => bridge.invoke("load_device", {
      trackIndex: args.trackIndex,
      query: args.query,
      kind: "instrument",
      position: "replace_instrument",
      role: args.role,
      rationale: args.rationale
    }),
    ableton_set_device_parameter: (args) => bridge.invoke("set_device_parameter", args),
    ableton_set_automation: (args) => bridge.invoke("set_automation", args),
    ableton_apply_mastering_chain: (args) => bridge.invoke("apply_mastering_chain", args),
    ableton_export_render: (args) => bridge.invoke("export_render", args),
    ableton_bounce_tracks: (args) => bridge.invoke("bounce_tracks", args),
    ableton_analyze_and_apply_mastering: (args) => bridge.invoke("analyze_and_apply_mastering", args),
    ableton_add_locator: (args) => bridge.invoke("add_locator", args)
  };
}

async function resolvePresetCatalogInventory(bridge) {
  const searches = await Promise.all(PRESET_CATALOG.map(async (entry) => {
    const result = await bridge.invoke("search_browser", {
      kind: entry.load.kind,
      query: entry.load.query,
      limit: 1
    });
    return Array.isArray(result?.results) ? result.results : [];
  }));
  return searches.flat();
}

export function validateToolInput(toolName, args) {
  validatePluginOutputRoutingToolInput(toolName, args);
  if (validateArrangementInsertionToolInput(toolName, args)) {
    return;
  }
  if (validateSceneTempoSignatureToolInput(toolName, args)) {
    return;
  }
  if (toolName === "ableton_set_tempo" && !isNumberInRange(args.bpm, 20, 999)) {
    throw rpcError(-32602, "bpm must be a number between 20 and 999");
  }

  if (toolName === "ableton_create_snapshot" && isBlank(args.label)) {
    throw rpcError(-32602, "label must be a non-empty string");
  }

  if (toolName === "ableton_rollback_snapshot" && isBlank(args.snapshotId)) {
    throw rpcError(-32602, "snapshotId must be a non-empty string");
  }

  if (toolName === "ableton_search_browser" && args.limit !== undefined) {
    requireIntegerInRange(args.limit, "limit", 1, 50);
  }

  if (toolName === "ableton_diagnose_plugins") {
    if (args.queries !== undefined && !Array.isArray(args.queries)) {
      throw rpcError(-32602, "queries must be an array");
    }
    if (args.pluginDirectories !== undefined && !Array.isArray(args.pluginDirectories)) {
      throw rpcError(-32602, "pluginDirectories must be an array");
    }
    for (const [index, directory] of (args.pluginDirectories ?? []).entries()) {
      if (isBlank(directory) || !String(directory).startsWith("/")) {
        throw rpcError(-32602, `pluginDirectories[${index}] must be an absolute local directory path`);
      }
    }
  }

  if (toolName === "ableton_analyze_audio") {
    if (isBlank(args.path)) {
      throw rpcError(-32602, "path must be a non-empty absolute local file path");
    }
    if (!args.path.startsWith("/")) {
      throw rpcError(-32602, "path must be an absolute local file path");
    }
    if (!/\.(wav|aif|aiff|flac|mp3|m4a|aac)$/i.test(args.path)) {
      throw rpcError(-32602, "path must point to a supported audio file");
    }
  }

  if (toolName === "ableton_analyze_mix") {
    validateAudioFilePath(args.masterPath, "masterPath");
    if (args.stems !== undefined && !Array.isArray(args.stems)) {
      throw rpcError(-32602, "stems must be an array");
    }
    if ((args.stems?.length ?? 0) > 128) {
      throw rpcError(-32602, "stems must contain at most 128 files");
    }
    const names = new Set();
    for (const [index, stem] of (args.stems ?? []).entries()) {
      if (!stem || typeof stem !== "object" || Array.isArray(stem) || isBlank(stem.name)) {
        throw rpcError(-32602, `stems[${index}].name must be a non-empty string`);
      }
      if (names.has(stem.name.trim())) {
        throw rpcError(-32602, `stems contains duplicate name: ${stem.name.trim()}`);
      }
      names.add(stem.name.trim());
      validateAudioFilePath(stem.path, `stems[${index}].path`);
    }
  }

  if (toolName === "ableton_match_preset_intent") {
    if (isBlank(args.intent)) {
      throw rpcError(-32602, "intent must be a non-empty string");
    }
    if (args.limit !== undefined) {
      requireIntegerInRange(args.limit, "limit", 1, 20);
    }
  }

  if (toolName === "ableton_get_workflow_plan" && isBlank(args.workflowId)) {
    throw rpcError(-32602, "workflowId must be a non-empty string");
  }

  if (toolName === "ableton_delete_arrangement_clips") {
    if (isBlank(args.planToken)) {
      throw rpcError(-32602, "planToken must be a non-empty string");
    }
    if (!Array.isArray(args.clipIdentities) || args.clipIdentities.length === 0) {
      throw rpcError(-32602, "clipIdentities must be a non-empty array");
    }
    if (args.clipIdentities.some((identity) => isBlank(identity))) {
      throw rpcError(-32602, "clipIdentities must contain only non-empty strings");
    }
    if (new Set(args.clipIdentities).size !== args.clipIdentities.length) {
      throw rpcError(-32602, "clipIdentities must not contain duplicates");
    }
  }

  if (toolName === "ableton_get_bridge_observability" && args.installedFilePaths !== undefined) {
    if (!Array.isArray(args.installedFilePaths)) {
      throw rpcError(-32602, "installedFilePaths must be an array");
    }
    for (const [index, filePath] of args.installedFilePaths.entries()) {
      if (isBlank(filePath)) {
        throw rpcError(-32602, `installedFilePaths[${index}] must be a non-empty string`);
      }
    }
  }

  if (toolName === "ableton_evaluate_action_risk" && !args.toolName && !args.route && !(args.method && args.path)) {
    throw rpcError(-32602, "toolName, route, or method and path are required");
  }

  if (toolName === "ableton_set_signature") {
    requireIntegerInRange(args.numerator, "numerator", 1, 32);
    if (![1, 2, 4, 8, 16, 32].includes(args.denominator)) {
      throw rpcError(-32602, "denominator must be one of 1, 2, 4, 8, 16, or 32");
    }
  }

  if (toolName === "ableton_create_midi_clip") {
    validateMidiClipArgs(args);
  }

  if (toolName === "ableton_consolidate_clip") {
    validateConsolidateClipArgs(args);
  }

  if (["ableton_delete_clip", "ableton_get_clip_notes", "ableton_launch_clip", "ableton_humanize_clip", "ableton_quantize_clip", "ableton_apply_groove"].includes(toolName)) {
    requireTrackIndex(args);
    requireNonNegativeInteger(args.clipSlotIndex, "clipSlotIndex");
  }

  if (toolName === "ableton_launch_scene") {
    requireNonNegativeInteger(args.sceneIndex, "sceneIndex");
  }

  if (toolName === "ableton_humanize_clip") {
    if (args.timingAmountBeats !== undefined) {
      requireNumberInRange(args.timingAmountBeats, "timingAmountBeats", 0, 0.25);
    }
    if (args.durationAmountBeats !== undefined) {
      requireNumberInRange(args.durationAmountBeats, "durationAmountBeats", 0, 0.5);
    }
    if (args.velocityAmount !== undefined) {
      requireIntegerInRange(args.velocityAmount, "velocityAmount", 0, 64);
    }
    if (args.seed !== undefined && isBlank(String(args.seed))) {
      throw rpcError(-32602, "seed must not be blank when provided");
    }
  }

  if (toolName === "ableton_quantize_clip") {
    requireGrid(args.grid);
    if (args.strength !== undefined) {
      requireNumberInRange(args.strength, "strength", 0, 1);
    }
  }

  if (toolName === "ableton_apply_groove") {
    if (args.grid !== undefined) {
      requireGrid(args.grid);
    }
    requireNumberInRange(args.amount, "amount", 0, 1);
    if (args.swing !== undefined) {
      requireNumberInRange(args.swing, "swing", 0, 1);
    }
  }

  if (toolName === "ableton_import_midi" && (isBlank(args.path) || !/\.(mid|midi)$/i.test(args.path))) {
    throw rpcError(-32602, "path must point to a .mid or .midi file");
  }

  if (["ableton_modify_track", "ableton_duplicate_track", "ableton_freeze_track", "ableton_flatten_track", "ableton_load_device", "ableton_select_vst_for_midi"].includes(toolName)) {
    requireTrackIndex(args);
  }

  if (["ableton_duplicate_track", "ableton_consolidate_clip"].includes(toolName) && args.name !== undefined && isBlank(args.name)) {
    throw rpcError(-32602, "name must be a non-empty string when provided");
  }

  if (toolName === "ableton_create_return_track" && isBlank(args.name)) {
    throw rpcError(-32602, "name must be a non-empty string");
  }

  if (toolName === "ableton_create_return_track" && args.returnIndex !== undefined) {
    requireNonNegativeInteger(args.returnIndex, "returnIndex");
  }

  if (["ableton_modify_return", "ableton_delete_return_track"].includes(toolName)) {
    requireNonNegativeInteger(args.returnIndex, "returnIndex");
  }

  if (toolName === "ableton_modify_master") {
    validateMixerArgs(args, { allowCueVolume: true });
  }

  if (["ableton_load_device", "ableton_select_vst_for_midi"].includes(toolName) && isBlank(args.query)) {
    throw rpcError(-32602, "query must be a non-empty string");
  }

  if (toolName === "ableton_load_master_device" && isBlank(args.query)) {
    throw rpcError(-32602, "query must be a non-empty string");
  }

  if (toolName === "ableton_set_device_parameter" && isBlank(args.parameter)) {
    throw rpcError(-32602, "parameter must be a non-empty string");
  }

  if (["ableton_set_device_parameter", "ableton_get_device_parameters"].includes(toolName)) {
    validateDeviceParameterTarget(args);
  }

  if (toolName === "ableton_delete_device") {
    validateDeviceChainArgs(args);
    requireNonNegativeInteger(args.deviceIndex, "deviceIndex");
  }

  if (toolName === "ableton_reorder_device") {
    validateDeviceChainArgs(args);
    requireNonNegativeInteger(args.deviceIndex, "deviceIndex");
    requireNonNegativeInteger(args.toIndex, "toIndex");
    if (args.deviceIndex === args.toIndex) {
      throw rpcError(-32602, "toIndex must be different from deviceIndex");
    }
  }

  if (toolName === "ableton_set_automation") {
    validateAutomationArgs(args);
  }

  if (toolName === "ableton_export_render") {
    if (isBlank(args.outputPath)) {
      throw rpcError(-32602, "outputPath must be a non-empty string");
    }
    if (!["master", "selected_tracks", "all_tracks", "stems"].includes(args.scope)) {
      throw rpcError(-32602, "scope must be master, selected_tracks, all_tracks, or stems");
    }
    if (args.trackIndices !== undefined && !Array.isArray(args.trackIndices)) {
      throw rpcError(-32602, "trackIndices must be an array");
    }
  }

  if (toolName === "ableton_bounce_tracks") {
    if (isBlank(args.outputPath)) {
      throw rpcError(-32602, "outputPath must be a non-empty string");
    }
    if (args.scope !== undefined && !["selected_tracks", "all_tracks", "stems"].includes(args.scope)) {
      throw rpcError(-32602, "scope must be selected_tracks, all_tracks, or stems");
    }
    if (args.trackIndices !== undefined && !Array.isArray(args.trackIndices)) {
      throw rpcError(-32602, "trackIndices must be an array");
    }
  }

  if (toolName === "ableton_analyze_and_apply_mastering") {
    requireNumberInRange(args.targetLufs, "targetLufs", -24, -5);
    requireNumberInRange(args.truePeakDb, "truePeakDb", -6, 0);
    if (args.outputPath !== undefined && isBlank(args.outputPath)) {
      throw rpcError(-32602, "outputPath must be a non-empty string");
    }
  }

  if (toolName === "ableton_apply_mastering_chain" && args.mode !== undefined && !["replace_matching", "replace_all", "append"].includes(args.mode)) {
    throw rpcError(-32602, "mode must be replace_matching, replace_all, or append");
  }

  if (toolName === "ableton_add_locator") {
    requireNumberInRange(args.beat, "beat", 0, Number.POSITIVE_INFINITY);
    if (isBlank(args.name)) {
      throw rpcError(-32602, "name must be a non-empty string");
    }
  }
}

function annotateProjectMixerContract(project) {
  if (!project || typeof project !== "object" || project.mixerContract) {
    return project;
  }
  const tracks = Array.isArray(project.tracks) ? project.tracks : [];
  const legacyVolumeDbTracks = tracks.filter((track) => (
    track &&
    typeof track.volumeDb === "number" &&
    track.volumeRaw === undefined &&
    track.volumeDisplay === undefined &&
    track.volumeDb >= 0 &&
    track.volumeDb <= 1
  ));
  const legacySendsTracks = tracks.filter((track) => track?.sends && track.sendsRaw === undefined && track.sendsDb === undefined);
  return {
    ...project,
    mixerContract: {
      version: "unknown",
      safeForAutomatedMixing: false,
      legacyRawVolumeDbSuspected: legacyVolumeDbTracks.length > 0,
      legacyRawSendsSuspected: legacySendsTracks.length > 0,
      message: "This bridge did not report mixerContract. Treat volumeDb and sends readback as unsafe for automated write reuse until the Ableton Remote Script is reinstalled and restarted."
    },
    mixerWarnings: [
      ...(project.mixerWarnings ?? []),
      "Unsafe mixer readback contract: do not copy volumeDb or sends from this /project response into write endpoints."
    ]
  };
}

function annotateProductionReport(report) {
  if (!report || typeof report !== "object") {
    return report;
  }
  const project = report.project ? annotateProjectMixerContract(report.project) : report.project;
  const mixerContract = report.mixerContract ?? project?.mixerContract ?? {
    version: "unknown",
    safeForAutomatedMixing: false,
    message: "This production report did not include mixerContract. Read /project and verify safeForAutomatedMixing before automated mixer writes."
  };
  const productionWarnings = [
    ...(report.productionWarnings ?? []),
    ...(mixerContract.safeForAutomatedMixing === true ? [] : ["Unsafe or unknown mixer readback contract in production report."])
  ];
  return {
    ...report,
    ...(project ? { project } : {}),
    mixerContract,
    endpointSupport: report.endpointSupport ?? createBridgeObservabilitySnapshot().endpointSupport,
    ...(productionWarnings.length > 0 ? { productionWarnings } : {})
  };
}

function deviceParameterArgs(args = {}) {
  const location = args.location ?? {
    target: args.target ?? (args.returnIndex !== undefined ? "return" : args.trackIndex !== undefined ? "track" : undefined),
    trackIndex: args.trackIndex,
    returnIndex: args.returnIndex
  };
  return {
    target: location.target,
    trackIndex: location.trackIndex,
    returnIndex: location.returnIndex,
    deviceIndex: args.deviceIndex,
    deviceName: args.deviceName
  };
}

async function getBridgeObservability(args = {}) {
  const installedFiles = Array.isArray(args.installedFilePaths)
    ? await collectInstalledFileMetadata(args.installedFilePaths)
    : [];

  return createBridgeObservabilitySnapshot({
    runtimeStartedAt: args.runtimeStartedAt,
    livePid: args.livePid,
    installedFiles,
    lastError: args.lastError
  });
}

function evaluateRisk(args = {}) {
  if (args.toolName) {
    return { ok: true, risk: classifyToolRisk(args.toolName) };
  }
  if (args.route) {
    return { ok: true, risk: classifyEndpointRisk(args.route) };
  }
  return { ok: true, risk: classifyEndpointRisk(args.method, args.path) };
}

export function rpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validateMidiClipArgs(args) {
  requireTrackIndex(args);
  requireNonNegativeInteger(args.clipSlotIndex, "clipSlotIndex");
  if (!isNumberInRange(args.lengthBeats, 0.25, Number.POSITIVE_INFINITY)) {
    throw rpcError(-32602, "lengthBeats must be at least 0.25");
  }
  if (!Array.isArray(args.notes) || args.notes.length === 0) {
    throw rpcError(-32602, "notes must be a non-empty array");
  }
  if (args.notes.length > MAX_MIDI_CLIP_NOTES) {
    throw rpcError(-32602, `notes must contain at most ${MAX_MIDI_CLIP_NOTES} items`);
  }

  args.notes.forEach((note, index) => validateMidiNote(note, index));
}

function validateConsolidateClipArgs(args) {
  requireTrackIndex(args);
  requireNumberInRange(args.startBeat, "startBeat", 0, Number.POSITIVE_INFINITY);
  requirePositiveNumber(args.lengthBeats, "lengthBeats");
  if (args.clipSlotIndex !== undefined) {
    requireNonNegativeInteger(args.clipSlotIndex, "clipSlotIndex");
  }
}

function validateAutomationArgs(args) {
  if (isBlank(args.target)) {
    throw rpcError(-32602, "target must be a non-empty string");
  }
  const target = args.target.trim();
  if (target !== "tempo") {
    requireTrackIndex(args);
  }
  if (!isAutomationTarget(target)) {
    throw rpcError(-32602, "target must be volume, pan, tempo, send:<name>, or device:<deviceIndex>:<parameter>");
  }
  if (!Array.isArray(args.points) || args.points.length === 0) {
    throw rpcError(-32602, "points must be a non-empty array");
  }
  args.points.forEach((point, index) => {
    if (typeof point !== "object" || point === null || Array.isArray(point)) {
      throw rpcError(-32602, `points[${index}] must be an object`);
    }
    requireNumberInRange(point.beat, `points[${index}].beat`, 0, Number.POSITIVE_INFINITY);
    if (typeof point.value !== "number" || !Number.isFinite(point.value)) {
      throw rpcError(-32602, `points[${index}].value must be a finite number`);
    }
  });
}

function isAutomationTarget(target) {
  if (["volume", "pan", "tempo"].includes(target)) {
    return true;
  }
  if (target.startsWith("send:")) {
    return target.slice("send:".length).trim() !== "";
  }
  if (target.startsWith("device:")) {
    const parts = target.split(":");
    return parts.length >= 3 && /^\d+$/.test(parts[1]) && parts.slice(2).join(":").trim() !== "";
  }
  return false;
}

function validateMixerArgs(args, options = {}) {
  if (args.volumeDb !== undefined) {
    requireNumberInRange(args.volumeDb, "volumeDb", -70, 12);
  }
  if (args.pan !== undefined) {
    requireNumberInRange(args.pan, "pan", -1, 1);
  }
  if (options.allowCueVolume && args.cueVolumeDb !== undefined) {
    requireNumberInRange(args.cueVolumeDb, "cueVolumeDb", -70, 12);
  }
  if (args.verifyToleranceDb !== undefined) {
    requireNumberInRange(args.verifyToleranceDb, "verifyToleranceDb", 0, 12);
  }
}

function validateMidiNote(note, index) {
  if (typeof note !== "object" || note === null || Array.isArray(note)) {
    throw rpcError(-32602, `notes[${index}] must be an object`);
  }
  requireIntegerInRange(note.pitch, `notes[${index}].pitch`, 0, 127);
  requireNumberInRange(note.start, `notes[${index}].start`, 0, Number.POSITIVE_INFINITY);
  requirePositiveNumber(note.duration, `notes[${index}].duration`);

  if (note.velocity !== undefined) {
    requireIntegerInRange(note.velocity, `notes[${index}].velocity`, 1, 127);
  }
}

function normalizeClipArgs(args) {
  return {
    trackIndex: args.trackIndex,
    clipSlotIndex: args.clipSlotIndex,
    lengthBeats: args.lengthBeats,
    notes: args.notes.map((note) => ({
      pitch: note.pitch,
      start: note.start,
      duration: note.duration,
      velocity: note.velocity ?? 100
    }))
  };
}

function tool(name, description, properties, required = []) {
  return {
    name,
    description,
    inputSchema: objectSchema(properties, required)
  };
}

function objectSchema(properties, required = []) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
}

function deviceLocationSchema() {
  return objectSchema({
    target: enumProp(["track", "return", "master"], "Device chain target."),
    trackIndex: nonNegativeInteger(),
    returnIndex: nonNegativeInteger()
  }, ["target"]);
}

function stringProp(description) {
  return { type: "string", description };
}

function enumProp(values, description) {
  return { type: "string", enum: values, description };
}

function gridProp() {
  return enumProp(["1/4", "1/8", "1/16", "1/32", "1/64"], "Timing grid.");
}

function nonNegativeInteger() {
  return { type: "integer", minimum: 0 };
}

function requireTrackIndex(args) {
  requireNonNegativeInteger(args.trackIndex, "trackIndex");
}

function validateDeviceChainArgs(args) {
  if (typeof args.location !== "object" || args.location === null || Array.isArray(args.location)) {
    throw rpcError(-32602, "location must be an object");
  }
  if (!["track", "return", "master"].includes(args.location.target)) {
    throw rpcError(-32602, "location.target must be track, return, or master");
  }
  if (args.location.target === "track") {
    requireNonNegativeInteger(args.location.trackIndex, "trackIndex");
  }
  if (args.location.target === "return") {
    requireNonNegativeInteger(args.location.returnIndex, "returnIndex");
  }
}

function validateDeviceParameterTarget(args) {
  if (args.location !== undefined) {
    validateDeviceChainArgs(args);
    if (args.location.target === "track") {
      requireNonNegativeInteger(args.location.trackIndex, "trackIndex");
    }
    if (args.location.target === "return") {
      requireNonNegativeInteger(args.location.returnIndex, "returnIndex");
    }
  } else {
    const target = args.target ?? (args.returnIndex !== undefined ? "return" : args.trackIndex !== undefined ? "track" : "track");
    if (!["track", "return", "master"].includes(target)) {
      throw rpcError(-32602, "target must be track, return, or master");
    }
    if (target === "track") {
      requireNonNegativeInteger(args.trackIndex, "trackIndex");
    }
    if (target === "return") {
      requireNonNegativeInteger(args.returnIndex, "returnIndex");
    }
  }
  if (args.trackIndex !== undefined) {
    requireNonNegativeInteger(args.trackIndex, "trackIndex");
  }
  if (args.returnIndex !== undefined) {
    requireNonNegativeInteger(args.returnIndex, "returnIndex");
  }
  if (args.deviceIndex !== undefined) {
    requireNonNegativeInteger(args.deviceIndex, "deviceIndex");
  }
}

function requireNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw rpcError(-32602, `${name} must be a non-negative integer`);
  }
}

function requireIntegerInRange(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw rpcError(-32602, `${name} must be an integer between ${min} and ${max}`);
  }
}

function requireNumberInRange(value, name, min, max) {
  if (!isNumberInRange(value, min, max)) {
    throw rpcError(-32602, `${name} must be a number between ${min} and ${max}`);
  }
}

function requireGrid(value) {
  if (!["1/4", "1/8", "1/16", "1/32", "1/64"].includes(value)) {
    throw rpcError(-32602, "grid must be one of 1/4, 1/8, 1/16, 1/32, or 1/64");
  }
}

function requirePositiveNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw rpcError(-32602, `${name} must be a number greater than 0`);
  }
}

function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

function validateAudioFilePath(value, name) {
  if (isBlank(value) || !value.startsWith("/")) {
    throw rpcError(-32602, `${name} must be a non-empty absolute local file path`);
  }
  if (!/\.(wav|aif|aiff|flac|mp3|m4a|aac)$/i.test(value)) {
    throw rpcError(-32602, `${name} must point to a supported audio file`);
  }
}

function isNumberInRange(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
