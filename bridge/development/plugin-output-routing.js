import { BridgeRequestError } from "../errors.js";
import {
  resolveExactRouting,
  routingDescriptor,
  routingLabel,
  uniqueRoutingDisplayNames
} from "./routing-options.js";

export function planPluginOutputRouting(state, payload) {
  const source = sourceRoutingContext(state, payload);
  const outputChannels = observableOutputChannels(state, source);
  const receiverNamePrefix = optionalNonBlank(payload.receiverNamePrefix, "receiverNamePrefix") ?? `${source.track.name} - `;

  return {
    ok: true,
    readOnly: true,
    source: sourceSummary(source),
    discoveryStatus: outputChannels.length > 0 ? "available" : "receiver_required",
    availableOutputChannels: outputChannels,
    proposedRoutes: outputChannels.map((outputChannel) => ({
      outputChannel,
      trackName: `${receiverNamePrefix}${outputChannel}`
    })),
    receiverRequired: outputChannels.length > 0 ? null : receiverRequiredDiagnostic(source.track.name)
  };
}

export function applyPluginOutputRouting(state, payload) {
  const source = sourceRoutingContext(state, payload);
  const routes = validatedRoutes(payload.routes);
  const availableChannels = new Set(observableOutputChannels(state, source));
  const existingByName = requestedTracksByName(state.tracks, routes.map(({ trackName }) => trackName));
  const receiverByName = new Map();
  const createdTracks = [];

  for (const route of routes) {
    resolveExactRouting(source.routing.outputChannels, route.outputChannel, false);
    if (availableChannels.size > 0 && !availableChannels.has(route.outputChannel)) {
      throw new BridgeRequestError(`outputChannel is not available: ${route.outputChannel}`, 404);
    }
    const existing = existingByName.get(route.trackName);
    if (existing) {
      receiverByName.set(route.trackName, verifiedExistingReceiver(existing, source, route));
    }
  }

  try {
    for (const route of routes) {
      if (existingByName.has(route.trackName)) {
        continue;
      }
      const track = createReceiverTrack(state, route.trackName);
      createdTracks.push(track);
      configureReceiver(track, source, route);
      receiverByName.set(route.trackName, receiverResult(track, source, route, true));
    }
  } catch (error) {
    rollbackCreatedTracks(state, createdTracks);
    throw error;
  }

  return {
    ok: true,
    source: sourceSummary(source),
    createdCount: createdTracks.length,
    reusedCount: routes.length - createdTracks.length,
    receivers: routes.map(({ trackName }) => receiverByName.get(trackName))
  };
}

function sourceRoutingContext(state, payload) {
  const sourceTrackName = requiredNonBlank(payload.sourceTrackName, "sourceTrackName");
  const deviceName = requiredNonBlank(payload.deviceName, "deviceName");
  const requestedRoutingType = requiredNonBlank(payload.sourceRoutingType, "sourceRoutingType");
  const matchingTracks = state.tracks.filter(({ name }) => name === sourceTrackName);
  if (matchingTracks.length !== 1) {
    throw new BridgeRequestError(`sourceTrackName must match exactly one track: ${sourceTrackName}`, 404);
  }
  const track = matchingTracks[0];
  if (!(track.devices ?? []).some((device) => device.name === deviceName)) {
    throw new BridgeRequestError(`deviceName is not present on source track: ${deviceName}`, 404);
  }
  const routing = track.pluginOutputRouting ?? {};
  const routingTypes = Array.isArray(routing.sourceRoutingTypes) && routing.sourceRoutingTypes.length > 0
    ? routing.sourceRoutingTypes
    : [routing.sourceRoutingType ?? sourceTrackName];
  const routingType = resolveExactRouting(routingTypes, requestedRoutingType, true);
  if (routingType === null) {
    throw new BridgeRequestError(`sourceRoutingType is not available: ${requestedRoutingType}`, 404);
  }
  return {
    track,
    deviceName,
    routing: {
      sourceRoutingType: routingType,
      outputChannels: Array.isArray(routing.outputChannels) ? routing.outputChannels : [],
      failureChannels: new Set(routing.failureChannels ?? [])
    }
  };
}

function configureReceiver(track, source, route) {
  track.inputRoutingType = source.routing.sourceRoutingType.displayName;
  if (source.routing.failureChannels.has(route.outputChannel)) {
    throw new BridgeRequestError(`Failed to route output channel: ${route.outputChannel}`);
  }
  track.inputRoutingChannel = route.outputChannel;
  track.monitoring = "In";
  track.monitoringState = 0;
  assertReceiverReadback(track, source, route);
}

function verifiedExistingReceiver(track, source, route) {
  assertReceiverReadback(track, source, route);
  return receiverResult(track, source, route, false);
}

function assertReceiverReadback(track, source, route) {
  const expectedRoutingType = source.routing.sourceRoutingType.displayName;
  if (track.type !== "audio" || track.inputRoutingType !== expectedRoutingType || track.inputRoutingChannel !== route.outputChannel || (track.monitoring !== "In" && track.monitoringState !== 0)) {
    throw new BridgeRequestError(`Existing receiver track does not match requested routing: ${route.trackName}`, 409);
  }
}

function receiverResult(track, source, route, created) {
  return {
    trackIndex: track.index,
    trackName: track.name,
    sourceRoutingType: source.routing.sourceRoutingType.displayName,
    sourceRoutingIdentifier: source.routing.sourceRoutingType.identifier,
    outputChannel: route.outputChannel,
    monitoring: "In",
    created,
    reused: !created,
    verified: true,
    readback: {
      inputRoutingType: track.inputRoutingType,
      inputRoutingChannel: track.inputRoutingChannel,
      monitoringState: track.monitoringState
    }
  };
}

function createReceiverTrack(state, name) {
  const track = {
    index: state.tracks.length,
    name,
    type: "audio",
    volumeDb: 0,
    pan: 0,
    muted: false,
    solo: false,
    armed: false,
    sends: Object.fromEntries(state.returns.map((returnTrack) => [returnTrack.name, 0])),
    inputRoutingType: null,
    inputRoutingChannel: null,
    monitoring: "Off",
    monitoringState: 2,
    outputRouting: "Master",
    devices: [],
    clips: []
  };
  state.tracks.push(track);
  return track;
}

function rollbackCreatedTracks(state, createdTracks) {
  const created = new Set(createdTracks);
  state.tracks = state.tracks.filter((track) => !created.has(track));
  state.tracks.forEach((track, index) => { track.index = index; });
}

function requestedTracksByName(tracks, requestedNames) {
  const requested = new Set(requestedNames);
  const tracksByName = new Map();
  for (const track of tracks) {
    if (!requested.has(track.name)) {
      continue;
    }
    if (tracksByName.has(track.name)) {
      tracksByName.set(track.name, null);
    } else {
      tracksByName.set(track.name, track);
    }
  }
  for (const [name, track] of tracksByName) {
    if (track === null) {
      throw new BridgeRequestError(`Existing track name is ambiguous: ${name}`, 409);
    }
  }
  return tracksByName;
}

function observableOutputChannels(state, source) {
  const labels = [];
  const seen = new Set();
  const routingType = source.routing.sourceRoutingType;
  for (const track of state.tracks) {
    const observedType = routingDescriptor(track.inputRoutingType);
    const isSourceSelected = observedType.displayName === routingType.displayName || (
      observedType.identifier && observedType.identifier === routingType.identifier
    );
    if (!isSourceSelected) {
      continue;
    }
    for (const label of uniqueRoutingDisplayNames(track.availableInputRoutingChannels ?? [])) {
      if (label && !seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    }
  }
  return labels;
}

function validatedRoutes(routes) {
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new BridgeRequestError("routes must be a non-empty array");
  }
  const outputChannels = new Set();
  const trackNames = new Set();
  return routes.map((route, index) => {
    const outputChannel = requiredNonBlank(route?.outputChannel, `routes[${index}].outputChannel`);
    const trackName = requiredNonBlank(route?.trackName, `routes[${index}].trackName`);
    requireUnique(outputChannels, outputChannel, "outputChannel");
    requireUnique(trackNames, trackName, "trackName");
    return { outputChannel, trackName };
  });
}

function sourceSummary(source) {
  return {
    trackIndex: source.track.index,
    trackName: source.track.name,
    deviceName: source.deviceName,
    sourceRoutingType: source.routing.sourceRoutingType.displayName,
    sourceRoutingIdentifier: source.routing.sourceRoutingType.identifier
  };
}

function receiverRequiredDiagnostic(sourceTrackName) {
  return {
    required: true,
    reason: "Live exposes plugin output-channel choices only for a receiver's currently selected input routing type.",
    nextStep: `In Live, route one audio track's Audio From to ${sourceTrackName}, then run this read-only plan again.`
  };
}

function requiredNonBlank(value, field) {
  const result = optionalNonBlank(value, field);
  if (result === null) {
    throw new BridgeRequestError(`${field} must be a non-empty string`);
  }
  return result;
}

function optionalNonBlank(value, field) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new BridgeRequestError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireUnique(values, value, field) {
  if (values.has(value)) {
    throw new BridgeRequestError(`routes contains duplicate ${field}: ${value}`);
  }
  values.add(value);
}
