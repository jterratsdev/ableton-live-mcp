import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";

const adapter = new DevelopmentAbletonAdapter();
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
assert.deepEqual(rollbackComparableState(adapter.state), baseline);

await assert.rejects(
  () => adapter.rollbackSnapshot({ snapshotId: "missing" }),
  /snapshotId does not exist/
);

const liveSnapshotSource = await readFile("ableton_remote_scripts/AbletonMcpBridge/live_snapshots.py", "utf8");
assert.match(liveSnapshotSource, /return_track_detail/);
assert.match(liveSnapshotSource, /master_track_detail/);
assert.match(liveSnapshotSource, /Remote Script rollback records but does not restore mixer values/);
assert.match(liveSnapshotSource, /def remote_script_rollback_warnings\(snapshot\):/);

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
