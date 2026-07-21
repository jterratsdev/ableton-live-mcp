import { BridgeRequestError } from "../errors.js";

export const MAX_BROWSER_SEARCH_RESULTS = 50;
const DEFAULT_BROWSER_SEARCH_LIMIT = 25;
const PLUGIN_BROWSER_KINDS = new Set(["instrument", "audio_effect", "midi_effect", "vst", "au", "plugin"]);
const BROWSER_KIND_ALIASES = new Map([
  ["presets", "preset"],
  ["samples", "sample"],
  ["racks", "rack"],
  ["grooves", "groove"],
  ["plugins", "plugin"],
  ["max", "max_device"],
  ["m4l", "max_device"],
  ["max_devices", "max_device"],
  ["max-device", "max_device"],
  ["max-devices", "max_device"],
  ["max_for_live", "max_device"],
  ["max-for-live", "max_device"]
]);
const SUPPORTED_BROWSER_KINDS = new Set([
  "any",
  "instrument",
  "audio_effect",
  "midi_effect",
  "rack",
  "preset",
  "sample",
  "groove",
  "plugin",
  "vst",
  "au",
  "max_device"
]);

export function normalizePluginFilters(filters = {}) {
  return {
    kind: typeof filters.kind === "string" && filters.kind.trim() ? filters.kind.trim() : "any",
    query: typeof filters.query === "string" && filters.query.trim() ? filters.query.trim() : ""
  };
}

export function normalizeBrowserSearchFilters(filters = {}) {
  const kind = normalizeBrowserKind(filters.kind);
  return {
    kind,
    query: typeof filters.query === "string" && filters.query.trim() ? filters.query.trim() : "",
    limit: normalizeBrowserLimit(filters.limit)
  };
}

export function matchesPlugin(plugin, filters) {
  return matchesKind(plugin, filters.kind) && matchesQuery(plugin, filters.query);
}

export function matchesBrowserItem(item, filters) {
  return matchesBrowserKind(item.kind, filters.kind) && matchesBrowserQuery(item, filters.query);
}

export function pluginToBrowserItem(plugin) {
  return {
    kind: plugin.kind,
    name: plugin.name,
    path: plugin.path ?? null,
    loadable: plugin.loadable ?? true,
    ref: plugin.id,
    type: plugin.type,
    source: plugin.source,
    tags: Array.isArray(plugin.tags) ? plugin.tags : []
  };
}

export function normalizeBrowserItem(item) {
  return {
    kind: item.kind,
    name: item.name,
    path: item.path ?? null,
    loadable: item.loadable === true,
    ref: item.ref ?? item.id ?? item.path ?? item.name,
    type: item.type,
    source: item.source,
    tags: Array.isArray(item.tags) ? item.tags : []
  };
}

export function listPlugins(state, filters = {}) {
  const normalizedFilters = normalizePluginFilters(filters);
  const plugins = state.plugins
    .filter((plugin) => matchesPlugin(plugin, normalizedFilters))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  return {
    ok: true,
    filters: normalizedFilters,
    count: plugins.length,
    plugins: cloneForResponse(plugins)
  };
}

export function searchBrowser(state, filters = {}) {
  const normalizedFilters = normalizeBrowserSearchFilters(filters);
  const inventory = [
    ...state.plugins.map((plugin) => pluginToBrowserItem(plugin)),
    ...state.browserItems.map((item) => normalizeBrowserItem(item))
  ];
  const matches = inventory
    .filter((item) => matchesBrowserItem(item, normalizedFilters))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  const results = matches.slice(0, normalizedFilters.limit);

  return {
    ok: true,
    filters: normalizedFilters,
    count: results.length,
    capped: matches.length > results.length,
    results: cloneForResponse(results)
  };
}

function matchesKind(plugin, kind) {
  return !kind || kind === "any" || plugin.kind === kind || plugin.type === kind;
}

function matchesQuery(plugin, query) {
  if (!query) {
    return true;
  }
  const haystack = [plugin.id, plugin.name, plugin.kind, plugin.type, plugin.source, ...plugin.tags].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function matchesBrowserKind(itemKind, requestedKind) {
  if (!requestedKind || requestedKind === "any") {
    return true;
  }
  if (requestedKind === "plugin") {
    return PLUGIN_BROWSER_KINDS.has(itemKind);
  }
  return itemKind === requestedKind;
}

function matchesBrowserQuery(item, query) {
  if (!query) {
    return true;
  }
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const haystack = [
    item.ref,
    item.id,
    item.name,
    item.kind,
    item.type,
    item.source,
    item.path,
    ...tags
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function normalizeBrowserKind(kind) {
  if (typeof kind !== "string" || kind.trim() === "") {
    return "any";
  }
  const normalized = kind.trim().toLowerCase();
  const canonical = BROWSER_KIND_ALIASES.get(normalized) ?? normalized;
  if (!SUPPORTED_BROWSER_KINDS.has(canonical)) {
    throw new BridgeRequestError(`kind must be one of ${Array.from(SUPPORTED_BROWSER_KINDS).join(", ")}`);
  }
  return canonical;
}

function normalizeBrowserLimit(limit) {
  if (limit === undefined || limit === null || limit === "") {
    return DEFAULT_BROWSER_SEARCH_LIMIT;
  }
  const parsed = typeof limit === "number" ? limit : Number.parseInt(String(limit), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BridgeRequestError("limit must be a positive integer");
  }
  return Math.min(parsed, MAX_BROWSER_SEARCH_RESULTS);
}

function cloneForResponse(value) {
  return JSON.parse(JSON.stringify(value));
}
