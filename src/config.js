const DEFAULT_BRIDGE_URL = "http://127.0.0.1:9789";
const DEFAULT_TIMEOUT_MS = 5000;
const LOCAL_BRIDGE_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export function loadBridgeConfig(options = {}, env = process.env) {
  const baseUrl = options.baseUrl ?? env.ABLETON_BRIDGE_URL ?? DEFAULT_BRIDGE_URL;
  const timeoutMs = parseTimeoutMs(options.timeoutMs ?? env.ABLETON_BRIDGE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const dryRun = options.dryRun ?? env.ABLETON_MCP_DRY_RUN === "1";

  return {
    baseUrl: formatBridgeUrl(validateBridgeUrl(baseUrl)),
    timeoutMs,
    dryRun
  };
}

function validateBridgeUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("ABLETON_BRIDGE_URL must be a valid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("ABLETON_BRIDGE_URL must use http or https");
  }

  if (!LOCAL_BRIDGE_HOSTS.has(url.hostname)) {
    throw new Error("ABLETON_BRIDGE_URL must point to 127.0.0.1, localhost, or ::1");
  }

  return url;
}

function parseTimeoutMs(value) {
  const timeoutMs = Number(value);
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("ABLETON_BRIDGE_TIMEOUT_MS must be a positive integer");
  }
  return timeoutMs;
}

function formatBridgeUrl(url) {
  if (url.pathname === "/" && url.search === "" && url.hash === "") {
    return url.origin;
  }
  return url.toString();
}
