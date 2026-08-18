import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { createBridgeServer } from "../bridge/http-server.js";
import { AbletonBridge } from "../src/bridge.js";
import { createDispatch, tools, validateToolInput } from "../src/tools.js";

const SOURCE_TRACK_NAME = "Batería";
const SOURCE_ROUTING_TYPE = "Batería";
const SSD_DEVICE_NAME = "SSD Sampler 5";
const OUTPUT_CHANNELS = Object.freeze(["SSD 3/4", "SSD 5/6"]);

assert.ok(tools.some(({ name }) => name === "ableton_plan_plugin_output_routing"));
assert.ok(tools.some(({ name }) => name === "ableton_apply_plugin_output_routing"));

{
  const adapter = createAdapter();
  const before = JSON.stringify(adapter.state);

  const plan = await adapter.planPluginOutputRouting(planRequest());

  assert.equal(JSON.stringify(adapter.state), before, "planning must not mutate development state");
  assert.deepEqual(plan.availableOutputChannels, OUTPUT_CHANNELS);
  assert.deepEqual(plan.proposedRoutes, [
    { outputChannel: "SSD 3/4", trackName: "Batería - SSD 3/4" },
    { outputChannel: "SSD 5/6", trackName: "Batería - SSD 5/6" }
  ]);
}

{
  const adapter = createAdapter({ observableOutputs: false });

  const plan = await adapter.planPluginOutputRouting(planRequest());

  assert.equal(plan.discoveryStatus, "receiver_required");
  assert.deepEqual(plan.availableOutputChannels, []);
  assert.equal(plan.receiverRequired.required, true);
  assert.match(plan.receiverRequired.reason, /currently selected input routing type/);
}

{
  const duplicateChannels = [
    { displayName: "SSD 3/4", identifier: "ssd-first" },
    { displayName: "SSD 3/4", identifier: "ssd-second" }
  ];
  const adapter = createAdapter({ outputChannels: duplicateChannels });
  const before = JSON.stringify(adapter.state);

  await assert.rejects(
    adapter.applyPluginOutputRouting(applyRequest([
      { outputChannel: "SSD 3/4", trackName: "Batería - Ambiguous" }
    ])),
    /routing display name is ambiguous: SSD 3\/4/
  );

  assert.equal(JSON.stringify(adapter.state), before);
}

{
  const adapter = createAdapter({ routingType: { displayName: SOURCE_ROUTING_TYPE, identifier: "track-0" } });

  const plan = await adapter.planPluginOutputRouting({ ...planRequest(), sourceRoutingType: "track-0" });

  assert.equal(plan.source.sourceRoutingIdentifier, "track-0");
}

{
  const duplicateTypes = [
    { displayName: SOURCE_ROUTING_TYPE, identifier: "track-0" },
    { displayName: SOURCE_ROUTING_TYPE, identifier: "track-other" }
  ];
  const adapter = createAdapter({ sourceRoutingTypes: duplicateTypes });
  const before = JSON.stringify(adapter.state);

  await assert.rejects(
    adapter.planPluginOutputRouting(planRequest()),
    /routing display name is ambiguous: Batería/
  );
  assert.equal(JSON.stringify(adapter.state), before);

  adapter.state.tracks[1].inputRoutingType = duplicateTypes[1];
  const selected = await adapter.planPluginOutputRouting({
    ...planRequest(),
    sourceRoutingType: "track-other"
  });
  assert.equal(selected.source.sourceRoutingIdentifier, "track-other");
}

{
  const adapter = createAdapter({ observableOutputs: false });
  const before = JSON.stringify(adapter.state);

  await assert.rejects(
    adapter.planPluginOutputRouting({ ...planRequest(), sourceRoutingType: "missing-routing-type" }),
    /sourceRoutingType is not available: missing-routing-type/
  );

  assert.equal(JSON.stringify(adapter.state), before);
}

{
  const adapter = createAdapter();

  const applied = await adapter.applyPluginOutputRouting(applyRequest());

  assert.equal(applied.createdCount, 2);
  assert.deepEqual(applied.receivers.map(receiverSummary), [
    ["Batería - Kick", SOURCE_ROUTING_TYPE, "SSD 3/4", "In", true],
    ["Batería - Snare", SOURCE_ROUTING_TYPE, "SSD 5/6", "In", true]
  ]);
  assert.deepEqual(adapter.state.tracks.slice(-2).map(trackSummary), [
    ["Batería - Kick", SOURCE_ROUTING_TYPE, "SSD 3/4", "In"],
    ["Batería - Snare", SOURCE_ROUTING_TYPE, "SSD 5/6", "In"]
  ]);
  assert.deepEqual(adapter.state.tracks.slice(-2).map(({ monitoringState }) => monitoringState), [0, 0]);

  const repeated = await adapter.applyPluginOutputRouting(applyRequest());

  assert.equal(repeated.createdCount, 0);
  assert.equal(repeated.reusedCount, 2);
  assert.equal(adapter.state.tracks.length, 4);
}

{
  const adapter = createAdapter();
  adapter.state.tracks.push({
    index: 2,
    name: "Batería - Kick",
    type: "audio",
    inputRoutingType: "Ext. In",
    inputRoutingChannel: "1/2",
    monitoring: "Off",
    monitoringState: 2,
    devices: [],
    clips: [],
    sends: {}
  });
  const beforeCount = adapter.state.tracks.length;

  await assert.rejects(adapter.applyPluginOutputRouting(applyRequest()), /does not match requested routing/);

  assert.equal(adapter.state.tracks.length, beforeCount);
}

for (const routes of [
  [
    { outputChannel: "SSD 3/4", trackName: "One" },
    { outputChannel: "SSD 3/4", trackName: "Two" }
  ],
  [
    { outputChannel: "SSD 3/4", trackName: "Same" },
    { outputChannel: "SSD 5/6", trackName: "Same" }
  ]
]) {
  const adapter = createAdapter();

  assert.throws(
    () => validateToolInput("ableton_apply_plugin_output_routing", applyRequest(routes)),
    /routes contains duplicate/
  );
  await assert.rejects(adapter.applyPluginOutputRouting(applyRequest(routes)), /routes contains duplicate/);
}

{
  const adapter = createAdapter();
  adapter.state.tracks.push(
    { index: 2, name: "Unrelated", type: "audio", devices: [], clips: [], sends: {} },
    { index: 3, name: "Unrelated", type: "audio", devices: [], clips: [], sends: {} }
  );

  const result = await adapter.applyPluginOutputRouting(applyRequest());

  assert.equal(result.createdCount, 2);
}

{
  const server = createBridgeServer(createAdapter());
  await listen(server);
  const bridge = new AbletonBridge({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    dryRun: false
  });
  const dispatch = createDispatch(bridge);
  try {
    const plan = await dispatch.ableton_plan_plugin_output_routing(planRequest());
    const applied = await dispatch.ableton_apply_plugin_output_routing(applyRequest());

    assert.equal(plan.readOnly, true);
    assert.equal(applied.createdCount, 2);
    assert.ok(applied.receivers.every(({ verified }) => verified));
  } finally {
    await close(server);
  }
}

const python = spawnSync("python3", ["test/live_plugin_routing_test.py"], { encoding: "utf8" });
assert.equal(python.status, 0, python.stderr || python.stdout);

{
  const adapter = createAdapter();
  const beforeCount = adapter.state.tracks.length;

  await assert.rejects(
    adapter.applyPluginOutputRouting(applyRequest([
      { outputChannel: "SSD 99/100", trackName: "Batería - Unsupported" }
    ])),
    /outputChannel is not available: SSD 99\/100/
  );

  assert.equal(adapter.state.tracks.length, beforeCount);
}

{
  const adapter = createAdapter({ failureChannels: ["SSD 5/6"] });
  const beforeNames = adapter.state.tracks.map(({ name }) => name);

  await assert.rejects(adapter.applyPluginOutputRouting(applyRequest()), /Failed to route output channel: SSD 5\/6/);

  assert.deepEqual(adapter.state.tracks.map(({ name }) => name), beforeNames);
}

console.log("plugin output routing ok");

function createAdapter(options = {}) {
  const routingType = options.routingType ?? SOURCE_ROUTING_TYPE;
  const outputChannels = options.outputChannels ?? OUTPUT_CHANNELS;
  return new DevelopmentAbletonAdapter({
    tracks: [
      {
        index: 0,
        name: SOURCE_TRACK_NAME,
        type: "midi",
        devices: [{ index: 0, name: SSD_DEVICE_NAME, kind: "instrument" }],
        pluginOutputRouting: {
          sourceRoutingType: routingType,
          sourceRoutingTypes: options.sourceRoutingTypes,
          outputChannels,
          failureChannels: options.failureChannels ?? []
        },
        clips: [],
        sends: {}
      },
      {
        index: 1,
        name: "SSD routing observer",
        type: "audio",
        inputRoutingType: options.observableOutputs === false ? "Ext. In" : routingType,
        inputRoutingChannel: outputChannels[0],
        availableInputRoutingChannels: options.observableOutputs === false ? [] : outputChannels,
        monitoring: "In",
        devices: [],
        clips: [],
        sends: {}
      }
    ],
    returns: []
  });
}

function planRequest() {
  return {
    sourceTrackName: SOURCE_TRACK_NAME,
    deviceName: SSD_DEVICE_NAME,
    sourceRoutingType: SOURCE_ROUTING_TYPE
  };
}

function applyRequest(routes = [
  { outputChannel: "SSD 3/4", trackName: "Batería - Kick" },
  { outputChannel: "SSD 5/6", trackName: "Batería - Snare" }
]) {
  return { ...planRequest(), routes };
}

function receiverSummary(receiver) {
  return [
    receiver.trackName,
    receiver.sourceRoutingType,
    receiver.outputChannel,
    receiver.monitoring,
    receiver.verified
  ];
}

function trackSummary(track) {
  return [track.name, track.inputRoutingType, track.inputRoutingChannel, track.monitoring];
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
}

function close(server) {
  server.closeAllConnections?.();
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
