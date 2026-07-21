import assert from "node:assert/strict";
import {
  WORKFLOW_IDS,
  getWorkflowPlan,
  getWorkflowPlanIds,
  listWorkflowPlans,
  validateWorkflowPlans
} from "../src/workflow-plans.js";
import { classifyToolRisk } from "../src/risk-policy.js";
import { tools } from "../src/tools.js";

const knownToolNames = new Set(tools.map((tool) => tool.name));
const requiredWorkflowIds = [
  WORKFLOW_IDS.CLASSICAL_SESSION_SETUP,
  WORKFLOW_IDS.INSTRUMENT_ASSIGNMENT,
  WORKFLOW_IDS.MIX_BALANCING,
  WORKFLOW_IDS.REVERB_CLEANUP,
  WORKFLOW_IDS.MASTERING_PREP,
  WORKFLOW_IDS.RENDER_VALIDATION
];

definesEveryRequiredHighLevelWorkflow();
validatesThePlanCatalog();
usesOnlyRegisteredMcpTools();
declaresRiskMetadataFromTheCanonicalPolicy();
keepsGeneratedPlansPlanOnlyAndImmutable();
flagsUnknownWorkflowIds();

console.log("workflow plans ok");

function definesEveryRequiredHighLevelWorkflow() {
  assert.deepEqual(getWorkflowPlanIds(), requiredWorkflowIds);
}

function validatesThePlanCatalog() {
  assert.deepEqual(validateWorkflowPlans(), { ok: true, errors: [] });
}

function usesOnlyRegisteredMcpTools() {
  const unknownToolSteps = listWorkflowPlans().flatMap((plan) =>
    plan.steps
      .filter((planStep) => !knownToolNames.has(planStep.toolName))
      .map((planStep) => `${plan.id}.${planStep.id}:${planStep.toolName}`)
  );

  assert.deepEqual(unknownToolSteps, []);
}

function declaresRiskMetadataFromTheCanonicalPolicy() {
  const mismatchedRiskSteps = listWorkflowPlans().flatMap((plan) =>
    plan.steps
      .filter((planStep) => {
        const classification = classifyToolRisk(planStep.toolName);

        return planStep.riskTier !== classification.tier
          || planStep.risk.tier !== classification.tier
          || planStep.risk.recommendation !== classification.recommendation
          || planStep.risk.requiresSnapshot !== classification.requiresSnapshot;
      })
      .map((planStep) => `${plan.id}.${planStep.id}:${planStep.toolName}`)
  );

  assert.deepEqual(mismatchedRiskSteps, []);
}

function keepsGeneratedPlansPlanOnlyAndImmutable() {
  const plan = getWorkflowPlan(WORKFLOW_IDS.RENDER_VALIDATION);

  assert.equal(plan.executionMode, "plan-only");
  assert.throws(() => plan.steps.push({ toolName: "ableton_get_status" }), TypeError);
  assert.equal(getWorkflowPlan(WORKFLOW_IDS.RENDER_VALIDATION).steps.length, plan.steps.length);
}

function flagsUnknownWorkflowIds() {
  assert.throws(
    () => getWorkflowPlan("unknown"),
    /Unknown workflow plan: unknown/
  );
}
