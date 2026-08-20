export const SCENE_TIME_SIGNATURE_DENOMINATORS = Object.freeze([1, 2, 4, 8, 16, 32]);

const tempoActionSchema = {
  oneOf: [
    objectSchema({ action: { const: "set" }, bpm: { type: "number", minimum: 20, maximum: 999 } }, ["action", "bpm"]),
    objectSchema({ action: { const: "clear" } }, ["action"])
  ]
};

const timeSignatureActionSchema = {
  oneOf: [
    objectSchema({
      action: { const: "set" },
      numerator: { type: "integer", minimum: 1, maximum: 32 },
      denominator: { type: "integer", enum: SCENE_TIME_SIGNATURE_DENOMINATORS }
    }, ["action", "numerator", "denominator"]),
    objectSchema({ action: { const: "clear" } }, ["action"])
  ]
};

export const sceneTempoSignatureTools = Object.freeze([
  {
    name: "ableton_get_scene_tempo_signature_capabilities",
    description: "Read per-property tempo and time-signature override capabilities for one exact Session Scene index without writing or launching it. Overrides affect playback only when that Session Scene is later launched explicitly; this does not create Arrangement automation or change global Song tempo/signature.",
    inputSchema: objectSchema({ sceneIndex: nonNegativeInteger() }, ["sceneIndex"])
  },
  {
    name: "ableton_set_scene_tempo_signature_overrides",
    description: "Atomically set or clear tempo and time-signature overrides for one exact Session Scene index without launching it. Overrides affect playback only when that Session Scene is later launched explicitly; this does not create Arrangement envelopes or markers and never falls back to global Song tempo/signature.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        sceneIndex: nonNegativeInteger(),
        tempo: tempoActionSchema,
        timeSignature: timeSignatureActionSchema
      },
      required: ["sceneIndex"],
      anyOf: [{ required: ["tempo"] }, { required: ["timeSignature"] }]
    }
  }
]);

export function createSceneTempoSignatureDispatch(bridge) {
  return {
    ableton_get_scene_tempo_signature_capabilities: ({ sceneIndex }) => bridge.invoke("get_scene_tempo_signature_capabilities", { sceneIndex }),
    ableton_set_scene_tempo_signature_overrides: (args) => bridge.invoke("set_scene_tempo_signature_overrides", args)
  };
}

export function validateSceneTempoSignatureToolInput(toolName, args) {
  if (toolName === "ableton_get_scene_tempo_signature_capabilities") {
    requireObject(args, "request");
    assertExactFields(args, ["sceneIndex"]);
    requireSceneIndex(args.sceneIndex);
    return true;
  }
  if (toolName !== "ableton_set_scene_tempo_signature_overrides") return false;

  validateSceneOverrideRequest(args);
  return true;
}

export function validateSceneOverrideRequest(args) {
  requireObject(args, "request");
  assertExactFields(args, ["sceneIndex", "tempo", "timeSignature"]);
  requireSceneIndex(args.sceneIndex);
  if (args.tempo === undefined && args.timeSignature === undefined) invalid("tempo or timeSignature is required");
  if (args.tempo !== undefined) validateTempoAction(args.tempo);
  if (args.timeSignature !== undefined) validateTimeSignatureAction(args.timeSignature);
  return args;
}

function validateTempoAction(action) {
  requireObject(action, "tempo");
  if (action.action === "set") {
    assertExactFields(action, ["action", "bpm"], "tempo");
    if (typeof action.bpm !== "number" || !Number.isFinite(action.bpm) || action.bpm < 20 || action.bpm > 999) {
      invalid("tempo.bpm must be a finite number between 20 and 999");
    }
    return;
  }
  if (action.action === "clear") {
    assertExactFields(action, ["action"], "tempo");
    return;
  }
  invalid("tempo.action must be set or clear");
}

function validateTimeSignatureAction(action) {
  requireObject(action, "timeSignature");
  if (action.action === "set") {
    assertExactFields(action, ["action", "numerator", "denominator"], "timeSignature");
    if (!Number.isInteger(action.numerator) || action.numerator < 1 || action.numerator > 32) {
      invalid("timeSignature.numerator must be an integer between 1 and 32");
    }
    if (!SCENE_TIME_SIGNATURE_DENOMINATORS.includes(action.denominator)) {
      invalid("timeSignature.denominator must be one of 1, 2, 4, 8, 16, or 32");
    }
    return;
  }
  if (action.action === "clear") {
    assertExactFields(action, ["action"], "timeSignature");
    return;
  }
  invalid("timeSignature.action must be set or clear");
}

function requireSceneIndex(value) {
  if (!Number.isInteger(value) || value < 0) invalid("sceneIndex must be a non-negative integer");
}

function requireObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`${name} must be an object`);
}

function assertExactFields(value, allowed, prefix = "request") {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) invalid(`${prefix} contains unsupported fields: ${unexpected.join(", ")}`);
}

function invalid(message) {
  const error = new Error(message);
  error.code = -32602;
  throw error;
}

function objectSchema(properties, required = []) {
  return { type: "object", additionalProperties: false, properties, required };
}

function nonNegativeInteger() {
  return { type: "integer", minimum: 0 };
}
