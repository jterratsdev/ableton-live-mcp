#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const LIVE_SMOKE_ENV = "ABLETON_LIVE_SMOKE";
const SAFE_WRITE_ENV = "ABLETON_LIVE_SMOKE_SAFE_WRITE";
const DESTRUCTIVE_ENV = "ABLETON_LIVE_SMOKE_DESTRUCTIVE";
const DESTRUCTIVE_CONFIRMATION = "I_UNDERSTAND_THIS_CAN_MUTATE_OR_DELETE_LIVE_SET";
const DEFAULT_RESPONSE_TIMEOUT_MS = 15000;
const SUITES = new Set(["readonly", "safe-write", "destructive"]);

export async function runLiveSmokeSuite(suite = "readonly") {
  const selectedSuite = normalizeSuite(suite);
  validateLiveSmokeGate(selectedSuite);

  const client = startMcpServer();
  const observations = {
    suite: selectedSuite,
    bridgeUrl: process.env.ABLETON_BRIDGE_URL ?? "http://127.0.0.1:9789"
  };

  try {
    await client.call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: `live-smoke-${selectedSuite}`, version: "0.0.0" }
    });

    observations.readOnly = await runReadOnlyChecks(client);
    if (selectedSuite === "safe-write" || selectedSuite === "destructive") {
      observations.safeWrite = await runSafeWriteChecks(client, observations.readOnly.status);
    }
    if (selectedSuite === "destructive") {
      observations.destructive = await runDestructiveChecks(client);
    }

    console.log(`live smoke ${selectedSuite} ok`);
    console.log(JSON.stringify(observations, null, 2));
  } finally {
    await client.close();
  }
}

async function runReadOnlyChecks(client) {
  const status = expectJsonOk("ableton_get_status", await client.tool("ableton_get_status"));
  assertStatusShape(status);

  const project = expectJsonOk("ableton_get_project", await client.tool("ableton_get_project"));
  assertProjectShape(project);

  const meters = expectJsonOk("ableton_get_meters", await client.tool("ableton_get_meters"));
  assertArray(meters.tracks, "meters.tracks");
  assertArray(meters.returns, "meters.returns");
  assert.equal(typeof meters.master, "object", "meters.master must be an object");

  const browser = expectJsonOk("ableton_search_browser", await client.tool("ableton_search_browser", {
    kind: "any",
    limit: 5
  }));
  assertArray(browser.results, "browser.results");

  const arrangement = expectJsonOk("ableton_get_arrangement", await client.tool("ableton_get_arrangement"));
  assertArray(arrangement.locators, "arrangement.locators");
  assertArray(arrangement.clips, "arrangement.clips");

  const returns = expectJsonOk("ableton_list_returns", await client.tool("ableton_list_returns"));
  assertArray(returns.returns, "returns.returns");

  const routing = expectJsonOk("ableton_list_buses", await client.tool("ableton_list_buses"));
  assertArray(routing.buses, "routing.buses");
  assertArray(routing.trackRouting, "routing.trackRouting");

  return {
    status: {
      tempo: status.tempo,
      playing: status.playing,
      trackCount: status.tracks.length
    },
    project: {
      trackCount: project.tracks.length,
      deviceCount: project.tracks.reduce((count, track) => count + track.devices.length, 0),
      timeSignature: project.timeSignature
    },
    meters: {
      trackCount: meters.tracks.length,
      returnCount: meters.returns.length,
      warnings: meters.warnings?.length ?? 0
    },
    browser: { count: browser.count, returned: browser.results.length },
    arrangement: { locatorCount: arrangement.locators.length, clipCount: arrangement.clips.length },
    returns: { count: returns.count ?? returns.returns.length },
    routing: { busCount: routing.buses.length, routedTrackCount: routing.trackRouting.length },
    devices: await readFirstDeviceParameters(client, project)
  };
}

async function runSafeWriteChecks(client, readOnlyStatus) {
  const snapshot = summarizeOkOrUnsupported("ableton_create_snapshot", await client.tool("ableton_create_snapshot", {
    label: "live smoke safe-write checkpoint"
  }));
  const tempo = expectJsonOk("ableton_set_tempo", await client.tool("ableton_set_tempo", {
    bpm: readOnlyStatus.tempo
  }));
  assert.equal(typeof tempo.tempo, "number", "tempo response must include numeric tempo");

  const statusAfterTempo = expectJsonOk("ableton_get_status", await client.tool("ableton_get_status"));
  assert.equal(statusAfterTempo.tempo, readOnlyStatus.tempo, "safe-write tempo roundtrip must preserve original tempo");

  return {
    snapshot,
    tempoRoundtrip: {
      requested: readOnlyStatus.tempo,
      observed: statusAfterTempo.tempo
    }
  };
}

async function runDestructiveChecks(client) {
  const name = `Live Smoke Return ${Date.now()}`;
  const createReturn = summarizeOkOrUnsupported("ableton_create_return_track", await client.tool("ableton_create_return_track", {
    name
  }));

  if (createReturn.status === "unsupported") {
    return { createReturn, deleteReturn: { status: "skipped" } };
  }

  const returnIndex = createReturn.response.returnIndex ?? createReturn.response.return?.index;
  assert.equal(typeof returnIndex, "number", "created return response must include returnIndex");

  const deleted = expectJsonOk("ableton_delete_return_track", await client.tool("ableton_delete_return_track", {
    returnIndex
  }));
  assert.equal(deleted.deleted, true, "destructive return cleanup must delete the smoke return");

  return {
    createReturn: { status: "ok", returnIndex, name },
    deleteReturn: { status: "ok", returnIndex, remainingCount: deleted.count }
  };
}

async function readFirstDeviceParameters(client, project) {
  const track = project.tracks.find((candidate) => candidate.devices.length > 0);
  if (!track) {
    return { status: "skipped", reason: "No devices reported by ableton_get_project." };
  }

  const device = track.devices[0];
  const result = await client.tool("ableton_get_device_parameters", {
    trackIndex: track.index,
    deviceIndex: device.index
  });

  if (isUnsupported(result)) {
    return {
      status: "unsupported",
      trackIndex: track.index,
      deviceIndex: device.index,
      deviceName: device.name,
      detail: result.text
    };
  }

  const inventory = expectJsonOk("ableton_get_device_parameters", result);
  const parameters = inventory.parameters ?? inventory.devices?.[0]?.parameters;
  assertArray(parameters, "device parameters");
  return {
    status: "ok",
    trackIndex: track.index,
    deviceIndex: device.index,
    deviceName: device.name,
    parameterCount: parameters.length
  };
}

export function startMcpServer() {
  const env = { ...process.env };
  delete env.ABLETON_MCP_DRY_RUN;

  const child = spawn(process.execPath, ["src/server.js"], { stdio: ["pipe", "pipe", "pipe"], env });
  const responses = new Map();
  const stderr = [];
  let nextId = 1;
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
  child.stderr.on("data", (chunk) => stderr.push(chunk.toString("utf8")));

  return {
    async call(method, params) {
      const id = nextId;
      nextId += 1;
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      return waitForResponse(id, responses, stderr);
    },
    async tool(name, args = {}) {
      const response = await this.call("tools/call", { name, arguments: args });
      assert.equal(response.result?.content?.[0]?.type, "text", `${name} must return text content`);
      const text = response.result.content[0].text;
      return { name, isError: response.result.isError === true, text, json: parseJson(text) };
    },
    async close() {
      child.stdin.end();
      child.kill();
    }
  };
}

async function waitForResponse(id, responses, stderr) {
  const timeoutMs = Number(process.env.ABLETON_LIVE_SMOKE_RESPONSE_TIMEOUT_MS ?? DEFAULT_RESPONSE_TIMEOUT_MS);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (responses.has(id)) {
      return responses.get(id);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out waiting for MCP response ${id}. stderr: ${stderr.join("").trim()}`);
}

export function expectJsonOk(name, result) {
  assert.equal(result.isError, false, `${name} returned MCP error: ${result.text}`);
  assert.equal(typeof result.json, "object", `${name} must return JSON object content`);
  assert.notEqual(result.json, null, `${name} must return JSON object content`);
  assert.notEqual(result.json.ok, false, `${name} returned ok:false`);
  return result.json;
}

function summarizeOkOrUnsupported(name, result) {
  if (isUnsupported(result)) {
    return { status: "unsupported", detail: result.text };
  }
  return { status: "ok", response: expectJsonOk(name, result) };
}

function validateLiveSmokeGate(suite) {
  if (process.env[LIVE_SMOKE_ENV] !== "1") {
    throw new Error(`${LIVE_SMOKE_ENV}=1 is required before running live Ableton smoke tests.`);
  }
  if (process.env.ABLETON_MCP_DRY_RUN === "1") {
    throw new Error("Live smoke tests require real bridge mode; unset ABLETON_MCP_DRY_RUN.");
  }
  if ((suite === "safe-write" || suite === "destructive") && process.env[SAFE_WRITE_ENV] !== "1") {
    throw new Error(`${SAFE_WRITE_ENV}=1 is required for ${suite} live smoke tests.`);
  }
  if (suite === "destructive" && process.env[DESTRUCTIVE_ENV] !== DESTRUCTIVE_CONFIRMATION) {
    throw new Error(`${DESTRUCTIVE_ENV}=${DESTRUCTIVE_CONFIRMATION} is required for destructive live smoke tests.`);
  }
}

function assertStatusShape(status) {
  assert.equal(typeof status.tempo, "number", "status.tempo must be numeric");
  assert.equal(typeof status.playing, "boolean", "status.playing must be boolean");
  assertArray(status.tracks, "status.tracks");
}

function assertProjectShape(project) {
  assert.equal(typeof project.timeSignature, "string", "project.timeSignature must be a string");
  assertArray(project.tracks, "project.tracks");
  assert.ok(project.tracks.every((track) => Array.isArray(track.devices)), "project tracks must expose device arrays");
}

function assertArray(value, name) {
  assert.ok(Array.isArray(value), `${name} must be an array`);
}

export function isUnsupported(result) {
  return result.isError && /\b501\b/.test(result.text);
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function normalizeSuite(suite) {
  const normalized = suite === "read-only" ? "readonly" : suite;
  if (!SUITES.has(normalized)) {
    throw new Error(`Unknown live smoke suite "${suite}". Expected readonly, safe-write, or destructive.`);
  }
  return normalized;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLiveSmokeSuite(process.argv[2] ?? "readonly").catch((error) => { console.error(error.message); process.exitCode = 1; });
}
