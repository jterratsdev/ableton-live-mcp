import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scriptDir = "ableton_remote_scripts/AbletonMcpBridge";
const initPath = `${scriptDir}/__init__.py`;
const bridgePath = `${scriptDir}/AbletonMcpBridge.py`;
const httpPath = `${scriptDir}/http_bridge.py`;
const liveApiPath = `${scriptDir}/live_api.py`;
const liveModulePaths = [
  `${scriptDir}/live_arrangement.py`,
  `${scriptDir}/live_browser.py`,
  `${scriptDir}/live_clips.py`,
  `${scriptDir}/live_core.py`,
  `${scriptDir}/live_devices.py`,
  `${scriptDir}/live_mastering.py`,
  `${scriptDir}/live_mixer.py`,
  `${scriptDir}/live_snapshots.py`,
  `${scriptDir}/live_summaries.py`,
  `${scriptDir}/live_track_operations.py`
];

assert.ok(existsSync(initPath), "__init__.py should exist");
assert.ok(existsSync(bridgePath), "AbletonMcpBridge.py should exist");
assert.ok(existsSync(httpPath), "http_bridge.py should exist");
assert.ok(existsSync(liveApiPath), "live_api.py should exist");
liveModulePaths.forEach((modulePath) => assert.ok(existsSync(modulePath), `${modulePath} should exist`));

const initSource = readFileSync(initPath, "utf8");
assert.match(initSource, /def create_instance\(c_instance\):/);

const bridgeSource = readFileSync(bridgePath, "utf8");
const httpSource = readFileSync(httpPath, "utf8");
const liveApiSource = readFileSync(liveApiPath, "utf8");
const liveBrowserSource = readFileSync(`${scriptDir}/live_browser.py`, "utf8");
const liveCoreSource = readFileSync(`${scriptDir}/live_core.py`, "utf8");
const liveDevicesSource = readFileSync(`${scriptDir}/live_devices.py`, "utf8");
const liveMasteringSource = readFileSync(`${scriptDir}/live_mastering.py`, "utf8");
const liveMixerSource = readFileSync(`${scriptDir}/live_mixer.py`, "utf8");
const liveSummariesSource = readFileSync(`${scriptDir}/live_summaries.py`, "utf8");
const liveTrackOperationsSource = readFileSync(`${scriptDir}/live_track_operations.py`, "utf8");
[
  "GET /status",
  "GET /project",
  "GET /arrangement",
  "POST /project/snapshot",
  "POST /project/rollback",
  "GET /plugins",
  "POST /tempo",
  "POST /automation",
  "POST /project/save",
  "GET /browser/search",
  "GET /production/report",
  "POST /signature",
  "POST /tracks/midi",
  "POST /tracks/duplicate",
  "POST /tracks/freeze",
  "POST /tracks/flatten",
  "POST /tracks/modify",
  "GET /returns",
  "POST /returns/create",
  "POST /returns/modify",
  "DELETE /returns",
  "GET /routing/buses",
  "GET /meters",
  "POST /master/modify",
  "POST /arrangement/insert",
  "POST /arrangement/locators",
  "POST /transport/start",
  "POST /transport/stop",
  "POST /devices/load",
  "POST /devices/load-master",
  "GET /devices/parameters",
  "POST /devices/parameter",
  "POST /devices/reorder",
  "DELETE /devices",
  "POST /mastering/apply",
  "POST /render/export",
  "POST /tracks/bounce",
  "POST /mastering/analyze-and-apply",
  "POST /mastering/remove-reverb",
  "POST /clips/midi",
  "POST /clips/consolidate",
  "DELETE /clips/midi",
  "GET /clips/notes",
  "POST /clips/humanize",
  "POST /clips/quantize",
  "POST /groove/apply",
  "POST /midi/import"
].forEach((route) => assert.ok(bridgeSource.includes(route), `${route} should be implemented`));
assert.match(bridgeSource, /schedule_message\(1, self\._drain_live_call_queue\)/);
assert.match(bridgeSource, /Automation envelope writing is not supported/);
assert.match(httpSource, /def do_DELETE\(self\):/);
assert.match(httpSource, /method in \("POST", "DELETE"\)/);
assert.match(liveApiSource, /from \.live_browser import/);
assert.match(liveApiSource, /from \.live_arrangement import/);
assert.match(liveApiSource, /from \.live_mixer import/);
assert.match(liveApiSource, /from \.live_devices import/);
assert.match(liveApiSource, /from \.live_track_operations import/);
assert.match(liveBrowserSource, /def browser_item_inventory\(browser, query, kind\):/);
assert.match(liveBrowserSource, /def browser_search_inventory\(browser, query, kind, limit\):/);
assert.match(liveBrowserSource, /Browser category is not available in this Live version/);
assert.match(liveBrowserSource, /MAX_BROWSER_SEARCH_RESULTS = 50/);
assert.match(liveBrowserSource, /def plugin_type_for_kind\(kind\):/);
assert.match(liveMixerSource, /def modify_track\(song, payload\):/);
assert.match(liveMixerSource, /def create_return_track\(song, payload\):/);
assert.match(liveMixerSource, /def delete_return_track\(song, payload\):/);
assert.match(liveMixerSource, /def list_meters\(song\):/);
assert.match(liveMixerSource, /output_meter_left/);
assert.match(liveMixerSource, /output_meter_right/);
assert.match(liveMixerSource, /output_meter_level/);
assert.match(liveMixerSource, /def modify_master_track\(song, payload\):/);
assert.match(liveCoreSource, /def parameter_db_value\(parameter\):/);
assert.match(liveSummariesSource, /"volumeRaw": volume\["raw"\]/);
assert.match(liveSummariesSource, /"volumeDb": volume\["db"\]/);
assert.doesNotMatch(liveSummariesSource, /"volumeDb": parameter_value/);
assert.doesNotMatch(liveSummariesSource, /"cueVolumeDb": parameter_value/);
assert.match(liveTrackOperationsSource, /def duplicate_track\(song, payload\):/);
assert.match(liveTrackOperationsSource, /def freeze_track\(song, payload\):/);
assert.match(liveTrackOperationsSource, /def flatten_track\(song, payload\):/);
assert.match(liveTrackOperationsSource, /def consolidate_clip\(song, payload\):/);
assert.match(liveTrackOperationsSource, /does not expose track duplication/);
assert.match(liveTrackOperationsSource, /does not expose clip consolidation/);
assert.match(liveTrackOperationsSource, /501/);
assert.match(liveDevicesSource, /def set_device_parameter\(song, payload\):/);
assert.match(liveDevicesSource, /def get_device_parameters\(song, payload\):/);
assert.match(liveDevicesSource, /def load_master_device\(song, browser, payload\):/);
assert.match(liveDevicesSource, /def reorder_device\(song, payload\):/);
assert.match(liveDevicesSource, /def delete_device\(song, payload\):/);
assert.match(liveDevicesSource, /Ableton Live API does not expose a reliable device reorder operation/);
assert.match(liveMasteringSource, /def apply_mastering_chain\(song, browser, payload\):/);
assert.match(readFileSync(`${scriptDir}/live_clips.py`, "utf8"), /def humanize_clip\(song, payload\):/);
assert.match(readFileSync(`${scriptDir}/live_clips.py`, "utf8"), /def quantize_clip\(song, payload\):/);
assert.match(readFileSync(`${scriptDir}/live_clips.py`, "utf8"), /def apply_groove\(song, payload\):/);
assert.match(readFileSync(`${scriptDir}/live_clips.py`, "utf8"), /get_notes_extended/);
assert.match(readFileSync(`${scriptDir}/live_clips.py`, "utf8"), /replace_selected_notes/);
assert.match(readFileSync(`${scriptDir}/live_clips.py`, "utf8"), /501/);
const liveArrangementSource = readFileSync(`${scriptDir}/live_arrangement.py`, "utf8");
assert.match(liveArrangementSource, /def arrangement_snapshot\(song\):/);
assert.match(liveArrangementSource, /def add_locator\(song, payload\):/);
assert.match(liveArrangementSource, /set_or_delete_cue/);
assert.match(liveArrangementSource, /Arrangement clip insertion is not supported/);

const compile = spawnSync("python3", ["-m", "py_compile", initPath, bridgePath, httpPath, liveApiPath, ...liveModulePaths], {
  encoding: "utf8",
  env: { ...process.env, PYTHONPYCACHEPREFIX: join(tmpdir(), "ableton-mcp-pycache") }
});
assert.equal(compile.status, 0, compile.stderr);

console.log("remote script static ok");
