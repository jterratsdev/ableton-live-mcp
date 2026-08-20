import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { createBridgeServer } from "../bridge/http-server.js";

const python = spawnSync("python3", ["test/live_edition_capabilities_test.py"], { encoding: "utf8" });
assert.equal(python.status, 0, python.stderr || python.stdout);
assert.match(python.stdout, /live edition capacity tests ok/u);

{
  const adapter = adapterWith("lite", 8);
  const before = JSON.stringify(adapter.state.tracks);
  const status = await adapter.getStatus();
  assert.equal(status.editionCapabilities.edition.name, "lite");
  assert.deepEqual(status.editionCapabilities.audioMidiTracks, {
    current: 8,
    maximum: 8,
    remaining: 0,
    finiteLimit: true,
    atLimit: true,
    status: "at-limit"
  });
  await assert.rejects(adapter.createMidiTrack(), capacityError);
  await assert.rejects(adapter.duplicateTrack({ trackIndex: 3 }), capacityError);
  assert.equal(JSON.stringify(adapter.state.tracks), before);

  const response = await request(adapter, "/tracks/duplicate", { trackIndex: 3 });
  assert.equal(response.status, 409);
  assert.equal(response.body.errorCode, "edition_track_capacity_reached");
  assert.equal(response.body.editionCapabilities.audioMidiTracks.current, 8);
  assert.equal(JSON.stringify(adapter.state.tracks), before);
}

{
  const adapter = adapterWith("lite", 7);
  await adapter.duplicateTrack({ trackIndex: 3 });
  assert.equal(adapter.state.tracks.length, 8);
}

{
  const intro = adapterWith("intro", 16);
  await assert.rejects(intro.createMidiTrack(), capacityError);
}

for (const edition of ["standard", "suite", "unknown"]) {
  const adapter = adapterWith(edition, 8);
  await adapter.duplicateTrack({ trackIndex: 3 });
  assert.equal(adapter.state.tracks.length, 9, `${edition} must not receive the Lite cap`);
}

console.log("edition capacity contracts ok");

function capacityError(error) {
  assert.equal(error.statusCode, 409);
  assert.equal(error.details.errorCode, "edition_track_capacity_reached");
  return true;
}

function adapterWith(liveEdition, count) {
  return new DevelopmentAbletonAdapter({
    liveEdition,
    returns: [],
    tracks: Array.from({ length: count }, (_, index) => ({
      index,
      name: `Track ${index}`,
      type: "midi",
      devices: [],
      clips: [],
      sends: {}
    }))
  });
}

async function request(adapter, pathname, payload) {
  const server = createBridgeServer(adapter);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { status: response.status, body: await response.json() };
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
}
