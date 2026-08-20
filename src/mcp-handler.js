import { CapabilityResolver } from "./capability-resolver.js";
import { assertToolAvailable, projectToolDefinitions } from "./tool-capabilities.js";
import { createDispatch, rpcError, tools, validateToolInput } from "./tools.js";

const SERVER_NAME = "ableton-live-mcp";
const PROTOCOL_VERSION = "2024-11-05";

export function createMcpRequestHandler({ bridge, serverVersion, capabilityResolver } = {}) {
  const resolver = capabilityResolver ?? new CapabilityResolver(bridge);
  const resolveCapabilities = () => resolver.resolve();
  const dispatch = createDispatch(bridge, { resolveCapabilities });

  return async function handleRequest(request) {
    switch (request.method) {
      case "initialize":
        return {
          protocolVersion: request.params?.protocolVersion ?? PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: true } },
          serverInfo: { name: SERVER_NAME, version: serverVersion }
        };
      case "tools/list":
        return { tools: projectToolDefinitions(tools, await resolveCapabilities()) };
      case "tools/call":
        return callTool(request.params, dispatch, await resolveCapabilities());
      default:
        throw rpcError(-32601, `Method not found: ${request.method}`);
    }
  };
}

async function callTool(params = {}, dispatch, capabilityView) {
  const toolName = params.name;
  const args = params.arguments ?? {};
  const handler = dispatch[toolName];

  if (!handler) {
    throw rpcError(-32602, `Unknown tool: ${toolName}`);
  }

  assertToolAvailable(toolName, capabilityView);
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
