export const RISK_TIERS = Object.freeze({
  READ: "read",
  SAFE_WRITE: "safe-write",
  DESTRUCTIVE: "destructive",
  EXPORT: "export",
  UNSUPPORTED: "unsupported"
});

export const DEFAULT_RISK_RECOMMENDATIONS = Object.freeze({
  [RISK_TIERS.READ]: Object.freeze({
    blockedByDefault: false,
    requiresExplicitApproval: false,
    requiresSnapshot: false,
    recommendation: "allow"
  }),
  [RISK_TIERS.SAFE_WRITE]: Object.freeze({
    blockedByDefault: false,
    requiresExplicitApproval: false,
    requiresSnapshot: true,
    recommendation: "allow_after_context_check"
  }),
  [RISK_TIERS.DESTRUCTIVE]: Object.freeze({
    blockedByDefault: true,
    requiresExplicitApproval: true,
    requiresSnapshot: true,
    recommendation: "block_until_explicit_approval"
  }),
  [RISK_TIERS.EXPORT]: Object.freeze({
    blockedByDefault: true,
    requiresExplicitApproval: true,
    requiresSnapshot: false,
    recommendation: "block_until_export_approval"
  }),
  [RISK_TIERS.UNSUPPORTED]: Object.freeze({
    blockedByDefault: true,
    requiresExplicitApproval: true,
    requiresSnapshot: false,
    recommendation: "block_as_unsupported"
  })
});

const HTTP_ENDPOINT_RISKS = Object.freeze({
  "GET /status": read("Read transport and session status."),
  "GET /project": read("Read project structure and mixer state."),
  "GET /arrangement": read("Read arrangement timeline metadata."),
  "POST /project/snapshot": safeWrite("Create rollback metadata before broader edits."),
  "POST /project/rollback": destructive("Replace current project state from a prior snapshot."),
  "GET /plugins": read("Read browser/plugin inventory."),
  "GET /browser/search": read("Read loadable browser search results."),
  "POST /analysis/audio": read("Analyze an existing local audio artifact without mutating Live."),
  "GET /production/report": read("Read derived production diagnostics."),
  "POST /tempo": safeWrite("Change song tempo."),
  "POST /project/save": destructive("Persist the current Live set and potentially overwrite disk state."),
  "POST /signature": safeWrite("Change song time signature."),
  "POST /transport/start": safeWrite("Change playback state."),
  "POST /transport/stop": safeWrite("Change playback state."),
  "POST /clips/launch": safeWrite("Launch a Session View clip."),
  "POST /scenes/launch": safeWrite("Launch a Session View scene."),
  "POST /tracks/midi": safeWrite("Create a MIDI track."),
  "POST /tracks/duplicate": safeWrite("Duplicate an existing track."),
  "POST /tracks/freeze": safeWrite("Freeze a track while preserving an unfreeze path."),
  "POST /tracks/flatten": destructive("Flatten a frozen track into audio."),
  "POST /tracks/modify": safeWrite("Change track mixer, routing, arm, mute, solo, or metadata."),
  "GET /returns": read("Read return track state."),
  "POST /returns/create": safeWrite("Create a return track."),
  "POST /returns/modify": safeWrite("Change return track mixer or metadata."),
  "DELETE /returns": destructive("Delete a return track."),
  "GET /routing/buses": read("Read routing options."),
  "GET /meters": read("Read observable meters."),
  "POST /master/modify": safeWrite("Change master mixer state."),
  "POST /clips/midi": safeWrite("Create or replace MIDI clip notes."),
  "POST /clips/consolidate": destructive("Consolidate a clip range and potentially replace clip material."),
  "DELETE /clips/midi": destructive("Delete a clip."),
  "GET /clips/notes": read("Read MIDI clip notes."),
  "POST /clips/humanize": safeWrite("Rewrite MIDI notes deterministically."),
  "POST /clips/quantize": safeWrite("Rewrite MIDI note timing deterministically."),
  "POST /groove/apply": safeWrite("Rewrite MIDI note timing with a groove transform."),
  "POST /midi/import": unsupported("Raw bridge MIDI import is unsupported by the Remote Script; use the MCP parser path."),
  "POST /devices/load": safeWrite("Load a device, preset, rack, plugin, VST, or AU onto a track."),
  "POST /devices/load-master": safeWrite("Load a device, preset, rack, plugin, VST, or AU onto the master."),
  "GET /devices/parameters": read("Read device parameters before changing them."),
  "POST /devices/parameter": safeWrite("Change a device parameter."),
  "POST /devices/reorder": safeWrite("Move a device within a chain."),
  "DELETE /devices": destructive("Delete a device from a chain."),
  "POST /automation": unsupported("Remote Script automation envelope writing is not safely supported."),
  "POST /mastering/apply": safeWrite("Apply or update master-chain processing."),
  "POST /render/export": exportRisk("Export audio artifacts; unsupported in the Remote Script today."),
  "POST /tracks/bounce": exportRisk("Bounce selected tracks or stems; unsupported in the Remote Script today."),
  "POST /mastering/analyze-and-apply": exportRisk("Render, analyze, and mutate mastering state."),
  "POST /mastering/remove-reverb": destructive("Remove master reverb from a Live set."),
  "POST /arrangement/insert": safeWrite("Insert existing material onto the arrangement timeline."),
  "POST /arrangement/locators": safeWrite("Add or update arrangement locators.")
});

const MCP_TOOL_RISKS = Object.freeze({
  ableton_get_status: tool("GET /status"),
  ableton_get_project: tool("GET /project"),
  ableton_get_arrangement: tool("GET /arrangement"),
  ableton_create_snapshot: tool("POST /project/snapshot"),
  ableton_rollback_snapshot: tool("POST /project/rollback"),
  ableton_list_plugins: tool("GET /plugins"),
  ableton_search_browser: tool("GET /browser/search"),
  ableton_diagnose_plugins: {
    ...read("Compare local plugin bundles against Ableton's plugin/browser index without mutating Live state."),
    endpoint: null
  },
  ableton_analyze_audio: tool("POST /analysis/audio"),
  ableton_get_production_report: tool("GET /production/report"),
  ableton_diagnose_playback: {
    ...read("Diagnose silent playback without mutating Live state."),
    endpoint: null
  },
  ableton_get_bridge_observability: {
    ...read("Read local bridge diagnostics, endpoint support, and stale-runtime metadata."),
    endpoint: null
  },
  ableton_evaluate_action_risk: {
    ...read("Evaluate policy metadata without mutating Live state."),
    endpoint: null
  },
  ableton_list_risk_policy: {
    ...read("Read all known MCP and HTTP risk policy classifications."),
    endpoint: null
  },
  ableton_match_preset_intent: {
    ...read("Score local preset catalog entries without loading devices."),
    endpoint: null
  },
  ableton_list_workflow_plans: {
    ...read("Read high-level plan-only workflow definitions."),
    endpoint: null
  },
  ableton_get_workflow_plan: {
    ...read("Read one high-level plan-only workflow definition."),
    endpoint: null
  },
  ableton_set_tempo: tool("POST /tempo"),
  ableton_save_project: tool("POST /project/save"),
  ableton_set_signature: tool("POST /signature"),
  ableton_start_transport: tool("POST /transport/start"),
  ableton_stop_transport: tool("POST /transport/stop"),
  ableton_create_midi_track: tool("POST /tracks/midi"),
  ableton_duplicate_track: tool("POST /tracks/duplicate"),
  ableton_freeze_track: tool("POST /tracks/freeze"),
  ableton_flatten_track: tool("POST /tracks/flatten"),
  ableton_modify_track: tool("POST /tracks/modify"),
  ableton_list_returns: tool("GET /returns"),
  ableton_create_return_track: tool("POST /returns/create"),
  ableton_modify_return: tool("POST /returns/modify"),
  ableton_delete_return_track: tool("DELETE /returns"),
  ableton_list_buses: tool("GET /routing/buses"),
  ableton_get_meters: tool("GET /meters"),
  ableton_modify_master: tool("POST /master/modify"),
  ableton_create_midi_clip: tool("POST /clips/midi"),
  ableton_consolidate_clip: tool("POST /clips/consolidate"),
  ableton_delete_clip: tool("DELETE /clips/midi"),
  ableton_get_clip_notes: tool("GET /clips/notes"),
  ableton_launch_clip: tool("POST /clips/launch"),
  ableton_launch_scene: tool("POST /scenes/launch"),
  ableton_humanize_clip: tool("POST /clips/humanize"),
  ableton_quantize_clip: tool("POST /clips/quantize"),
  ableton_apply_groove: tool("POST /groove/apply"),
  ableton_import_midi: {
    ...safeWrite("Parse a local MIDI file and write notes through supported clip operations."),
    endpoint: null
  },
  ableton_load_device: tool("POST /devices/load"),
  ableton_load_master_device: tool("POST /devices/load-master"),
  ableton_select_vst_for_midi: {
    ...safeWrite("Load the selected instrument using the supported device-load path."),
    endpoint: "POST /devices/load"
  },
  ableton_set_device_parameter: tool("POST /devices/parameter"),
  ableton_get_device_parameters: tool("GET /devices/parameters"),
  ableton_reorder_device: tool("POST /devices/reorder"),
  ableton_delete_device: tool("DELETE /devices"),
  ableton_set_automation: tool("POST /automation"),
  ableton_apply_mastering_chain: tool("POST /mastering/apply"),
  ableton_export_render: tool("POST /render/export"),
  ableton_bounce_tracks: tool("POST /tracks/bounce"),
  ableton_analyze_and_apply_mastering: tool("POST /mastering/analyze-and-apply"),
  ableton_insert_arrangement_clip: tool("POST /arrangement/insert"),
  ableton_add_locator: tool("POST /arrangement/locators")
});

export class RiskPolicyError extends Error {
  constructor(classification) {
    super(`Action is blocked by default: ${classification.subject}`);
    this.name = "RiskPolicyError";
    this.classification = classification;
  }
}

export function classifyToolRisk(toolName) {
  const normalizedName = String(toolName ?? "").trim();
  const record = MCP_TOOL_RISKS[normalizedName] ?? unsupported("Unknown MCP tool.");

  return classification({
    subjectType: "mcp-tool",
    subject: normalizedName,
    record
  });
}

export function classifyEndpointRisk(methodOrRoute, path) {
  const route = normalizeEndpointRoute(methodOrRoute, path);
  const record = HTTP_ENDPOINT_RISKS[route] ?? unsupported("Unknown HTTP endpoint.");

  return classification({
    subjectType: "http-endpoint",
    subject: route,
    record
  });
}

export function evaluateActionRisk(action) {
  if (typeof action === "string") {
    return classifyToolRisk(action);
  }

  if (action?.toolName) {
    return classifyToolRisk(action.toolName);
  }

  if (action?.route) {
    return classifyEndpointRisk(action.route);
  }

  if (action?.method || action?.path) {
    return classifyEndpointRisk(action.method, action.path);
  }

  return classification({
    subjectType: "unknown",
    subject: "unknown",
    record: unsupported("Action did not include toolName, route, method, or path.")
  });
}

export function shouldBlockByDefault(action) {
  return evaluateActionRisk(action).blockedByDefault;
}

export function requireAllowedByDefault(action) {
  const result = evaluateActionRisk(action);
  if (result.blockedByDefault) {
    throw new RiskPolicyError(result);
  }
  return result;
}

export function listToolRiskClassifications() {
  return Object.keys(MCP_TOOL_RISKS).sort().map(classifyToolRisk);
}

export function listEndpointRiskClassifications() {
  return Object.keys(HTTP_ENDPOINT_RISKS).sort().map((route) => classifyEndpointRisk(route));
}

export function hasToolRiskClassification(toolName) {
  return Object.hasOwn(MCP_TOOL_RISKS, toolName);
}

function normalizeEndpointRoute(methodOrRoute, path) {
  if (path === undefined) {
    const route = String(methodOrRoute ?? "").trim().replace(/\s+/g, " ");
    const [method, ...pathParts] = route.split(" ");
    return [method?.toUpperCase(), pathParts.join(" ")].filter(Boolean).join(" ");
  }

  return `${String(methodOrRoute ?? "").trim().toUpperCase()} ${String(path ?? "").trim()}`.trim();
}

function classification({ subjectType, subject, record }) {
  const recommendation = DEFAULT_RISK_RECOMMENDATIONS[record.tier];
  return Object.freeze({
    subjectType,
    subject,
    tier: record.tier,
    endpoint: record.endpoint ?? null,
    rationale: record.rationale,
    blockedByDefault: recommendation.blockedByDefault,
    requiresExplicitApproval: recommendation.requiresExplicitApproval,
    requiresSnapshot: recommendation.requiresSnapshot,
    recommendation: recommendation.recommendation
  });
}

function tool(route) {
  return { ...HTTP_ENDPOINT_RISKS[route], endpoint: route };
}

function read(rationale) {
  return risk(RISK_TIERS.READ, rationale);
}

function safeWrite(rationale) {
  return risk(RISK_TIERS.SAFE_WRITE, rationale);
}

function destructive(rationale) {
  return risk(RISK_TIERS.DESTRUCTIVE, rationale);
}

function exportRisk(rationale) {
  return risk(RISK_TIERS.EXPORT, rationale);
}

function unsupported(rationale) {
  return risk(RISK_TIERS.UNSUPPORTED, rationale);
}

function risk(tier, rationale) {
  return Object.freeze({ tier, rationale });
}
