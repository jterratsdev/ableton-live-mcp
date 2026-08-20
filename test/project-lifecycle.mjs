import assert from "node:assert/strict";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { createDispatch, tools } from "../src/tools.js";
import { spawnSync } from "node:child_process";

toolsExposeProjectLifecycleOperations();
await dispatchPreservesDeleteArgumentsAndRejectsRemovedSave();
await developmentAdapterProvesDeleteReadBack();
pythonRemoteScriptContractsPass();

console.log("project lifecycle contracts ok");

function toolsExposeProjectLifecycleOperations() {
  const names = new Set(tools.map((tool) => tool.name));
  assert.equal(names.has("ableton_delete_clip"), true);
  assert.equal(names.has("ableton_save_project"), false);
}

async function dispatchPreservesDeleteArgumentsAndRejectsRemovedSave() {
  const calls = [];
  const dispatch = createDispatch({ invoke: async (action, payload) => {
    calls.push({ action, payload });
    return { ok: true };
  } });

  await dispatch.ableton_delete_clip({ trackIndex: 2, clipSlotIndex: 7 });
  assert.equal(dispatch.ableton_save_project, undefined);
  assert.deepEqual(calls, [
    { action: "delete_clip", payload: { trackIndex: 2, clipSlotIndex: 7 } }
  ]);
}

async function developmentAdapterProvesDeleteReadBack() {
  const adapter = new DevelopmentAbletonAdapter();
  await adapter.createMidiClip({
    trackIndex: 0,
    clipSlotIndex: 7,
    lengthBeats: 4,
    notes: [{ pitch: 60, start: 0, duration: 1, velocity: 100 }]
  });

  const deleted = await adapter.deleteClip({ trackIndex: 0, clipSlotIndex: 7 });
  assert.equal(deleted.deleted, true);
  await assert.rejects(adapter.getClipNotes({ trackIndex: 0, clipSlotIndex: 7 }), /does not contain a clip/u);
  assert.equal((await adapter.deleteClip({ trackIndex: 0, clipSlotIndex: 7 })).deleted, false);
}

function pythonRemoteScriptContractsPass() {
  const result = spawnSync("python3", ["test/live_project_clip_test.py"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}
