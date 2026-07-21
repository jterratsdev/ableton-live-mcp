import { BridgeRequestError } from "../errors.js";
import { clone, requireNonNegativeInteger } from "./utils.js";
import { applyReturnPatch } from "./mixer.js";

export function listReturns(state) {
  return { ok: true, count: state.returns.length, returns: clone(state.returns) };
}

export function createReturn(state, payload = {}) {
  const name = validateReturnName(payload);
  const returnIndex = validateCreateReturnIndex(payload, state.returns.length);
  const returnTrack = {
    index: returnIndex,
    name,
    type: "return",
    volumeDb: 0,
    pan: 0,
    muted: false,
    solo: false,
    devices: []
  };

  state.returns.splice(returnIndex, 0, returnTrack);
  reindexReturns(state.returns);
  for (const track of state.tracks) {
    track.sends = track.sends ?? {};
    track.sends[name] = 0;
  }

  return {
    ok: true,
    created: true,
    return: clone(returnTrack),
    returnIndex: returnTrack.index,
    count: state.returns.length
  };
}

export function modifyReturn(state, payload) {
  const returnTrack = getReturnTrack(state, requireNonNegativeInteger(payload.returnIndex, "returnIndex"));
  const applied = applyReturnPatch(returnTrack, payload);
  return { ok: true, return: clone(returnTrack), applied };
}

export function deleteReturn(state, payload = {}) {
  const returnIndex = requireNonNegativeInteger(payload.returnIndex, "returnIndex");
  const returnTrack = getReturnTrack(state, returnIndex);
  const [deletedReturn] = state.returns.splice(returnIndex, 1);
  reindexReturns(state.returns);

  for (const track of state.tracks) {
    if (track.sends && Object.prototype.hasOwnProperty.call(track.sends, deletedReturn.name)) {
      delete track.sends[deletedReturn.name];
    }
    if (track.outputRouting === deletedReturn.name) {
      track.outputRouting = "Master";
    }
  }

  return {
    ok: true,
    deleted: true,
    return: clone(returnTrack),
    returnIndex,
    count: state.returns.length
  };
}

export function listBuses(state) {
  return {
    ok: true,
    master: clone(state.master),
    returns: clone(state.returns),
    buses: [
      { name: "Master", type: "master" },
      ...state.returns.map((returnTrack) => ({ name: returnTrack.name, type: "return", returnIndex: returnTrack.index }))
    ],
    trackRouting: state.tracks.map((track) => ({
      trackIndex: track.index,
      name: track.name,
      inputRouting: track.inputRouting,
      outputRouting: track.outputRouting,
      availableOutputs: ["Master", ...state.returns.map((returnTrack) => returnTrack.name)]
    }))
  };
}

export function getReturnTrack(state, returnIndex) {
  const returnTrack = state.returns[returnIndex];
  if (!returnTrack) {
    throw new BridgeRequestError("returnIndex is outside the available return track range", 404);
  }
  return returnTrack;
}

function validateReturnName(payload) {
  if (typeof payload.name !== "string" || payload.name.trim() === "") {
    throw new BridgeRequestError("name must be a non-empty string");
  }
  return payload.name.trim();
}

function validateCreateReturnIndex(payload, returnCount) {
  if (payload.returnIndex === undefined || payload.returnIndex === null) {
    return returnCount;
  }
  const returnIndex = requireNonNegativeInteger(payload.returnIndex, "returnIndex");
  if (returnIndex > returnCount) {
    throw new BridgeRequestError("returnIndex must be between 0 and current return count");
  }
  return returnIndex;
}

function reindexReturns(returns) {
  returns.forEach((returnTrack, index) => {
    returnTrack.index = index;
  });
}
