import {
  BRIDGE_MODES,
  CAPABILITY_SCHEMA_VERSION,
  ENDPOINT_SUPPORT,
  routeKey
} from "../bridge/observability.js";

export const CAPABILITY_HANDSHAKE_UNAVAILABLE = "capability_handshake_unavailable";
export const DEFAULT_CAPABILITY_TTL_MS = 2_000;
export const DEFAULT_CAPABILITY_FAILURE_TTL_MS = 100;

const VALID_STATUSES = new Set(["supported", "conditional", "unsupported"]);
const VALID_MODES = new Set(Object.values(BRIDGE_MODES));
const EXPECTED_ROUTES = new Set(ENDPOINT_SUPPORT.map(({ method, path }) => routeKey(method, path)));

export class CapabilityResolver {
  constructor(bridge, options = {}) {
    this.bridge = bridge;
    this.now = options.now ?? Date.now;
    this.successTtlMs = options.successTtlMs ?? DEFAULT_CAPABILITY_TTL_MS;
    this.failureTtlMs = options.failureTtlMs ?? DEFAULT_CAPABILITY_FAILURE_TTL_MS;
    this.cached = null;
    this.inFlight = null;
  }

  async resolve() {
    if (this.cached && this.cached.expiresAt > this.now()) {
      return this.cached.view;
    }
    if (this.inFlight) {
      return this.inFlight;
    }
    this.inFlight = this.refresh();
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  async refresh() {
    try {
      const view = normalizeCapabilityDocument(await this.bridge.invoke("get_capabilities"));
      this.cached = { view, expiresAt: this.now() + this.successTtlMs };
      return view;
    } catch {
      const view = createUnavailableCapabilityView();
      this.cached = { view, expiresAt: this.now() + this.failureTtlMs };
      return view;
    }
  }
}

export function normalizeCapabilityDocument(document) {
  if (!document || document.ok !== true || document.schemaVersion !== CAPABILITY_SCHEMA_VERSION) {
    throw new Error("Malformed bridge capability document");
  }
  if (!VALID_MODES.has(document.mode) || !Array.isArray(document.routes)) {
    throw new Error("Malformed bridge capability document");
  }

  const routes = new Map();
  for (const entry of document.routes) {
    const rawMethod = typeof entry?.method === "string" ? entry.method : "";
    const method = rawMethod.toUpperCase();
    const path = typeof entry?.path === "string" ? entry.path : "";
    const key = routeKey(method, path);
    if (rawMethod !== method || !EXPECTED_ROUTES.has(key) || routes.has(key) || !VALID_STATUSES.has(entry?.status)) {
      throw new Error("Malformed bridge capability route set");
    }
    if (typeof entry.reason !== "string" || entry.reason.trim() === "") {
      throw new Error("Malformed bridge capability reason");
    }
    routes.set(key, Object.freeze({ method, path, status: entry.status, reason: entry.reason.trim() }));
  }
  if (routes.size !== EXPECTED_ROUTES.size) {
    throw new Error("Incomplete bridge capability route set");
  }
  return Object.freeze({
    ok: true,
    available: true,
    schemaVersion: document.schemaVersion,
    mode: document.mode,
    routes
  });
}

export function createUnavailableCapabilityView() {
  const reason = `${CAPABILITY_HANDSHAKE_UNAVAILABLE}: active bridge capabilities could not be verified`;
  return Object.freeze({
    ok: false,
    available: false,
    schemaVersion: CAPABILITY_SCHEMA_VERSION,
    mode: "unavailable",
    reason,
    routes: new Map(ENDPOINT_SUPPORT.map(({ method, path }) => {
      const normalized = { method, path, status: "unsupported", reason };
      return [routeKey(method, path), Object.freeze(normalized)];
    }))
  });
}
