import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { DevelopmentAbletonAdapter } from "../bridge/development-adapter.js";
import { createDispatch, tools, validateToolInput } from "../src/tools.js";
import { classifyEndpointRisk, classifyToolRisk } from "../src/risk-policy.js";

await planningIsReadOnlyAndExposesExactIdentity();
await exactDeletionPreservesUnselectedAndSessionClips();
await invalidSelectionsFailClosedBeforeMutation();
dispatchAndRiskContractsAreSeparated();
pythonFakeLiveContractPasses();

console.log("arrangement clip deletion contracts ok");

function fixtureState() {
  return {
    tracks: [
      { index: 0, name: "Piano", type: "midi", clips: [{ slot: 0, name: "Session Verse", lengthBeats: 16 }] },
      { index: 1, name: "Audio", type: "audio", clips: [] }
    ],
    arrangement: {
      lengthBeats: 32,
      clips: [
        { id: "arr-1", trackIndex: 0, name: "Intro", startBeat: 0, lengthBeats: 8 },
        { id: "arr-2", trackIndex: 0, name: "Keep", startBeat: 8, lengthBeats: 8 },
        { id: "arr-3", trackIndex: 1, name: "Outro", startBeat: 16, lengthBeats: 8 }
      ]
    }
  };
}

async function planningIsReadOnlyAndExposesExactIdentity() {
  const adapter = new DevelopmentAbletonAdapter(fixtureState());
  const before = structuredClone(adapter.state);

  const plan = await adapter.planArrangementClipDeletion();

  assert.equal(plan.readOnly, true);
  assert.equal(plan.candidates.length, 3);
  assert.ok(plan.planToken);
  assert.ok(plan.candidates.every((candidate) => candidate.trackIdentity && candidate.clipIdentity));
  assert.deepEqual(plan.candidates.map(({ startBeat, lengthBeats }) => ({ startBeat, lengthBeats })), [
    { startBeat: 0, lengthBeats: 8 },
    { startBeat: 8, lengthBeats: 8 },
    { startBeat: 16, lengthBeats: 8 }
  ]);
  assert.deepEqual(adapter.state, before);
}

async function exactDeletionPreservesUnselectedAndSessionClips() {
  const adapter = new DevelopmentAbletonAdapter(fixtureState());
  const sessionBefore = structuredClone(adapter.state.tracks[0].clips);
  const plan = await adapter.planArrangementClipDeletion();
  const selected = [plan.candidates[0].clipIdentity, plan.candidates[2].clipIdentity];

  const result = await adapter.deleteArrangementClips({ planToken: plan.planToken, clipIdentities: selected });

  assert.deepEqual(adapter.state.arrangement.clips.map(({ name }) => name), ["Keep"]);
  assert.deepEqual(adapter.state.tracks[0].clips, sessionBefore);
  assert.equal(result.deletedCount, 2);
  assert.equal(result.results.every(({ verifiedAbsent }) => verifiedAbsent), true);
}

async function invalidSelectionsFailClosedBeforeMutation() {
  const adapter = new DevelopmentAbletonAdapter(fixtureState());
  const plan = await adapter.planArrangementClipDeletion();
  const identity = plan.candidates[0].clipIdentity;
  const before = structuredClone(adapter.state);

  await assert.rejects(adapter.deleteArrangementClips({ planToken: plan.planToken, clipIdentities: [identity, identity] }), /duplicated|duplicates/u);
  assert.deepEqual(adapter.state, before);
  await assert.rejects(adapter.deleteArrangementClips({ planToken: plan.planToken, clipIdentities: ["missing"] }), /missing|stale/u);
  assert.deepEqual(adapter.state, before);

  adapter.state.arrangement.clips[0].name = "Changed";
  const changed = structuredClone(adapter.state);
  await assert.rejects(adapter.deleteArrangementClips({ planToken: plan.planToken, clipIdentities: [identity] }), /stale/u);
  assert.deepEqual(adapter.state, changed);

  const replaced = new DevelopmentAbletonAdapter(fixtureState());
  const replacedPlan = await replaced.planArrangementClipDeletion();
  replaced.state.arrangement.clips[0] = structuredClone(replaced.state.arrangement.clips[0]);
  await assert.rejects(replaced.deleteArrangementClips({
    planToken: replacedPlan.planToken,
    clipIdentities: [replacedPlan.candidates[0].clipIdentity]
  }), /stale/u);

  const partial = new DevelopmentAbletonAdapter(fixtureState());
  partial.state.tracks[1].arrangementDeleteSupported = false;
  const partialPlan = await partial.planArrangementClipDeletion();
  const partialBefore = structuredClone(partial.state);
  await assert.rejects(partial.deleteArrangementClips({
    planToken: partialPlan.planToken,
    clipIdentities: [partialPlan.candidates[0].clipIdentity, partialPlan.candidates[2].clipIdentity]
  }), /unsupported/u);
  assert.deepEqual(partial.state, partialBefore);
}

function dispatchAndRiskContractsAreSeparated() {
  const calls = [];
  const dispatch = createDispatch({ invoke: async (action, payload) => calls.push({ action, payload }) });
  dispatch.ableton_plan_arrangement_clip_deletion({});
  dispatch.ableton_delete_arrangement_clips({ planToken: "token", clipIdentities: ["clip"] });

  assert.deepEqual(calls.map(({ action }) => action), ["plan_arrangement_clip_deletion", "delete_arrangement_clips"]);
  assert.ok(tools.some(({ name }) => name === "ableton_plan_arrangement_clip_deletion"));
  assert.ok(tools.some(({ name }) => name === "ableton_delete_arrangement_clips"));
  assert.equal(classifyToolRisk("ableton_plan_arrangement_clip_deletion").tier, "read");
  assert.equal(classifyToolRisk("ableton_delete_arrangement_clips").tier, "destructive");
  assert.equal(classifyEndpointRisk("GET /arrangement/clips/delete-plan").tier, "read");
  assert.equal(classifyEndpointRisk("DELETE /arrangement/clips").tier, "destructive");
  assert.throws(() => validateToolInput("ableton_delete_arrangement_clips", { planToken: "token", clipIdentities: ["x", "x"] }), /duplicates/u);
}

function pythonFakeLiveContractPasses() {
  const result = spawnSync("python3", ["test/live_arrangement_delete_test.py"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /fake-Live tests ok/u);
}
