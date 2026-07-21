import { BridgeRequestError } from "../errors.js";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalize(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isValidTempo(bpm) {
  return typeof bpm === "number" && Number.isFinite(bpm) && bpm >= 20 && bpm <= 999;
}

export function isValidDb(value) {
  return isNumberInRange(value, -70, 12);
}

export function isNumberInRange(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function requireBoolean(value, name) {
  if (typeof value !== "boolean") {
    throw new BridgeRequestError(`${name} must be a boolean`);
  }
  return value;
}

export function requireNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new BridgeRequestError(`${name} must be a non-negative integer`);
  }
  return value;
}

export function coerceNonNegativeInteger(value) {
  if (Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return value;
}

export function coerceClipTargetPayload(payload) {
  return {
    trackIndex: coerceNonNegativeInteger(payload.trackIndex),
    clipSlotIndex: coerceNonNegativeInteger(payload.clipSlotIndex)
  };
}

export function validateSignature(payload) {
  if (!Number.isInteger(payload.numerator) || payload.numerator < 1 || payload.numerator > 32) {
    throw new BridgeRequestError("numerator must be an integer between 1 and 32");
  }
  if (![1, 2, 4, 8, 16, 32].includes(payload.denominator)) {
    throw new BridgeRequestError("denominator must be one of 1, 2, 4, 8, 16, or 32");
  }
  return { numerator: payload.numerator, denominator: payload.denominator };
}

export function validateSnapshotLabel(payload) {
  if (typeof payload.label !== "string" || payload.label.trim() === "") {
    throw new BridgeRequestError("label must be a non-empty string");
  }
  return payload.label.trim();
}

export function validateSnapshotId(payload) {
  if (typeof payload.snapshotId !== "string" || payload.snapshotId.trim() === "") {
    throw new BridgeRequestError("snapshotId must be a non-empty string");
  }
  return payload.snapshotId.trim();
}

export function snapshotId(label, index) {
  const suffix = normalize(label).replace(/\s+/g, "-") || "snapshot";
  return `snap-${Date.now()}-${index + 1}-${suffix}`;
}

export function validateParameterName(parameter) {
  if (typeof parameter !== "string" || parameter.trim() === "") {
    throw new BridgeRequestError("parameter must be a non-empty string");
  }
  return parameter.trim();
}

export function isValidLoudness(targetLufs) {
  return typeof targetLufs === "number" && Number.isFinite(targetLufs) && targetLufs >= -24 && targetLufs <= -5;
}

export function isValidTruePeak(truePeakDb) {
  return typeof truePeakDb === "number" && Number.isFinite(truePeakDb) && truePeakDb >= -6 && truePeakDb <= 0;
}

export function reindexDevices(devices) {
  devices.forEach((device, index) => {
    device.index = index;
  });
}

export function nextClipSlot(track) {
  if (!track.clips.length) {
    return 0;
  }
  return Math.max(...track.clips.map((clip) => clip.slot)) + 1;
}

export function midiClipName(path) {
  const name = path.split(/[\\/]/).pop() ?? "Imported MIDI";
  return name.replace(/\.(mid|midi)$/i, "");
}
