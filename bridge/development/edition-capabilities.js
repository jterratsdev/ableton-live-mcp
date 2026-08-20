import { BridgeRequestError } from "../errors.js";

export const EDITION_SOURCE = {
  url: "https://www.ableton.com/en/upgrade-live/",
  verifiedDate: "2026-08-18"
};

const PROFILES = {
  lite: { displayName: "Live Lite", maximum: 8 },
  intro: { displayName: "Live Intro", maximum: 16 },
  standard: { displayName: "Live Standard", maximum: null },
  suite: { displayName: "Live Suite", maximum: null }
};

export function editionCapabilities(state) {
  const name = typeof state.liveEdition === "string" ? state.liveEdition.toLowerCase() : "unknown";
  const profile = PROFILES[name];
  const detected = Boolean(profile);
  const maximum = profile?.maximum ?? null;
  const current = state.tracks.length;
  const finiteLimit = maximum !== null;
  const remaining = finiteLimit ? Math.max(maximum - current, 0) : null;
  const status = !detected ? "unknown" : !finiteLimit ? "unlimited" : remaining === 0 ? "at-limit" : "available";
  return {
    edition: {
      name: detected ? name : "unknown",
      displayName: profile?.displayName ?? "Unknown Live edition",
      detected,
      provenance: detected ? "development-config" : "unavailable",
      confidence: detected ? "high" : "none",
      evidence: detected ? name : null,
      source: EDITION_SOURCE
    },
    audioMidiTracks: {
      current,
      maximum,
      remaining,
      finiteLimit,
      atLimit: finiteLimit && remaining === 0,
      status
    }
  };
}

export function requireAudioMidiTrackCapacity(state, operation) {
  const capabilities = editionCapabilities(state);
  const capacity = capabilities.audioMidiTracks;
  if (capacity.atLimit) {
    throw new BridgeRequestError(
      `${operation} cannot create another audio/MIDI track: ${capabilities.edition.displayName} is at its verified ${capacity.maximum}-track limit`,
      409,
      { errorCode: "edition_track_capacity_reached", operation, editionCapabilities: capabilities }
    );
  }
  return capabilities;
}
