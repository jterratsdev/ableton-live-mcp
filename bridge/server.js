#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { DevelopmentAbletonAdapter } from "./development-adapter.js";
import { createBridgeServer } from "./http-server.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 9789;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export function startDevelopmentBridge(options = {}) {
  const host = options.host ?? process.env.ABLETON_BRIDGE_HOST ?? DEFAULT_HOST;
  const port = Number(options.port ?? process.env.ABLETON_BRIDGE_PORT ?? DEFAULT_PORT);
  const adapter = options.adapter ?? new DevelopmentAbletonAdapter();
  const server = createBridgeServer(adapter);

  validateListenOptions(host, port);

  server.listen(port, host, () => {
    const address = server.address();
    process.stderr.write(`Ableton development bridge listening on http://${host}:${address.port}\n`);
  });

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startDevelopmentBridge();
}

function validateListenOptions(host, port) {
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error("ABLETON_BRIDGE_HOST must be 127.0.0.1, localhost, or ::1");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("ABLETON_BRIDGE_PORT must be an integer between 0 and 65535");
  }
}
