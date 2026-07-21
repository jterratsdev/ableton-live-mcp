import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportDevelopmentRender } from "../bridge/development/render.js";
import { bounceTracks } from "../bridge/development/production-workflows.js";
import { createDevelopmentState } from "../bridge/development/default-state.js";

const state = createDevelopmentState();
const tempDirectory = await mkdtemp(join(tmpdir(), "ableton-render-export-"));

const masterPath = join(tempDirectory, "master.wav");
const master = await exportDevelopmentRender(state, {
  outputPath: masterPath,
  scope: "master",
  sampleRate: 44100,
  bitDepth: 16,
  lengthBeats: 2
});

assert.equal(master.ok, true);
assert.equal(master.rendered, true);
assert.equal(master.contract.scope, "master");
assert.equal(master.contract.artifact, "single_wav");
assert.equal(master.contract.remoteScript.statusCode, 501);
assert.deepEqual(master.targets, [{ targetType: "master", name: "Master" }]);
assert.equal(master.files[0].path, masterPath);
assert.equal((await stat(masterPath)).isFile(), true);

const selectedPath = join(tempDirectory, "selected.wav");
const selected = await exportDevelopmentRender(state, {
  outputPath: selectedPath,
  scope: "selected_tracks",
  trackIndices: [1],
  sampleRate: 48000,
  bitDepth: 24
});

assert.equal(selected.contract.scope, "selected_tracks");
assert.equal(selected.contract.selectionSource, "payload.trackIndices");
assert.deepEqual(selected.targets, [{ targetType: "track", trackIndex: 1, name: "Drums", type: "midi" }]);
assert.equal((await stat(selectedPath)).isFile(), true);

await assert.rejects(
  () => exportDevelopmentRender(state, {
    outputPath: join(tempDirectory, "missing-selection.wav"),
    scope: "selected_tracks"
  }),
  /selected_tracks render requires trackIndices\[\] or selected tracks in bridge state/
);

const stemsDirectory = join(tempDirectory, "stems");
const stems = await bounceTracks(state, {
  outputPath: stemsDirectory,
  trackIndices: [0],
  scope: "stems",
  includeReturnTracks: true,
  sampleRate: 44100,
  bitDepth: 16
});

assert.equal(stems.ok, true);
assert.deepEqual(stems.targetTracks, [{ targetType: "track", trackIndex: 0, name: "Piano", type: "midi" }]);
assert.deepEqual(
  stems.render.targets.map((target) => target.name),
  ["Piano", "Reverb", "Delay"]
);
assert.equal(stems.render.files.length, 3);
assert.deepEqual(await readdir(stemsDirectory), [
  "01-track-0-Piano.wav",
  "02-return-0-Reverb.wav",
  "03-return-1-Delay.wav"
]);

const duplicateStemDirectory = join(tempDirectory, "duplicate-stems");
await assert.rejects(
  () => bounceTracks(state, {
    outputPath: duplicateStemDirectory,
    trackIndices: [0, 0],
    scope: "stems"
  }),
  /trackIndices\[\] contains a duplicate track index/
);

const remoteScriptSource = await readFile("ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py", "utf8");
assert.match(remoteScriptSource, /POST \/render\/export/);
assert.match(remoteScriptSource, /render export is not supported by this bridge", 501/);
assert.match(remoteScriptSource, /track bounce is not supported by this bridge", 501/);
assert.match(remoteScriptSource, /mastering analyze-and-apply is not supported by this bridge", 501/);
