import { ENDPOINT_SUPPORT, routeKey } from "../bridge/observability.js";

const LOCAL = "local";
const BRIDGE = "bridge";
const HYBRID = "hybrid";

const local = (limitation) => policy(LOCAL, [], { limitation });
const bridge = (route, options) => policy(BRIDGE, [route], options);
const hybrid = (routes, options) => policy(HYBRID, routes, options);

export const TOOL_CAPABILITY_REGISTRY = Object.freeze({
  ableton_get_scene_tempo_signature_capabilities: bridge("GET /scenes/tempo-signature-capabilities", { limitation: "Reads only the exact Session Scene index and never launches it; overrides matter only after a later explicit Scene launch." }),
  ableton_set_scene_tempo_signature_overrides: bridge("POST /scenes/tempo-signature-overrides", { probeTool: "ableton_get_scene_tempo_signature_capabilities", limitation: "Writes only exact Session Scene override properties; it never launches a Scene, creates Arrangement automation or markers, or changes global Song tempo/signature." }),
  ableton_get_arrangement_insertion_capabilities: bridge("GET /arrangement/insertion-capabilities", { limitation: "Reports callable operations for the exact target track without proving another target is supported." }),
  ableton_insert_arrangement_clip: bridge("POST /arrangement/insert", { probeTool: "ableton_get_arrangement_insertion_capabilities", limitation: "Supports only host-observable clips and exact operations reported by the target-level probe." }),
  ableton_get_status: bridge("GET /status"),
  ableton_get_project: bridge("GET /project"),
  ableton_get_arrangement: bridge("GET /arrangement", { limitation: "Reports only Arrangement clips and fields observable through the active host API." }),
  ableton_plan_arrangement_clip_deletion: bridge("GET /arrangement/clips/delete-plan", { limitation: "Requires host-observable clip timing identities." }),
  ableton_delete_arrangement_clips: bridge("DELETE /arrangement/clips", { probeTool: "ableton_plan_arrangement_clip_deletion", limitation: "Deletes only exact clips present in a current read-only plan." }),
  ableton_create_snapshot: bridge("POST /project/snapshot", { limitation: "Captures exposed bridge fields for rollback; it is not an Ableton Live Set file." }),
  ableton_rollback_snapshot: bridge("POST /project/rollback", { limitation: "Restores only fields captured and exposed by the bridge snapshot; it does not load a Live Set file." }),
  ableton_list_plugins: bridge("GET /plugins", { limitation: "Returns browser-indexed inventory, not proof that a result is loadable on a specific target." }),
  ableton_search_browser: bridge("GET /browser/search", { limitation: "Search metadata does not guarantee target-specific loadability." }),
  ableton_diagnose_plugins: hybrid(["GET /plugins", "GET /browser/search"], { limitation: "Combines local disk inspection with Ableton browser indexing; it cannot prove target-specific loadability." }),
  ableton_analyze_audio: local("Analyzes an existing local rendered file; it does not render Live audio."),
  ableton_analyze_mix: local("Analyzes existing local rendered files; it does not render Live audio."),
  ableton_get_production_report: bridge("GET /production/report"),
  ableton_diagnose_playback: hybrid(["GET /status", "GET /project", "GET /arrangement", "GET /meters", "GET /routing/buses"], { limitation: "Meter evidence may be unavailable, zero, or stale and is not guaranteed mixing evidence." }),
  ableton_get_bridge_observability: local("Reports local metadata supplied to the MCP and does not prove a Live target operation is callable."),
  ableton_evaluate_action_risk: local(),
  ableton_list_risk_policy: local(),
  ableton_match_preset_intent: hybrid(["GET /browser/search"], { limitation: "Matches browser-indexed candidates and does not prove a preset is loadable on a target." }),
  ableton_list_workflow_plans: local("Plans are materialized against the current capability view; blocked steps are not executable recommendations."),
  ableton_get_workflow_plan: local("The returned plan labels unsupported bridge steps blocked and non-executable."),
  ableton_set_tempo: bridge("POST /tempo"),
  ableton_set_signature: bridge("POST /signature"),
  ableton_start_transport: bridge("POST /transport/start"),
  ableton_stop_transport: bridge("POST /transport/stop"),
  ableton_create_midi_track: bridge("POST /tracks/midi"),
  ableton_duplicate_track: bridge("POST /tracks/duplicate"),
  ableton_freeze_track: bridge("POST /tracks/freeze"),
  ableton_flatten_track: bridge("POST /tracks/flatten"),
  ableton_modify_track: bridge("POST /tracks/modify"),
  ableton_list_returns: bridge("GET /returns"),
  ableton_create_return_track: bridge("POST /returns/create"),
  ableton_modify_return: bridge("POST /returns/modify"),
  ableton_delete_return_track: bridge("DELETE /returns"),
  ableton_list_buses: bridge("GET /routing/buses"),
  ableton_plan_plugin_output_routing: bridge("GET /routing/plugin-outputs/plan", { limitation: "Channel discovery depends on the exact source and existing target routing state." }),
  ableton_apply_plugin_output_routing: bridge("POST /routing/plugin-outputs/apply", { probeTool: "ableton_plan_plugin_output_routing", limitation: "Requires exact routing labels or identifiers returned for the current target." }),
  ableton_get_meters: bridge("GET /meters", { limitation: "Its response is the reliability probe; values may be unavailable, zero, or stale and are not guaranteed mixing evidence." }),
  ableton_modify_master: bridge("POST /master/modify"),
  ableton_create_midi_clip: bridge("POST /clips/midi"),
  ableton_consolidate_clip: bridge("POST /clips/consolidate"),
  ableton_delete_clip: bridge("DELETE /clips/midi"),
  ableton_get_clip_notes: bridge("GET /clips/notes"),
  ableton_launch_clip: bridge("POST /clips/launch"),
  ableton_launch_scene: bridge("POST /scenes/launch"),
  ableton_humanize_clip: bridge("POST /clips/humanize"),
  ableton_quantize_clip: bridge("POST /clips/quantize"),
  ableton_apply_groove: bridge("POST /groove/apply"),
  ableton_import_midi: hybrid(["POST /clips/midi"], { limitation: "Parses MIDI locally, then requires the active bridge to create the destination MIDI clip." }),
  ableton_load_device: bridge("POST /devices/load", { limitation: "Browser results do not guarantee target-specific loadability." }),
  ableton_load_master_device: bridge("POST /devices/load-master", { limitation: "Browser results do not guarantee target-specific loadability." }),
  ableton_select_vst_for_midi: bridge("POST /devices/load", { limitation: "Selection uses indexed candidates and does not guarantee target-specific loadability before the call." }),
  ableton_set_device_parameter: bridge("POST /devices/parameter", { probeTool: "ableton_get_device_parameters", limitation: "Writes require an exact parameter exposed by a preceding read of the target device." }),
  ableton_get_device_parameters: bridge("GET /devices/parameters", { limitation: "Returns only parameters exposed by Live for the exact inspected target." }),
  ableton_reorder_device: bridge("POST /devices/reorder"),
  ableton_delete_device: bridge("DELETE /devices"),
  ableton_set_automation: bridge("POST /automation"),
  ableton_apply_mastering_chain: bridge("POST /mastering/apply", { limitation: "Loudness and peak values are requested targets, not measured results without analysis of a real render." }),
  ableton_export_render: bridge("POST /render/export"),
  ableton_bounce_tracks: bridge("POST /tracks/bounce"),
  ableton_analyze_and_apply_mastering: bridge("POST /mastering/analyze-and-apply", { limitation: "Measured loudness requires a real rendered artifact; requested targets alone are not measurements." }),
  ableton_add_locator: bridge("POST /arrangement/locators", { limitation: "Availability depends on cue-point mutation support in the active host; no universal target probe exists." })
});

export function toolAvailability(toolName, capabilityView) {
  const entry = TOOL_CAPABILITY_REGISTRY[toolName];
  if (!entry) {
    throw new Error(`Missing capability policy for ${toolName}`);
  }
  if (entry.ownership === LOCAL) {
    return Object.freeze({ available: true, status: "supported", reason: null, probeTool: null });
  }
  const routeResults = entry.requiredRoutes.map((route) => capabilityView.routes.get(route));
  const unavailableIndex = routeResults.findIndex((route) => !route || route.status === "unsupported");
  if (unavailableIndex !== -1) {
    const unsupported = routeResults[unavailableIndex];
    return Object.freeze({
      available: false,
      status: "unsupported",
      route: unsupported ? routeKey(unsupported.method, unsupported.path) : entry.requiredRoutes[unavailableIndex],
      reason: unsupported?.reason ?? capabilityView.reason,
      probeTool: entry.probeTool
    });
  }
  const conditional = routeResults.find((route) => route.status === "conditional");
  return Object.freeze({
    available: true,
    status: conditional ? "conditional" : "supported",
    route: conditional ? routeKey(conditional.method, conditional.path) : null,
    reason: conditional?.reason ?? null,
    probeTool: conditional ? entry.probeTool : null
  });
}

export function projectToolDefinitions(definitions, capabilityView) {
  return definitions.flatMap((definition) => {
    const availability = toolAvailability(definition.name, capabilityView);
    if (!availability.available) {
      return [];
    }
    const registryEntry = TOOL_CAPABILITY_REGISTRY[definition.name];
    const descriptionParts = [definition.description];
    if (registryEntry.limitation) {
      descriptionParts.push(`Limit: ${registryEntry.limitation}`);
    }
    if (availability.status === "conditional") {
      descriptionParts.push(`Conditional: ${availability.reason}`);
      if (availability.probeTool) {
        descriptionParts.push(`Probe first with ${availability.probeTool}.`);
      }
    }
    return [{ ...definition, description: descriptionParts.join(" ") }];
  });
}

export function assertToolAvailable(toolName, capabilityView) {
  const availability = toolAvailability(toolName, capabilityView);
  if (availability.available) {
    return availability;
  }
  const error = new Error(`Tool ${toolName} is unavailable for ${availability.route}: ${availability.reason}`);
  error.code = -32602;
  error.errorCode = "bridge_capability_unavailable";
  throw error;
}

export function validateToolCapabilityRegistry(toolNames, dispatchNames) {
  const errors = [];
  const knownRoutes = new Set(ENDPOINT_SUPPORT.map(({ method, path }) => routeKey(method, path)));
  const definitionNames = new Set(toolNames);
  const handlerNames = new Set(dispatchNames);
  const policyNames = new Set(Object.keys(TOOL_CAPABILITY_REGISTRY));
  const definitionCounts = countNames(toolNames);
  for (const [name, count] of definitionCounts) {
    if (count !== 1) {
      errors.push(`Tool definition appears more than once ${name}`);
    }
  }
  for (const name of new Set([...definitionNames, ...handlerNames, ...policyNames])) {
    if (!definitionNames.has(name)) errors.push(`Policy/dispatch references missing tool definition ${name}`);
    if (!handlerNames.has(name)) errors.push(`Tool/policy references missing dispatch handler ${name}`);
    if (!policyNames.has(name)) errors.push(`Tool/dispatch is missing capability policy ${name}`);
  }
  for (const [name, entry] of Object.entries(TOOL_CAPABILITY_REGISTRY)) {
    for (const route of entry.requiredRoutes) {
      if (!knownRoutes.has(route)) errors.push(`${name} references unknown route ${route}`);
    }
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function policy(ownership, requiredRoutes, options = {}) {
  return Object.freeze({
    ownership,
    requiredRoutes: Object.freeze([...requiredRoutes]),
    probeTool: options.probeTool ?? null,
    limitation: options.limitation ?? null
  });
}

function countNames(names) {
  const counts = new Map();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}
