#!/usr/bin/env node
import assert from "node:assert/strict";
import { expectJsonOk, startMcpServer } from "./live-smoke-suite.mjs";

const CONTRACT_CONFIRMATION = "I_UNDERSTAND_THIS_MUTATES_A_DISPOSABLE_LIVE_SET";
const TOLERANCE = 0.05;

validateGate();

const trackIndex = integerEnv("ABLETON_LIVE_CONTRACT_TRACK_INDEX");
const clipSlotIndex = integerEnv("ABLETON_LIVE_CONTRACT_CLIP_SLOT_INDEX");
const client = startMcpServer();
const observations = { trackIndex, clipSlotIndex };

try {
  await client.call("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "live-contract", version: "0.0.0" }
  });

  const initialProject = expectJsonOk("ableton_get_project", await client.tool("ableton_get_project"));
  const track = initialProject.tracks.find((candidate) => candidate.index === trackIndex);
  assert.ok(track, `Track ${trackIndex} does not exist.`);
  assert.ok(!track.clips.some((clip) => clip.slot === clipSlotIndex), `Clip slot ${clipSlotIndex} is not empty; refusing to overwrite it.`);

  observations.mixer = await mixerRoundTrip(client, trackIndex, track.volumeDb);
  observations.parameter = await parameterRoundTrip(client, track);
  observations.clips = await clipRoundTrip(client, trackIndex, clipSlotIndex);
  observations.inventory = await inventoryRoundTrip(client);
  observations.mastering = await optionalMasteringRoundTrip(client);

  console.log("live round-trip contracts ok");
  console.log(JSON.stringify(observations, null, 2));
} finally {
  await client.close();
}

async function mixerRoundTrip(client, targetTrackIndex, originalVolumeDb) {
  assert.equal(typeof originalVolumeDb, "number", "The selected track must expose volumeDb so it can be restored.");
  const observed = [];
  try {
    for (const target of [0, -1]) {
      expectJsonOk("ableton_modify_track", await client.tool("ableton_modify_track", { trackIndex: targetTrackIndex, volumeDb: target }));
      const project = expectJsonOk("ableton_get_project", await client.tool("ableton_get_project"));
      const actual = project.tracks.find((track) => track.index === targetTrackIndex)?.volumeDb;
      assertClose(actual, target, `track volume ${target} dB`);
      observed.push({ requested: target, observed: actual });
    }
    return { originalVolumeDb, observed };
  } finally {
    expectJsonOk("ableton_modify_track restore", await client.tool("ableton_modify_track", {
      trackIndex: targetTrackIndex,
      volumeDb: originalVolumeDb
    }));
  }
}

async function parameterRoundTrip(client, track) {
  const device = track.devices.find((candidate) => candidate.parameters.some(isWritableParameter));
  if (!device) {
    return { status: "skipped", reason: "No enabled parameter with finite bounds was found on the selected track." };
  }
  const parameter = device.parameters.find(isWritableParameter);
  const args = { trackIndex: track.index, deviceIndex: device.index, parameter: parameter.name };
  const rawTarget = parameter.min <= 0 && parameter.max >= 0 ? 0 : parameter.min + ((parameter.max - parameter.min) * 0.25);
  try {
    expectJsonOk("ableton_set_device_parameter value", await client.tool("ableton_set_device_parameter", { ...args, value: rawTarget }));
    assertClose(await readParameter(client, args), rawTarget, "raw device parameter");

    expectJsonOk("ableton_set_device_parameter normalizedValue", await client.tool("ableton_set_device_parameter", { ...args, normalizedValue: 0.75 }));
    const normalizedTarget = parameter.min + ((parameter.max - parameter.min) * 0.75);
    assertClose(await readParameter(client, args), normalizedTarget, "normalized device parameter");
    return { status: "ok", device: device.name, parameter: parameter.name, rawTarget, normalizedTarget };
  } finally {
    expectJsonOk("ableton_set_device_parameter restore", await client.tool("ableton_set_device_parameter", { ...args, value: parameter.value }));
  }
}

async function readParameter(client, args) {
  const inventory = expectJsonOk("ableton_get_device_parameters", await client.tool("ableton_get_device_parameters", args));
  return inventory.devices[0].parameters.find((parameter) => parameter.name === args.parameter)?.value;
}

async function clipRoundTrip(client, targetTrackIndex, targetClipSlotIndex) {
  const sizes = [1, 100, 1000, 2000];
  const observed = [];
  try {
    for (const size of sizes) {
      const notes = Array.from({ length: size }, (_, index) => ({
        pitch: 48 + (index % 24),
        start: index * 0.25,
        duration: 0.125,
        velocity: 40 + (index % 80)
      }));
      expectJsonOk("ableton_create_midi_clip", await client.tool("ableton_create_midi_clip", {
        trackIndex: targetTrackIndex,
        clipSlotIndex: targetClipSlotIndex,
        lengthBeats: Math.max(4, size * 0.25),
        notes
      }));
      const result = expectJsonOk("ableton_get_clip_notes", await client.tool("ableton_get_clip_notes", {
        trackIndex: targetTrackIndex,
        clipSlotIndex: targetClipSlotIndex
      }));
      assert.equal(result.notes.length, notes.length, `Expected ${size} notes after round-trip.`);
      assert.deepEqual(result.notes.map(noteContractShape), notes, `The ${size}-note clip changed during round-trip.`);
      observed.push({ requested: size, observed: result.notes.length });
    }
    return observed;
  } finally {
    const deleted = await client.tool("ableton_delete_clip", { trackIndex: targetTrackIndex, clipSlotIndex: targetClipSlotIndex });
    if (!deleted.isError) expectJsonOk("ableton_delete_clip cleanup", deleted);
  }
}

async function inventoryRoundTrip(client) {
  const result = expectJsonOk("ableton_match_preset_intent", await client.tool("ableton_match_preset_intent", {
    intent: process.env.ABLETON_LIVE_CONTRACT_PRESET_INTENT ?? "realistic piano",
    limit: 10
  }));
  for (const match of result.matches) {
    assert.equal(match.inventory?.loadable, true, `${match.name} is not backed by a loadable browser result.`);
    assert.ok(match.inventory.ref, `${match.name} is missing its resolved browser reference.`);
  }
  return { count: result.matches.length, matches: result.matches.map((match) => match.name) };
}

async function optionalMasteringRoundTrip(client) {
  const source = process.env.ABLETON_LIVE_CONTRACT_MASTERING_CHAIN;
  if (!source) return { status: "skipped", reason: "ABLETON_LIVE_CONTRACT_MASTERING_CHAIN was not provided." };
  const chain = JSON.parse(source);
  assert.ok(Array.isArray(chain) && chain.length > 0, "ABLETON_LIVE_CONTRACT_MASTERING_CHAIN must be a non-empty JSON array.");
  expectJsonOk("ableton_apply_mastering_chain", await client.tool("ableton_apply_mastering_chain", { chain, mode: "replace_all" }));
  const project = expectJsonOk("ableton_get_project", await client.tool("ableton_get_project"));
  assert.deepEqual(project.master.devices.map((device) => device.name), chain.map((step) => step.device), "Master device order does not match the requested chain.");
  return { status: "ok", devices: project.master.devices.map((device) => device.name) };
}

function isWritableParameter(parameter) {
  return parameter.isEnabled && Number.isFinite(parameter.value) && Number.isFinite(parameter.min)
    && Number.isFinite(parameter.max) && parameter.max > parameter.min;
}

function noteContractShape(note) {
  return { pitch: note.pitch, start: note.start, duration: note.duration, velocity: note.velocity };
}

function assertClose(actual, expected, label) {
  assert.equal(typeof actual, "number", `${label} read-back must be numeric.`);
  assert.ok(Math.abs(actual - expected) <= TOLERANCE, `${label}: expected ${expected}, observed ${actual}.`);
}

function integerEnv(name) {
  const value = Number(process.env[name]);
  assert.ok(Number.isInteger(value) && value >= 0, `${name} must be a non-negative integer.`);
  return value;
}

function validateGate() {
  assert.equal(process.env.ABLETON_LIVE_SMOKE, "1", "ABLETON_LIVE_SMOKE=1 is required.");
  assert.equal(process.env.ABLETON_LIVE_SMOKE_SAFE_WRITE, "1", "ABLETON_LIVE_SMOKE_SAFE_WRITE=1 is required.");
  assert.equal(process.env.ABLETON_LIVE_CONTRACT, CONTRACT_CONFIRMATION,
    `ABLETON_LIVE_CONTRACT=${CONTRACT_CONFIRMATION} is required.`);
  assert.notEqual(process.env.ABLETON_MCP_DRY_RUN, "1", "Live contracts require the real bridge.");
}
