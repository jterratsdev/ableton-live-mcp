import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_BRIDGE_VERSION,
  ENDPOINT_SUPPORT,
  collectInstalledFileMetadata,
  createBridgeObservabilitySnapshot,
  endpointSupportSummary
} from "../bridge/observability.js";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(DEFAULT_BRIDGE_VERSION, packageJson.version);

assert.equal(new Set(ENDPOINT_SUPPORT.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).size, ENDPOINT_SUPPORT.length);
assert.ok(ENDPOINT_SUPPORT.some((endpoint) => endpoint.method === "POST" && endpoint.path === "/render/export" && endpoint.remoteScript.status === "unsupported"));
assert.ok(ENDPOINT_SUPPORT.some((endpoint) => endpoint.method === "POST" && endpoint.path === "/mastering/remove-reverb" && endpoint.development.status === "unsupported"));

const pythonEndpoints = loadPythonEndpointSupport();
assert.deepEqual(
  pythonEndpoints.map(canonicalEndpoint),
  ENDPOINT_SUPPORT.map(canonicalEndpoint)
);
const pythonSnapshot = loadPythonSnapshot();
assert.equal(pythonSnapshot.staleRuntime.status, "stale");
assert.equal(pythonSnapshot.staleRuntime.isStale, true);

const installedFiles = [{
  path: "/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/MIDI Remote Scripts/AbletonMcpBridge/AbletonMcpBridge.py",
  exists: true,
  sizeBytes: 100,
  mtimeMs: Date.parse("2026-07-20T21:10:00.000Z"),
  sha256: "a".repeat(64)
}];

const snapshot = createBridgeObservabilitySnapshot({
  processPid: 111,
  livePid: 222,
  runtimeStartedAt: "2026-07-20T21:00:00.000Z",
  installedFiles,
  lastError: {
    name: "BridgeHttpError",
    message: "Ableton Remote Script render export is not supported by this bridge",
    endpoint: "POST /render/export",
    statusCode: 501,
    at: "2026-07-20T21:05:00.000Z"
  }
});

assert.equal(snapshot.ok, true);
assert.equal(snapshot.version.bridgeVersion, packageJson.version);
assert.equal(snapshot.process.livePid, 222);
assert.equal(snapshot.endpointSupport.count, ENDPOINT_SUPPORT.length);
assert.equal(snapshot.lastError.statusCode, 501);
assert.equal(snapshot.staleRuntime.status, "stale");
assert.equal(snapshot.staleRuntime.isStale, true);

const summary = endpointSupportSummary();
assert.equal(summary.remoteScript.unsupported, ENDPOINT_SUPPORT.filter((endpoint) => endpoint.remoteScript.status === "unsupported").length);
assert.equal(summary.development.supported, ENDPOINT_SUPPORT.filter((endpoint) => endpoint.development.status === "supported").length);

const tempDir = await mkdtemp(join(tmpdir(), "ableton-observability-"));
try {
  const filePath = join(tempDir, "live_observability.py");
  const content = "observability fixture\n";
  await writeFile(filePath, content);
  await utimes(filePath, new Date("2026-07-20T21:00:00.000Z"), new Date("2026-07-20T21:00:01.000Z"));

  const [metadata] = await collectInstalledFileMetadata([filePath]);

  assert.equal(metadata.path, filePath);
  assert.equal(metadata.exists, true);
  assert.equal(metadata.sizeBytes, Buffer.byteLength(content));
  assert.equal(metadata.sha256, createHash("sha256").update(content).digest("hex"));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

const compile = spawnSync("python3", [
  "-m",
  "py_compile",
  "ableton_remote_scripts/AbletonMcpBridge/live_observability.py"
], {
  encoding: "utf8",
  env: { ...process.env, PYTHONPYCACHEPREFIX: join(tmpdir(), "ableton-mcp-pycache") }
});
assert.equal(compile.status, 0, compile.stderr);

console.log("observability ok");

function loadPythonEndpointSupport() {
  const result = spawnSync("python3", [
    "-c",
    [
      "import json",
      "import sys",
      "sys.path.insert(0, 'ableton_remote_scripts')",
      "from AbletonMcpBridge.live_observability import ENDPOINT_SUPPORT",
      "print(json.dumps(list(ENDPOINT_SUPPORT), sort_keys=True))"
    ].join("; ")
  ], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function loadPythonSnapshot() {
  const result = spawnSync("python3", [
    "-c",
    [
      "import json",
      "import sys",
      "sys.path.insert(0, 'ableton_remote_scripts')",
      "from AbletonMcpBridge.live_observability import bridge_observability",
      "snapshot = bridge_observability({'runtimeStartedAt': '2026-07-20T21:00:00.000Z', 'installedFiles': [{'path': 'AbletonMcpBridge.py', 'exists': True, 'mtimeMs': 1784581800000.0, 'sizeBytes': 1, 'sha256': 'a'}]})",
      "print(json.dumps(snapshot, sort_keys=True))"
    ].join("; ")
  ], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function canonicalEndpoint(endpoint) {
  return {
    method: endpoint.method,
    path: endpoint.path,
    riskTier: endpoint.riskTier,
    developmentStatus: endpoint.development.status,
    remoteScriptStatus: endpoint.remoteScript.status,
    remoteScriptNote: endpoint.remoteScript.note ?? null
  };
}
