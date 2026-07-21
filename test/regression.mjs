import http from "node:http";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { AbletonBridge } from "../src/bridge.js";
import { loadBridgeConfig } from "../src/config.js";

await rejectsInvalidMidiNoteValues();
await rejectsInvalidMidiImportPath();
await rejectsInvalidAudioAnalysisPath();
await rejectsInvalidClipRewriteBounds();
await rejectsInvalidTrackOperations();
await rejectsInvalidConsolidationRange();
await forwardsPluginFiltersAsQueryParams();
await forwardsBrowserSearchFiltersAsQueryParams();
await returnsDeterministicPluginInventoryFixtures();
await returnsDeterministicBrowserSearchFixtures();
await readsMetersFromDevelopmentState();
await mutatesDevelopmentArrangementState();
validatesBridgeConfig();

console.log("regression ok");

async function rejectsInvalidMidiNoteValues() {
  const child = spawn(process.execPath, ["src/server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ABLETON_MCP_DRY_RUN: "1"
    }
  });

  try {
    const response = await request(child, 1, "tools/call", {
      name: "ableton_create_midi_clip",
      arguments: {
        trackIndex: 0,
        clipSlotIndex: 0,
        lengthBeats: 4,
        notes: [{ pitch: 999, start: -1, duration: 0, velocity: 500 }]
      }
    });

    assert.equal(response.error.code, -32602);
    assert.match(response.error.message, /notes\[0\]\.pitch/);
  } finally {
    child.kill();
  }
}

async function rejectsInvalidMidiImportPath() {
  const child = spawn(process.execPath, ["src/server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ABLETON_MCP_DRY_RUN: "1"
    }
  });

  try {
    const response = await request(child, 2, "tools/call", {
      name: "ableton_import_midi",
      arguments: { path: "/tmp/not-midi.txt" }
    });

    assert.equal(response.error.code, -32602);
    assert.match(response.error.message, /path must point to a \.mid or \.midi file/);
  } finally {
    child.kill();
  }
}

async function rejectsInvalidAudioAnalysisPath() {
  const child = spawn(process.execPath, ["src/server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ABLETON_MCP_DRY_RUN: "1"
    }
  });

  try {
    const response = await request(child, 21, "tools/call", {
      name: "ableton_analyze_audio",
      arguments: { path: "relative/render.txt" }
    });

    assert.equal(response.error.code, -32602);
    assert.match(response.error.message, /path must be an absolute local file path/);
  } finally {
    child.kill();
  }
}

async function rejectsInvalidClipRewriteBounds() {
  const child = spawn(process.execPath, ["src/server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ABLETON_MCP_DRY_RUN: "1"
    }
  });

  try {
    const response = await request(child, 22, "tools/call", {
      name: "ableton_humanize_clip",
      arguments: {
        trackIndex: 0,
        clipSlotIndex: 0,
        timingAmountBeats: 0.5
      }
    });

    assert.equal(response.error.code, -32602);
    assert.match(response.error.message, /timingAmountBeats must be a number between 0 and 0\.25/);
  } finally {
    child.kill();
  }
}

async function rejectsInvalidTrackOperations() {
  const child = spawn(process.execPath, ["src/server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ABLETON_MCP_DRY_RUN: "1"
    }
  });

  try {
    const response = await request(child, 23, "tools/call", {
      name: "ableton_duplicate_track",
      arguments: { trackIndex: -1 }
    });

    assert.equal(response.error.code, -32602);
    assert.match(response.error.message, /trackIndex must be a non-negative integer/);
  } finally {
    child.kill();
  }
}

async function rejectsInvalidConsolidationRange() {
  const child = spawn(process.execPath, ["src/server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ABLETON_MCP_DRY_RUN: "1"
    }
  });

  try {
    const response = await request(child, 24, "tools/call", {
      name: "ableton_consolidate_clip",
      arguments: { trackIndex: 0, startBeat: 0, lengthBeats: 0 }
    });

    assert.equal(response.error.code, -32602);
    assert.match(response.error.message, /lengthBeats must be a number greater than 0/);
  } finally {
    child.kill();
  }
}

async function forwardsPluginFiltersAsQueryParams() {
  const seen = {};
  const server = http.createServer((req, res) => {
    seen.method = req.method;
    seen.url = req.url;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const { port } = server.address();
    const bridge = new AbletonBridge({
      baseUrl: `http://127.0.0.1:${port}`,
      dryRun: false
    });

    await bridge.invoke("list_plugins", { kind: "instrument", query: "piano" });

    assert.equal(seen.method, "GET");
    assert.equal(seen.url, "/plugins?kind=instrument&query=piano");
  } finally {
    server.close();
  }
}

async function forwardsBrowserSearchFiltersAsQueryParams() {
  const seen = {};
  const server = http.createServer((req, res) => {
    seen.method = req.method;
    seen.url = req.url;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const { port } = server.address();
    const bridge = new AbletonBridge({
      baseUrl: `http://127.0.0.1:${port}`,
      dryRun: false
    });

    await bridge.invoke("search_browser", { kind: "sample", query: "clap", limit: 3 });

    assert.equal(seen.method, "GET");
    assert.equal(seen.url, "/browser/search?kind=sample&query=clap&limit=3");
  } finally {
    server.close();
  }
}

async function returnsDeterministicPluginInventoryFixtures() {
  const { DevelopmentAbletonAdapter } = await import("../bridge/development-adapter.js");
  const adapter = new DevelopmentAbletonAdapter();

  const all = await adapter.listPlugins();
  assert.ok(all.count >= 10);
  assert.ok(all.plugins.some((plugin) => plugin.kind === "vst" && plugin.name === "Kontakt 8"));
  assert.ok(all.plugins.some((plugin) => plugin.kind === "midi_effect" && plugin.name === "Chord"));

  const racks = await adapter.listPlugins({ kind: "rack", query: "classical" });
  assert.deepEqual(racks.plugins.map((plugin) => plugin.name), ["Classical Room Rack"]);
}

async function returnsDeterministicBrowserSearchFixtures() {
  const { DevelopmentAbletonAdapter } = await import("../bridge/development-adapter.js");
  const adapter = new DevelopmentAbletonAdapter();

  const sample = await adapter.searchBrowser({ kind: "sample", query: "clap", limit: 5 });
  assert.equal(sample.ok, true);
  assert.deepEqual(sample.results.map((item) => item.name), ["Tight Clap.wav"]);
  assert.deepEqual(Object.keys(sample.results[0]).slice(0, 5), ["kind", "name", "path", "loadable", "ref"]);
  assert.equal(sample.results[0].loadable, true);

  const capped = await adapter.searchBrowser({ kind: "any", limit: 1 });
  assert.equal(capped.count, 1);
  assert.equal(capped.capped, true);
  assert.equal(capped.filters.limit, 1);
}

async function readsMetersFromDevelopmentState() {
  const { DevelopmentAbletonAdapter } = await import("../bridge/development-adapter.js");
  const adapter = new DevelopmentAbletonAdapter({
    tracks: [{
      index: 0,
      name: "Metered Track",
      type: "audio",
      meter: { left: 0.25, right: 0.5, level: 0.75 },
      devices: [],
      clips: []
    }],
    returns: [{
      index: 0,
      name: "Metered Return",
      type: "return",
      output_meter_left: 0.1,
      output_meter_right: 0.2,
      output_meter_level: 0.3,
      devices: []
    }],
    master: {
      name: "Master",
      outputMeterLeft: 0.4,
      outputMeterRight: 0.45,
      outputMeterLevel: 0.5,
      devices: []
    }
  });

  const meters = await adapter.getMeters();
  assert.deepEqual(meters.tracks[0].meter, { left: 0.25, right: 0.5, level: 0.75 });
  assert.deepEqual(meters.returns[0].meter, { left: 0.1, right: 0.2, level: 0.3 });
  assert.deepEqual(meters.master.meter, { left: 0.4, right: 0.45, level: 0.5 });
  assert.deepEqual(meters.warnings, []);
}

async function mutatesDevelopmentArrangementState() {
  const { DevelopmentAbletonAdapter } = await import("../bridge/development-adapter.js");
  const adapter = new DevelopmentAbletonAdapter();

  const inserted = await adapter.insertArrangementClip({
    trackIndex: 0,
    sourcePath: "/tmp/rendered-loop.wav",
    startBeat: 8,
    lengthBeats: 4,
    kind: "audio"
  });
  assert.equal(inserted.ok, true);
  assert.equal(inserted.clip.kind, "audio");
  assert.equal(inserted.clip.source.path, "/tmp/rendered-loop.wav");

  const locator = await adapter.addLocator({ beat: 8, name: "Drop" });
  assert.equal(locator.ok, true);
  assert.deepEqual(locator.locator, { beat: 8, name: "Drop" });

  const project = await adapter.getProject();
  assert.ok(project.locators.some((candidate) => candidate.name === "Drop" && candidate.beat === 8));

  const arrangement = await adapter.getArrangement();
  assert.equal(arrangement.clips[0].name, "rendered-loop.wav");
  assert.ok(arrangement.sections.some((section) => section.name === "Drop"));
}

function validatesBridgeConfig() {
  assert.throws(
    () => loadBridgeConfig({ baseUrl: "http://192.168.1.10:9789" }),
    /127\.0\.0\.1, localhost, or ::1/
  );
  assert.throws(
    () => loadBridgeConfig({ timeoutMs: "abc" }),
    /positive integer/
  );
  assert.equal(loadBridgeConfig({ baseUrl: "http://localhost:9789", timeoutMs: 1000 }).timeoutMs, 1000);
}

function request(child, id, method, params) {
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

  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);

  return waitFor(responses, id);
}

async function waitFor(responses, id) {
  const started = Date.now();
  while (Date.now() - started < 2000) {
    if (responses.has(id)) {
      return responses.get(id);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for response ${id}`);
}
