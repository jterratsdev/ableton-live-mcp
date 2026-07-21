import assert from "node:assert/strict";
import {
  RiskPolicyError,
  RISK_TIERS,
  classifyEndpointRisk,
  classifyToolRisk,
  evaluateActionRisk,
  hasToolRiskClassification,
  listEndpointRiskClassifications,
  listToolRiskClassifications,
  requireAllowedByDefault,
  shouldBlockByDefault
} from "../src/risk-policy.js";
import { tools } from "../src/tools.js";

const allToolNames = tools.map((tool) => tool.name).sort();
const missingToolPolicies = allToolNames.filter((toolName) => !hasToolRiskClassification(toolName));
assert.deepEqual(missingToolPolicies, []);
assert.deepEqual(listToolRiskClassifications().map((classification) => classification.subject), allToolNames);

assert.equal(classifyToolRisk("ableton_get_project").tier, RISK_TIERS.READ);
assert.equal(classifyToolRisk("ableton_set_tempo").tier, RISK_TIERS.SAFE_WRITE);
assert.equal(classifyToolRisk("ableton_delete_clip").tier, RISK_TIERS.DESTRUCTIVE);
assert.equal(classifyToolRisk("ableton_export_render").tier, RISK_TIERS.EXPORT);
assert.equal(classifyToolRisk("ableton_set_automation").tier, RISK_TIERS.UNSUPPORTED);
assert.equal(classifyToolRisk("ableton_import_midi").tier, RISK_TIERS.SAFE_WRITE);
assert.equal(classifyToolRisk("unknown_tool").tier, RISK_TIERS.UNSUPPORTED);

assert.equal(classifyEndpointRisk("GET", "/project").tier, RISK_TIERS.READ);
assert.equal(classifyEndpointRisk("post", "/tempo").tier, RISK_TIERS.SAFE_WRITE);
assert.equal(classifyEndpointRisk("DELETE /clips/midi").tier, RISK_TIERS.DESTRUCTIVE);
assert.equal(classifyEndpointRisk("POST /render/export").tier, RISK_TIERS.EXPORT);
assert.equal(classifyEndpointRisk("POST /automation").tier, RISK_TIERS.UNSUPPORTED);
assert.equal(classifyEndpointRisk("POST /midi/import").tier, RISK_TIERS.UNSUPPORTED);
assert.equal(classifyEndpointRisk("PATCH /unknown").tier, RISK_TIERS.UNSUPPORTED);

assert.equal(shouldBlockByDefault({ toolName: "ableton_get_status" }), false);
assert.equal(shouldBlockByDefault({ toolName: "ableton_modify_track" }), false);
assert.equal(shouldBlockByDefault({ toolName: "ableton_delete_device" }), true);
assert.equal(shouldBlockByDefault({ route: "POST /tracks/bounce" }), true);
assert.equal(shouldBlockByDefault({ method: "POST", path: "/automation" }), true);

const safeWrite = evaluateActionRisk({ toolName: "ableton_modify_master" });
assert.equal(safeWrite.blockedByDefault, false);
assert.equal(safeWrite.requiresSnapshot, true);
assert.equal(safeWrite.recommendation, "allow_after_context_check");

const destructive = evaluateActionRisk({ toolName: "ableton_flatten_track" });
assert.equal(destructive.blockedByDefault, true);
assert.equal(destructive.requiresExplicitApproval, true);
assert.equal(destructive.requiresSnapshot, true);
assert.equal(destructive.recommendation, "block_until_explicit_approval");

const exportAction = evaluateActionRisk({ route: "POST /render/export" });
assert.equal(exportAction.blockedByDefault, true);
assert.equal(exportAction.requiresExplicitApproval, true);
assert.equal(exportAction.recommendation, "block_until_export_approval");

const unsupported = evaluateActionRisk({ toolName: "ableton_set_automation" });
assert.equal(unsupported.blockedByDefault, true);
assert.equal(unsupported.requiresExplicitApproval, true);
assert.equal(unsupported.recommendation, "block_as_unsupported");

assert.equal(requireAllowedByDefault("ableton_get_meters").tier, RISK_TIERS.READ);
assert.throws(
  () => requireAllowedByDefault("ableton_delete_return_track"),
  (error) => error instanceof RiskPolicyError && error.classification.tier === RISK_TIERS.DESTRUCTIVE
);

const endpointTiers = new Set(listEndpointRiskClassifications().map((classification) => classification.tier));
for (const tier of Object.values(RISK_TIERS)) {
  assert.equal(endpointTiers.has(tier), true, `endpoint policy should include ${tier}`);
}

console.log("risk policy ok");
