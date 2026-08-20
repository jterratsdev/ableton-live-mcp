import { SCENE_TIME_SIGNATURE_DENOMINATORS } from "../../src/scene-tempo-signature-tools.js";

export const SCENE_OVERRIDE_FIELDS = Object.freeze([
  "tempo",
  "tempo_enabled",
  "time_signature_numerator",
  "time_signature_denominator",
  "time_signature_enabled"
]);

export function createDevelopmentScenePort(state, hooks = {}) {
  return {
    resolve(sceneIndex) {
      hooks.onResolve?.(sceneIndex);
      const record = state.scenes[sceneIndex];
      if (!record) {
        const error = new Error(`sceneIndex ${sceneIndex} does not exist`);
        error.statusCode = 404;
        error.details = { errorCode: "scene_not_found" };
        throw error;
      }
      return { sceneIndex, record };
    },
    count: () => state.scenes.length,
    probe(target, field) {
      hooks.onProbe?.(target, field);
      const configured = target.record.capabilities?.[field] ?? {};
      return capability(configured.readable !== false, configured.writable !== false, configured.reason);
    },
    read(target, field) {
      hooks.onRead?.(target, field);
      const record = target.record;
      if (field === "tempo") return record.tempoEnabled ? record.retainedTempo : -1;
      if (field === "tempo_enabled") return Boolean(record.tempoEnabled);
      if (field === "time_signature_numerator") return record.timeSignatureEnabled ? record.retainedNumerator : -1;
      if (field === "time_signature_denominator") return record.timeSignatureEnabled ? record.retainedDenominator : -1;
      if (field === "time_signature_enabled") return Boolean(record.timeSignatureEnabled);
      throw new Error(`Unknown Scene field: ${field}`);
    },
    write(target, field, value) {
      hooks.beforeWrite?.(target, field, value);
      const record = target.record;
      if (field === "tempo") record.retainedTempo = value;
      else if (field === "tempo_enabled") record.tempoEnabled = value;
      else if (field === "time_signature_numerator") record.retainedNumerator = value;
      else if (field === "time_signature_denominator") record.retainedDenominator = value;
      else if (field === "time_signature_enabled") record.timeSignatureEnabled = value;
      else throw new Error(`Unknown Scene field: ${field}`);
      hooks.afterWrite?.(target, field, value);
    }
  };
}

export function observeSceneTarget(port, sceneIndex) {
  return captureSceneTarget(port, sceneIndex).observation;
}

export function captureSceneTarget(port, sceneIndex) {
  const target = port.resolve(sceneIndex);
  return { target, observation: observeResolvedSceneTarget(port, sceneIndex, target) };
}

function observeResolvedSceneTarget(port, sceneIndex, target) {
  const fieldCapabilities = {};
  const raw = {};
  for (const field of SCENE_OVERRIDE_FIELDS) {
    let probed;
    try {
      probed = normalizeCapability(port.probe(target, field), field);
    } catch (error) {
      probed = capability(false, false, safeMessage(error, `${field} probe failed`));
    }
    fieldCapabilities[field] = probed;
    if (!probed.readable) {
      raw[field] = null;
      continue;
    }
    try {
      raw[field] = port.read(target, field);
      validateRawField(field, raw[field]);
    } catch (error) {
      fieldCapabilities[field] = capability(false, probed.writable, safeMessage(error, `${field} read failed`));
      raw[field] = null;
    }
  }
  validateSentinelFamilies(fieldCapabilities, raw);
  const name = safeName(target.record?.name ?? target.name);
  return {
    target: { sceneIndex, name },
    targetFingerprint: { sceneIndex, sceneCount: port.count(), name, propertyShape: propertyShape(fieldCapabilities) },
    capabilities: capabilityProjection(fieldCapabilities),
    observed: observedProjection(raw, fieldCapabilities)
  };
}

function validateRawField(field, value) {
  if (field === "tempo" && (typeof value !== "number" || !Number.isFinite(value) || (value !== -1 && (value < 20 || value > 999)))) throw new Error("tempo is not a finite BPM or disabled sentinel");
  if (["tempo_enabled", "time_signature_enabled"].includes(field) && typeof value !== "boolean") throw new Error(`${field} is not boolean`);
  if (field === "time_signature_numerator" && (!Number.isInteger(value) || (value !== -1 && (value < 1 || value > 32)))) throw new Error("time_signature_numerator is invalid");
  if (field === "time_signature_denominator" && ![-1, ...SCENE_TIME_SIGNATURE_DENOMINATORS].includes(value)) throw new Error("time_signature_denominator is invalid");
}

function validateSentinelFamilies(capabilities, raw) {
  if (capabilities.tempo.readable && capabilities.tempo_enabled.readable) {
    const isValid = raw.tempo_enabled ? raw.tempo !== -1 : raw.tempo === -1;
    if (!isValid) markUnreadable(capabilities, ["tempo", "tempo_enabled"], "tempo sentinel and enable state are inconsistent");
  }
  const signatureFields = ["time_signature_numerator", "time_signature_denominator", "time_signature_enabled"];
  if (signatureFields.every((field) => capabilities[field].readable)) {
    const isValid = raw.time_signature_enabled
      ? raw.time_signature_numerator !== -1 && raw.time_signature_denominator !== -1
      : raw.time_signature_numerator === -1 && raw.time_signature_denominator === -1;
    if (!isValid) markUnreadable(capabilities, signatureFields, "time-signature sentinels and enable state are inconsistent");
  }
}

function capabilityProjection(fields) {
  const numerator = fields.time_signature_numerator;
  const denominator = fields.time_signature_denominator;
  return {
    tempo: { ...fields.tempo },
    tempoEnabled: { ...fields.tempo_enabled },
    timeSignature: {
      readable: numerator.readable && denominator.readable,
      writable: numerator.writable && denominator.writable,
      reason: combinedReason([numerator, denominator]),
      components: { numerator: { ...numerator }, denominator: { ...denominator } }
    },
    timeSignatureEnabled: { ...fields.time_signature_enabled }
  };
}

function observedProjection(raw, capabilities) {
  const tempoReadable = capabilities.tempo.readable && capabilities.tempo_enabled.readable;
  const signatureReadable = ["time_signature_numerator", "time_signature_denominator", "time_signature_enabled"].every((field) => capabilities[field].readable);
  const tempoEnabled = tempoReadable ? raw.tempo_enabled : null;
  const signatureEnabled = signatureReadable ? raw.time_signature_enabled : null;
  return {
    tempo: { value: tempoReadable && tempoEnabled ? raw.tempo : null, enabled: tempoEnabled, raw: { value: raw.tempo, enabled: raw.tempo_enabled } },
    timeSignature: {
      value: signatureReadable && signatureEnabled ? { numerator: raw.time_signature_numerator, denominator: raw.time_signature_denominator } : null,
      enabled: signatureEnabled,
      raw: { numerator: raw.time_signature_numerator, denominator: raw.time_signature_denominator, enabled: raw.time_signature_enabled }
    }
  };
}

function propertyShape(fields) {
  const axes = (value) => ({ readable: value.readable, writable: value.writable });
  return {
    tempo: axes(fields.tempo), tempoEnabled: axes(fields.tempo_enabled),
    timeSignatureNumerator: axes(fields.time_signature_numerator),
    timeSignatureDenominator: axes(fields.time_signature_denominator),
    timeSignatureEnabled: axes(fields.time_signature_enabled)
  };
}

function normalizeCapability(value, field) {
  if (!value || typeof value.readable !== "boolean" || typeof value.writable !== "boolean") return capability(false, false, `${field} capability is malformed`);
  return capability(value.readable, value.writable, value.reason);
}

function capability(readable, writable, reason) {
  return { readable, writable, reason: !readable || !writable ? safeReason(reason, "property is unavailable") : null };
}

function combinedReason(parts) {
  const reasons = parts.filter((part) => !part.readable || !part.writable).map((part) => part.reason);
  return reasons.length ? [...new Set(reasons)].join("; ") : null;
}

function markUnreadable(capabilities, fields, reason) {
  for (const field of fields) capabilities[field] = capability(false, capabilities[field].writable, reason);
}

function safeName(value) {
  try {
    return typeof value === "string" ? value : String(value ?? "");
  } catch {
    return "";
  }
}

function safeMessage(error, fallback) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  return message || fallback;
}

function safeReason(reason, fallback) {
  return typeof reason === "string" && reason.trim() ? reason.trim() : fallback;
}
