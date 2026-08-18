import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";

export const OBSERVABILITY_SCHEMA_VERSION = "1.0.0";
export const DEFAULT_BRIDGE_VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

export const ENDPOINT_SUPPORT = Object.freeze([
  endpoint("GET", "/status", "read", "supported", "supported"),
  endpoint("GET", "/project", "read", "supported", "supported"),
  endpoint("GET", "/arrangement", "read", "supported", "supported"),
  endpoint("GET", "/arrangement/clips/delete-plan", "read", "supported", "conditional", "Requires Track.arrangement_clips and exact Clip timing identity fields"),
  endpoint("DELETE", "/arrangement/clips", "destructive", "supported", "conditional", "Requires Track.delete_clip and a current exact deletion plan"),
  endpoint("POST", "/project/snapshot", "safe-write", "supported", "supported"),
  endpoint("POST", "/project/rollback", "destructive", "supported", "supported"),
  endpoint("GET", "/plugins", "read", "supported", "supported"),
  endpoint("GET", "/browser/search", "read", "supported", "supported"),
  endpoint("POST", "/analysis/audio", "read", "supported", "unsupported", "Remote Script does not analyze local audio files"),
  endpoint("POST", "/analysis/mix", "read", "supported", "unsupported", "MCP performs rendered-file analysis locally; Remote Script does not analyze audio files"),
  endpoint("GET", "/production/report", "read", "supported", "supported"),
  endpoint("POST", "/tempo", "safe-write", "supported", "supported"),
  endpoint("POST", "/automation", "safe-write", "supported", "unsupported", "Live Python API does not expose reliable cross-version envelope mutation"),
  endpoint("POST", "/project/save", "safe-write", "supported", "conditional", "Save methods vary by Live version and set state"),
  endpoint("POST", "/signature", "safe-write", "supported", "supported"),
  endpoint("POST", "/tracks/midi", "safe-write", "supported", "supported"),
  endpoint("POST", "/tracks/duplicate", "safe-write", "supported", "conditional", "Requires Live duplicate_track support"),
  endpoint("POST", "/tracks/freeze", "safe-write", "supported", "conditional", "Requires Live freeze support"),
  endpoint("POST", "/tracks/flatten", "destructive", "supported", "conditional", "Requires Live flatten support"),
  endpoint("POST", "/tracks/modify", "safe-write", "supported", "supported"),
  endpoint("GET", "/returns", "read", "supported", "supported"),
  endpoint("POST", "/returns/create", "safe-write", "supported", "conditional", "Requires Live return-track creation support"),
  endpoint("POST", "/returns/modify", "safe-write", "supported", "supported"),
  endpoint("DELETE", "/returns", "destructive", "supported", "conditional", "Requires Live return-track deletion support"),
  endpoint("GET", "/routing/buses", "read", "supported", "supported"),
  endpoint("GET", "/meters", "read", "supported", "conditional", "Meter fields vary by Live version"),
  endpoint("POST", "/master/modify", "safe-write", "supported", "conditional", "Master mute and solo are not universally exposed"),
  endpoint("POST", "/arrangement/insert", "safe-write", "supported", "unsupported", "Remote Script has no reliable arrangement clip insertion API"),
  endpoint("POST", "/arrangement/locators", "safe-write", "supported", "conditional", "Requires Live cue point mutation support"),
  endpoint("POST", "/transport/start", "safe-write", "supported", "supported"),
  endpoint("POST", "/transport/stop", "safe-write", "supported", "supported"),
  endpoint("POST", "/clips/launch", "safe-write", "supported", "supported"),
  endpoint("POST", "/scenes/launch", "safe-write", "supported", "supported"),
  endpoint("POST", "/devices/load", "safe-write", "supported", "supported"),
  endpoint("POST", "/devices/load-master", "safe-write", "supported", "supported"),
  endpoint("GET", "/devices/parameters", "read", "supported", "supported"),
  endpoint("POST", "/devices/parameter", "safe-write", "supported", "supported"),
  endpoint("POST", "/devices/reorder", "safe-write", "supported", "unsupported", "Live Python API does not expose reliable cross-version device reorder"),
  endpoint("DELETE", "/devices", "destructive", "supported", "conditional", "Requires device-chain delete support"),
  endpoint("POST", "/mastering/apply", "safe-write", "supported", "supported"),
  endpoint("POST", "/render/export", "export", "supported", "unsupported", "Remote Script render export is not supported"),
  endpoint("POST", "/tracks/bounce", "export", "supported", "unsupported", "Remote Script track bounce is not supported"),
  endpoint("POST", "/mastering/analyze-and-apply", "export", "supported", "unsupported", "Remote Script mastering analysis depends on unsupported render export"),
  endpoint("POST", "/mastering/remove-reverb", "safe-write", "unsupported", "supported"),
  endpoint("POST", "/clips/midi", "safe-write", "supported", "supported"),
  endpoint("POST", "/clips/consolidate", "safe-write", "supported", "unsupported", "Remote Script has no reliable consolidation API"),
  endpoint("DELETE", "/clips/midi", "destructive", "supported", "supported"),
  endpoint("GET", "/clips/notes", "read", "supported", "conditional", "Requires readable MIDI note API"),
  endpoint("POST", "/clips/humanize", "safe-write", "supported", "conditional", "Requires readable and replaceable MIDI note API"),
  endpoint("POST", "/clips/quantize", "safe-write", "supported", "conditional", "Requires readable and replaceable MIDI note API"),
  endpoint("POST", "/groove/apply", "safe-write", "supported", "conditional", "Requires readable and replaceable MIDI note API"),
  endpoint("POST", "/midi/import", "safe-write", "supported", "unsupported", "MIDI import is parsed in the MCP process")
]);

export function createBridgeObservabilitySnapshot(options = {}) {
  const installedFiles = normalizeInstalledFiles(options.installedFiles);
  const runtimeStartedAt = normalizeTimestamp(options.runtimeStartedAt);

  return {
    ok: true,
    schemaVersion: OBSERVABILITY_SCHEMA_VERSION,
    mode: options.mode ?? "deterministic-development-observability",
    version: {
      bridgeVersion: normalizeOptionalString(options.bridgeVersion) ?? DEFAULT_BRIDGE_VERSION,
      buildHash: normalizeOptionalString(options.buildHash) ?? buildHashFromInstalledFiles(installedFiles)
    },
    process: {
      pid: normalizePid(options.processPid ?? process.pid),
      livePid: normalizePid(options.livePid)
    },
    runtime: {
      host: normalizeOptionalString(options.host) ?? "127.0.0.1",
      port: normalizePort(options.port ?? 9789),
      startedAt: runtimeStartedAt
    },
    installedFiles,
    endpointSupport: endpointSupportSummary(ENDPOINT_SUPPORT),
    lastError: normalizeLastError(options.lastError),
    staleRuntime: diagnoseStaleRuntime(runtimeStartedAt, installedFiles)
  };
}

export async function collectInstalledFileMetadata(paths) {
  const files = [];
  for (const filePath of paths ?? []) {
    files.push(await installedFileMetadata(filePath));
  }
  return files;
}

export function endpointSupportSummary(endpoints = ENDPOINT_SUPPORT) {
  const entries = endpoints.map((entry) => ({ ...entry }));
  return {
    count: entries.length,
    development: countStatuses(entries, "development"),
    remoteScript: countStatuses(entries, "remoteScript"),
    endpoints: entries
  };
}

function endpoint(method, path, riskTier, developmentStatus, remoteScriptStatus, note = undefined) {
  return {
    method,
    path,
    riskTier,
    development: { status: developmentStatus },
    remoteScript: { status: remoteScriptStatus, note }
  };
}

async function installedFileMetadata(filePath) {
  try {
    const [metadata, content] = await Promise.all([stat(filePath), readFile(filePath)]);
    return {
      path: filePath,
      exists: true,
      sizeBytes: metadata.size,
      mtimeMs: metadata.mtimeMs,
      sha256: createHash("sha256").update(content).digest("hex")
    };
  } catch (error) {
    return {
      path: filePath,
      exists: false,
      error: error.message
    };
  }
}

function normalizeInstalledFiles(files = []) {
  return files.map((file) => ({
    path: String(file.path),
    exists: Boolean(file.exists),
    sizeBytes: Number.isFinite(file.sizeBytes) ? file.sizeBytes : null,
    mtimeMs: Number.isFinite(file.mtimeMs) ? file.mtimeMs : null,
    sha256: normalizeOptionalString(file.sha256),
    error: normalizeOptionalString(file.error)
  }));
}

function buildHashFromInstalledFiles(files) {
  const hashedFiles = files.filter((file) => file.exists && file.sha256);
  if (hashedFiles.length === 0) {
    return null;
  }

  const hash = createHash("sha256");
  for (const file of hashedFiles.sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(`${file.path}:${file.sizeBytes}:${file.mtimeMs}:${file.sha256}\n`);
  }
  return hash.digest("hex");
}

function countStatuses(endpoints, runtimeKey) {
  return endpoints.reduce((counts, endpointEntry) => {
    const status = endpointEntry[runtimeKey].status;
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
}

function normalizeLastError(error) {
  if (!error) {
    return null;
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return {
    name: normalizeOptionalString(error.name),
    message: normalizeOptionalString(error.message) ?? String(error),
    endpoint: normalizeOptionalString(error.endpoint),
    statusCode: Number.isInteger(error.statusCode) ? error.statusCode : null,
    at: normalizeTimestamp(error.at)
  };
}

function diagnoseStaleRuntime(runtimeStartedAt, installedFiles) {
  const runtimeStartedMs = Date.parse(runtimeStartedAt ?? "");
  const newestInstalledMtimeMs = Math.max(
    ...installedFiles
      .filter((file) => file.exists && Number.isFinite(file.mtimeMs))
      .map((file) => file.mtimeMs),
    Number.NEGATIVE_INFINITY
  );

  if (!Number.isFinite(runtimeStartedMs) || !Number.isFinite(newestInstalledMtimeMs)) {
    return {
      status: "unknown",
      isStale: null,
      reason: "runtime start time or installed file timestamps are unavailable"
    };
  }

  if (runtimeStartedMs < newestInstalledMtimeMs) {
    return {
      status: "stale",
      isStale: true,
      reason: "installed Remote Script files are newer than the running bridge runtime",
      newestInstalledAt: new Date(newestInstalledMtimeMs).toISOString()
    };
  }

  return {
    status: "fresh",
    isStale: false,
    reason: "running bridge runtime is newer than or equal to installed Remote Script files",
    newestInstalledAt: new Date(newestInstalledMtimeMs).toISOString()
  };
}

function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePid(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function normalizePort(value) {
  return Number.isInteger(value) && value >= 0 && value <= 65535 ? value : null;
}

function normalizeTimestamp(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  if (Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return null;
}
