import { BridgeRequestError } from "../errors.js";
import { clone, snapshotId, validateSnapshotId, validateSnapshotLabel } from "./utils.js";

const SNAPSHOT_MODE = "deterministic-development-memory";

export function createDevelopmentSnapshot(state, payload = {}) {
  const label = validateSnapshotLabel(payload);
  const project = snapshotProject(state);
  const snapshot = {
    id: snapshotId(label, state.snapshots.length),
    label,
    createdAt: new Date().toISOString(),
    project,
    coverage: snapshotCoverage(project)
  };

  state.snapshots.push(snapshot);

  return {
    ok: true,
    snapshot: {
      id: snapshot.id,
      label: snapshot.label,
      createdAt: snapshot.createdAt,
      mode: SNAPSHOT_MODE,
      trackCount: snapshot.project.tracks.length,
      coverage: clone(snapshot.coverage)
    }
  };
}

export function rollbackDevelopmentSnapshot(state, payload = {}) {
  const id = validateSnapshotId(payload);
  const snapshot = state.snapshots.find((candidate) => candidate.id === id);
  if (!snapshot) {
    throw new BridgeRequestError("snapshotId does not exist", 404);
  }

  restoreProject(state, snapshot.project);

  return {
    ok: true,
    rolledBack: true,
    snapshot: {
      id: snapshot.id,
      label: snapshot.label,
      createdAt: snapshot.createdAt,
      mode: SNAPSHOT_MODE,
      coverage: clone(snapshot.coverage ?? snapshotCoverage(snapshot.project))
    },
    project: {
      tempo: state.tempo,
      timeSignature: state.timeSignature,
      trackCount: state.tracks.length,
      returnCount: state.returns.length,
      masterDeviceCount: state.master.devices?.length ?? 0
    }
  };
}

function snapshotProject(state) {
  return {
    tempo: state.tempo,
    timeSignature: state.timeSignature,
    playing: state.playing,
    tracks: clone(state.tracks),
    returns: clone(state.returns),
    master: clone(state.master),
    locators: clone(state.locators),
    arrangement: clone(state.arrangement),
    automation: clone(state.automation),
    loadedDevices: clone(state.loadedDevices),
    importedMidi: clone(state.importedMidi),
    masteringChain: clone(state.masteringChain)
  };
}

function restoreProject(state, project) {
  state.tempo = project.tempo;
  state.timeSignature = project.timeSignature;
  state.playing = project.playing;
  state.tracks = clone(project.tracks);
  state.returns = clone(project.returns);
  state.master = clone(project.master);
  state.locators = clone(project.locators);
  state.arrangement = clone(project.arrangement);
  state.automation = clone(project.automation ?? []);
  state.loadedDevices = clone(project.loadedDevices);
  state.importedMidi = clone(project.importedMidi);
  state.masteringChain = clone(project.masteringChain);
}

function snapshotCoverage(project) {
  return {
    tempo: true,
    timeSignature: true,
    playing: true,
    tracks: coverageForTracks(project.tracks),
    returns: coverageForReturns(project.returns),
    master: coverageForMaster(project.master),
    arrangement: true,
    automation: true,
    loadedDevices: true,
    importedMidi: true,
    masteringChain: true,
    limitations: []
  };
}

function coverageForTracks(tracks) {
  return {
    count: tracks.length,
    mixerState: true,
    sends: true,
    routing: true,
    devices: true,
    clips: true,
    deviceCount: tracks.reduce((sum, track) => sum + (track.devices?.length ?? 0), 0),
    clipCount: tracks.reduce((sum, track) => sum + (track.clips?.length ?? 0), 0)
  };
}

function coverageForReturns(returns) {
  return {
    count: returns.length,
    mixerState: true,
    devices: true,
    deviceCount: returns.reduce((sum, returnTrack) => sum + (returnTrack.devices?.length ?? 0), 0)
  };
}

function coverageForMaster(master) {
  return {
    mixerState: true,
    cueVolume: true,
    devices: true,
    deviceCount: master.devices?.length ?? 0
  };
}
