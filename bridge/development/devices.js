import { BridgeRequestError } from "../errors.js";
import { clone, coerceNonNegativeInteger, normalize, reindexDevices, requireNonNegativeInteger } from "./utils.js";
import { getTrack } from "./mixer.js";
import { matchesPlugin } from "./plugins.js";

const DEVICE_TARGETS = ["track", "return", "master"];

export function resolveDevice(devices, payload) {
  const deviceIndex = coerceNonNegativeInteger(payload.deviceIndex);
  if (Number.isInteger(deviceIndex)) {
    const device = devices[deviceIndex];
    if (!device) {
      throw new BridgeRequestError("deviceIndex is outside the available device range", 404);
    }
    return device;
  }
  if (typeof payload.deviceName === "string" && payload.deviceName.trim()) {
    const normalized = normalize(payload.deviceName);
    const device = devices.find((candidate) => normalize(candidate.name) === normalized);
    if (!device) {
      throw new BridgeRequestError("deviceName does not match a device on the track", 404);
    }
    return device;
  }
  throw new BridgeRequestError("deviceIndex or deviceName is required");
}

export function resolveDevices(devices, payload) {
  const hasDeviceIndex = payload.deviceIndex !== undefined && payload.deviceIndex !== null && payload.deviceIndex !== "";
  const hasDeviceName = typeof payload.deviceName === "string" && payload.deviceName.trim() !== "";
  if (!hasDeviceIndex && !hasDeviceName) {
    return devices;
  }
  return [resolveDevice(devices, payload)];
}

export function deviceParameterInventory(device) {
  const parameters = device.parameters ?? {};
  return {
    index: device.index,
    name: device.name,
    kind: device.kind,
    parameterCount: Object.keys(parameters).length,
    parameters: Object.entries(parameters).map(([name, value]) => ({
      name,
      value,
      min: 0,
      max: 1,
      isEnabled: true
    }))
  };
}

export function loadDeviceIntoChain(devices, plugin, payload = {}) {
  const position = payload.position ?? "append";
  if (!["append", "prepend"].includes(position)) {
    throw new BridgeRequestError("position must be append or prepend");
  }

  const loaded = {
    index: position === "prepend" ? 0 : devices.length,
    name: plugin.name,
    kind: plugin.kind,
    parameters: clone(payload.settings ?? {})
  };

  if (position === "prepend") {
    devices.unshift(loaded);
  } else {
    devices.push(loaded);
  }
  reindexDevices(devices);
  return loaded;
}

export function loadTrackDevice(state, payload = {}) {
  const trackIndex = requireNonNegativeInteger(payload.trackIndex, "trackIndex");
  if (typeof payload.query !== "string" || payload.query.trim() === "") {
    throw new BridgeRequestError("query must be a non-empty string");
  }

  const track = getTrack(state, trackIndex);
  const device = {
    trackIndex,
    query: payload.query,
    kind: payload.kind ?? "any",
    position: payload.position ?? "append",
    role: payload.role,
    selectedDevice: payload.query,
    rationale: payload.rationale
  };
  const loaded = {
    index: payload.position === "prepend" ? 0 : track.devices.length,
    name: payload.query,
    kind: payload.kind ?? "any",
    parameters: {}
  };
  if (payload.position === "replace_instrument") {
    track.devices = [loaded, ...track.devices.filter((candidate) => candidate.kind !== "instrument" && candidate.kind !== "vst" && candidate.kind !== "au")];
  } else if (payload.position === "prepend") {
    track.devices.unshift(loaded);
  } else {
    track.devices.push(loaded);
  }
  reindexDevices(track.devices);
  state.loadedDevices.push(device);

  return { ok: true, device: { ...device, loadedDevice: clone(loaded) } };
}

export function loadMasterDevice(state, payload = {}) {
  if (typeof payload.query !== "string" || payload.query.trim() === "") {
    throw new BridgeRequestError("query must be a non-empty string");
  }

  const kind = payload.kind ?? "audio_effect";
  const plugin = state.plugins.find((candidate) => matchesPlugin(candidate, { kind, query: payload.query }));
  if (!plugin) {
    throw new BridgeRequestError(`No matching loadable item found for master query: ${payload.query}`, 404);
  }

  const loaded = loadDeviceIntoChain(state.master.devices, plugin, payload);
  const device = {
    target: "master",
    query: payload.query,
    kind,
    position: payload.position ?? "append",
    selectedDevice: plugin.name,
    rationale: payload.rationale,
    loadedDevice: clone(loaded)
  };
  state.loadedDevices.push(device);
  return { ok: true, device, master: clone(state.master) };
}

export function setDeviceParameter(state, payload = {}) {
  const target = resolveDeviceChain(state, deviceParameterPayload(payload));
  const device = resolveDevice(target.devices, payload);
  const parameterName = validateParameterName(payload.parameter);
  const value = payload.normalizedValue ?? payload.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BridgeRequestError("value or normalizedValue must be a finite number");
  }
  device.parameters = device.parameters ?? {};
  if (!Object.hasOwn(device.parameters, parameterName)) {
    throw new BridgeRequestError(`parameter does not exist on device: ${parameterName}`, 404);
  }
  device.parameters[parameterName] = value;
  return {
    ok: true,
    parameter: {
      location: target.location,
      deviceIndex: device.index,
      deviceName: device.name,
      parameter: parameterName,
      value
    }
  };
}

export function getDeviceParameters(state, payload = {}) {
  const target = resolveDeviceChain(state, deviceParameterPayload(payload));
  const devices = resolveDevices(target.devices, payload);
  return {
    ok: true,
    location: target.location,
    chain: { name: target.chain.name, type: target.location.target },
    count: devices.length,
    devices: devices.map((device) => deviceParameterInventory(device))
  };
}

export function deleteDeviceFromChain(state, payload = {}) {
  const target = resolveDeviceChain(state, payload);
  const deviceIndex = resolveDeviceIndex(target.devices, payload.deviceIndex, "deviceIndex");
  const [deletedDevice] = target.devices.splice(deviceIndex, 1);
  reindexDevices(target.devices);

  return {
    ok: true,
    deleted: true,
    location: target.location,
    device: clone(deletedDevice),
    deviceIndex,
    count: target.devices.length,
    devices: clone(target.devices)
  };
}

export function reorderDeviceInChain(state, payload = {}) {
  const target = resolveDeviceChain(state, payload);
  const deviceIndex = resolveDeviceIndex(target.devices, payload.deviceIndex, "deviceIndex");
  const toIndex = resolveDeviceIndex(target.devices, payload.toIndex, "toIndex");
  if (deviceIndex === toIndex) {
    throw new BridgeRequestError("toIndex must be different from deviceIndex");
  }

  const [device] = target.devices.splice(deviceIndex, 1);
  target.devices.splice(toIndex, 0, device);
  reindexDevices(target.devices);

  return {
    ok: true,
    reordered: true,
    location: target.location,
    fromIndex: deviceIndex,
    toIndex,
    device: clone(device),
    devices: clone(target.devices)
  };
}

function resolveDeviceChain(state, payload) {
  const location = normalizeLocation(payload);
  if (location.target === "track") {
    const trackIndex = requireNonNegativeInteger(coerceNonNegativeInteger(location.trackIndex), "trackIndex");
    const track = state.tracks[trackIndex];
    if (!track) {
      throw new BridgeRequestError("trackIndex is outside the available track range", 404);
    }
    track.devices = track.devices ?? [];
    return {
      location: { target: "track", trackIndex },
      chain: track,
      devices: track.devices
    };
  }

  if (location.target === "return") {
    const returnIndex = requireNonNegativeInteger(coerceNonNegativeInteger(location.returnIndex), "returnIndex");
    const returnTrack = state.returns[returnIndex];
    if (!returnTrack) {
      throw new BridgeRequestError("returnIndex is outside the available return track range", 404);
    }
    returnTrack.devices = returnTrack.devices ?? [];
    return {
      location: { target: "return", returnIndex },
      chain: returnTrack,
      devices: returnTrack.devices
    };
  }

  state.master.devices = state.master.devices ?? [];
  return {
    location: { target: "master" },
    chain: state.master,
    devices: state.master.devices
  };
}

function normalizeLocation(payload) {
  const rawLocation = isPlainObject(payload.location) ? payload.location : payload;
  const target = rawLocation.target ?? (rawLocation.returnIndex !== undefined ? "return" : rawLocation.trackIndex !== undefined ? "track" : undefined);
  if (!DEVICE_TARGETS.includes(target)) {
    throw new BridgeRequestError("location.target must be track, return, or master");
  }
  return {
    target,
    trackIndex: rawLocation.trackIndex ?? payload.trackIndex,
    returnIndex: rawLocation.returnIndex ?? payload.returnIndex
  };
}

function resolveDeviceIndex(devices, value, name) {
  const index = requireNonNegativeInteger(coerceNonNegativeInteger(value), name);
  if (index >= devices.length) {
    throw new BridgeRequestError(`${name} is outside the available device range`, 404);
  }
  return index;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateParameterName(parameter) {
  if (typeof parameter !== "string" || parameter.trim() === "") {
    throw new BridgeRequestError("parameter must be a non-empty string");
  }
  return parameter.trim();
}

function deviceParameterPayload(payload) {
  if (isPlainObject(payload.location)) {
    return payload;
  }
  return {
    ...payload,
    location: {
      target: payload.target ?? (payload.returnIndex !== undefined ? "return" : payload.trackIndex !== undefined ? "track" : "track"),
      trackIndex: payload.trackIndex,
      returnIndex: payload.returnIndex
    }
  };
}
