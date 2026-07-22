export async function diagnosePlayback(bridge) {
  const [status, project, arrangement, meters, routing] = await Promise.all([
    bridge.invoke("get_status"),
    bridge.invoke("get_project"),
    bridge.invoke("get_arrangement"),
    bridge.invoke("get_meters"),
    bridge.invoke("list_buses").catch((error) => ({ ok: false, error: error.message }))
  ]);

  const sessionClips = sessionClipInventory(project);
  const launchedClips = sessionClips.filter((clip) => clip.isPlaying || clip.isTriggered);
  const arrangementClips = Array.isArray(arrangement.clips) ? arrangement.clips : [];
  const meterSummary = summarizeMeters(meters);
  const mutedTracks = (project.tracks ?? []).filter((track) => track.muted);
  const soloTracks = (project.tracks ?? []).filter((track) => track.solo);
  const findings = [];

  if (status.playing && meterSummary.observable && meterSummary.reliableForMixing && !meterSummary.hasSignal) {
    findings.push({
      code: "transport_running_silent",
      severity: "warning",
      message: "Transport is running but observable meters are silent."
    });
  }
  if (!meterSummary.observable) {
    findings.push({
      code: "meters_unobservable",
      severity: "warning",
      message: "The bridge did not expose usable meter values."
    });
  }
  if (!meterSummary.reliableForMixing) {
    findings.push({
      code: "meters_unreliable_for_mixing",
      severity: "warning",
      message: `Meters are not reliable for mixing (${meterSummary.capabilityStatus}).`
    });
  }
  if (sessionClips.length > 0 && launchedClips.length === 0) {
    findings.push({
      code: "session_clips_idle",
      severity: status.playing ? "warning" : "info",
      message: "Session View clips exist, but none appear launched."
    });
  }
  if (arrangementClips.length === 0) {
    findings.push({
      code: "arrangement_empty",
      severity: "info",
      message: "Arrangement has no reported clips; transport alone may not produce audio."
    });
  }
  if (mutedTracks.length > 0) {
    findings.push({
      code: "muted_tracks",
      severity: "info",
      message: "Some tracks are muted."
    });
  }
  if (soloTracks.length > 0) {
    findings.push({
      code: "solo_active",
      severity: "info",
      message: "Solo is active; non-solo tracks may be silent."
    });
  }

  return {
    ok: true,
    playing: Boolean(status.playing),
    meterSummary,
    session: {
      clipCount: sessionClips.length,
      launchedClipCount: launchedClips.length,
      clips: sessionClips
    },
    arrangement: {
      clipCount: arrangementClips.length,
      lengthBeats: arrangement.lengthBeats ?? null
    },
    routing: routing.ok === false ? { ok: false, error: routing.error } : routing,
    muteSolo: {
      mutedTracks: mutedTracks.map(trackRef),
      soloTracks: soloTracks.map(trackRef)
    },
    findings,
    recommendedActions: recommendedActions(findings)
  };
}

function sessionClipInventory(project) {
  const clips = [];
  for (const track of project.tracks ?? []) {
    for (const clip of track.clips ?? []) {
      clips.push({
        trackIndex: track.index,
        trackName: track.name,
        clipSlotIndex: clip.slot,
        name: clip.name ?? "",
        lengthBeats: clip.lengthBeats ?? null,
        isPlaying: Boolean(clip.isPlaying),
        isTriggered: Boolean(clip.isTriggered)
      });
    }
  }
  return clips;
}

function summarizeMeters(meters) {
  const values = [];
  for (const target of [...(meters.tracks ?? []), ...(meters.returns ?? []), meters.master].filter(Boolean)) {
    for (const value of Object.values(target.meter ?? {})) {
      if (typeof value === "number" && Number.isFinite(value)) {
        values.push(value);
      }
    }
  }
  const hasSignal = values.some((value) => Math.abs(value) > 0.0001);
  const explicitlyReliable = meters.reliableForMixing;
  return {
    observable: values.length > 0,
    hasSignal,
    reliableForMixing: explicitlyReliable === undefined ? hasSignal : explicitlyReliable === true,
    capabilityStatus: meters.meterCapability?.status ?? (hasSignal ? "signal-observed" : "unknown"),
    max: values.length ? Math.max(...values.map(Math.abs)) : null,
    warningCount: Array.isArray(meters.warnings) ? meters.warnings.length : 0
  };
}

function recommendedActions(findings) {
  const codes = new Set(findings.map((finding) => finding.code));
  const actions = [];
  if (codes.has("session_clips_idle")) {
    actions.push("Launch a specific Session View clip with ableton_launch_clip, or launch a scene with ableton_launch_scene.");
  }
  if (codes.has("arrangement_empty") && codes.has("session_clips_idle")) {
    actions.push("Insert clips into Arrangement or launch Session View clips before relying on transport/start for audible playback.");
  }
  if (codes.has("meters_unobservable")) {
    actions.push("Use audible monitoring or a live smoke pass; this Live API may not expose meter fields.");
  }
  if (codes.has("meters_unreliable_for_mixing")) {
    actions.push("Do not make meter-guided mix changes; use analyzed rendered audio or another verified metering source.");
  }
  if (codes.has("muted_tracks") || codes.has("solo_active")) {
    actions.push("Review mute/solo state before changing faders.");
  }
  if (actions.length === 0) {
    actions.push("Playback state looks consistent; meter-guided mix moves can proceed with normal snapshot/risk checks.");
  }
  return actions;
}

function trackRef(track) {
  return { index: track.index, name: track.name };
}
