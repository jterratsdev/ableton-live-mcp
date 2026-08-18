const PLAN_TOOL = "ableton_plan_plugin_output_routing";
const APPLY_TOOL = "ableton_apply_plugin_output_routing";
const MAX_RECEIVER_ROUTES = 64;

const sourceProperties = Object.freeze({
  sourceTrackName: stringSchema("Exact Live source-track name containing SSD5."),
  deviceName: stringSchema("Exact SSD5 device name, for example SSD Sampler 5."),
  sourceRoutingType: stringSchema("Exact Live routing display name or routing identifier for the SSD5 source track.")
});

export const pluginOutputRoutingTools = Object.freeze([
  toolDefinition(
    PLAN_TOOL,
    "Read available SSD5 plugin output channels and propose receiver-track names without changing Live state.",
    {
      ...sourceProperties,
      receiverNamePrefix: stringSchema("Optional prefix for proposed receiver-track names.")
    },
    ["sourceTrackName", "deviceName", "sourceRoutingType"]
  ),
  toolDefinition(
    APPLY_TOOL,
    "Create or reuse verified Monitor In audio receivers for an explicit SSD5 output-to-track map.",
    {
      ...sourceProperties,
      routes: {
        type: "array",
        minItems: 1,
        maxItems: MAX_RECEIVER_ROUTES,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            outputChannel: stringSchema("Exact Live plugin output-channel display name."),
            trackName: stringSchema("Exact receiver audio-track name.")
          },
          required: ["outputChannel", "trackName"]
        }
      }
    },
    ["sourceTrackName", "deviceName", "sourceRoutingType", "routes"]
  )
]);

export function createPluginOutputRoutingDispatch(bridge) {
  return {
    [PLAN_TOOL]: (args) => bridge.invoke("plan_plugin_output_routing", args),
    [APPLY_TOOL]: (args) => bridge.invoke("apply_plugin_output_routing", args)
  };
}

export function validatePluginOutputRoutingToolInput(toolName, args) {
  if (toolName !== PLAN_TOOL && toolName !== APPLY_TOOL) {
    return;
  }
  for (const field of ["sourceTrackName", "deviceName", "sourceRoutingType"]) {
    requireNonBlank(args[field], field);
  }
  if (toolName === PLAN_TOOL && args.receiverNamePrefix !== undefined) {
    requireNonBlank(args.receiverNamePrefix, "receiverNamePrefix");
  }
  if (toolName === APPLY_TOOL) {
    if (!Array.isArray(args.routes) || args.routes.length < 1 || args.routes.length > MAX_RECEIVER_ROUTES) {
      throw invalidInput(`routes must contain between 1 and ${MAX_RECEIVER_ROUTES} entries`);
    }
    const outputChannels = new Set();
    const trackNames = new Set();
    args.routes.forEach((route, index) => {
      if (!route || typeof route !== "object" || Array.isArray(route)) {
        throw invalidInput(`routes[${index}] must be an object`);
      }
      const outputChannel = requireNonBlank(route.outputChannel, `routes[${index}].outputChannel`);
      const trackName = requireNonBlank(route.trackName, `routes[${index}].trackName`);
      requireUnique(outputChannels, outputChannel, "outputChannel");
      requireUnique(trackNames, trackName, "trackName");
    });
  }
}

function toolDefinition(name, description, properties, required) {
  return {
    name,
    description,
    inputSchema: { type: "object", additionalProperties: false, properties, required }
  };
}

function stringSchema(description) {
  return { type: "string", minLength: 1, description };
}

function requireNonBlank(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalidInput(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireUnique(values, value, field) {
  if (values.has(value)) {
    throw invalidInput(`routes contains duplicate ${field}: ${value}`);
  }
  values.add(value);
}

function invalidInput(message) {
  return Object.assign(new Error(message), { code: -32602 });
}
