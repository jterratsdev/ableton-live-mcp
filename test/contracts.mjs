import assert from "node:assert/strict";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { createBridgeServer, MAX_BODY_BYTES } from "../bridge/http-server.js";
import { createDispatch, MAX_MIDI_CLIP_NOTES, tools } from "../src/tools.js";

await parameterValuesRoundTripUnchanged();
await presetRecommendationsUseBridgeInventory();
await realisticLargeMidiClipCrossesTheLegacyLimit();
await oversizedBodiesReportMaximumAndObservedBytes();
await masteringPreservesResolvedVstAndAuOrder();
schemasExposeNumericParametersAndBoundedMidiNotes();

console.log("round-trip contracts ok");

async function parameterValuesRoundTripUnchanged() {
  const calls = [];
  const dispatch = createDispatch({ invoke: async (action, payload) => calls.push({ action, payload }) });

  await dispatch.ableton_set_device_parameter({ parameter: "Gain", value: 0 });
  await dispatch.ableton_set_device_parameter({ parameter: "Gain", value: -1 });

  assert.deepEqual(calls.map(({ payload }) => payload.value), [0, -1]);
}

async function presetRecommendationsUseBridgeInventory() {
  const inventory = [{ kind: "preset", name: "Nylon Guitar.adg", ref: "preset:installed", loadable: true }];
  const searches = [];
  const dispatch = createDispatch({
    invoke: async (action, payload) => {
      assert.equal(action, "search_browser");
      searches.push(payload);
      return {
        ok: true,
        results: payload.kind === "preset" && payload.query === "Nylon Guitar.adg" ? inventory : []
      };
    }
  });

  const result = await dispatch.ableton_match_preset_intent({ intent: "classical guitar", limit: 3 });

  assert.deepEqual(result.matches.map((match) => match.inventory.ref), ["preset:installed"]);
  assert.ok(searches.length > 1);
  assert.equal(searches.every((search) => search.limit === 1 && search.kind !== "any" && search.query), true);
}

async function realisticLargeMidiClipCrossesTheLegacyLimit() {
  const server = createBridgeServer(new DevelopmentAbletonAdapter());
  await listen(server);
  try {
    const notes = Array.from({ length: 2000 }, (_, index) => ({
      pitch: 36 + (index % 48),
      start: index * 0.125,
      duration: 0.125,
      velocity: 96
    }));
    const payload = { trackIndex: 0, clipSlotIndex: 0, lengthBeats: 256, notes };
    const encoded = JSON.stringify(payload);
    assert.ok(Buffer.byteLength(encoded) > 65536);

    const response = await fetch(serverUrl(server, "/clips/midi"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: encoded
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.clip.notes.length, 2000);
  } finally {
    await close(server);
  }
}

async function oversizedBodiesReportMaximumAndObservedBytes() {
  const server = createBridgeServer(new DevelopmentAbletonAdapter());
  await listen(server);
  try {
    const encoded = JSON.stringify({ padding: "x".repeat(MAX_BODY_BYTES) });
    const observedBytes = Buffer.byteLength(encoded);
    const response = await fetch(serverUrl(server, "/tempo"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: encoded
    });
    const body = await response.json();

    assert.equal(response.status, 413);
    assert.match(body.error, new RegExp(`maximum ${MAX_BODY_BYTES} bytes, observed ${observedBytes} bytes`, "u"));
  } finally {
    await close(server);
  }
}

async function masteringPreservesResolvedVstAndAuOrder() {
  const adapter = new DevelopmentAbletonAdapter();
  const result = await adapter.applyMasteringChain({
    style: "transparent",
    targetLufs: -16,
    truePeakDb: -1,
    mode: "replace_all",
    chain: [
      { device: "Kontakt 8", kind: "vst" },
      { device: "LABS", kind: "au" }
    ]
  });

  assert.deepEqual(result.loadedDevices.map((device) => device.name), ["Kontakt 8", "LABS"]);
  assert.equal(result.loadedDevices.length, result.mastering.chain.length);
}

function schemasExposeNumericParametersAndBoundedMidiNotes() {
  const parameterTool = tools.find((tool) => tool.name === "ableton_set_device_parameter");
  const midiTool = tools.find((tool) => tool.name === "ableton_create_midi_clip");

  assert.deepEqual(parameterTool.inputSchema.properties.value, { type: "number" });
  assert.equal(midiTool.inputSchema.properties.notes.maxItems, MAX_MIDI_CLIP_NOTES);
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

function close(server) {
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

function serverUrl(server, path) {
  return `http://127.0.0.1:${server.address().port}${path}`;
}
