import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { createBridgeServer } from "../bridge/http-server.js";

const bridgeServer = createBridgeServer(new DevelopmentAbletonAdapter());
await listen(bridgeServer);

const bridgeUrl = `http://127.0.0.1:${bridgeServer.address().port}`;
const env = { ...process.env, ABLETON_BRIDGE_URL: bridgeUrl };
delete env.ABLETON_MCP_DRY_RUN;

const child = spawn(process.execPath, ["src/server.js"], {
  stdio: ["pipe", "pipe", "pipe"],
  env
});

const responses = new Map();
let buffer = "";

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) {
    if (line.trim()) {
      const message = JSON.parse(line);
      responses.set(message.id, message);
    }
  }
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

try {
  await call(1, "initialize", { protocolVersion: "2024-11-05", capabilities: {} });

  const initialStatus = await toolCall(2, "ableton_get_status");
  assert.equal(initialStatus.ok, true);
  assert.equal(initialStatus.dryRun, undefined);
  assert.equal(initialStatus.tempo, 124);
  assert.equal(initialStatus.playing, false);

  const project = await toolCall(3, "ableton_get_project");
  assert.equal(project.timeSignature, "4/4");
  assert.equal(project.tracks[0].devices[0].name, "Wavetable");
  assert.equal(project.mixerContract.version, 2);
  assert.equal(project.mixerContract.safeForAutomatedMixing, true);
  assert.equal(project.mixerContract.readback.sendsDisplay.includes("display"), true);
  assert.equal(project.tracks[0].sendsDisplay.Reverb, "-12.0 dB");

  const initialProductionReport = await toolCall(78, "ableton_get_production_report");
  assert.equal(initialProductionReport.ok, true);
  assert.equal(initialProductionReport.mixerContract.safeForAutomatedMixing, true);
  assert.ok(initialProductionReport.endpointSupport.count > 0);
  assert.equal(initialProductionReport.masteringPolicy.defaultApplyMode, "replace_matching");

  const initialArrangement = await toolCall(42, "ableton_get_arrangement");
  assert.equal(initialArrangement.ok, true);
  assert.equal(initialArrangement.lengthBeats, 16);
  assert.deepEqual(initialArrangement.locators, [{ beat: 0, name: "Intro" }]);
  assert.equal(initialArrangement.sections[0].name, "Intro");

  const snapshot = await toolCall(18, "ableton_create_snapshot", { label: "before integration mutations" });
  assert.equal(snapshot.ok, true);
  assert.match(snapshot.snapshot.id, /^snap-/);
  assert.equal(snapshot.snapshot.trackCount, 2);

  const tempo = await toolCall(4, "ableton_set_tempo", { bpm: 132 });
  assert.equal(tempo.tempo, 132);

  const saved = await toolCall(15, "ableton_save_project", { label: "bridge integration test" });
  assert.equal(saved.ok, true);
  assert.equal(saved.saved, true);
  assert.deepEqual(saved.verification, { methodInvoked: true, requestedMode: "save" });

  const savedAs = await toolCall(85, "ableton_save_project", {
    path: "/tmp/ableton-mcp-bridge-contract.als",
    label: "bridge save-as integration test"
  });
  assert.equal(savedAs.saved, true);
  assert.equal(savedAs.path, "/tmp/ableton-mcp-bridge-contract.als");
  assert.deepEqual(savedAs.verification, { methodInvoked: true, requestedMode: "save_as" });

  const signature = await toolCall(16, "ableton_set_signature", { numerator: 3, denominator: 4 });
  assert.equal(signature.ok, true);
  assert.equal(signature.timeSignature, "3/4");

  const started = await toolCall(5, "ableton_start_transport");
  assert.equal(started.playing, true);
  assert.equal(started.requestedPlaying, true);
  assert.equal(started.observedPlaying, true);
  assert.equal(started.confirmed, true);

  const changedStatus = await toolCall(6, "ableton_get_status");
  assert.equal(changedStatus.tempo, 132);
  assert.equal(changedStatus.playing, true);

  const rolledBack = await toolCall(19, "ableton_rollback_snapshot", { snapshotId: snapshot.snapshot.id });
  assert.equal(rolledBack.ok, true);
  assert.equal(rolledBack.rolledBack, true);
  assert.equal(rolledBack.project.tempo, 124);
  assert.equal(rolledBack.project.timeSignature, "4/4");

  const afterRollback = await toolCall(20, "ableton_get_project");
  assert.equal(afterRollback.tempo, 124);
  assert.equal(afterRollback.timeSignature, "4/4");

  const playbackBeforeLaunch = await toolCall(80, "ableton_diagnose_playback");
  assert.equal(playbackBeforeLaunch.ok, true);
  assert.equal(playbackBeforeLaunch.session.clipCount, 1);
  assert.equal(playbackBeforeLaunch.session.launchedClipCount, 0);
  assert.ok(playbackBeforeLaunch.findings.some((finding) => finding.code === "session_clips_idle"));

  const launchedClip = await toolCall(81, "ableton_launch_clip", { trackIndex: 0, clipSlotIndex: 0 });
  assert.equal(launchedClip.ok, true);
  assert.equal(launchedClip.launched, true);
  assert.equal(launchedClip.clip.name, "Verse");

  const playbackAfterLaunch = await toolCall(82, "ableton_diagnose_playback");
  assert.equal(playbackAfterLaunch.playing, true);
  assert.equal(playbackAfterLaunch.session.launchedClipCount, 1);
  assert.equal(playbackAfterLaunch.meterSummary.hasSignal, true);
  assert.equal(playbackAfterLaunch.meterSummary.reliableForMixing, true);

  const launchedScene = await toolCall(83, "ableton_launch_scene", { sceneIndex: 0 });
  assert.equal(launchedScene.ok, true);
  assert.equal(launchedScene.clips[0].trackIndex, 0);

  const modifiedTrack = await toolCall(24, "ableton_modify_track", {
    trackIndex: 0,
    name: "Piano Main",
    volumeDb: -8,
    pan: -0.2,
    muted: false,
    solo: true,
    armed: true,
    sends: { Reverb: -18 },
    outputRouting: "Master"
  });
  assert.equal(modifiedTrack.ok, true);
  assert.equal(modifiedTrack.track.name, "Piano Main");
  assert.equal(modifiedTrack.track.volumeDb, -8);
  assert.equal(modifiedTrack.track.pan, -0.2);
  assert.equal(modifiedTrack.track.solo, true);
  assert.equal(modifiedTrack.track.sends.Reverb, -18);
  assert.equal(modifiedTrack.writeVerification.volumeDb.requestedDb, -8);
  assert.equal(modifiedTrack.writeVerification.volumeDb.rawWritten, -8);
  assert.equal(modifiedTrack.writeVerification.volumeDb.observedRaw, -8);
  assert.equal(modifiedTrack.writeVerification.volumeDb.observedDisplay, "-8.0 dB");
  assert.equal(modifiedTrack.writeVerification.volumeDb.observedDb, -8);
  assert.equal(modifiedTrack.writeVerification.volumeDb.deltaDb, 0);
  assert.equal(modifiedTrack.writeVerification.volumeDb.toleranceDb, 0.5);
  assert.equal(modifiedTrack.writeVerification.volumeDb.confirmed, true);
  assert.equal(modifiedTrack.writeVerification.sends.Reverb.withinTolerance, true);
  assert.deepEqual(modifiedTrack.warnings, []);

  const returns = await toolCall(25, "ableton_list_returns");
  assert.equal(returns.ok, true);
  assert.equal(returns.count, 2);
  assert.equal(returns.returns[0].name, "Reverb");

  const modifiedReturn = await toolCall(26, "ableton_modify_return", {
    returnIndex: 0,
    volumeDb: -14,
    pan: 0.25,
    muted: false
  });
  assert.equal(modifiedReturn.return.volumeDb, -14);
  assert.equal(modifiedReturn.return.pan, 0.25);
  assert.equal(modifiedReturn.writeVerification.volumeDb.observed, -14);
  assert.equal(modifiedReturn.writeVerification.volumeDb.withinTolerance, true);

  const createdReturn = await toolCall(32, "ableton_create_return_track", {
    name: "Parallel Crush"
  });
  assert.equal(createdReturn.ok, true);
  assert.equal(createdReturn.created, true);
  assert.equal(createdReturn.return.name, "Parallel Crush");
  assert.equal(createdReturn.return.index, 2);
  assert.equal(createdReturn.count, 3);

  const returnsAfterCreate = await toolCall(33, "ableton_list_returns");
  assert.equal(returnsAfterCreate.count, 3);
  assert.equal(returnsAfterCreate.returns[2].name, "Parallel Crush");

  const buses = await toolCall(27, "ableton_list_buses");
  assert.equal(buses.ok, true);
  assert.ok(buses.buses.some((bus) => bus.name === "Master"));
  assert.ok(buses.buses.some((bus) => bus.name === "Reverb"));
  assert.ok(buses.buses.some((bus) => bus.name === "Parallel Crush"));
  assert.ok(buses.trackRouting.every((track) => track.availableOutputs.includes("Parallel Crush")));

  const deletedReturn = await toolCall(34, "ableton_delete_return_track", {
    returnIndex: 2
  });
  assert.equal(deletedReturn.ok, true);
  assert.equal(deletedReturn.deleted, true);
  assert.equal(deletedReturn.return.name, "Parallel Crush");
  assert.equal(deletedReturn.count, 2);

  const returnsAfterDelete = await toolCall(35, "ableton_list_returns");
  assert.equal(returnsAfterDelete.count, 2);
  assert.equal(returnsAfterDelete.returns.some((candidate) => candidate.name === "Parallel Crush"), false);

  const invalidReturnCreate = await postJson(`${bridgeUrl}/returns/create`, { name: "Too Far", returnIndex: 99 }, { expectedStatus: 400 });
  assert.equal(invalidReturnCreate.ok, false);
  assert.equal(invalidReturnCreate.error, "returnIndex must be between 0 and current return count");

  const invalidReturnDelete = await deleteJson(`${bridgeUrl}/returns`, { returnIndex: 99 }, { expectedStatus: 404 });
  assert.equal(invalidReturnDelete.ok, false);
  assert.equal(invalidReturnDelete.error, "returnIndex is outside the available return track range");

  const meters = await toolCall(40, "ableton_get_meters");
  assert.equal(meters.ok, true);
  assert.equal(meters.tracks.length, 2);
  assert.equal(meters.returns.length, 2);
  assert.deepEqual(meters.tracks[0].meter, { left: 0.45, right: 0.46, level: 0.5 });
  assert.deepEqual(meters.master.meter, { left: 0.45, right: 0.46, level: 0.5 });
  assert.ok(meters.warnings.some((warning) => warning.includes("returns[0].meter.left")));

  const httpMeters = await getJson(`${bridgeUrl}/meters`);
  assert.equal(httpMeters.ok, true);
  assert.equal(httpMeters.master.type, "master");
  assert.equal(httpMeters.returns[0].type, "return");

  const modifiedMaster = await toolCall(31, "ableton_modify_master", {
    volumeDb: -2,
    pan: 0.1,
    cueVolumeDb: -18,
    muted: false
  });
  assert.equal(modifiedMaster.ok, true);
  assert.equal(modifiedMaster.master.volumeDb, -2);
  assert.equal(modifiedMaster.master.pan, 0.1);
  assert.equal(modifiedMaster.master.cueVolumeDb, -18);
  assert.deepEqual(modifiedMaster.applied, { volumeDb: -2, pan: 0.1, cueVolumeDb: -18 });
  assert.equal(modifiedMaster.writeVerification.volumeDb.withinTolerance, true);
  assert.equal(modifiedMaster.writeVerification.cueVolumeDb.withinTolerance, true);
  assert.deepEqual(modifiedMaster.warnings, ["Master mute is not supported by the development adapter"]);

  const invalidMaster = await postJson(`${bridgeUrl}/master/modify`, { volumeDb: -90 }, { expectedStatus: 400 });
  assert.equal(invalidMaster.ok, false);
  assert.equal(invalidMaster.error, "volumeDb must be a number between -70 and 12");

  const insertedArrangementClip = await toolCall(43, "ableton_insert_arrangement_clip", {
    trackIndex: 0,
    clipSlotIndex: 0,
    startBeat: 16,
    lengthBeats: 8,
    name: "Verse Arrangement"
  });
  assert.equal(insertedArrangementClip.ok, true);
  assert.equal(insertedArrangementClip.inserted, true);
  assert.equal(insertedArrangementClip.clip.trackIndex, 0);
  assert.equal(insertedArrangementClip.clip.source.type, "sessionClip");
  assert.equal(insertedArrangementClip.clip.startBeat, 16);
  assert.equal(insertedArrangementClip.arrangement.lengthBeats, 24);

  const addedLocator = await toolCall(44, "ableton_add_locator", { beat: 16, name: "Verse" });
  assert.equal(addedLocator.ok, true);
  assert.deepEqual(addedLocator.locator, { beat: 16, name: "Verse" });
  assert.ok(addedLocator.arrangement.sections.some((section) => section.name === "Verse"));

  const updatedLocator = await postJson(`${bridgeUrl}/arrangement/locators`, { beat: 16, name: "Verse 2" });
  assert.equal(updatedLocator.ok, true);
  assert.deepEqual(updatedLocator.locator, { beat: 16, name: "Verse 2" });

  const arrangementAfterMutations = await getJson(`${bridgeUrl}/arrangement`);
  assert.equal(arrangementAfterMutations.clips[0].name, "Verse Arrangement");
  assert.ok(arrangementAfterMutations.locators.some((locator) => locator.name === "Verse 2"));

  const projectAfterLocator = await toolCall(45, "ableton_get_project");
  assert.ok(projectAfterLocator.locators.some((locator) => locator.name === "Verse 2" && locator.beat === 16));

  const missingArrangementSource = await postJson(`${bridgeUrl}/arrangement/insert`, {
    trackIndex: 0,
    startBeat: 0,
    lengthBeats: 4
  }, { expectedStatus: 400 });
  assert.equal(missingArrangementSource.ok, false);
  assert.equal(missingArrangementSource.error, "clipSlotIndex, sourcePath, or sourceRef is required");

  const parameter = await toolCall(28, "ableton_set_device_parameter", {
    trackIndex: 0,
    deviceIndex: 0,
    parameter: "Filter Frequency",
    normalizedValue: 0.72
  });
  assert.equal(parameter.ok, true);
  assert.equal(parameter.parameter.value, 0.72);

  const parameterInventory = await toolCall(30, "ableton_get_device_parameters", {
    trackIndex: 0,
    deviceIndex: 0
  });
  assert.equal(parameterInventory.ok, true);
  assert.equal(parameterInventory.count, 1);
  assert.equal(parameterInventory.devices[0].name, "Wavetable");
  assert.deepEqual(parameterInventory.devices[0].parameters[0], {
    name: "Filter Frequency",
    value: 0.72,
    min: 0,
    max: 1,
    isEnabled: true
  });

  const allParameterInventory = await getJson(`${bridgeUrl}/devices/parameters?trackIndex=0`);
  assert.equal(allParameterInventory.ok, true);
  assert.equal(allParameterInventory.devices[0].parameterCount, 1);

  const returnParameter = await toolCall(75, "ableton_set_device_parameter", {
    target: "return",
    returnIndex: 0,
    deviceIndex: 0,
    parameter: "DryWet",
    normalizedValue: 0.22
  });
  assert.equal(returnParameter.ok, true);
  assert.deepEqual(returnParameter.parameter.location, { target: "return", returnIndex: 0 });
  assert.equal(returnParameter.parameter.value, 0.22);

  const returnParameterInventory = await toolCall(76, "ableton_get_device_parameters", {
    target: "return",
    returnIndex: 0,
    deviceIndex: 0
  });
  assert.equal(returnParameterInventory.ok, true);
  assert.deepEqual(returnParameterInventory.location, { target: "return", returnIndex: 0 });
  assert.equal(returnParameterInventory.devices[0].parameters[0].value, 0.22);

  const tempoAutomation = await toolCall(70, "ableton_set_automation", {
    target: "tempo",
    points: [
      { beat: 8, value: 128 },
      { beat: 0, value: 124 }
    ]
  });
  assert.equal(tempoAutomation.ok, true);
  assert.equal(tempoAutomation.automation.kind, "tempo");
  assert.deepEqual(tempoAutomation.automation.points.map((point) => point.beat), [0, 8]);

  const volumeAutomation = await toolCall(71, "ableton_set_automation", {
    trackIndex: 0,
    target: "volume",
    points: [
      { beat: 16, value: -7 },
      { beat: 0, value: -12 }
    ]
  });
  assert.equal(volumeAutomation.ok, true);
  assert.equal(volumeAutomation.automation.laneId, "track:0:volume");
  assert.deepEqual(volumeAutomation.automation.points, [{ beat: 0, value: -12 }, { beat: 16, value: -7 }]);

  const panAutomation = await toolCall(72, "ableton_set_automation", {
    trackIndex: 0,
    target: "pan",
    points: [{ beat: 0, value: -0.5 }, { beat: 8, value: 0.5 }]
  });
  assert.equal(panAutomation.automation.kind, "track_pan");

  const sendAutomation = await toolCall(73, "ableton_set_automation", {
    trackIndex: 0,
    target: "send:Reverb",
    points: [{ beat: 0, value: -24 }, { beat: 12, value: -10 }]
  });
  assert.equal(sendAutomation.automation.sendName, "Reverb");

  const deviceAutomation = await toolCall(74, "ableton_set_automation", {
    trackIndex: 0,
    target: "device:0:Filter Frequency",
    points: [{ beat: 0, value: 0.25 }, { beat: 4, value: 0.75 }]
  });
  assert.equal(deviceAutomation.automation.deviceName, "Wavetable");
  assert.equal(deviceAutomation.automation.parameter, "Filter Frequency");

  const replacedVolumeAutomation = await postJson(`${bridgeUrl}/automation`, {
    trackIndex: 0,
    target: "volume",
    points: [{ beat: 4, value: -9 }]
  });
  assert.equal(replacedVolumeAutomation.ok, true);
  assert.equal(replacedVolumeAutomation.replaced, true);
  assert.deepEqual(replacedVolumeAutomation.automation.points, [{ beat: 4, value: -9 }]);

  const projectAfterAutomation = await getJson(`${bridgeUrl}/project`);
  assert.equal(projectAfterAutomation.automation.length, 5);
  assert.ok(projectAfterAutomation.automation.some((entry) => entry.laneId === "tempo"));
  assert.ok(projectAfterAutomation.automation.some((entry) => entry.laneId === "track:0:send:Reverb"));
  assert.ok(projectAfterAutomation.automation.some((entry) => entry.laneId === "track:0:device:0:Filter Frequency"));

  const missingSendAutomation = await postJson(`${bridgeUrl}/automation`, {
    trackIndex: 0,
    target: "send:Nope",
    points: [{ beat: 0, value: -12 }]
  }, { expectedStatus: 404 });
  assert.equal(missingSendAutomation.ok, false);
  assert.equal(missingSendAutomation.error, "send does not exist on track: Nope");

  const invalidVolumeAutomation = await postJson(`${bridgeUrl}/automation`, {
    trackIndex: 0,
    target: "volume",
    points: [{ beat: 0, value: -90 }]
  }, { expectedStatus: 400 });
  assert.equal(invalidVolumeAutomation.ok, false);
  assert.equal(invalidVolumeAutomation.error, "points[0].value must be a dB value between -70 and 12");

  const missingDeviceInventory = await getJson(`${bridgeUrl}/devices/parameters?trackIndex=0&deviceIndex=99`, { expectedStatus: 404 });
  assert.equal(missingDeviceInventory.ok, false);
  assert.equal(missingDeviceInventory.error, "deviceIndex is outside the available device range");

  const missingParameter = await postJson(`${bridgeUrl}/devices/parameter`, {
    trackIndex: 0,
    deviceIndex: 0,
    parameter: "No Such Parameter",
    value: 1
  }, { expectedStatus: 404 });
  assert.equal(missingParameter.ok, false);
  assert.equal(missingParameter.error, "parameter does not exist on device: No Such Parameter");

  const mastering = await toolCall(29, "ableton_apply_mastering_chain", {
    style: "transparent",
    targetLufs: -16,
    truePeakDb: -1,
    chain: [{ device: "EQ Eight", settings: { "Low Cut": 0.25 } }]
  });
  assert.equal(mastering.ok, true);
  assert.equal(mastering.mode, "replace_matching");
  assert.equal(mastering.loadedDevices[0].name, "EQ Eight");
  assert.equal(mastering.loadedDevices[0].parameters["Low Cut"], 0.25);

  const masterParameter = await toolCall(77, "ableton_set_device_parameter", {
    target: "master",
    deviceIndex: 0,
    parameter: "Low Cut",
    normalizedValue: 0.33
  });
  assert.equal(masterParameter.ok, true);
  assert.deepEqual(masterParameter.parameter.location, { target: "master" });
  assert.equal(masterParameter.parameter.value, 0.33);

  const repeatedMastering = await postJson(`${bridgeUrl}/mastering/apply`, {
    style: "transparent",
    targetLufs: -16,
    truePeakDb: -1,
    chain: [{ device: "EQ Eight", settings: { "Low Cut": 0.4 } }]
  });
  assert.equal(repeatedMastering.ok, true);
  assert.equal(repeatedMastering.mode, "replace_matching");
  assert.equal(repeatedMastering.removedDevices.length, 1);
  assert.equal(repeatedMastering.loadedDevices[0].parameters["Low Cut"], 0.4);

  const missingMastering = await postJson(`${bridgeUrl}/mastering/apply`, {
    style: "transparent",
    targetLufs: -16,
    truePeakDb: -1,
    chain: [{ device: "Missing Device", settings: {} }]
  }, { expectedStatus: 404 });
  assert.equal(missingMastering.ok, false);
  assert.match(missingMastering.error, /Mastering chain is incomplete/);

  const loadedMasterDevice = await toolCall(36, "ableton_load_master_device", {
    query: "EQ Eight",
    kind: "audio_effect",
    position: "append",
    rationale: "master bus eq"
  });
  assert.equal(loadedMasterDevice.ok, true);
  assert.equal(loadedMasterDevice.device.target, "master");
  assert.equal(loadedMasterDevice.device.selectedDevice, "EQ Eight");
  assert.equal(loadedMasterDevice.device.loadedDevice.name, "EQ Eight");
  assert.equal(loadedMasterDevice.master.devices.at(-1).name, "EQ Eight");

  const missingMasterDevice = await postJson(`${bridgeUrl}/devices/load-master`, {
    query: "Missing Device",
    kind: "audio_effect"
  }, { expectedStatus: 404 });
  assert.equal(missingMasterDevice.ok, false);
  assert.equal(missingMasterDevice.error, "No matching loadable item found for master query: Missing Device");

  const loadedTrackDevice = await toolCall(46, "ableton_load_device", {
    trackIndex: 0,
    query: "EQ Eight",
    kind: "audio_effect",
    position: "append"
  });
  assert.equal(loadedTrackDevice.ok, true);

  const reorderedTrackDevice = await toolCall(47, "ableton_reorder_device", {
    location: { target: "track", trackIndex: 0 },
    deviceIndex: 1,
    toIndex: 0
  });
  assert.equal(reorderedTrackDevice.ok, true);
  assert.equal(reorderedTrackDevice.reordered, true);
  assert.equal(reorderedTrackDevice.location.target, "track");
  assert.deepEqual(reorderedTrackDevice.devices.map((device) => device.index), [0, 1]);
  assert.deepEqual(reorderedTrackDevice.devices.map((device) => device.name), ["EQ Eight", "Wavetable"]);

  const deletedTrackDevice = await toolCall(48, "ableton_delete_device", {
    location: { target: "track", trackIndex: 0 },
    deviceIndex: 1
  });
  assert.equal(deletedTrackDevice.ok, true);
  assert.equal(deletedTrackDevice.deleted, true);
  assert.equal(deletedTrackDevice.device.name, "Wavetable");
  assert.deepEqual(deletedTrackDevice.devices.map((device) => device.index), [0]);

  const reorderedReturnDevice = await postJson(`${bridgeUrl}/devices/reorder`, {
    location: { target: "return", returnIndex: 0 },
    deviceIndex: 1,
    toIndex: 0
  });
  assert.equal(reorderedReturnDevice.ok, true);
  assert.equal(reorderedReturnDevice.location.target, "return");
  assert.deepEqual(reorderedReturnDevice.devices.map((device) => device.name), ["EQ Eight", "Hybrid Reverb"]);

  const deletedReturnDevice = await deleteJson(`${bridgeUrl}/devices`, {
    location: { target: "return", returnIndex: 0 },
    deviceIndex: 1
  });
  assert.equal(deletedReturnDevice.ok, true);
  assert.equal(deletedReturnDevice.device.name, "Hybrid Reverb");
  assert.deepEqual(deletedReturnDevice.devices.map((device) => device.index), [0]);

  const reorderedMasterDevice = await toolCall(49, "ableton_reorder_device", {
    location: { target: "master" },
    deviceIndex: 1,
    toIndex: 0
  });
  assert.equal(reorderedMasterDevice.ok, true);
  assert.equal(reorderedMasterDevice.location.target, "master");
  assert.deepEqual(reorderedMasterDevice.devices.map((device) => device.index), [0, 1]);

  const deletedMasterDevice = await deleteJson(`${bridgeUrl}/devices`, {
    location: { target: "master" },
    deviceIndex: 0
  });
  assert.equal(deletedMasterDevice.ok, true);
  assert.equal(deletedMasterDevice.location.target, "master");
  assert.equal(deletedMasterDevice.count, 1);

  const missingDeviceDelete = await deleteJson(`${bridgeUrl}/devices`, {
    location: { target: "master" },
    deviceIndex: 99
  }, { expectedStatus: 404 });
  assert.equal(missingDeviceDelete.ok, false);
  assert.equal(missingDeviceDelete.error, "deviceIndex is outside the available device range");

  const invalidDeviceReorder = await postJson(`${bridgeUrl}/devices/reorder`, {
    location: { target: "track", trackIndex: 0 },
    deviceIndex: 0,
    toIndex: 0
  }, { expectedStatus: 400 });
  assert.equal(invalidDeviceReorder.ok, false);
  assert.equal(invalidDeviceReorder.error, "toIndex must be different from deviceIndex");

  const invalidDeviceLocation = await deleteJson(`${bridgeUrl}/devices`, {
    deviceIndex: 0
  }, { expectedStatus: 400 });
  assert.equal(invalidDeviceLocation.ok, false);
  assert.equal(invalidDeviceLocation.error, "location.target must be track, return, or master");

  const plugins = await toolCall(7, "ableton_list_plugins", { kind: "instrument", query: "table" });
  assert.deepEqual(plugins.plugins.map((plugin) => plugin.name), ["Wavetable"]);
  assert.equal(plugins.filters.kind, "instrument");
  assert.equal(plugins.count, 1);

  const presetPlugins = await toolCall(21, "ableton_list_plugins", { kind: "preset", query: "concert" });
  assert.deepEqual(presetPlugins.plugins.map((plugin) => plugin.name), ["Concert Grand.adg"]);

  const effectPlugins = await toolCall(22, "ableton_list_plugins", { kind: "audio_effect", query: "reverb" });
  assert.deepEqual(effectPlugins.plugins.map((plugin) => plugin.name), ["Hybrid Reverb"]);

  const auPlugins = await toolCall(23, "ableton_list_plugins", { kind: "au", query: "labs" });
  assert.deepEqual(auPlugins.plugins.map((plugin) => plugin.name), ["LABS"]);

  const pluginRoot = await mkdtemp(join(tmpdir(), "ableton-plugin-diagnostics-"));
  await mkdir(join(pluginRoot, "VST3", "ValhallaRoom.vst3"), { recursive: true });
  await mkdir(join(pluginRoot, "Components", "Youlean Loudness Meter 2.component"), { recursive: true });
  const pluginDiagnostics = await toolCall(79, "ableton_diagnose_plugins", {
    queries: ["Valhalla", "Kontakt", "MissingFx"],
    includeDefaultDirectories: false,
    pluginDirectories: [pluginRoot]
  });
  assert.equal(pluginDiagnostics.ok, true);
  assert.equal(pluginDiagnostics.scannedDirectories[0].pluginCount, 2);
  assert.equal(pluginDiagnostics.missingFromAbletonIndex[0].query, "Valhalla");
  assert.equal(pluginDiagnostics.missingFromAbletonIndex[0].diskMatches[0].format, "vst3");
  assert.equal(pluginDiagnostics.availableInAbleton[0].query, "Kontakt");
  assert.equal(pluginDiagnostics.notInstalled[0].query, "MissingFx");
  assert.ok(pluginDiagnostics.recommendedActions.some((action) => action.includes("Rescan")));

  const browserSamples = await toolCall(41, "ableton_search_browser", { kind: "sample", query: "clap", limit: 3 });
  assert.equal(browserSamples.ok, true);
  assert.equal(browserSamples.filters.kind, "sample");
  assert.equal(browserSamples.filters.limit, 3);
  assert.deepEqual(browserSamples.results.map((item) => item.name), ["Tight Clap.wav"]);
  assert.equal(browserSamples.results[0].loadable, true);
  assert.equal(browserSamples.results[0].ref, "sample:tight-clap");
  assert.equal(browserSamples.results[0].path, "Samples/Drums/Claps/Tight Clap.wav");

  const directBrowserSearch = await getJson(`${bridgeUrl}/browser/search?kind=groove&query=swing&limit=1`);
  assert.equal(directBrowserSearch.ok, true);
  assert.equal(directBrowserSearch.count, 1);
  assert.equal(directBrowserSearch.results[0].kind, "groove");

  const wavPath = await writeTestWav();
  const audioAnalysis = await toolCall(50, "ableton_analyze_audio", { path: wavPath });
  assert.equal(audioAnalysis.ok, true);
  assert.equal(audioAnalysis.path, wavPath);
  assert.equal(audioAnalysis.format, "wav");
  assert.equal(typeof audioAnalysis.durationSeconds, "number");
  assert.equal(typeof audioAnalysis.lufs, "number");
  assert.equal(typeof audioAnalysis.truePeakDb, "number");
  assert.equal(typeof audioAnalysis.rmsDb, "number");
  assert.equal(typeof audioAnalysis.crestFactorDb, "number");
  assert.equal(audioAnalysis.clipping.detected, false);
  assert.equal(audioAnalysis.reliableForMixing, true);
  assert.equal(audioAnalysis.tool.backend, "ffmpeg-file-analysis");
  assert.equal(audioAnalysis.tool.liveMetersUsed, false);

  const mixAnalysis = await toolCall(84, "ableton_analyze_mix", {
    masterPath: wavPath,
    stems: [{ name: "Piano", path: wavPath }]
  });
  assert.equal(mixAnalysis.ok, true);
  assert.equal(mixAnalysis.reliableForMixing, true);
  assert.equal(mixAnalysis.backend.mode, "offline-file-analysis");
  assert.equal(mixAnalysis.backend.liveMetersUsed, false);
  assert.equal(mixAnalysis.summary.stemCount, 1);
  assert.equal(mixAnalysis.summary.integratedLufs, mixAnalysis.master.lufs);
  assert.equal(mixAnalysis.stems[0].name, "Piano");

  const directMixAnalysis = await postJson(`${bridgeUrl}/analysis/mix`, {
    masterPath: wavPath,
    stems: [{ name: "Strings", path: wavPath }]
  });
  assert.equal(directMixAnalysis.reliableForMixing, true);
  assert.equal(directMixAnalysis.stems[0].name, "Strings");

  const missingAudio = await postJson(`${bridgeUrl}/analysis/audio`, {
    path: "/tmp/ableton-mcp-missing.wav"
  }, { expectedStatus: 404 });
  assert.equal(missingAudio.ok, false);
  assert.match(missingAudio.error, /audio file does not exist or is not readable/);

  const renderPath = join(await mkdtemp(join(tmpdir(), "ableton-render-")), "master.wav");
  const render = await toolCall(51, "ableton_export_render", {
    outputPath: renderPath,
    scope: "master",
    startBeat: 0,
    lengthBeats: 4,
    sampleRate: 44100,
    bitDepth: 16,
    normalize: false
  });
  assert.equal(render.ok, true);
  assert.equal(render.rendered, true);
  assert.equal(render.files[0].path, renderPath);
  assert.equal((await stat(renderPath)).isFile(), true);

  const invalidRender = await postJson(`${bridgeUrl}/render/export`, {
    outputPath: "relative.wav",
    scope: "master"
  }, { expectedStatus: 400 });
  assert.equal(invalidRender.ok, false);
  assert.equal(invalidRender.error, "outputPath must be an absolute path");

  const productionReport = await toolCall(60, "ableton_get_production_report");
  assert.equal(productionReport.ok, true);
  assert.equal(productionReport.summary.trackCount, 2);
  assert.ok(Array.isArray(productionReport.risks));

  const bounceDirectory = await mkdtemp(join(tmpdir(), "ableton-bounce-"));
  const bounce = await toolCall(61, "ableton_bounce_tracks", {
    outputPath: bounceDirectory,
    trackIndices: [0],
    scope: "stems",
    lengthBeats: 2,
    sampleRate: 44100,
    bitDepth: 16
  });
  assert.equal(bounce.ok, true);
  assert.equal(bounce.bounced, true);
  assert.equal(bounce.targetTracks[0].trackIndex, 0);
  assert.equal((await stat(bounce.render.files[0].path)).isFile(), true);

  const masteringOutput = join(await mkdtemp(join(tmpdir(), "ableton-mastering-")), "analysis.wav");
  const masteringAnalysis = await toolCall(62, "ableton_analyze_and_apply_mastering", {
    outputPath: masteringOutput,
    targetLufs: -16,
    truePeakDb: -1,
    lengthBeats: 2,
    chain: [{ device: "Limiter", settings: { Ceiling: -1 } }]
  });
  assert.equal(masteringAnalysis.ok, true);
  assert.equal(masteringAnalysis.render.files[0].path, masteringOutput);
  assert.equal(masteringAnalysis.target.lufs, -16);
  assert.ok(masteringAnalysis.adjustments.some((adjustment) => adjustment.target === "master.devices"));
  assert.equal((await stat(masteringOutput)).isFile(), true);

  const beforeDuplicate = await toolCall(63, "ableton_get_project");
  const duplicatedTrack = await toolCall(64, "ableton_duplicate_track", { trackIndex: 0, name: "Piano Double" });
  assert.equal(duplicatedTrack.ok, true);
  assert.equal(duplicatedTrack.duplicated, true);
  assert.equal(duplicatedTrack.sourceTrackIndex, 0);
  assert.equal(duplicatedTrack.newTrackIndex, 1);
  assert.equal(duplicatedTrack.track.name, "Piano Double");
  assert.deepEqual(duplicatedTrack.track.devices, beforeDuplicate.tracks[0].devices);
  assert.deepEqual(duplicatedTrack.track.clips, beforeDuplicate.tracks[0].clips);
  assert.deepEqual(duplicatedTrack.track.sends, beforeDuplicate.tracks[0].sends);

  const projectAfterDuplicate = await toolCall(65, "ableton_get_project");
  assert.equal(projectAfterDuplicate.tracks[1].name, "Piano Double");
  assert.deepEqual(projectAfterDuplicate.tracks.map((track) => track.index), [0, 1, 2]);

  const invalidDuplicate = await postJson(`${bridgeUrl}/tracks/duplicate`, { trackIndex: 99 }, { expectedStatus: 404 });
  assert.equal(invalidDuplicate.ok, false);
  assert.equal(invalidDuplicate.error, "trackIndex is outside the available track range");

  const newTrack = await toolCall(8, "ableton_create_midi_track", { name: "Lead" });
  assert.equal(newTrack.ok, true);
  assert.equal(newTrack.track.name, "Lead");
  assert.equal(newTrack.track.type, "midi");

  const clip = await toolCall(9, "ableton_create_midi_clip", {
    trackIndex: 0,
    clipSlotIndex: 1,
    lengthBeats: 4,
    notes: [{ pitch: 60, start: 0, duration: 1 }]
  });
  assert.equal(clip.ok, true);
  assert.equal(clip.clip.noteCount, 1);
  assert.equal(clip.clip.notes[0].velocity, 100);

  const clipNotes = await toolCall(17, "ableton_get_clip_notes", {
    trackIndex: 0,
    clipSlotIndex: 1
  });
  assert.equal(clipNotes.ok, true);
  assert.equal(clipNotes.clip.noteCount, 1);
  assert.deepEqual(clipNotes.notes, [{ pitch: 60, start: 0, duration: 1, velocity: 100 }]);

  const consolidatedClip = await toolCall(66, "ableton_consolidate_clip", {
    trackIndex: 0,
    startBeat: 0,
    lengthBeats: 2,
    clipSlotIndex: 7,
    name: "Consolidated Range"
  });
  assert.equal(consolidatedClip.ok, true);
  assert.equal(consolidatedClip.consolidated, true);
  assert.equal(consolidatedClip.clip.slot, 7);
  assert.equal(consolidatedClip.clip.name, "Consolidated Range");
  assert.equal(consolidatedClip.clip.lengthBeats, 2);
  assert.deepEqual(consolidatedClip.clip.sourceClipSlots, [0, 1]);
  assert.deepEqual(consolidatedClip.clip.notes, [{ pitch: 60, start: 0, duration: 1, velocity: 100 }]);

  const emptyConsolidation = await postJson(`${bridgeUrl}/clips/consolidate`, {
    trackIndex: 0,
    startBeat: 64,
    lengthBeats: 4
  });
  assert.equal(emptyConsolidation.ok, true);
  assert.equal(emptyConsolidation.consolidated, false);
  assert.equal(emptyConsolidation.clip, null);

  const invalidConsolidation = await postJson(`${bridgeUrl}/clips/consolidate`, {
    trackIndex: 0,
    startBeat: 0,
    lengthBeats: 0
  }, { expectedStatus: 400 });
  assert.equal(invalidConsolidation.ok, false);
  assert.equal(invalidConsolidation.error, "lengthBeats must be greater than 0");

  const quantizeSource = await toolCall(52, "ableton_create_midi_clip", {
    trackIndex: 0,
    clipSlotIndex: 4,
    lengthBeats: 4,
    notes: [
      { pitch: 60, start: 0.13, duration: 0.47, velocity: 90 },
      { pitch: 62, start: 0.375, duration: 0.5, velocity: 80 }
    ]
  });
  assert.equal(quantizeSource.ok, true);

  const quantized = await toolCall(53, "ableton_quantize_clip", {
    trackIndex: 0,
    clipSlotIndex: 4,
    grid: "1/16",
    strength: 1
  });
  assert.equal(quantized.ok, true);
  assert.equal(quantized.operation, "quantize");
  assert.equal(quantized.changedNoteCount, 2);
  assert.deepEqual(quantized.notes.map((note) => note.start), [0.25, 0.5]);

  const humanizePayload = {
    trackIndex: 0,
    clipSlotIndex: 5,
    lengthBeats: 2,
    notes: [
      { pitch: 64, start: 0, duration: 0.25, velocity: 1 },
      { pitch: 67, start: 1.75, duration: 0.25, velocity: 127 }
    ]
  };
  await toolCall(54, "ableton_create_midi_clip", humanizePayload);
  const firstHumanized = await toolCall(55, "ableton_humanize_clip", {
    trackIndex: 0,
    clipSlotIndex: 5,
    timingAmountBeats: 0.05,
    durationAmountBeats: 0.02,
    velocityAmount: 12,
    seed: "bridge-test"
  });
  await toolCall(56, "ableton_create_midi_clip", humanizePayload);
  const secondHumanized = await toolCall(57, "ableton_humanize_clip", {
    trackIndex: 0,
    clipSlotIndex: 5,
    timingAmountBeats: 0.05,
    durationAmountBeats: 0.02,
    velocityAmount: 12,
    seed: "bridge-test"
  });
  assert.deepEqual(secondHumanized.notes, firstHumanized.notes);
  assert.ok(firstHumanized.changedNoteCount > 0);
  assert.ok(firstHumanized.notes.every((note) => note.start >= 0 && note.duration > 0 && note.velocity >= 1 && note.velocity <= 127));

  await toolCall(58, "ableton_create_midi_clip", {
    trackIndex: 0,
    clipSlotIndex: 6,
    lengthBeats: 2,
    notes: [
      { pitch: 36, start: 0, duration: 0.1, velocity: 100 },
      { pitch: 38, start: 0.25, duration: 0.1, velocity: 100 },
      { pitch: 42, start: 0.5, duration: 0.1, velocity: 100 },
      { pitch: 46, start: 0.75, duration: 0.1, velocity: 100 }
    ]
  });
  const grooved = await toolCall(59, "ableton_apply_groove", {
    trackIndex: 0,
    clipSlotIndex: 6,
    grid: "1/16",
    amount: 1,
    swing: 0.5
  });
  assert.equal(grooved.ok, true);
  assert.equal(grooved.operation, "groove");
  assert.equal(grooved.changedNoteCount, 2);
  assert.deepEqual(grooved.notes.map((note) => note.start), [0, 0.375, 0.5, 0.875]);

  const invalidHumanize = await postJson(`${bridgeUrl}/clips/humanize`, {
    trackIndex: 0,
    clipSlotIndex: 5,
    timingAmountBeats: 0.5
  }, { expectedStatus: 400 });
  assert.equal(invalidHumanize.ok, false);
  assert.equal(invalidHumanize.error, "timingAmountBeats must be a number between 0 and 0.25");

  const uneditableClip = await postJson(`${bridgeUrl}/clips/humanize`, {
    trackIndex: 0,
    clipSlotIndex: 0,
    timingAmountBeats: 0.01
  }, { expectedStatus: 501 });
  assert.equal(uneditableClip.ok, false);
  assert.equal(uneditableClip.error, "clip does not expose editable MIDI notes");

  const deletedClip = await toolCall(10, "ableton_delete_clip", {
    trackIndex: 0,
    clipSlotIndex: 1
  });
  assert.equal(deletedClip.ok, true);
  assert.equal(deletedClip.deleted, true);
  assert.equal(deletedClip.clip.slot, 1);

  const afterDelete = await toolCall(11, "ableton_get_project");
  assert.equal(afterDelete.tracks[0].clips.some((candidate) => candidate.slot === 1), false);

  const missingClip = await toolCall(12, "ableton_delete_clip", {
    trackIndex: 0,
    clipSlotIndex: 1
  });
  assert.equal(missingClip.ok, true);
  assert.equal(missingClip.deleted, false);

  const midiPath = await writeTestMidi();
  const imported = await toolCall(13, "ableton_import_midi", {
    path: midiPath,
    trackIndex: 0,
    clipSlotIndex: 2
  });
  assert.equal(imported.ok, true);
  assert.equal(imported.imported.noteCount, 1);
  assert.equal(imported.clip.clip.slot, 2);

  const bridgeImport = await postJson(`${bridgeUrl}/midi/import`, {
    path: midiPath,
    trackIndex: 0,
    clipSlotIndex: 3
  });
  assert.equal(bridgeImport.ok, true);
  assert.equal(bridgeImport.imported.mode, "deterministic-development-import");

  const frozenTrack = await toolCall(67, "ableton_freeze_track", { trackIndex: 0 });
  assert.equal(frozenTrack.ok, true);
  assert.equal(frozenTrack.frozen, true);
  assert.equal(frozenTrack.track.frozen, true);

  const flattenedTrack = await toolCall(68, "ableton_flatten_track", { trackIndex: 0 });
  assert.equal(flattenedTrack.ok, true);
  assert.equal(flattenedTrack.flattened, true);
  assert.equal(flattenedTrack.audio, true);
  assert.equal(flattenedTrack.track.type, "audio");
  assert.equal(flattenedTrack.track.devices.length, 0);

  const invalidFreeze = await postJson(`${bridgeUrl}/tracks/freeze`, { trackIndex: 99 }, { expectedStatus: 404 });
  assert.equal(invalidFreeze.ok, false);
  assert.equal(invalidFreeze.error, "trackIndex is outside the available track range");

  const rollbackFailure = await postJson(`${bridgeUrl}/project/rollback`, { snapshotId: "missing" }, { expectedStatus: 404 });
  assert.equal(rollbackFailure.ok, false);
  assert.equal(rollbackFailure.error, "snapshotId does not exist");

  const stopped = await toolCall(14, "ableton_stop_transport");
  assert.equal(stopped.playing, false);
  assert.equal(stopped.requestedPlaying, false);
  assert.equal(stopped.observedPlaying, false);
  assert.equal(stopped.confirmed, true);

  console.log("bridge ok");
} finally {
  child.kill();
  await close(bridgeServer);
}

async function toolCall(id, name, args = {}) {
  const response = await call(id, "tools/call", { name, arguments: args });
  assert.equal(response.result.content[0].type, "text");
  return JSON.parse(response.result.content[0].text);
}

function call(id, method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return waitFor(id);
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

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function writeTestMidi() {
  const directory = await mkdtemp(join(tmpdir(), "ableton-midi-"));
  const filePath = join(directory, "one-note.mid");
  await writeFile(filePath, Buffer.from([
    0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
    0x00, 0x00, 0x00, 0x01, 0x01, 0xe0,
    0x4d, 0x54, 0x72, 0x6b, 0x00, 0x00, 0x00, 0x0d,
    0x00, 0x90, 0x3c, 0x64,
    0x83, 0x60, 0x80, 0x3c, 0x00,
    0x00, 0xff, 0x2f, 0x00
  ]));
  return filePath;
}

async function writeTestWav() {
  const directory = await mkdtemp(join(tmpdir(), "ableton-audio-"));
  const filePath = join(directory, "tone.wav");
  const sampleRate = 44100;
  const seconds = 0.25;
  const sampleCount = Math.floor(sampleRate * seconds);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const sample = Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.2;
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + (index * 2));
  }

  await writeFile(filePath, buffer);
  return filePath;
}

async function postJson(url, payload, options = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (options.expectedStatus !== undefined) {
    assert.equal(response.status, options.expectedStatus);
  }
  return response.json();
}

async function deleteJson(url, payload, options = {}) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (options.expectedStatus !== undefined) {
    assert.equal(response.status, options.expectedStatus);
  }
  return response.json();
}

async function getJson(url, options = {}) {
  const response = await fetch(url);
  if (options.expectedStatus !== undefined) {
    assert.equal(response.status, options.expectedStatus);
  }
  return response.json();
}
