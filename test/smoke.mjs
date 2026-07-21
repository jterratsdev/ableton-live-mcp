import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const child = spawn(process.execPath, ["src/server.js"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: {
    ...process.env,
    ABLETON_MCP_DRY_RUN: "1"
  }
});

const responses = new Map();
let buffer = "";

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const message = JSON.parse(line);
    responses.set(message.id, message);
  }
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

try {
  send(1, "initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "0.0.0" } });
  const init = await waitFor(1);
  assert.equal(init.result.serverInfo.name, "ableton-live-mcp");

  send(2, "tools/list", {});
  const list = await waitFor(2);
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_set_tempo"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_get_arrangement"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_create_snapshot"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_rollback_snapshot"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_save_project"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_set_signature"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_duplicate_track"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_freeze_track"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_flatten_track"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_search_browser"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_analyze_audio"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_get_production_report"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_get_bridge_observability"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_evaluate_action_risk"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_list_risk_policy"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_match_preset_intent"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_list_workflow_plans"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_get_workflow_plan"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_consolidate_clip"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_delete_clip"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_get_clip_notes"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_humanize_clip"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_quantize_clip"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_apply_groove"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_modify_track"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_list_returns"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_create_return_track"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_modify_return"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_delete_return_track"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_list_buses"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_get_meters"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_modify_master"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_load_master_device"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_set_device_parameter"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_get_device_parameters"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_reorder_device"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_delete_device"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_select_vst_for_midi"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_export_render"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_bounce_tracks"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_analyze_and_apply_mastering"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_insert_arrangement_clip"));
  assert.ok(list.result.tools.some((tool) => tool.name === "ableton_add_locator"));

  send(3, "tools/call", { name: "ableton_set_tempo", arguments: { bpm: 124 } });
  const tempo = await waitFor(3);
  assert.equal(tempo.result.content[0].type, "text");
  assert.match(tempo.result.content[0].text, /"dryRun": true/);
  assert.match(tempo.result.content[0].text, /"bpm": 124/);

  send(35, "tools/call", { name: "ableton_get_arrangement", arguments: {} });
  const arrangement = await waitFor(35);
  assert.match(arrangement.result.content[0].text, /"get_arrangement"/);

  send(11, "tools/call", { name: "ableton_create_snapshot", arguments: { label: "smoke checkpoint" } });
  const snapshot = await waitFor(11);
  assert.match(snapshot.result.content[0].text, /"create_snapshot"/);

  send(12, "tools/call", { name: "ableton_rollback_snapshot", arguments: { snapshotId: "snap-test" } });
  const rollback = await waitFor(12);
  assert.match(rollback.result.content[0].text, /"rollback_snapshot"/);

  send(8, "tools/call", { name: "ableton_save_project", arguments: { label: "smoke" } });
  const save = await waitFor(8);
  assert.match(save.result.content[0].text, /"save_project"/);

  send(9, "tools/call", { name: "ableton_set_signature", arguments: { numerator: 3, denominator: 4 } });
  const signature = await waitFor(9);
  assert.match(signature.result.content[0].text, /"set_signature"/);

  send(34, "tools/call", { name: "ableton_search_browser", arguments: { kind: "sample", query: "clap", limit: 2 } });
  const browserSearch = await waitFor(34);
  assert.match(browserSearch.result.content[0].text, /"search_browser"/);
  assert.match(browserSearch.result.content[0].text, /"limit": 2/);

  send(45, "tools/call", { name: "ableton_analyze_audio", arguments: { path: "/tmp/render.wav" } });
  const audioAnalysis = await waitFor(45);
  assert.match(audioAnalysis.result.content[0].text, /"analyze_audio"/);

  send(4, "tools/call", {
    name: "ableton_create_midi_clip",
    arguments: {
      trackIndex: 0,
      clipSlotIndex: 0,
      lengthBeats: 4,
      notes: [{ pitch: 60, start: 0, duration: 1 }]
    }
  });
  const clip = await waitFor(4);
  assert.match(clip.result.content[0].text, /"velocity": 100/);

  send(5, "tools/call", { name: "ableton_delete_clip", arguments: { trackIndex: 0, clipSlotIndex: 2 } });
  const deleted = await waitFor(5);
  assert.match(deleted.result.content[0].text, /"delete_clip"/);

  send(63, "tools/call", { name: "ableton_consolidate_clip", arguments: { trackIndex: 0, startBeat: 0, lengthBeats: 4, clipSlotIndex: 7 } });
  const consolidated = await waitFor(63);
  assert.match(consolidated.result.content[0].text, /"consolidate_clip"/);
  assert.match(consolidated.result.content[0].text, /"lengthBeats": 4/);

  send(10, "tools/call", { name: "ableton_get_clip_notes", arguments: { trackIndex: 0, clipSlotIndex: 0 } });
  const notes = await waitFor(10);
  assert.match(notes.result.content[0].text, /"get_clip_notes"/);

  send(42, "tools/call", { name: "ableton_humanize_clip", arguments: { trackIndex: 0, clipSlotIndex: 0, timingAmountBeats: 0.02, durationAmountBeats: 0.01, velocityAmount: 5, seed: "smoke" } });
  const humanized = await waitFor(42);
  assert.match(humanized.result.content[0].text, /"humanize_clip"/);
  assert.match(humanized.result.content[0].text, /"seed": "smoke"/);

  send(43, "tools/call", { name: "ableton_quantize_clip", arguments: { trackIndex: 0, clipSlotIndex: 0, grid: "1/16", strength: 0.75 } });
  const quantized = await waitFor(43);
  assert.match(quantized.result.content[0].text, /"quantize_clip"/);
  assert.match(quantized.result.content[0].text, /"grid": "1\/16"/);

  send(44, "tools/call", { name: "ableton_apply_groove", arguments: { trackIndex: 0, clipSlotIndex: 0, grid: "1/16", amount: 0.6, swing: 0.5 } });
  const groove = await waitFor(44);
  assert.match(groove.result.content[0].text, /"apply_groove"/);
  assert.match(groove.result.content[0].text, /"amount": 0.6/);

  send(13, "tools/call", { name: "ableton_modify_track", arguments: { trackIndex: 0, volumeDb: -8, pan: 0.1 } });
  const modifyTrack = await waitFor(13);
  assert.match(modifyTrack.result.content[0].text, /"modify_track"/);

  send(64, "tools/call", { name: "ableton_duplicate_track", arguments: { trackIndex: 0, name: "Piano Layer" } });
  const duplicateTrack = await waitFor(64);
  assert.match(duplicateTrack.result.content[0].text, /"duplicate_track"/);
  assert.match(duplicateTrack.result.content[0].text, /"Piano Layer"/);

  send(65, "tools/call", { name: "ableton_freeze_track", arguments: { trackIndex: 0 } });
  const freezeTrack = await waitFor(65);
  assert.match(freezeTrack.result.content[0].text, /"freeze_track"/);

  send(66, "tools/call", { name: "ableton_flatten_track", arguments: { trackIndex: 0 } });
  const flattenTrack = await waitFor(66);
  assert.match(flattenTrack.result.content[0].text, /"flatten_track"/);

  send(14, "tools/call", { name: "ableton_list_returns", arguments: {} });
  const returns = await waitFor(14);
  assert.match(returns.result.content[0].text, /"list_returns"/);

  send(15, "tools/call", { name: "ableton_modify_return", arguments: { returnIndex: 0, volumeDb: -12 } });
  const modifyReturn = await waitFor(15);
  assert.match(modifyReturn.result.content[0].text, /"modify_return"/);

  send(32, "tools/call", { name: "ableton_create_return_track", arguments: { name: "Parallel Crush" } });
  const createReturn = await waitFor(32);
  assert.match(createReturn.result.content[0].text, /"create_return"/);

  send(33, "tools/call", { name: "ableton_delete_return_track", arguments: { returnIndex: 1 } });
  const deleteReturn = await waitFor(33);
  assert.match(deleteReturn.result.content[0].text, /"delete_return"/);

  send(16, "tools/call", { name: "ableton_list_buses", arguments: {} });
  const buses = await waitFor(16);
  assert.match(buses.result.content[0].text, /"list_buses"/);

  send(20, "tools/call", { name: "ableton_get_meters", arguments: {} });
  const meters = await waitFor(20);
  assert.match(meters.result.content[0].text, /"get_meters"/);

  send(19, "tools/call", { name: "ableton_modify_master", arguments: { volumeDb: -2, pan: 0, cueVolumeDb: -18 } });
  const modifyMaster = await waitFor(19);
  assert.match(modifyMaster.result.content[0].text, /"modify_master"/);

  send(21, "tools/call", { name: "ableton_load_master_device", arguments: { query: "EQ Eight", kind: "audio_effect", position: "append" } });
  const loadMasterDevice = await waitFor(21);
  assert.match(loadMasterDevice.result.content[0].text, /"load_master_device"/);

  send(17, "tools/call", { name: "ableton_set_device_parameter", arguments: { trackIndex: 0, deviceIndex: 0, parameter: "Filter Frequency", normalizedValue: 0.5 } });
  const deviceParameter = await waitFor(17);
  assert.match(deviceParameter.result.content[0].text, /"set_device_parameter"/);

  send(18, "tools/call", { name: "ableton_get_device_parameters", arguments: { trackIndex: 0, deviceIndex: 0 } });
  const deviceParameters = await waitFor(18);
  assert.match(deviceParameters.result.content[0].text, /"get_device_parameters"/);

  send(37, "tools/call", {
    name: "ableton_reorder_device",
    arguments: { location: { target: "track", trackIndex: 0 }, deviceIndex: 0, toIndex: 1 }
  });
  const reorderDevice = await waitFor(37);
  assert.match(reorderDevice.result.content[0].text, /"reorder_device"/);

  send(38, "tools/call", {
    name: "ableton_delete_device",
    arguments: { location: { target: "master" }, deviceIndex: 0 }
  });
  const deleteDevice = await waitFor(38);
  assert.match(deleteDevice.result.content[0].text, /"delete_device"/);

  send(6, "tools/call", { name: "ableton_select_vst_for_midi", arguments: { trackIndex: 0, role: "piano", query: "Kontakt piano" } });
  const vst = await waitFor(6);
  assert.match(vst.result.content[0].text, /"replace_instrument"/);

  send(7, "tools/call", {
    name: "ableton_export_render",
    arguments: {
      outputPath: "/tmp/ableton-render.wav",
      scope: "master",
      sampleRate: 48000,
      bitDepth: 24,
      normalize: false
    }
  });
  const render = await waitFor(7);
  assert.match(render.result.content[0].text, /"export_render"/);

  send(60, "tools/call", { name: "ableton_get_production_report", arguments: {} });
  const productionReport = await waitFor(60);
  assert.match(productionReport.result.content[0].text, /"get_production_report"/);

  send(70, "tools/call", { name: "ableton_match_preset_intent", arguments: { intent: "realistic violin", limit: 1 } });
  const presetMatch = await waitFor(70);
  assert.match(presetMatch.result.content[0].text, /"realistic violin"/);
  assert.match(presetMatch.result.content[0].text, /"id": "vst:bbc-symphony:solo-violin-legato"/);

  send(71, "tools/call", { name: "ableton_evaluate_action_risk", arguments: { toolName: "ableton_delete_clip" } });
  const actionRisk = await waitFor(71);
  assert.match(actionRisk.result.content[0].text, /"tier": "destructive"/);

  send(72, "tools/call", { name: "ableton_list_risk_policy", arguments: {} });
  const riskPolicy = await waitFor(72);
  assert.match(riskPolicy.result.content[0].text, /"ableton_match_preset_intent"/);

  send(73, "tools/call", { name: "ableton_list_workflow_plans", arguments: {} });
  const workflowPlans = await waitFor(73);
  assert.match(workflowPlans.result.content[0].text, /"classical_session_setup"/);

  send(74, "tools/call", { name: "ableton_get_workflow_plan", arguments: { workflowId: "render_validation" } });
  const workflowPlan = await waitFor(74);
  assert.match(workflowPlan.result.content[0].text, /"Render validation"/);

  send(75, "tools/call", { name: "ableton_get_bridge_observability", arguments: {} });
  const observability = await waitFor(75);
  assert.match(observability.result.content[0].text, /"schemaVersion": "1.0.0"/);

  send(61, "tools/call", { name: "ableton_bounce_tracks", arguments: { outputPath: "/tmp/ableton-bounce", scope: "stems" } });
  const bounce = await waitFor(61);
  assert.match(bounce.result.content[0].text, /"bounce_tracks"/);

  send(62, "tools/call", { name: "ableton_analyze_and_apply_mastering", arguments: { targetLufs: -16, truePeakDb: -1, outputPath: "/tmp/mastering-analysis.wav" } });
  const analyzeMastering = await waitFor(62);
  assert.match(analyzeMastering.result.content[0].text, /"analyze_and_apply_mastering"/);

  send(39, "tools/call", {
    name: "ableton_insert_arrangement_clip",
    arguments: {
      trackIndex: 0,
      clipSlotIndex: 0,
      startBeat: 16,
      lengthBeats: 4,
      name: "Dry Arrangement Clip"
    }
  });
  const arrangementInsert = await waitFor(39);
  assert.match(arrangementInsert.result.content[0].text, /"insert_arrangement_clip"/);
  assert.match(arrangementInsert.result.content[0].text, /"startBeat": 16/);

  send(40, "tools/call", { name: "ableton_add_locator", arguments: { beat: 16, name: "Bridge" } });
  const locator = await waitFor(40);
  assert.match(locator.result.content[0].text, /"add_locator"/);

  child.stdin.end();
  console.log("smoke ok");
} finally {
  child.kill();
}

function send(id, method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
}

async function waitFor(id) {
  const started = Date.now();
  while (Date.now() - started < 2000) {
    if (responses.has(id)) {
      return responses.get(id);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for response ${id}`);
}
