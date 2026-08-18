import { loadBridgeConfig } from "./config.js";

const ACTIONS = {
  get_status: { method: "GET", path: "/status" },
  get_project: { method: "GET", path: "/project" },
  get_arrangement: { method: "GET", path: "/arrangement" },
  plan_arrangement_clip_deletion: { method: "GET", path: "/arrangement/clips/delete-plan" },
  delete_arrangement_clips: { method: "DELETE", path: "/arrangement/clips" },
  create_snapshot: { method: "POST", path: "/project/snapshot" },
  rollback_snapshot: { method: "POST", path: "/project/rollback" },
  list_plugins: { method: "GET", path: "/plugins" },
  search_browser: { method: "GET", path: "/browser/search" },
  analyze_audio: { method: "POST", path: "/analysis/audio" },
  analyze_mix: { method: "POST", path: "/analysis/mix" },
  get_production_report: { method: "GET", path: "/production/report" },
  set_tempo: { method: "POST", path: "/tempo" },
  save_project: { method: "POST", path: "/project/save" },
  set_signature: { method: "POST", path: "/signature" },
  start_transport: { method: "POST", path: "/transport/start" },
  stop_transport: { method: "POST", path: "/transport/stop" },
  create_midi_track: { method: "POST", path: "/tracks/midi" },
  duplicate_track: { method: "POST", path: "/tracks/duplicate" },
  freeze_track: { method: "POST", path: "/tracks/freeze" },
  flatten_track: { method: "POST", path: "/tracks/flatten" },
  modify_track: { method: "POST", path: "/tracks/modify" },
  list_returns: { method: "GET", path: "/returns" },
  create_return: { method: "POST", path: "/returns/create" },
  modify_return: { method: "POST", path: "/returns/modify" },
  delete_return: { method: "DELETE", path: "/returns" },
  list_buses: { method: "GET", path: "/routing/buses" },
  plan_plugin_output_routing: { method: "GET", path: "/routing/plugin-outputs/plan" },
  apply_plugin_output_routing: { method: "POST", path: "/routing/plugin-outputs/apply" },
  get_meters: { method: "GET", path: "/meters" },
  modify_master: { method: "POST", path: "/master/modify" },
  create_midi_clip: { method: "POST", path: "/clips/midi" },
  consolidate_clip: { method: "POST", path: "/clips/consolidate" },
  delete_clip: { method: "DELETE", path: "/clips/midi" },
  get_clip_notes: { method: "GET", path: "/clips/notes" },
  launch_clip: { method: "POST", path: "/clips/launch" },
  launch_scene: { method: "POST", path: "/scenes/launch" },
  humanize_clip: { method: "POST", path: "/clips/humanize" },
  quantize_clip: { method: "POST", path: "/clips/quantize" },
  apply_groove: { method: "POST", path: "/groove/apply" },
  import_midi: { method: "POST", path: "/midi/import" },
  load_device: { method: "POST", path: "/devices/load" },
  load_master_device: { method: "POST", path: "/devices/load-master" },
  set_device_parameter: { method: "POST", path: "/devices/parameter" },
  reorder_device: { method: "POST", path: "/devices/reorder" },
  delete_device: { method: "DELETE", path: "/devices" },
  set_automation: { method: "POST", path: "/automation" },
  apply_mastering_chain: { method: "POST", path: "/mastering/apply" },
  analyze_and_apply_mastering: { method: "POST", path: "/mastering/analyze-and-apply" },
  export_render: { method: "POST", path: "/render/export" },
  bounce_tracks: { method: "POST", path: "/tracks/bounce" },
  insert_arrangement_clip: { method: "POST", path: "/arrangement/insert" },
  add_locator: { method: "POST", path: "/arrangement/locators" },
  get_device_parameters: { method: "GET", path: "/devices/parameters" }
};

export class AbletonBridge {
  constructor(options = {}) {
    const config = loadBridgeConfig(options);
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs;
    this.dryRun = config.dryRun;
  }

  async invoke(actionName, payload = {}) {
    const action = ACTIONS[actionName];
    if (!action) {
      throw new Error(`Unsupported bridge action: ${actionName}`);
    }

    if (this.dryRun) {
      return {
        ok: true,
        dryRun: true,
        bridge: this.baseUrl,
        action: actionName,
        payload
      };
    }

    const url = buildUrl(action, this.baseUrl, payload);
    const response = await fetch(url, {
      method: action.method,
      headers: action.method === "GET" ? undefined : { "content-type": "application/json" },
      body: action.method === "GET" ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    const text = await response.text();
    const body = parseJsonOrText(text);

    if (!response.ok) {
      const detail = typeof body === "string" ? body : JSON.stringify(body);
      throw new Error(`Ableton bridge ${response.status} ${response.statusText}: ${detail}`);
    }

    return body;
  }
}

function buildUrl(action, baseUrl, payload) {
  const url = new URL(action.path, baseUrl);

  if (action.method === "GET") {
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url;
}

function parseJsonOrText(text) {
  if (!text) {
    return { ok: true };
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
