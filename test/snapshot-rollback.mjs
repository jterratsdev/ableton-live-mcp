import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";

const adapter = new DevelopmentAbletonAdapter();
adapter.state.tracks[0].volumeRaw = 0.6831;
adapter.state.tracks[1].volumeRaw = 0.6412;
adapter.state.tracks[0].sendsRaw = { 0: 0.11, 1: 0.22 };
adapter.state.returns[0].volumeRaw = 0.61;
adapter.state.returns[0].sendsRaw = { 0: 0.12 };
adapter.state.master.volumeRaw = 0.85;
adapter.state.master.cueVolumeRaw = 0.42;
const baseline = rollbackComparableState(adapter.state);

const snapshot = await adapter.createSnapshot({ label: "before guarded edit" });

assert.equal(snapshot.ok, true);
assert.equal(snapshot.snapshot.mode, "deterministic-development-memory");
assert.equal(snapshot.snapshot.trackCount, 2);
assert.equal(snapshot.snapshot.coverage.tracks.mixerState, true);
assert.equal(snapshot.snapshot.coverage.tracks.sends, true);
assert.equal(snapshot.snapshot.coverage.tracks.routing, true);
assert.equal(snapshot.snapshot.coverage.tracks.devices, true);
assert.equal(snapshot.snapshot.coverage.tracks.deviceCount, 2);
assert.equal(snapshot.snapshot.coverage.returns.count, 2);
assert.equal(snapshot.snapshot.coverage.returns.deviceCount, 2);
assert.equal(snapshot.snapshot.coverage.master.devices, true);
assert.deepEqual(snapshot.snapshot.coverage.limitations, []);

await adapter.setTempo({ bpm: 142 });
await adapter.setSignature({ numerator: 5, denominator: 4 });
await adapter.startTransport();
await adapter.modifyTrack({
  trackIndex: 0,
  name: "Prepared Piano",
  volumeDb: -18,
  pan: -0.35,
  muted: true,
  solo: true,
  armed: true,
  sends: { Reverb: -30 },
  inputRouting: "No Input",
  outputRouting: "Reverb"
});
await adapter.setAutomation({
  trackIndex: 0,
  target: "send:Reverb",
  points: [{ beat: 0, value: -24 }]
});
await adapter.loadDevice({ trackIndex: 0, query: "EQ Eight", kind: "audio_effect", position: "append" });
await adapter.deleteDevice({ location: { target: "track", trackIndex: 1 }, deviceIndex: 0 });
await adapter.modifyReturn({ returnIndex: 0, name: "Long Hall", volumeDb: -20, pan: 0.4, muted: true, solo: true });
await adapter.createReturn({ name: "Parallel Crush" });
await adapter.modifyMaster({ volumeDb: -3, pan: 0.2, cueVolumeDb: -16 });
await adapter.loadMasterDevice({ query: "EQ Eight", kind: "audio_effect", position: "append" });
await adapter.applyMasteringChain({
  style: "warm",
  targetLufs: -14,
  truePeakDb: -1,
  chain: [{ device: "Hybrid Reverb", settings: { DryWet: 0.12 } }]
});
await adapter.createMidiClip({
  trackIndex: 0,
  clipSlotIndex: 3,
  lengthBeats: 4,
  notes: [{ pitch: 60, start: 0, duration: 1, velocity: 100 }]
});
await adapter.insertArrangementClip({
  trackIndex: 0,
  clipSlotIndex: 0,
  startBeat: 16,
  lengthBeats: 8,
  name: "Rollback Candidate"
});
await adapter.addLocator({ beat: 16, name: "Rollback Marker" });

assert.notDeepEqual(rollbackComparableState(adapter.state), baseline);

const rollback = await adapter.rollbackSnapshot({ snapshotId: snapshot.snapshot.id });

assert.equal(rollback.ok, true);
assert.equal(rollback.rolledBack, true);
assert.equal(rollback.project.tempo, baseline.tempo);
assert.equal(rollback.project.timeSignature, baseline.timeSignature);
assert.equal(rollback.project.trackCount, baseline.tracks.length);
assert.equal(rollback.project.returnCount, baseline.returns.length);
assert.equal(rollback.project.masterDeviceCount, baseline.master.devices.length);
assert.deepEqual(rollback.snapshot.coverage.tracks, snapshot.snapshot.coverage.tracks);
assert.equal(rollback.restoration.complete, true);
assert.equal(rollback.restoration.failedCount, 0);
assert.ok(rollback.restoration.appliedCount > 0);
assert.equal(
  rollback.restoration.targets.find((target) => target.target === "track" && target.index === 0)
    .fields.find((field) => field.field === "volumeRaw").observed,
  0.6831
);
assert.deepEqual(rollbackComparableState(adapter.state), baseline);

await assert.rejects(
  () => adapter.rollbackSnapshot({ snapshotId: "missing" }),
  /snapshotId does not exist/
);

const partialAdapter = new DevelopmentAbletonAdapter();
const partialSnapshot = await partialAdapter.createSnapshot({ label: "unverifiable mixer field" });
const storedPartialSnapshot = partialAdapter.state.snapshots.find(
  (candidate) => candidate.id === partialSnapshot.snapshot.id
);
storedPartialSnapshot.project.mixerState.tracks[0].fields.volumeRaw.sourceProperty = "missingRaw";
const partialRollback = await partialAdapter.rollbackSnapshot({ snapshotId: partialSnapshot.snapshot.id });
assert.equal(partialRollback.ok, false);
assert.equal(partialRollback.rolledBack, false);
assert.equal(partialRollback.restoration.complete, false);
assert.equal(partialRollback.restoration.failedCount, 1);
assert.equal(
  partialRollback.restoration.targets[0].fields.find((field) => field.field === "volumeRaw").status,
  "failed"
);

const liveSnapshotSource = await readFile("ableton_remote_scripts/AbletonMcpBridge/live_snapshots.py", "utf8");
assert.match(liveSnapshotSource, /def restore_mixer_state\(song, snapshot\):/);
assert.match(liveSnapshotSource, /parameter\.value = expected/);
assert.match(liveSnapshotSource, /"complete": failed_count == 0/);
assert.match(liveSnapshotSource, /def remote_script_rollback_warnings\(snapshot\):/);

const liveBridgeSource = await readFile(
  "ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py",
  "utf8"
);
assert.match(liveBridgeSource, /complete = bool\(result\.get\("complete"\)\)/);
assert.match(liveBridgeSource, /"ok": complete/);
assert.match(liveBridgeSource, /"rolledBack": complete/);

const pythonResult = spawnSync("python3", ["test/live_snapshots_test.py"], {
  cwd: process.cwd(),
  encoding: "utf8"
});
assert.equal(pythonResult.status, 0, pythonResult.stderr || pythonResult.stdout);

console.log("snapshot rollback ok");

function rollbackComparableState(state) {
  return JSON.parse(JSON.stringify({
    tempo: state.tempo,
    timeSignature: state.timeSignature,
    playing: state.playing,
    tracks: state.tracks,
    returns: state.returns,
    master: state.master,
    locators: state.locators,
    arrangement: state.arrangement,
    automation: state.automation,
    loadedDevices: state.loadedDevices,
    importedMidi: state.importedMidi,
    masteringChain: state.masteringChain
  }));
}
