import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { createBridgeServer } from "../bridge/http-server.js";

const REPORT_PATH = resolve("test/evidence/ableton-bridge-smoke-report.json");

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
const stderr = [];
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
  stderr.push(chunk.toString("utf8"));
});

const report = {
  task: "ableton-bridge-real-smoke-20260716",
  generatedAt: new Date().toISOString(),
  environment: {
    bridgeUrl,
    dryRun: false,
    node: process.version,
    bridgeAdapter: "DevelopmentAbletonAdapter"
  },
  calls: [],
  observations: {},
  acceptanceCriteria: [],
  deferredExternalVerification: {
    system: "Ableton Live real adapter",
    owner: "qa + developer with Ableton Live environment",
    status: "deferred",
    rationale: "This workspace has a deterministic local bridge adapter but no running Ableton Live adapter. The smoke proves MCP-to-HTTP bridge behavior without ABLETON_MCP_DRY_RUN; live DAW verification must run when Ableton and the real adapter are available.",
    followUpTask: "Implement or attach real Ableton adapter, then rerun this smoke against that adapter."
  }
};

try {
  await call(1, "initialize", { protocolVersion: "2024-11-05", capabilities: {} });

  const initialStatus = await toolCall(2, "ableton_get_status");
  assert.equal(initialStatus.ok, true);
  assert.equal(initialStatus.dryRun, undefined);
  assert.equal(initialStatus.tempo, 124);
  assert.equal(initialStatus.playing, false);

  const project = await toolCall(3, "ableton_get_project");
  assert.equal(project.ok, true);
  assert.equal(project.timeSignature, "4/4");
  assert.equal(project.tracks[0].devices[0].name, "Wavetable");

  const tempo = await toolCall(4, "ableton_set_tempo", { bpm: 132 });
  assert.equal(tempo.ok, true);
  assert.equal(tempo.tempo, 132);

  const started = await toolCall(5, "ableton_start_transport");
  assert.equal(started.ok, true);
  assert.equal(started.playing, true);

  const changedStatus = await toolCall(6, "ableton_get_status");
  assert.equal(changedStatus.tempo, 132);
  assert.equal(changedStatus.playing, true);

  const plugins = await toolCall(7, "ableton_list_plugins", { kind: "instrument", query: "table" });
  assert.deepEqual(plugins.plugins.map((plugin) => plugin.name), ["Wavetable"]);

  const stopped = await toolCall(8, "ableton_stop_transport");
  assert.equal(stopped.ok, true);
  assert.equal(stopped.playing, false);

  report.observations = {
    initialStatus: pickStatus(initialStatus),
    projectSummary: {
      timeSignature: project.timeSignature,
      trackCount: project.tracks.length,
      firstDevice: project.tracks[0].devices[0].name
    },
    stateChange: {
      tempoBefore: initialStatus.tempo,
      tempoAfter: changedStatus.tempo,
      playingBefore: initialStatus.playing,
      playingAfterStart: changedStatus.playing,
      playingAfterStop: stopped.playing
    },
    pluginFilter: {
      request: { kind: "instrument", query: "table" },
      returnedNames: plugins.plugins.map((plugin) => plugin.name)
    }
  };
  report.acceptanceCriteria = [
    {
      criterion: "A non-dry-run smoke test exercises the MCP server through the HTTP bridge.",
      result: "pass",
      evidence: "MCP server started without ABLETON_MCP_DRY_RUN and used ABLETON_BRIDGE_URL pointing to the local bridge."
    },
    {
      criterion: "Evidence captures request/response shape and observable bridge state changes.",
      result: "pass",
      evidence: "This report includes each JSON-RPC request, MCP response content, and tempo/transport state transitions."
    },
    {
      criterion: "Any Ableton-unavailable constraint is documented with a deterministic local substitute and owner for live verification.",
      result: "deferred-external",
      evidence: "deferredExternalVerification documents the deterministic adapter substitute and live Ableton follow-up owner."
    }
  ];

  await writeReport(report);
  console.log(`bridge smoke report ok: ${REPORT_PATH}`);
} finally {
  child.kill();
  await close(bridgeServer);
}

async function toolCall(id, name, args = {}) {
  const params = { name, arguments: args };
  const response = await call(id, "tools/call", params);
  assert.equal(response.result.content[0].type, "text");
  const parsed = JSON.parse(response.result.content[0].text);
  recordCall(name, params, response, parsed);
  return parsed;
}

function call(id, method, params) {
  const request = { jsonrpc: "2.0", id, method, params };
  child.stdin.write(`${JSON.stringify(request)}\n`);
  return waitFor(id).then((response) => {
    if (method !== "tools/call") {
      recordCall(method, params, response);
    }
    return response;
  });
}

function recordCall(name, request, response, parsedContent = undefined) {
  report.calls.push({
    name,
    request,
    response: sanitizeResponse(response),
    parsedContent
  });
}

function sanitizeResponse(response) {
  if (response.result?.content?.[0]?.text) {
    return {
      jsonrpc: response.jsonrpc,
      id: response.id,
      result: {
        content: [{
          type: response.result.content[0].type,
          textJson: JSON.parse(response.result.content[0].text)
        }]
      }
    };
  }
  return response;
}

function pickStatus(status) {
  return {
    tempo: status.tempo,
    playing: status.playing,
    tracks: status.tracks
  };
}

async function writeReport(contents) {
  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({ ...contents, stderr }, null, 2)}\n`);
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
