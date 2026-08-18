import { BridgeRequestError } from "../errors.js";

export function resolveExactRouting(options, requested, allowIdentifier) {
  const descriptors = (options ?? []).map(routingDescriptor);
  if (allowIdentifier) {
    const identifierMatch = descriptors.find(({ identifier }) => identifier === requested);
    if (identifierMatch) {
      return identifierMatch;
    }
  }
  const displayMatches = descriptors.filter(({ displayName }) => displayName === requested);
  if (displayMatches.length < 2) {
    return displayMatches[0] ?? null;
  }
  const identifiers = new Set(displayMatches.map(({ identifier }) => identifier));
  if (!identifiers.has(null) && identifiers.size === 1) {
    return displayMatches[0];
  }
  throw new BridgeRequestError(
    `routing display name is ambiguous: ${requested}; use an exact identifier when supported`,
    409
  );
}

export function uniqueRoutingDisplayNames(options) {
  const labels = [];
  const seen = new Set();
  for (const option of options) {
    const label = routingLabel(option);
    if (!label || seen.has(label)) {
      continue;
    }
    resolveExactRouting(options, label, false);
    seen.add(label);
    labels.push(label);
  }
  return labels;
}

export function routingDescriptor(value) {
  if (value === undefined || value === null) {
    return { displayName: null, identifier: null };
  }
  if (typeof value === "string") {
    return { displayName: value, identifier: value };
  }
  return {
    displayName: value?.displayName ?? value?.display_name,
    identifier: value?.identifier ?? value?.displayName ?? value?.display_name
  };
}

export function routingLabel(value) {
  return typeof value === "string" ? value : (value?.displayName ?? value?.display_name);
}
