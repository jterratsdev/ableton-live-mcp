import { BridgeRequestError } from "../errors.js";
import { validateSceneOverrideRequest } from "../../src/scene-tempo-signature-tools.js";
import { clone } from "./utils.js";
import { captureSceneTarget, createDevelopmentScenePort, observeSceneTarget } from "./scene-tempo-signature-observation.js";

export { createDevelopmentScenePort } from "./scene-tempo-signature-observation.js";

const FIELD_FAMILIES = Object.freeze({
  tempo: "tempo",
  tempo_enabled: "tempo",
  time_signature_numerator: "timeSignature",
  time_signature_denominator: "timeSignature",
  time_signature_enabled: "timeSignature"
});

export function sceneTempoSignatureCapabilities(stateOrPort, sceneIndex) {
  if (!Number.isInteger(sceneIndex) || sceneIndex < 0) sceneError("invalid_request", "sceneIndex must be a non-negative integer", 400);
  const port = scenePort(stateOrPort);
  const before = observeSceneTarget(port, sceneIndex);
  const after = observeSceneTarget(port, sceneIndex);
  if (!sameFingerprint(before.targetFingerprint, after.targetFingerprint) || !sameRaw(before.observed, after.observed)) {
    sceneError("scene_target_changed", "Read-only Scene capability probing changed observable target state", 409);
  }
  return { ok: true, readOnly: true, ...after };
}

export function setSceneTempoSignatureOverrides(stateOrPort, payload) {
  try {
    validateSceneOverrideRequest(payload);
  } catch (error) {
    sceneError("invalid_request", error.message, 400);
  }
  const port = scenePort(stateOrPort);
  const captured = captureSceneTarget(port, payload.sceneIndex);
  const pinnedTarget = captured.target;
  const before = captured.observation;
  const missingRequirements = requiredCapabilityFailures(before.capabilities, payload);
  if (missingRequirements.length) {
    sceneError("scene_override_unsupported", "Scene override request requires unavailable properties", 501, {
      target: before.target,
      requested: requestedActions(payload),
      missingRequirements,
      capabilities: before.capabilities
    });
  }

  const writes = plannedWrites(before.observed, payload);
  const journal = [];
  let originalFailure = null;
  try {
    for (const write of writes) {
      const entry = journalEntry(write, journal.length + 1, "attempted");
      journal.push(entry);
      try {
        port.write(pinnedTarget, write.field, write.value);
        entry.outcome = "returned";
      } catch (error) {
        entry.outcome = "failed";
        throw operationFailure("setter", write.field, error);
      }
    }
    let after;
    try {
      after = observeSceneTarget(port, payload.sceneIndex);
    } catch (error) {
      throw operationFailure("target_reresolution", null, error);
    }
    verifyTarget(before, after);
    verifyRequested(after.observed, payload);
    return {
      ok: true,
      target: after.target,
      requested: requestedActions(payload),
      status: journal.length ? "changed" : "no-op",
      changed: journal.length > 0,
      noOp: journal.length === 0,
      changedFields: journal.filter(({ outcome }) => outcome === "returned").map(({ field }) => field),
      observed: after.observed,
      capabilities: after.capabilities
    };
  } catch (error) {
    originalFailure = error.originalFailure ?? operationFailure("verification", null, error).originalFailure;
  }

  if (journal.length === 0) {
    sceneError("scene_target_changed", originalFailure.message, 409, {
      target: before.target,
      requested: requestedActions(payload),
      originalFailure
    });
  }
  throw rollbackAndBuildError(port, pinnedTarget, payload, before, journal, originalFailure);
}

function requiredCapabilityFailures(capabilities, payload) {
  const requirements = [];
  if (payload.tempo) {
    requirements.push(["tempo", capabilities.tempo, true, payload.tempo.action === "set"]);
    requirements.push(["tempo_enabled", capabilities.tempoEnabled, true, true]);
  }
  if (payload.timeSignature) {
    requirements.push(["time_signature_numerator", capabilities.timeSignature.components.numerator, true, payload.timeSignature.action === "set"]);
    requirements.push(["time_signature_denominator", capabilities.timeSignature.components.denominator, true, payload.timeSignature.action === "set"]);
    requirements.push(["time_signature_enabled", capabilities.timeSignatureEnabled, true, true]);
  }
  return requirements.flatMap(([field, value, needsRead, needsWrite]) => {
    const missing = [];
    if (needsRead && !value.readable) missing.push({ field, requirement: "readable", reason: value.reason });
    if (needsWrite && !value.writable) missing.push({ field, requirement: "writable", reason: value.reason });
    return missing;
  });
}

function plannedWrites(observed, payload) {
  const writes = [];
  if (payload.tempo?.action === "set") {
    if (observed.tempo.raw.value !== payload.tempo.bpm) writes.push({ field: "tempo", family: "tempo", value: payload.tempo.bpm });
    if (observed.tempo.raw.enabled !== true) writes.push({ field: "tempo_enabled", family: "tempo", value: true });
  } else if (payload.tempo?.action === "clear" && observed.tempo.raw.enabled !== false) {
    writes.push({ field: "tempo_enabled", family: "tempo", value: false });
  }
  if (payload.timeSignature?.action === "set") {
    if (observed.timeSignature.raw.numerator !== payload.timeSignature.numerator) writes.push({ field: "time_signature_numerator", family: "timeSignature", value: payload.timeSignature.numerator });
    if (observed.timeSignature.raw.denominator !== payload.timeSignature.denominator) writes.push({ field: "time_signature_denominator", family: "timeSignature", value: payload.timeSignature.denominator });
    if (observed.timeSignature.raw.enabled !== true) writes.push({ field: "time_signature_enabled", family: "timeSignature", value: true });
  } else if (payload.timeSignature?.action === "clear" && observed.timeSignature.raw.enabled !== false) {
    writes.push({ field: "time_signature_enabled", family: "timeSignature", value: false });
  }
  return writes;
}

function rollbackAndBuildError(port, pinnedTarget, payload, before, journal, originalFailure) {
  const failures = [];
  const hiddenValueRestoration = [];
  for (const entry of [...journal].reverse()) {
    const restore = restoration(before.observed, entry.field);
    if (restore.hidden) {
      hiddenValueRestoration.push({ family: entry.family, observable: false, reason: "disabled pre-state hides the retained value" });
      entry.outcome = entry.outcome === "failed" ? "failed" : "compensated";
      continue;
    }
    try {
      port.write(pinnedTarget, entry.field, restore.value);
      entry.outcome = "compensated";
    } catch (error) {
      entry.outcome = "compensation-failed";
      failures.push({ stage: "setter", field: entry.field, message: safeMessage(error, "compensation failed") });
    }
  }
  let finalObserved = null;
  const verification = [];
  try {
    const after = observeSceneTarget(port, payload.sceneIndex);
    finalObserved = after.observed;
    verification.push(...rollbackVerification(before, after));
  } catch (error) {
    verification.push({ field: "target", expected: before.targetFingerprint, observed: null, message: safeMessage(error, "rollback verification failed") });
  }
  const rollback = {
    attempted: true,
    succeeded: failures.length === 0 && verification.length === 0,
    failures,
    hiddenValueRestoration: uniqueObjects(hiddenValueRestoration),
    finalObserved,
    verification
  };
  return new BridgeRequestError("Scene override transaction failed", 500, {
    errorCode: "scene_override_transaction_failed",
    target: before.target,
    requested: requestedActions(payload),
    originalFailure,
    rollback,
    journal: journal.map(({ field, family, invocationOrder, outcome }) => ({ field, family, invocationOrder, outcome }))
  });
}

function restoration(observed, field) {
  if (field === "tempo") return observed.tempo.raw.enabled ? { value: observed.tempo.raw.value } : { hidden: true };
  if (field === "tempo_enabled") return { value: observed.tempo.raw.enabled };
  if (field === "time_signature_numerator") return observed.timeSignature.raw.enabled ? { value: observed.timeSignature.raw.numerator } : { hidden: true };
  if (field === "time_signature_denominator") return observed.timeSignature.raw.enabled ? { value: observed.timeSignature.raw.denominator } : { hidden: true };
  return { value: observed.timeSignature.raw.enabled };
}

function rollbackVerification(before, after) {
  const mismatches = [];
  if (!sameFingerprint(before.targetFingerprint, after.targetFingerprint)) mismatches.push({ field: "target", expected: before.targetFingerprint, observed: after.targetFingerprint });
  for (const [family, expected] of Object.entries(before.observed)) {
    if (JSON.stringify(expected) !== JSON.stringify(after.observed[family])) mismatches.push({ field: family, expected, observed: after.observed[family] });
  }
  return mismatches;
}

function verifyTarget(before, after) {
  if (!sameFingerprint(before.targetFingerprint, after.targetFingerprint)) throw operationFailure("target_reresolution", null, new Error("Scene target fingerprint changed"));
}

function verifyRequested(observed, payload) {
  if (payload.tempo?.action === "set" && (observed.tempo.enabled !== true || observed.tempo.value !== payload.tempo.bpm)) {
    throw operationFailure("readback", "tempo", new Error("tempo readback did not match requested value and enable state"));
  }
  if (payload.tempo?.action === "clear" && (observed.tempo.enabled !== false || observed.tempo.raw.value !== -1 || observed.tempo.value !== null)) {
    throw operationFailure("readback", "tempo", new Error("tempo clear readback did not expose disabled -1 sentinel"));
  }
  if (payload.timeSignature?.action === "set") {
    const value = observed.timeSignature.value;
    if (observed.timeSignature.enabled !== true || value?.numerator !== payload.timeSignature.numerator || value?.denominator !== payload.timeSignature.denominator) {
      throw operationFailure("readback", "timeSignature", new Error("time-signature readback did not match requested values and enable state"));
    }
  }
  if (payload.timeSignature?.action === "clear" && (observed.timeSignature.enabled !== false || observed.timeSignature.raw.numerator !== -1 || observed.timeSignature.raw.denominator !== -1 || observed.timeSignature.value !== null)) {
    throw operationFailure("readback", "timeSignature", new Error("time-signature clear readback did not expose disabled -1 sentinels"));
  }
}

function requestedActions(payload) {
  return clone({ ...(payload.tempo ? { tempo: payload.tempo } : {}), ...(payload.timeSignature ? { timeSignature: payload.timeSignature } : {}) });
}

function scenePort(value) {
  return value && typeof value.resolve === "function" ? value : createDevelopmentScenePort(value);
}

function sameFingerprint(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameRaw(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function journalEntry(write, invocationOrder, outcome) {
  return { field: write.field, family: write.family, invocationOrder, outcome };
}

function operationFailure(stage, field, error) {
  const wrapped = new Error(safeMessage(error, "Scene operation failed"));
  wrapped.originalFailure = { stage, field, message: wrapped.message };
  return wrapped;
}

function safeMessage(error, fallback) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  return message || fallback;
}

function uniqueObjects(values) {
  return [...new Map(values.map((value) => [JSON.stringify(value), value])).values()];
}

function sceneError(errorCode, message, statusCode, details = {}) {
  throw new BridgeRequestError(message, statusCode, { errorCode, ...details });
}
