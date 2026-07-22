#!/usr/bin/env node
import { readFileSync } from "node:fs";
import readline from "node:readline";
import { AbletonBridge } from "./bridge.js";
import { createDispatch, rpcError, tools, validateToolInput } from "./tools.js";

const SERVER_NAME = "ableton-live-mcp";
const SERVER_VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const PROTOCOL_VERSION = "2024-11-05";

const bridge = new AbletonBridge();
const dispatch = createDispatch(bridge);

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

async function handleRequest(request) {
  switch (request.method) {
    case "initialize":
      return {
        protocolVersion: request.params?.protocolVersion ?? PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      };
    case "tools/list":
      return { tools };
    case "tools/call":
      return callTool(request.params);
    default:
      throw rpcError(-32601, `Method not found: ${request.method}`);
  }
}

async function callTool(params = {}) {
  const toolName = params.name;
  const args = params.arguments ?? {};
  const handler = dispatch[toolName];

  if (!handler) {
    throw rpcError(-32602, `Unknown tool: ${toolName}`);
  }

  validateToolInput(toolName, args);

  try {
    const result = await handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message }]
    };
  }
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
