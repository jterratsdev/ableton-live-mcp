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

  const restoration = restoreProject(state, snapshot.project);

  return {
    ok: restoration.complete,
    rolledBack: restoration.complete,
    restoration,
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
    masteringChain: clone(state.masteringChain),
    mixerState: snapshotMixerState(state)
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
  return verifyRestoredMixerState(state, project.mixerState ?? snapshotMixerState(project));
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

function snapshotMixerState(state) {
  return {
    tracks: state.tracks.map((track, index) => snapshotMixerTarget("track", index, track, {
      arm: true,
      sends: true
    })),
    returns: state.returns.map((returnTrack, index) => snapshotMixerTarget("return", index, returnTrack, {
      sends: true
    })),
    master: snapshotMixerTarget("master", null, state.master, {
      cueVolume: true
    })
  };
}

function snapshotMixerTarget(target, index, value, options = {}) {
  const fields = {
    volumeRaw: nativeField(value, "volumeRaw", "volumeDb"),
    panRaw: nativeField(value, "panRaw", "pan"),
    muted: nativeField(value, "muted"),
    solo: nativeField(value, "solo")
  };
  if (options.arm) {
    fields.armed = nativeField(value, "armed");
  }
  if (options.sends) {
    fields.sendsRaw = nativeField(value, "sendsRaw", "sends");
  }
  if (options.cueVolume) {
    fields.cueVolumeRaw = nativeField(value, "cueVolumeRaw", "cueVolumeDb");
  }
  return {
    target,
    index,
    name: value?.name ?? "",
    fields
  };
}

function nativeField(target, preferredProperty, developmentProperty = preferredProperty) {
  if (target && Object.hasOwn(target, preferredProperty)) {
    return {
      supported: true,
      sourceProperty: preferredProperty,
      value: clone(target[preferredProperty])
    };
  }
  if (target && Object.hasOwn(target, developmentProperty)) {
    return {
      supported: true,
      sourceProperty: developmentProperty,
      value: clone(target[developmentProperty])
    };
  }
  return {
    supported: false,
    sourceProperty: preferredProperty,
    value: null
  };
}

function verifyRestoredMixerState(state, mixerState) {
  const targets = [];
  for (const target of mixerState.tracks ?? []) {
    targets.push(verifyMixerTarget(target, state.tracks[target.index]));
  }
  for (const target of mixerState.returns ?? []) {
    targets.push(verifyMixerTarget(target, state.returns[target.index]));
  }
  if (mixerState.master) {
    targets.push(verifyMixerTarget(mixerState.master, state.master));
  }

  const appliedCount = targets.reduce((sum, target) => sum + target.summary.applied, 0);
  const skippedCount = targets.reduce((sum, target) => sum + target.summary.skipped, 0);
  const failedCount = targets.reduce((sum, target) => sum + target.summary.failed, 0);
  return {
    complete: failedCount === 0,
    appliedCount,
    skippedCount,
    failedCount,
    targets
  };
}

function verifyMixerTarget(snapshot, observedTarget) {
  const fields = [];
  if (!observedTarget) {
    fields.push(restorationField("mixerState", "failed", snapshot.fields, null, "Target no longer exists at captured index"));
    return finishMixerTarget(snapshot, null, fields);
  }

  for (const [name, captured] of Object.entries(snapshot.fields ?? {})) {
    if (!captured.supported) {
      fields.push(restorationField(name, "skipped", captured.value, null, "Field was not supported when captured"));
      continue;
    }
    const observed = cloneDefined(observedTarget[captured.sourceProperty]);
    const matches = JSON.stringify(observed) === JSON.stringify(captured.value);
    fields.push(restorationField(
      name,
      matches ? "applied" : "failed",
      captured.value,
      observed,
      matches ? undefined : `Readback from ${captured.sourceProperty} does not match captured value`
    ));
  }
  return finishMixerTarget(snapshot, observedTarget, fields);
}

function finishMixerTarget(snapshot, observedTarget, fields) {
  const summary = {
    applied: fields.filter((field) => field.status === "applied").length,
    skipped: fields.filter((field) => field.status === "skipped").length,
    failed: fields.filter((field) => field.status === "failed").length
  };
  return {
    target: snapshot.target,
    index: snapshot.index,
    snapshotName: snapshot.name,
    observedName: observedTarget?.name ?? null,
    fields,
    summary,
    complete: summary.failed === 0
  };
}

function restorationField(field, status, expected, observed, reason) {
  return {
    field,
    status,
    expected: cloneDefined(expected),
    observed: cloneDefined(observed),
    ...(reason ? { reason } : {})
  };
}

function cloneDefined(value) {
  return value === undefined ? null : clone(value);
}
