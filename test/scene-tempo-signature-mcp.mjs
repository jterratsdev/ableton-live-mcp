import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import { createMcpRequestHandler } from "../src/mcp-handler.js";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { routeRequest } from "../bridge/http-server.js";
import { createCapabilityDocument } from "../bridge/observability.js";

async function invalidMcpRequestsStopBeforeDownstreamAction() {
  const calls = [];
  const bridge = {
    async invoke(action, payload) {
      calls.push({ action, payload });
      if (action === "get_capabilities") return createCapabilityDocument("development");
      return { ok: true };
    }
  };
  const handler = createMcpRequestHandler({ bridge, serverVersion: "test" });
  const invalid = [
    { sceneIndex: -1, tempo: { action: "clear" } },
    { sceneIndex: 0.5, tempo: { action: "clear" } },
    { sceneIndex: 0, name: "Intro", tempo: { action: "clear" } },
    { sceneIndex: 0 },
    { sceneIndex: 0, tempo: { action: "unknown" } },
    { sceneIndex: 0, tempo: { action: "clear", bpm: 120 } },
    { sceneIndex: 0, tempo: { action: "set", bpm: Number.NaN } },
    { sceneIndex: 0, tempo: { action: "set", bpm: 19.99 } },
    { sceneIndex: 0, timeSignature: { action: "set", numerator: 0, denominator: 4 } },
    { sceneIndex: 0, timeSignature: { action: "set", numerator: 4, denominator: 3 } }
  ];
  for (const args of invalid) {
    await assert.rejects(handler({
      method: "tools/call",
      params: { name: "ableton_set_scene_tempo_signature_overrides", arguments: args }
    }), (error) => error.code === -32602);
  }
  assert.ok(calls.every(({ action }) => action === "get_capabilities"));
}

async function mcpUsesOnlyAnEphemeralFixtureBridge() {
  const adapter = new CountingAdapter();
  const bridge = directHttpBridge(adapter);
  const handler = createMcpRequestHandler({ bridge, serverVersion: "test" });
  const listed = await handler({ method: "tools/list" });
  const names = new Set(listed.tools.map(({ name }) => name));
  assert.equal(names.has("ableton_get_scene_tempo_signature_capabilities"), true);
  assert.equal(names.has("ableton_set_scene_tempo_signature_overrides"), true);

  const capability = await callTool(handler, "ableton_get_scene_tempo_signature_capabilities", { sceneIndex: 0 });
  const changed = await callTool(handler, "ableton_set_scene_tempo_signature_overrides", {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 133 },
    timeSignature: { action: "set", numerator: 5, denominator: 8 }
  });

  assert.equal(capability.readOnly, true);
  assert.deepEqual(changed.changedFields, ["tempo", "tempo_enabled", "time_signature_numerator", "time_signature_denominator", "time_signature_enabled"]);
  assert.deepEqual(adapter.calls, ["getCapabilities", "getSceneCapabilities", "setSceneOverrides"]);
  assert.equal(bridge.activeBridgeCalls, 0);
}

async function malformedHttpQueriesFailWithoutAdapterCalls() {
  const adapter = new CountingAdapter();
  for (const query of ["", "?sceneIndex=-1", "?sceneIndex=1.5", "?sceneIndex=01", "?sceneIndex=0&sceneIndex=1", "?sceneIndex=0&name=Intro"]) {
    await assert.rejects(routeRequest({ method: "GET", url: `/scenes/tempo-signature-capabilities${query}` }, adapter), (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.details.errorCode, "invalid_request");
      return true;
    });
  }
  assert.equal(adapter.calls.length, 0);
}

function directHttpBridge(adapter) {
  return {
    activeBridgeCalls: 0,
    async invoke(action, payload = {}) {
      if (action === "get_capabilities") return routeRequest({ method: "GET", url: "/capabilities" }, adapter);
      if (action === "get_scene_tempo_signature_capabilities") {
        return routeRequest({ method: "GET", url: `/scenes/tempo-signature-capabilities?sceneIndex=${payload.sceneIndex}` }, adapter);
      }
      if (action === "set_scene_tempo_signature_overrides") {
        const request = Readable.from([JSON.stringify(payload)]);
        request.method = "POST";
        request.url = "/scenes/tempo-signature-overrides";
        request.headers = {};
        return routeRequest(request, adapter);
      }
      throw new Error(`Unexpected fixture action: ${action}`);
    }
  };
}

async function callTool(handler, name, args) {
  const response = await handler({ method: "tools/call", params: { name, arguments: args } });
  assert.equal(response.isError, undefined);
  return JSON.parse(response.content[0].text);
}

class CountingAdapter extends DevelopmentAbletonAdapter {
  constructor() {
    super();
    this.calls = [];
  }

  async getCapabilities() {
    this.calls.push("getCapabilities");
    return super.getCapabilities();
  }

  async getSceneTempoSignatureCapabilities(sceneIndex) {
    this.calls.push("getSceneCapabilities");
    return super.getSceneTempoSignatureCapabilities(sceneIndex);
  }

  async setSceneTempoSignatureOverrides(payload) {
    this.calls.push("setSceneOverrides");
    return super.setSceneTempoSignatureOverrides(payload);
  }
}

await invalidMcpRequestsStopBeforeDownstreamAction();
await mcpUsesOnlyAnEphemeralFixtureBridge();
await malformedHttpQueriesFailWithoutAdapterCalls();
authoritativeCopyStatesSessionOnlyEffects();

console.log("scene tempo signature MCP-to-HTTP tests ok");

function authoritativeCopyStatesSessionOnlyEffects() {
  const sources = [
    readFileSync("src/scene-tempo-signature-tools.js", "utf8"),
    readFileSync("docs/ableton-bridge-contract.md", "utf8"),
    readFileSync("docs/ableton-python-remote-script.md", "utf8"),
    readFileSync("docs/ableton-compatibility.md", "utf8")
  ];
  for (const source of sources) {
    assert.match(source, /later (?:launched|explicit)/i);
    assert.match(source, /Arrangement/i);
    assert.match(source, /global Song/i);
  }
}
