import { createHash } from "node:crypto";
import { BridgeRequestError } from "../errors.js";
import { clone } from "./utils.js";

const objectIdentities = new WeakMap();
let nextObjectIdentity = 1;

export function planArrangementClipDeletion(state) {
  const candidates = arrangementCandidates(state).map(publicCandidate);

  assertUniqueCandidateIdentities(candidates);
  return {
    ok: true,
    readOnly: true,
    planToken: tokenFor(candidates.map(({ clipIdentity }) => clipIdentity)),
    candidates: clone(candidates)
  };
}

export function deleteArrangementClips(state, payload = {}) {
  const requestedIdentities = validateDeletionRequest(payload);
  const currentPlan = planArrangementClipDeletion(state);
  if (payload.planToken !== currentPlan.planToken) {
    throw new BridgeRequestError("Arrangement deletion plan is stale; run the read-only planning tool again", 409);
  }

  const candidatesByIdentity = new Map(currentPlan.candidates.map((candidate) => [candidate.clipIdentity, candidate]));
  const selected = requestedIdentities.map((clipIdentity) => {
    const candidate = candidatesByIdentity.get(clipIdentity);
    if (!candidate) {
      throw new BridgeRequestError(`Arrangement clip identity is missing or stale: ${clipIdentity}`, 409);
    }
    if (!candidate.deletionSupported) {
      throw new BridgeRequestError(`Arrangement clip deletion is unsupported for track ${candidate.trackIndex}`, 501);
    }
    return candidate;
  });

  const deleted = [];
  for (const candidate of selected.sort(reverseTimelineOrder)) {
    const currentCandidates = arrangementCandidates(state);
    const current = currentCandidates.find(({ clipIdentity }) => clipIdentity === candidate.clipIdentity);
    const index = current ? state.arrangement.clips.indexOf(current.sourceClip) : -1;
    if (index < 0) {
      throw new BridgeRequestError(`Arrangement clip changed during deletion: ${candidate.clipIdentity}`, 409);
    }
    state.arrangement.clips.splice(index, 1);
    deleted.push(candidate);
  }

  const remainingIdentities = new Set(planArrangementClipDeletion(state).candidates.map(({ clipIdentity }) => clipIdentity));
  return {
    ok: true,
    deletedCount: deleted.length,
    results: requestedIdentities.map((clipIdentity) => ({
      clipIdentity,
      deleted: !remainingIdentities.has(clipIdentity),
      verifiedAbsent: !remainingIdentities.has(clipIdentity)
    }))
  };
}

function arrangementClipCandidate(state, clip, arrangementIndex) {
  const trackIndex = clip.trackIndex;
  const track = state.tracks.find((candidate) => candidate.index === trackIndex);
  const startBeat = clip.startBeat;
  const lengthBeats = clip.lengthBeats;
  const identityFields = [trackIndex, arrangementIndex, objectIdentity(clip), clip.name ?? "", startBeat, lengthBeats];
  return {
    trackIndex,
    trackIdentity: tokenFor([trackIndex, track ? objectIdentity(track) : "", track?.name ?? clip.trackName ?? ""]),
    trackName: track?.name ?? clip.trackName ?? "",
    arrangementIndex,
    clipIdentity: tokenFor(identityFields),
    name: clip.name ?? "",
    startBeat,
    lengthBeats,
    deletionSupported: track?.arrangementDeleteSupported !== false,
    sourceClip: clip
  };
}

function arrangementCandidates(state) {
  const trackCounts = new Map();
  return (state.arrangement?.clips ?? []).map((clip) => {
    const arrangementIndex = trackCounts.get(clip.trackIndex) ?? 0;
    trackCounts.set(clip.trackIndex, arrangementIndex + 1);
    return arrangementClipCandidate(state, clip, arrangementIndex);
  });
}

function publicCandidate({ sourceClip, ...candidate }) {
  return candidate;
}

function validateDeletionRequest(payload) {
  if (typeof payload.planToken !== "string" || payload.planToken.length === 0) {
    throw new BridgeRequestError("planToken must be the token returned by the read-only planning tool");
  }
  if (!Array.isArray(payload.clipIdentities) || payload.clipIdentities.length === 0) {
    throw new BridgeRequestError("clipIdentities must be a non-empty array of pre-resolved Arrangement clip identities");
  }
  if (payload.clipIdentities.some((identity) => typeof identity !== "string" || identity.length === 0)) {
    throw new BridgeRequestError("clipIdentities must contain only non-empty strings");
  }
  if (new Set(payload.clipIdentities).size !== payload.clipIdentities.length) {
    throw new BridgeRequestError("clipIdentities contains a duplicated or ambiguous selection", 409);
  }
  return [...payload.clipIdentities];
}

function assertUniqueCandidateIdentities(candidates) {
  const identities = candidates.map(({ clipIdentity }) => clipIdentity);
  if (new Set(identities).size !== identities.length) {
    throw new BridgeRequestError("Arrangement clip identities are ambiguous; no deletion plan was created", 409);
  }
}

function reverseTimelineOrder(left, right) {
  return right.trackIndex - left.trackIndex || right.startBeat - left.startBeat || right.arrangementIndex - left.arrangementIndex;
}

function tokenFor(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function objectIdentity(value) {
  let identity = objectIdentities.get(value);
  if (identity === undefined) {
    identity = nextObjectIdentity;
    nextObjectIdentity += 1;
    objectIdentities.set(value, identity);
  }
  return identity;
}
