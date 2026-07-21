import { BridgeRequestError } from "../errors.js";
import { clone, coerceNonNegativeInteger, isFiniteNumber, isNumberInRange, isValidTempo, normalize, requireNonNegativeInteger } from "./utils.js";
import { getTrack } from "./mixer.js";

const TRACK_TARGETS = new Set(["volume", "pan"]);

export function setAutomation(state, payload = {}) {
  const target = resolveAutomationTarget(state, payload);
  const points = normalizeAutomationPoints(payload.points, target);
  state.automation = state.automation ?? [];

  const previousIndex = state.automation.findIndex((entry) => entry.laneId === target.laneId);
  const automation = {
    laneId: target.laneId,
    target: target.target,
    kind: target.kind,
    trackIndex: target.trackIndex,
    sendName: target.sendName,
    deviceIndex: target.deviceIndex,
    deviceName: target.deviceName,
    parameter: target.parameter,
    points
  };

  const replaced = previousIndex !== -1;
  if (replaced) {
    state.automation[previousIndex] = automation;
  } else {
    state.automation.push(automation);
  }

  return {
    ok: true,
    written: true,
    replaced,
    mode: "deterministic-development-automation",
    automation: clone(automation),
    pointCount: points.length
  };
}

function resolveAutomationTarget(state, payload) {
  if (typeof payload.target !== "string" || payload.target.trim() === "") {
    throw new BridgeRequestError("target must be a non-empty string");
  }

  const target = payload.target.trim();
  if (target === "tempo") {
    return {
      laneId: "tempo",
      target,
      kind: "tempo"
    };
  }

  if (TRACK_TARGETS.has(target)) {
    const trackIndex = requireTrackIndex(payload);
    getTrack(state, trackIndex);
    return {
      laneId: `track:${trackIndex}:${target}`,
      target,
      kind: `track_${target}`,
      trackIndex
    };
  }

  if (target.startsWith("send:")) {
    const trackIndex = requireTrackIndex(payload);
    const sendName = target.slice("send:".length).trim();
    if (!sendName) {
      throw new BridgeRequestError("target send name must be non-empty");
    }
    const track = getTrack(state, trackIndex);
    const returnTrack = state.returns.find((candidate) => normalize(candidate.name) === normalize(sendName));
    if (!returnTrack || !Object.prototype.hasOwnProperty.call(track.sends ?? {}, returnTrack.name)) {
      throw new BridgeRequestError(`send does not exist on track: ${sendName}`, 404);
    }
    return {
      laneId: `track:${trackIndex}:send:${returnTrack.name}`,
      target: `send:${returnTrack.name}`,
      kind: "track_send",
      trackIndex,
      sendName: returnTrack.name
    };
  }

  if (target.startsWith("device:")) {
    const trackIndex = requireTrackIndex(payload);
    const parsed = parseDeviceTarget(target);
    const track = getTrack(state, trackIndex);
    const device = track.devices?.[parsed.deviceIndex];
    if (!device) {
      throw new BridgeRequestError("deviceIndex is outside the available device range", 404);
    }
    const parameterName = Object.keys(device.parameters ?? {}).find((name) => normalize(name) === normalize(parsed.parameter));
    if (!parameterName) {
      throw new BridgeRequestError(`parameter does not exist on device: ${parsed.parameter}`, 404);
    }
    return {
      laneId: `track:${trackIndex}:device:${parsed.deviceIndex}:${parameterName}`,
      target: `device:${parsed.deviceIndex}:${parameterName}`,
      kind: "device_parameter",
      trackIndex,
      deviceIndex: parsed.deviceIndex,
      deviceName: device.name,
      parameter: parameterName
    };
  }

  throw new BridgeRequestError("target must be volume, pan, tempo, send:<name>, or device:<deviceIndex>:<parameter>");
}

function parseDeviceTarget(target) {
  const parts = target.split(":");
  if (parts.length < 3 || parts[1] === "" || parts.slice(2).join(":").trim() === "") {
    throw new BridgeRequestError("target device grammar must be device:<deviceIndex>:<parameter>");
  }
  const deviceIndex = coerceNonNegativeInteger(parts[1]);
  requireNonNegativeInteger(deviceIndex, "deviceIndex");
  return {
    deviceIndex,
    parameter: parts.slice(2).join(":").trim()
  };
}

function requireTrackIndex(payload) {
  return requireNonNegativeInteger(coerceNonNegativeInteger(payload.trackIndex), "trackIndex");
}

function normalizeAutomationPoints(points, target) {
  if (!Array.isArray(points) || points.length === 0) {
    throw new BridgeRequestError("points must be a non-empty array");
  }
  return points
    .map((point, index) => normalizeAutomationPoint(point, index, target))
    .sort((a, b) => a.beat - b.beat || a.index - b.index)
    .map(({ index, ...point }) => point);
}

function normalizeAutomationPoint(point, index, target) {
  if (typeof point !== "object" || point === null || Array.isArray(point)) {
    throw new BridgeRequestError(`points[${index}] must be an object`);
  }
  if (!isFiniteNumber(point.beat) || point.beat < 0) {
    throw new BridgeRequestError(`points[${index}].beat must be a non-negative number`);
  }
  if (!isFiniteNumber(point.value)) {
    throw new BridgeRequestError(`points[${index}].value must be a finite number`);
  }
  validateAutomationValue(point.value, target, index);
  return {
    beat: point.beat,
    value: point.value,
    index
  };
}

function validateAutomationValue(value, target, index) {
  if (target.kind === "tempo" && !isValidTempo(value)) {
    throw new BridgeRequestError(`points[${index}].value must be a tempo between 20 and 999`);
  }
  if ((target.kind === "track_volume" || target.kind === "track_send") && !isNumberInRange(value, -70, 12)) {
    throw new BridgeRequestError(`points[${index}].value must be a dB value between -70 and 12`);
  }
  if (target.kind === "track_pan" && !isNumberInRange(value, -1, 1)) {
    throw new BridgeRequestError(`points[${index}].value must be a pan value between -1 and 1`);
  }
  if (target.kind === "device_parameter" && !isNumberInRange(value, 0, 1)) {
    throw new BridgeRequestError(`points[${index}].value must be a normalized device value between 0 and 1`);
  }
}
