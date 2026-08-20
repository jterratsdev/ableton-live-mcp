#!/usr/bin/env node
import { readFileSync } from "node:fs";
import readline from "node:readline";
import { AbletonBridge } from "./bridge.js";
import { createMcpRequestHandler } from "./mcp-handler.js";

const SERVER_VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

const bridge = new AbletonBridge();
const handleRequest = createMcpRequestHandler({ bridge, serverVersion: SERVER_VERSION });

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Number.POSITIVE_INFINITY
});

rl.on("line", async (line) => {
  if (!line.trim()) {
    return;
  }

  let request;
  try {
    request = JSON.parse(line);
  } catch (error) {
    sendError(null, -32700, `Parse error: ${error.message}`);
    return;
  }

  if (request.id === undefined) {
    return;
  }

  try {
    const result = await handleRequest(request);
    send({ jsonrpc: "2.0", id: request.id, result });
  } catch (error) {
    sendError(request.id, error.code ?? -32000, error.message);
  }
});

rl.on("close", () => {
  process.exit(0);
});

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
