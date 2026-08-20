import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { ACTIONS } from "../src/bridge.js";
import { CapabilityResolver, normalizeCapabilityDocument } from "../src/capability-resolver.js";
import { createMcpRequestHandler } from "../src/mcp-handler.js";
import { createDispatch, tools } from "../src/tools.js";
import { TOOL_CAPABILITY_REGISTRY, validateToolCapabilityRegistry } from "../src/tool-capabilities.js";
import { createCapabilityDocument, ENDPOINT_SUPPORT, routeKey } from "../bridge/observability.js";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { routeRequest } from "../bridge/http-server.js";

const remoteCapabilities = createCapabilityDocument("remoteScript");
const developmentCapabilities = createCapabilityDocument("development");

assertCapabilityDocumentsAreComplete();
assertNodePythonCapabilityParity();
await developmentCapabilityEndpointIsReadOnly();
assertMalformedDocumentsAreRejected();
await remoteScriptListIsTruthful();
await developmentListPreservesDevelopmentTools();
await failedHandshakeIsConservative();
await unsupportedDirectCallIsBlockedBeforeDispatch();
await workflowPlansCarryCapabilityReasons();
await resolverDoesNotServeExpiredSuccessAfterFailure();
await resolverUsesOneInFlightHandshake();
assertRegistryParity();

console.log("capability-aware tools ok");

function assertCapabilityDocumentsAreComplete() {
  for (const document of [remoteCapabilities, developmentCapabilities]) {
    assert.equal(document.routes.length, ENDPOINT_SUPPORT.length);
    assert.equal(new Set(document.routes.map(({ method, path }) => routeKey(method, path))).size, ENDPOINT_SUPPORT.length);
    assert.ok(document.routes.every(({ status }) => ["supported", "conditional", "unsupported"].includes(status)));
    assert.ok(document.routes.every(({ reason }) => typeof reason === "string" && reason.length > 0));
  }
}

function assertNodePythonCapabilityParity() {
  const python = spawnSync("python3", ["test/live_capabilities_test.py", "--json"], { encoding: "utf8" });
  assert.equal(python.status, 0, python.stderr);
  assert.deepEqual(JSON.parse(python.stdout), remoteCapabilities);
}

async function developmentCapabilityEndpointIsReadOnly() {
  const adapter = new DevelopmentAbletonAdapter();
  const before = JSON.stringify(adapter.state);
  const response = await routeRequest({ method: "GET", url: "/capabilities" }, adapter);
  assert.equal(response.mode, "deterministic-development");
  assert.equal(JSON.stringify(adapter.state), before);
}

function assertMalformedDocumentsAreRejected() {
  const cases = [
    { ...remoteCapabilities, mode: "unknown" },
    { ...remoteCapabilities, routes: remoteCapabilities.routes.slice(1) },
    { ...remoteCapabilities, routes: [...remoteCapabilities.routes, remoteCapabilities.routes[0]] },
    { ...remoteCapabilities, routes: [...remoteCapabilities.routes, { method: "GET", path: "/extra", status: "supported", reason: "extra" }] },
    { ...remoteCapabilities, routes: remoteCapabilities.routes.map((route, index) => index === 0 ? { ...route, reason: "" } : route) }
  ];
  for (const document of cases) {
    assert.throws(() => normalizeCapabilityDocument(document), /Malformed|Incomplete/);
  }
}

async function remoteScriptListIsTruthful() {
  const { handler } = fixtureHandler(remoteCapabilities);
  const listed = await handler({ method: "tools/list" });
  const byName = new Map(listed.tools.map((tool) => [tool.name, tool]));

  for (const hidden of ["ableton_export_render", "ableton_bounce_tracks", "ableton_set_automation", "ableton_reorder_device", "ableton_consolidate_clip", "ableton_analyze_and_apply_mastering"]) {
    assert.equal(byName.has(hidden), false, hidden);
  }
  for (const retained of ["ableton_import_midi", "ableton_analyze_audio", "ableton_analyze_mix", "ableton_get_bridge_observability", "ableton_evaluate_action_risk", "ableton_list_risk_policy", "ableton_list_workflow_plans", "ableton_get_status"]) {
    assert.equal(byName.has(retained), true, retained);
  }
  assert.match(byName.get("ableton_insert_arrangement_clip").description, /Conditional: Requires exact-track host callability/);
  assert.match(byName.get("ableton_insert_arrangement_clip").description, /Probe first with ableton_get_arrangement_insertion_capabilities/);
  assert.match(byName.get("ableton_create_snapshot").description, /not an Ableton Live Set file/);
  assert.match(byName.get("ableton_list_plugins").description, /not proof that a result is loadable/);
  assert.match(byName.get("ableton_get_device_parameters").description, /only parameters exposed by Live/);
  assert.match(byName.get("ableton_apply_mastering_chain").description, /requested targets, not measured results/);
  assert.match(byName.get("ableton_get_meters").description, /not guaranteed mixing evidence/);
  assert.match(byName.get("ableton_add_locator").description, /cue-point mutation support/);
  assert.match(byName.get("ableton_get_arrangement").description, /host API/);
  assert.match(byName.get("ableton_set_scene_tempo_signature_overrides").description, /Conditional: Requires readable and structurally writable properties/);
  assert.match(byName.get("ableton_set_scene_tempo_signature_overrides").description, /Probe first with ableton_get_scene_tempo_signature_capabilities/);
}

async function developmentListPreservesDevelopmentTools() {
  const { handler } = fixtureHandler(developmentCapabilities);
  const listed = await handler({ method: "tools/list" });
  const names = new Set(listed.tools.map(({ name }) => name));
  for (const retained of ["ableton_export_render", "ableton_bounce_tracks", "ableton_set_automation", "ableton_reorder_device", "ableton_consolidate_clip", "ableton_apply_mastering_chain", "ableton_analyze_and_apply_mastering"]) {
    assert.equal(names.has(retained), true, retained);
  }
}

async function failedHandshakeIsConservative() {
  for (const capabilityResponse of [{ ok: true }, null]) {
    const { handler } = fixtureHandler(capabilityResponse);
    const listed = await handler({ method: "tools/list" });
    const names = new Set(listed.tools.map(({ name }) => name));
    assert.equal(names.has("ableton_analyze_audio"), true);
    assert.equal(names.has("ableton_list_workflow_plans"), true);
    assert.equal(names.has("ableton_get_status"), false);
    assert.equal(names.has("ableton_get_scene_tempo_signature_capabilities"), false);
    assert.equal(names.has("ableton_set_scene_tempo_signature_overrides"), false);
    assert.equal(names.has("ableton_export_render"), false);
    const response = await handler({ method: "tools/call", params: { name: "ableton_get_workflow_plan", arguments: { workflowId: "render_validation" } } });
    const plan = JSON.parse(response.content[0].text).workflow;
    const render = plan.steps.find(({ toolName }) => toolName === "ableton_export_render");
    assert.equal(render.executable, false);
    assert.match(render.capabilityReason, /capability_handshake_unavailable/);
  }
}

async function unsupportedDirectCallIsBlockedBeforeDispatch() {
  const fixture = fixtureHandler(remoteCapabilities);
  await assert.rejects(
    fixture.handler({ method: "tools/call", params: { name: "ableton_export_render", arguments: {} } }),
    /POST \/render\/export: Remote Script render export is not supported/
  );
  assert.deepEqual(fixture.actionCalls, ["get_capabilities"]);
}

async function workflowPlansCarryCapabilityReasons() {
  const { handler } = fixtureHandler(remoteCapabilities);
  const response = await handler({ method: "tools/call", params: { name: "ableton_get_workflow_plan", arguments: { workflowId: "render_validation" } } });
  const plan = JSON.parse(response.content[0].text).workflow;
  const render = plan.steps.find(({ toolName }) => toolName === "ableton_export_render");
  const bounce = plan.steps.find(({ toolName }) => toolName === "ableton_bounce_tracks");
  const analysis = plan.steps.find(({ toolName }) => toolName === "ableton_analyze_audio");
  assert.deepEqual([render.availability, render.executable, render.capabilityReason], ["blocked", false, "Remote Script render export is not supported"]);
  assert.deepEqual([bounce.availability, bounce.executable, bounce.capabilityReason], ["blocked", false, "Remote Script track bounce is not supported"]);
  assert.deepEqual([analysis.availability, analysis.executable], ["supported", true]);
}

async function resolverDoesNotServeExpiredSuccessAfterFailure() {
  let now = 0;
  const responses = [developmentCapabilities, new Error("offline"), remoteCapabilities];
  const resolver = new CapabilityResolver({
    async invoke() {
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response;
    }
  }, { now: () => now, successTtlMs: 2_000, failureTtlMs: 100 });
  assert.equal((await resolver.resolve()).mode, "deterministic-development");
  now = 2_001;
  assert.equal((await resolver.resolve()).available, false);
  now = 2_102;
  assert.equal((await resolver.resolve()).mode, "ableton-remote-script");
}

async function resolverUsesOneInFlightHandshake() {
  let calls = 0;
  const resolver = new CapabilityResolver({
    async invoke() {
      calls += 1;
      await new Promise((resolve) => setImmediate(resolve));
      return developmentCapabilities;
    }
  });
  const [first, second] = await Promise.all([resolver.resolve(), resolver.resolve()]);
  assert.equal(calls, 1);
  assert.equal(first, second);
}

function assertRegistryParity() {
  const dispatch = createDispatch({ invoke: async () => ({}) });
  assert.deepEqual(validateToolCapabilityRegistry(tools.map(({ name }) => name), Object.keys(dispatch)), { ok: true, errors: [] });
  const knownRoutes = new Set(ENDPOINT_SUPPORT.map(({ method, path }) => routeKey(method, path)));
  for (const action of Object.values(ACTIONS)) {
    assert.equal(knownRoutes.has(routeKey(action.method, action.path)), true, routeKey(action.method, action.path));
  }
  assert.equal(Object.keys(TOOL_CAPABILITY_REGISTRY).length, tools.length);
}

function fixtureHandler(capabilityResponse) {
  const actionCalls = [];
  const bridge = {
    async invoke(action) {
      actionCalls.push(action);
      if (action === "get_capabilities") {
        if (capabilityResponse === null) throw new Error("offline");
        return capabilityResponse;
      }
      return { ok: true };
    }
  };
  return { actionCalls, handler: createMcpRequestHandler({ bridge, serverVersion: "test" }) };
}
