import { classifyToolRisk, hasToolRiskClassification } from "./risk-policy.js";

export const WORKFLOW_IDS = Object.freeze({
  CLASSICAL_SESSION_SETUP: "classical_session_setup",
  INSTRUMENT_ASSIGNMENT: "instrument_assignment",
  MIX_BALANCING: "mix_balancing",
  REVERB_CLEANUP: "reverb_cleanup",
  MASTERING_PREP: "mastering_prep",
  RENDER_VALIDATION: "render_validation"
});

const WORKFLOW_ORDER = Object.freeze(Object.values(WORKFLOW_IDS));

const WORKFLOW_DEFINITIONS = Object.freeze({
  [WORKFLOW_IDS.CLASSICAL_SESSION_SETUP]: workflow({
    id: WORKFLOW_IDS.CLASSICAL_SESSION_SETUP,
    title: "Classical session setup",
    goal: "Create a reversible starting point for a classical MIDI production session.",
    steps: [
      step("read-bridge-status", "ableton_get_status", "Confirm the active bridge and Live session before planning writes."),
      step("read-project-context", "ableton_get_project", "Inspect existing tracks, clips, devices, and mixer state."),
      step("read-arrangement-context", "ableton_get_arrangement", "Inspect locators and current timeline structure."),
      step("read-production-context", "ableton_get_production_report", "Capture production warnings before setup edits."),
      step("snapshot-before-session-setup", "ableton_create_snapshot", "Create rollback metadata before tempo, signature, track, and locator edits.", { label: "Before classical session setup" }),
      step("set-classical-tempo", "ableton_set_tempo", "Set a conservative starting tempo supplied by the user or score.", {
        bpm: "$tempoBpm"
      }),
      step("set-score-signature", "ableton_set_signature", "Set the score time signature before importing or placing material.", {
        numerator: "$signatureNumerator",
        denominator: "$signatureDenominator"
      }),
      step("create-orchestra-midi-tracks", "ableton_create_midi_track", "Create named MIDI tracks for planned orchestral roles.", {
        name: "$trackRoleName",
        color: "$trackColor"
      }),
      step("add-score-locators", "ableton_add_locator", "Add section locators such as Intro, Theme, Development, and Coda.", {
        beat: "$sectionStartBeat",
        name: "$sectionName"
      }),
      step("verify-session-setup", "ableton_get_project", "Re-read the project to verify tempo, signature, tracks, and locators.")
    ]
  }),
  [WORKFLOW_IDS.INSTRUMENT_ASSIGNMENT]: workflow({
    id: WORKFLOW_IDS.INSTRUMENT_ASSIGNMENT,
    title: "Instrument assignment",
    goal: "Choose inspectable instruments from the user's available devices and presets.",
    steps: [
      step("read-track-roles", "ableton_get_project", "Inspect MIDI track names, clips, and current devices."),
      step("list-available-instruments", "ableton_list_plugins", "List available instruments and plugins before selecting sounds.", {
        kind: "instrument"
      }),
      step("search-role-presets", "ableton_search_browser", "Search browser inventory for the current musical role.", {
        kind: "any",
        query: "$instrumentQuery",
        limit: 10
      }),
      step("load-role-instrument", "ableton_select_vst_for_midi", "Load the selected instrument or preset onto the target MIDI track.", {
        trackIndex: "$trackIndex",
        role: "$musicalRole",
        query: "$selectedInstrumentQuery",
        rationale: "$selectionRationale"
      }),
      step("read-loaded-device-parameters", "ableton_get_device_parameters", "Inspect exposed parameters before any device tuning.", {
        trackIndex: "$trackIndex",
        deviceIndex: "$deviceIndex"
      }),
      step("tune-known-parameter", "ableton_set_device_parameter", "Apply bounded parameter tuning only after parameter inspection.", {
        trackIndex: "$trackIndex",
        deviceIndex: "$deviceIndex",
        parameter: "$parameterName",
        normalizedValue: "$normalizedValue"
      }),
      step("verify-instrument-assignment", "ableton_get_project", "Re-read the project to verify devices on each assigned track.")
    ]
  }),
  [WORKFLOW_IDS.MIX_BALANCING]: workflow({
    id: WORKFLOW_IDS.MIX_BALANCING,
    title: "Mix balancing",
    goal: "Make bounded level, pan, routing, send, return, and master moves with meter readback.",
    steps: [
      step("read-project-mix", "ableton_get_project", "Inspect tracks, device chains, sends, routing, and mixer state."),
      step("read-current-meters", "ableton_get_meters", "Capture current meter feedback before mix moves."),
      step("read-return-tracks", "ableton_list_returns", "Inspect existing returns before changing sends or creating space."),
      step("read-routing-options", "ableton_list_buses", "Inspect available routing and bus destinations."),
      step("snapshot-before-mix", "ableton_create_snapshot", "Create rollback metadata before batch mixer changes.", { label: "Before mix balancing" }),
      step("adjust-track-balance", "ableton_modify_track", "Apply bounded volume, pan, routing, or send changes to a target track.", {
        trackIndex: "$trackIndex",
        volumeDb: "$volumeDb",
        pan: "$pan",
        sends: "$sends"
      }),
      step("create-mix-return", "ableton_create_return_track", "Create a named return only when the plan needs a shared bus.", {
        name: "$returnName"
      }),
      step("adjust-return-balance", "ableton_modify_return", "Apply bounded return level and pan changes.", {
        returnIndex: "$returnIndex",
        volumeDb: "$returnVolumeDb",
        pan: "$returnPan"
      }),
      step("adjust-master-headroom", "ableton_modify_master", "Set conservative master headroom without saving or rendering.", {
        volumeDb: "$masterVolumeDb"
      }),
      step("verify-mix-meters", "ableton_get_meters", "Re-read meters after the batch of mix changes."),
      step("verify-mix-report", "ableton_get_production_report", "Re-read production warnings after balancing.")
    ]
  }),
  [WORKFLOW_IDS.REVERB_CLEANUP]: workflow({
    id: WORKFLOW_IDS.REVERB_CLEANUP,
    title: "Reverb cleanup",
    goal: "Reduce excessive ambience with reversible sends, return levels, and known wet parameter edits.",
    steps: [
      step("read-reverb-context", "ableton_get_project", "Inspect tracks, sends, return devices, and master devices for reverb sources."),
      step("read-reverb-returns", "ableton_list_returns", "Inspect return tracks before lowering ambience."),
      step("read-reverb-meters", "ableton_get_meters", "Capture meter state before cleanup."),
      step("snapshot-before-reverb-cleanup", "ableton_create_snapshot", "Create rollback metadata before changing sends, returns, or device parameters.", { label: "Before reverb cleanup" }),
      step("lower-track-reverb-send", "ableton_modify_track", "Lower track sends that feed excessive ambience.", {
        trackIndex: "$trackIndex",
        sends: "$reducedSends"
      }),
      step("lower-return-reverb-level", "ableton_modify_return", "Reduce reverb return gain instead of deleting devices.", {
        returnIndex: "$returnIndex",
        volumeDb: "$returnVolumeDb"
      }),
      step("inspect-reverb-device-parameters", "ableton_get_device_parameters", "Read device parameters before editing wet, decay, or size controls.", {
        trackIndex: "$trackIndex",
        deviceIndex: "$deviceIndex",
        deviceName: "$deviceName"
      }),
      step("adjust-known-reverb-parameter", "ableton_set_device_parameter", "Adjust only known reverb parameters with bounded values.", {
        trackIndex: "$trackIndex",
        deviceIndex: "$deviceIndex",
        parameter: "$parameterName",
        normalizedValue: "$normalizedValue"
      }),
      step("verify-reverb-cleanup", "ableton_get_production_report", "Re-read production diagnostics after ambience reduction.")
    ]
  }),
  [WORKFLOW_IDS.MASTERING_PREP]: workflow({
    id: WORKFLOW_IDS.MASTERING_PREP,
    title: "Mastering prep",
    goal: "Prepare a transparent master chain and level target without requiring render support.",
    steps: [
      step("read-pre-master-report", "ableton_get_production_report", "Inspect current production risks before master-chain work."),
      step("read-pre-master-meters", "ableton_get_meters", "Capture current master and track meter state."),
      step("search-mastering-tools", "ableton_search_browser", "Find available EQ, dynamics, limiter, or mastering racks.", {
        kind: "audio_effect",
        query: "$masteringDeviceQuery",
        limit: 10
      }),
      step("snapshot-before-mastering-prep", "ableton_create_snapshot", "Create rollback metadata before master-chain changes.", { label: "Before mastering prep" }),
      step("load-master-device", "ableton_load_master_device", "Load a chosen mastering device or rack onto the master chain.", {
        query: "$selectedMasterDevice",
        kind: "$masterDeviceKind",
        position: "append",
        rationale: "$selectionRationale"
      }),
      step("apply-structured-master-chain", "ableton_apply_mastering_chain", "Apply bounded mastering settings for target loudness and true peak.", {
        style: "$masteringStyle",
        targetLufs: "$targetLufs",
        truePeakDb: "$truePeakDb",
        chain: "$masteringChain"
      }),
      step("set-master-headroom", "ableton_modify_master", "Adjust master output headroom after chain placement.", {
        volumeDb: "$masterVolumeDb"
      }),
      step("verify-mastering-prep", "ableton_get_production_report", "Re-read production diagnostics after mastering prep.")
    ]
  }),
  [WORKFLOW_IDS.RENDER_VALIDATION]: workflow({
    id: WORKFLOW_IDS.RENDER_VALIDATION,
    title: "Render validation",
    goal: "Validate requested render or stem artifacts, or record explicit unsupported bridge behavior.",
    steps: [
      step("read-render-readiness", "ableton_get_production_report", "Inspect production warnings before requesting an export."),
      step("request-master-render", "ableton_export_render", "Request an approved master or stem export target and scope.", renderArgs("$outputPath", "$renderScope")),
      step("request-stem-bounce", "ableton_bounce_tracks", "Request approved selected-track or stem review artifacts when needed.", {
        ...renderArgs("$stemOutputPath", "$stemScope"),
        trackIndices: "$trackIndices"
      }),
      step("analyze-rendered-audio", "ableton_analyze_audio", "Analyze each real rendered file for loudness, peak, crest factor, and clipping.", {
        path: "$renderedAudioPath"
      }),
      step("verify-post-render-report", "ableton_get_production_report", "Re-read diagnostics and record any unsupported render response.")
    ]
  })
});

export function getWorkflowPlanIds() {
  return [...WORKFLOW_ORDER];
}

export function listWorkflowPlans() {
  return WORKFLOW_ORDER.map((workflowId) => getWorkflowPlan(workflowId));
}

export function getWorkflowPlan(workflowId) {
  const definition = WORKFLOW_DEFINITIONS[workflowId];
  if (!definition) {
    throw new Error(`Unknown workflow plan: ${workflowId}`);
  }
  return clonePlan(materializeWorkflow(definition));
}

export function validateWorkflowPlans() {
  const errors = [];

  for (const workflowId of WORKFLOW_ORDER) {
    const definition = WORKFLOW_DEFINITIONS[workflowId];
    if (!definition) {
      errors.push(`Missing workflow definition: ${workflowId}`);
      continue;
    }

    for (const planStep of definition.steps) {
      if (!hasToolRiskClassification(planStep.toolName)) {
        errors.push(`${workflowId}.${planStep.id} references unknown tool ${planStep.toolName}`);
      }
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function workflow(definition) {
  return Object.freeze({ ...definition, executionMode: "plan-only", steps: Object.freeze(definition.steps) });
}

function step(id, toolName, summary, argsTemplate = {}) {
  return Object.freeze({
    id,
    toolName,
    summary,
    argsTemplate: Object.freeze(argsTemplate)
  });
}

function renderArgs(outputPath, scope) {
  return {
    outputPath,
    scope,
    startBeat: "$startBeat",
    lengthBeats: "$lengthBeats",
    sampleRate: "$sampleRate",
    bitDepth: "$bitDepth",
    normalize: "$normalize",
    includeReturnTracks: "$includeReturnTracks"
  };
}

function materializeWorkflow(definition) {
  const steps = definition.steps.map(materializeStep);
  const riskTiers = [...new Set(steps.map((planStep) => planStep.riskTier))];
  return {
    id: definition.id,
    title: definition.title,
    goal: definition.goal,
    executionMode: definition.executionMode,
    riskTiers,
    steps
  };
}

function materializeStep(planStep) {
  const risk = classifyToolRisk(planStep.toolName);

  return {
    ...planStep,
    riskTier: risk.tier,
    risk: {
      tier: risk.tier,
      blockedByDefault: risk.blockedByDefault,
      requiresExplicitApproval: risk.requiresExplicitApproval,
      requiresSnapshot: risk.requiresSnapshot,
      recommendation: risk.recommendation,
      rationale: risk.rationale
    }
  };
}

function clonePlan(plan) {
  return deepFreeze(JSON.parse(JSON.stringify(plan)));
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}
