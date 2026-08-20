import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  createDevelopmentScenePort,
  sceneTempoSignatureCapabilities,
  setSceneTempoSignatureOverrides
} from "../bridge/development/scene-tempo-signature.js";
import { createDevelopmentState } from "../bridge/development/default-state.js";
import { SCENE_TIME_SIGNATURE_DENOMINATORS } from "../src/scene-tempo-signature-tools.js";

capabilityProbeIsReadOnlyAndPerProperty();
partialCapabilitiesFailCombinedRequestsBeforeWrites();
duplicateNamesStillUseExactIndexes();
setOrderIdempotencyAndClearSentinels();
mutateThenRaiseRollsBackEveryAttemptedField();
disabledPreStateRollbackDoesNotClaimHiddenValueRestoration();
rollbackFailurePreservesOriginalFailure();
recreatedProxiesAndReadbackMismatchAreHandled();
replacementTargetNeverReceivesForwardOrRollbackSetters();
missingTargetNeverRedirectsPinnedReceiver();
sameFingerprintReplacementNeverBecomesMutationReceiver();
nodeAndPythonContractsHaveCanonicalParity();

console.log("scene tempo signature development tests ok");

function capabilityProbeIsReadOnlyAndPerProperty() {
  const state = fixtureState();
  state.scenes[0].capabilities = {
    tempo: { writable: false, reason: "tempo is read-only" },
    time_signature_denominator: { readable: false, reason: "denominator getter raised" }
  };
  let writes = 0;
  const port = createDevelopmentScenePort(state, { beforeWrite: () => { writes += 1; } });
  const before = JSON.stringify(state);

  const result = sceneTempoSignatureCapabilities(port, 0);

  assert.equal(result.readOnly, true);
  assert.deepEqual(result.target, { sceneIndex: 0, name: "Same" });
  assert.deepEqual(result.capabilities.tempo, { readable: true, writable: false, reason: "tempo is read-only" });
  assert.equal(result.capabilities.timeSignature.readable, false);
  assert.match(result.capabilities.timeSignature.reason, /denominator getter raised/);
  assert.equal(writes, 0);
  assert.equal(JSON.stringify(state), before);
}

function partialCapabilitiesFailCombinedRequestsBeforeWrites() {
  const state = fixtureState();
  state.scenes[0].capabilities = { time_signature_enabled: { writable: false, reason: "enable setter missing" } };
  let writes = 0;
  const port = createDevelopmentScenePort(state, { beforeWrite: () => { writes += 1; } });

  assert.throws(() => setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 130 },
    timeSignature: { action: "set", numerator: 5, denominator: 4 }
  }), (error) => {
    assert.equal(error.statusCode, 501);
    assert.equal(error.details.errorCode, "scene_override_unsupported");
    assert.ok(error.details.missingRequirements.some(({ field, requirement }) => field === "time_signature_enabled" && requirement === "writable"));
    return true;
  });
  assert.equal(writes, 0);
}

function duplicateNamesStillUseExactIndexes() {
  const state = fixtureState();

  setSceneTempoSignatureOverrides(state, { sceneIndex: 1, tempo: { action: "set", bpm: 141 } });

  assert.equal(state.scenes[0].retainedTempo, 120);
  assert.equal(state.scenes[1].retainedTempo, 141);
}

function setOrderIdempotencyAndClearSentinels() {
  const state = fixtureState();
  const fields = [];
  const port = createDevelopmentScenePort(state, { beforeWrite: (_target, field) => fields.push(field) });
  const request = {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 130 },
    timeSignature: { action: "set", numerator: 7, denominator: 8 }
  };

  const changed = setSceneTempoSignatureOverrides(port, request);
  const noOp = setSceneTempoSignatureOverrides(port, request);
  const cleared = setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "clear" },
    timeSignature: { action: "clear" }
  });

  assert.deepEqual(fields, ["tempo", "tempo_enabled", "time_signature_numerator", "time_signature_denominator", "time_signature_enabled", "tempo_enabled", "time_signature_enabled"]);
  assert.deepEqual(changed.changedFields, fields.slice(0, 5));
  assert.deepEqual([noOp.status, noOp.changedFields.length], ["no-op", 0]);
  assert.deepEqual(cleared.observed.tempo, { value: null, enabled: false, raw: { value: -1, enabled: false } });
  assert.deepEqual(cleared.observed.timeSignature, { value: null, enabled: false, raw: { numerator: -1, denominator: -1, enabled: false } });
  assert.deepEqual([state.scenes[0].retainedTempo, state.scenes[0].retainedNumerator, state.scenes[0].retainedDenominator], [130, 7, 8]);
}

function mutateThenRaiseRollsBackEveryAttemptedField() {
  const state = fixtureState({ enabled: true });
  let raised = false;
  const port = createDevelopmentScenePort(state, {
    afterWrite(_target, field) {
      if (field === "time_signature_denominator" && !raised) {
        raised = true;
        throw new Error("mutated then raised");
      }
    }
  });
  const before = JSON.stringify(state.scenes);

  assert.throws(() => setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 150 },
    timeSignature: { action: "set", numerator: 9, denominator: 16 }
  }), (error) => {
    assert.equal(error.details.originalFailure.stage, "setter");
    assert.equal(error.details.rollback.succeeded, true);
    assert.deepEqual(error.details.journal.map(({ field }) => field), ["tempo", "time_signature_numerator", "time_signature_denominator"]);
    return true;
  });
  assert.equal(JSON.stringify(state.scenes), before);
}

function rollbackFailurePreservesOriginalFailure() {
  const state = fixtureState({ enabled: true });
  let writeCount = 0;
  const port = createDevelopmentScenePort(state, {
    afterWrite() {
      writeCount += 1;
      if (writeCount === 2) throw new Error("original setter failure");
    },
    beforeWrite(_target, field, value) {
      if (writeCount >= 2 && field === "tempo" && value === 120) throw new Error("compensation rejected");
    }
  });

  assert.throws(() => setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 160 },
    timeSignature: { action: "set", numerator: 3, denominator: 8 }
  }), (error) => {
    assert.match(error.details.originalFailure.message, /original setter failure/);
    assert.equal(error.details.rollback.succeeded, false);
    assert.ok(error.details.rollback.failures.some(({ field }) => field === "tempo"));
    assert.ok(error.details.rollback.verification.length > 0);
    return true;
  });
}

function disabledPreStateRollbackDoesNotClaimHiddenValueRestoration() {
  const state = fixtureState();
  let raised = false;
  const port = createDevelopmentScenePort(state, {
    afterWrite(_target, field) {
      if (field === "time_signature_numerator" && !raised) {
        raised = true;
        throw new Error("signature write failed");
      }
    }
  });

  assert.throws(() => setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 155 },
    timeSignature: { action: "set", numerator: 9, denominator: 8 }
  }), (error) => {
    assert.equal(error.details.rollback.succeeded, true);
    assert.ok(error.details.rollback.hiddenValueRestoration.some(({ family, observable }) => family === "tempo" && observable === false));
    return true;
  });
  assert.equal(state.scenes[0].tempoEnabled, false);
  assert.equal(state.scenes[0].retainedTempo, 155);
  assert.deepEqual(sceneTempoSignatureCapabilities(state, 0).observed.tempo.raw, { value: -1, enabled: false });
}

function recreatedProxiesAndReadbackMismatchAreHandled() {
  const state = fixtureState({ enabled: true });
  const base = createDevelopmentScenePort(state);
  const proxies = [];
  const recreated = {
    ...base,
    resolve(index) {
      const target = base.resolve(index);
      const wrapper = { ...target };
      proxies.push(wrapper);
      return wrapper;
    }
  };
  const result = setSceneTempoSignatureOverrides(recreated, { sceneIndex: 0, tempo: { action: "set", bpm: 132 } });
  assert.equal(result.observed.tempo.value, 132);
  assert.ok(new Set(proxies).size > 1);

  const mismatchState = fixtureState({ enabled: true });
  const mismatchBase = createDevelopmentScenePort(mismatchState);
  let tempoWrites = 0;
  const mismatch = {
    ...mismatchBase,
    write(target, field, value) {
      mismatchBase.write(target, field, value);
      if (field === "tempo") tempoWrites += 1;
    },
    read(target, field) {
      const value = mismatchBase.read(target, field);
      return field === "tempo" && tempoWrites === 1 ? value + 1 : value;
    }
  };
  assert.throws(() => setSceneTempoSignatureOverrides(mismatch, { sceneIndex: 0, tempo: { action: "set", bpm: 135 } }), (error) => {
    assert.equal(error.details.originalFailure.stage, "readback");
    assert.equal(error.details.rollback.succeeded, true);
    return true;
  });
  assert.equal(mismatchState.scenes[0].retainedTempo, 120);
}

function fixtureState(options = {}) {
  const enabled = options.enabled ?? false;
  return createDevelopmentState({
    scenes: [
      { name: "Same", retainedTempo: 120, tempoEnabled: enabled, retainedNumerator: 4, retainedDenominator: 4, timeSignatureEnabled: enabled },
      { name: "Same", retainedTempo: 125, tempoEnabled: enabled, retainedNumerator: 3, retainedDenominator: 4, timeSignatureEnabled: enabled },
      { name: "", retainedTempo: 128, tempoEnabled: false, retainedNumerator: 6, retainedDenominator: 8, timeSignatureEnabled: false }
    ]
  });
}

function replacementTargetNeverReceivesForwardOrRollbackSetters() {
  const state = fixtureState({ enabled: true });
  const original = state.scenes[0];
  const replacement = state.scenes[1];
  original.writes = [];
  replacement.writes = [];
  let shifted = false;
  const port = createDevelopmentScenePort(state, {
    beforeWrite(target, field) {
      target.record.writes.push(field);
    },
    afterWrite(target, field) {
      if (target.record === original && field === "tempo" && !shifted) {
        shifted = true;
        state.scenes.shift();
      }
    }
  });

  assert.throws(() => setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 130 },
    timeSignature: { action: "set", numerator: 7, denominator: 4 }
  }), (error) => {
    assert.deepEqual(error.details.originalFailure, {
      stage: "target_reresolution",
      field: null,
      message: "Scene target fingerprint changed"
    });
    assert.deepEqual(error.details.journal.map(({ field }) => field), ["tempo", "time_signature_numerator"]);
    assert.equal(error.details.rollback.succeeded, false);
    assert.deepEqual(error.details.rollback.failures, []);
    assert.ok(error.details.rollback.verification.some(({ field }) => field === "target"));
    return true;
  });
  assert.deepEqual(original.writes, ["tempo", "time_signature_numerator", "time_signature_numerator", "tempo"]);
  assert.deepEqual(replacement.writes, []);
}

function missingTargetNeverRedirectsPinnedReceiver() {
  const state = fixtureState({ enabled: true });
  const original = state.scenes[0];
  original.writes = [];
  let removed = false;
  const port = createDevelopmentScenePort(state, {
    beforeWrite(target, field) {
      target.record.writes.push(field);
    },
    afterWrite(target, field) {
      if (target.record === original && field === "tempo" && !removed) {
        removed = true;
        state.scenes = [];
      }
    }
  });

  assert.throws(() => setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 131 },
    timeSignature: { action: "set", numerator: 7, denominator: 4 }
  }), (error) => {
    assert.equal(error.details.originalFailure.stage, "target_reresolution");
    assert.equal(error.details.originalFailure.field, null);
    assert.deepEqual(error.details.journal.map(({ field }) => field), ["tempo", "time_signature_numerator"]);
    assert.deepEqual(error.details.rollback.failures, []);
    assert.ok(error.details.rollback.verification.some(({ field }) => field === "target"));
    return true;
  });
  assert.deepEqual(original.writes, ["tempo", "time_signature_numerator", "time_signature_numerator", "tempo"]);
}

function sameFingerprintReplacementNeverBecomesMutationReceiver() {
  const state = fixtureState({ enabled: true });
  const original = state.scenes[0];
  const replacement = state.scenes[1];
  replacement.retainedTempo = 130;
  original.writes = [];
  replacement.writes = [];
  let swapped = false;
  const port = createDevelopmentScenePort(state, {
    beforeWrite(target, field) {
      target.record.writes.push(field);
    },
    afterWrite(target, field) {
      if (target.record === original && field === "tempo" && !swapped) {
        swapped = true;
        state.scenes[0] = replacement;
      }
    }
  });

  assert.throws(() => setSceneTempoSignatureOverrides(port, {
    sceneIndex: 0,
    tempo: { action: "set", bpm: 130 },
    timeSignature: { action: "set", numerator: 7, denominator: 4 }
  }), (error) => {
    assert.equal(error.details.originalFailure.stage, "readback");
    assert.equal(error.details.originalFailure.field, "timeSignature");
    assert.deepEqual(error.details.journal.map(({ field }) => field), ["tempo", "time_signature_numerator"]);
    assert.equal(error.details.rollback.succeeded, false);
    assert.deepEqual(error.details.rollback.failures, []);
    assert.ok(error.details.rollback.verification.some(({ field }) => field === "tempo"));
    assert.ok(error.details.rollback.verification.some(({ field }) => field === "timeSignature"));
    return true;
  });
  assert.deepEqual(original.writes, ["tempo", "time_signature_numerator", "time_signature_numerator", "tempo"]);
  assert.deepEqual(replacement.writes, []);
}

function nodeAndPythonContractsHaveCanonicalParity() {
  const state = createDevelopmentState({
    scenes: [{ name: "Intro", retainedTempo: 124, tempoEnabled: false, retainedNumerator: 4, retainedDenominator: 4, timeSignatureEnabled: false }]
  });
  const node = {
    capability: sceneTempoSignatureCapabilities(state, 0),
    mutation: setSceneTempoSignatureOverrides(state, {
      sceneIndex: 0,
      tempo: { action: "set", bpm: 128 },
      timeSignature: { action: "set", numerator: 7, denominator: 8 }
    })
  };
  const python = spawnSync("python3", ["test/live_scene_tempo_signature_test.py", "--json"], {
    encoding: "utf8",
    env: { ...process.env, PYTHONPYCACHEPREFIX: "/tmp/ableton-mcp-pycache" }
  });
  assert.equal(python.status, 0, python.stderr);
  assert.deepEqual(JSON.parse(python.stdout), node);
  const denominators = spawnSync("python3", ["-c", "import json; from ableton_remote_scripts.AbletonMcpBridge.live_scene_tempo_signature import DENOMINATORS; print(json.dumps(DENOMINATORS))"], {
    encoding: "utf8",
    env: { ...process.env, PYTHONPYCACHEPREFIX: "/tmp/ableton-mcp-pycache" }
  });
  assert.equal(denominators.status, 0, denominators.stderr);
  assert.deepEqual(JSON.parse(denominators.stdout), SCENE_TIME_SIGNATURE_DENOMINATORS);
}
