import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { routeRequest } from "../bridge/http-server.js";
import { createDispatch, tools, validateToolInput } from "../src/tools.js";
import { classifyEndpointRisk, classifyToolRisk } from "../src/risk-policy.js";

const midiRequest = Object.freeze({
  mode: "midi_notes",
  trackIndex: 0,
  startBeat: 8,
  lengthBeats: 4,
  name: "Lead",
  notes: Object.freeze([{ pitch: 60, start: 0, duration: 1, velocity: 96 }])
});

function capabilityDiscoveryIsReadOnlyAndTargetSpecific() {
  const adapter = new DevelopmentAbletonAdapter();
  const before = structuredClone(adapter.state);

  const result = adapter.getArrangementInsertionCapabilities(0);

  return result.then((response) => {
    assert.equal(response.readOnly, true);
    assert.equal(response.target.trackIndex, 0);
    assert.equal(response.methods.create_midi_clip.executable, true);
    assert.equal(response.methods.create_audio_clip.applicable, false);
    assert.deepEqual(adapter.state, before);
  });
}

async function explicitModesProduceExactDevelopmentReadback() {
  const adapter = new DevelopmentAbletonAdapter();

  const midi = await adapter.insertArrangementClip(midiRequest);
  const session = await adapter.insertArrangementClip({
    mode: "session_clip", trackIndex: 0, sourceTrackIndex: 0,
    sourceClipSlotIndex: 0, startBeat: 16
  });

  assert.equal(midi.deltaCount, 1);
  assert.equal(midi.noteCount, 1);
  assert.equal(midi.noteWriteMethod, "add_new_notes");
  assert.deepEqual(
    { trackIndex: midi.clip.trackIndex, startBeat: midi.clip.startBeat, lengthBeats: midi.clip.lengthBeats, name: midi.clip.name },
    { trackIndex: 0, startBeat: 8, lengthBeats: 4, name: "Lead" }
  );
  assert.deepEqual(
    { name: session.clip.name, startBeat: session.clip.startBeat, lengthBeats: session.clip.lengthBeats },
    { name: "Verse", startBeat: 16, lengthBeats: 16 }
  );
}

async function developmentBoundaryRejectsMixedModesBeforeMutation() {
  const adapter = new DevelopmentAbletonAdapter();
  const before = structuredClone(adapter.state);
  const request = jsonRequest("POST", "/arrangement/insert", {
    ...midiRequest,
    sourcePath: "/secret/should-be-rejected.wav"
  });

  await assert.rejects(
    routeRequest(request, adapter),
    (error) => error.statusCode === 400 && error.details?.errorCode === "invalid_request" && /unsupported fields/u.test(error.message)
  );
  assert.deepEqual(adapter.state, before);
}

function jsonRequest(method, path, payload) {
  const body = JSON.stringify(payload);
  const request = Readable.from([body]);
  request.method = method;
  request.url = path;
  request.headers = { "content-type": "application/json", "content-length": String(Buffer.byteLength(body)) };
  return request;
}

async function audioPathsAreValidatedAndRedacted() {
  const directory = mkdtempSync(join(tmpdir(), "ableton-arrangement-insert-"));
  const path = join(directory, "fixture.wav");
  writeFileSync(path, "fixture");
  try {
    const adapter = new DevelopmentAbletonAdapter({
      tracks: [{ index: 0, name: "Audio", type: "audio", clips: [] }]
    });
    const result = await adapter.insertArrangementClip({ mode: "audio_file", trackIndex: 0, startBeat: 2, sourcePath: path });

    assert.equal(result.clip.kind, "audio");
    assert.equal(result.clip.source.basename, "fixture.wav");
    assert.equal(JSON.stringify(result).includes(directory), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function schemasValidationDispatchAndRiskAreExplicit() {
  const capabilityTool = tools.find(({ name }) => name === "ableton_get_arrangement_insertion_capabilities");
  const insertionTool = tools.find(({ name }) => name === "ableton_insert_arrangement_clip");
  assert.equal(capabilityTool.inputSchema.additionalProperties, false);
  assert.equal(insertionTool.inputSchema.oneOf.length, 3);
  assert.deepEqual(insertionTool.inputSchema.oneOf.map(({ properties }) => properties.mode.const), ["midi_notes", "session_clip", "audio_file"]);
  validateToolInput("ableton_insert_arrangement_clip", midiRequest);
  assert.throws(() => validateToolInput("ableton_insert_arrangement_clip", { trackIndex: 0, startBeat: 0 }), /legacy_payload_unsupported/u);
  assert.throws(() => validateToolInput("ableton_insert_arrangement_clip", { ...midiRequest, sourcePath: "/tmp/x.wav" }), /unsupported fields/u);
  assert.throws(() => validateToolInput("ableton_insert_arrangement_clip", { ...midiRequest, notes: [] }), /between 1/u);
  assert.throws(() => validateToolInput("ableton_insert_arrangement_clip", { ...midiRequest, notes: [{ pitch: 60, start: 3.5, duration: 1 }] }), /beyond/u);

  const calls = [];
  const dispatch = createDispatch({ invoke: async (action, payload) => calls.push({ action, payload }) });
  dispatch.ableton_get_arrangement_insertion_capabilities({ trackIndex: 1 });
  dispatch.ableton_insert_arrangement_clip(midiRequest);
  assert.deepEqual(calls.map(({ action }) => action), ["get_arrangement_insertion_capabilities", "insert_arrangement_clip"]);
  assert.equal(classifyToolRisk("ableton_get_arrangement_insertion_capabilities").tier, "read");
  assert.equal(classifyEndpointRisk("GET /arrangement/insertion-capabilities").tier, "read");
  assert.equal(classifyToolRisk("ableton_insert_arrangement_clip").tier, "safe-write");
}

await capabilityDiscoveryIsReadOnlyAndTargetSpecific();
await explicitModesProduceExactDevelopmentReadback();
await developmentBoundaryRejectsMixedModesBeforeMutation();
await audioPathsAreValidatedAndRedacted();
schemasValidationDispatchAndRiskAreExplicit();
console.log("arrangement insertion contract tests ok");
