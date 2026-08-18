import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { listEndpointRiskClassifications } from "../src/risk-policy.js";

const compatibilityDocument = await readFile("docs/ableton-compatibility.md", "utf8");
const metadata = parseCompatibilityMetadata(compatibilityDocument);

const REMOTE_SCRIPT_EXPECTATIONS = new Set([
  "supported",
  "supported_with_limits",
  "host_dependent_501",
  "unsupported_501",
  "local_bridge_only"
]);

const KNOWN_UNSUPPORTED_REMOTE_SCRIPT_ROUTES = [
  "POST /arrangement/insert",
  "POST /automation",
  "POST /devices/reorder",
  "POST /mastering/analyze-and-apply",
  "POST /midi/import",
  "POST /render/export",
  "POST /tracks/bounce"
];

assert.equal(metadata.schemaVersion, 1);
assert.equal(metadata.sourceReviewedAt, "2026-08-17");
assert.equal(metadata.unsupportedHttpStatus, 501);

assert.deepEqual(Object.keys(metadata.editions).sort(), ["liveLite", "liveStandard", "liveSuite"]);
assert.deepEqual(Object.keys(metadata.versions).sort(), ["live11", "live12"]);

for (const [editionId, edition] of Object.entries(metadata.editions)) {
  assert.equal(typeof edition.label, "string", `${editionId} should have a label`);
  assert.equal(typeof edition.support, "string", `${editionId} should declare support`);
  assert.equal(typeof edition.notes, "string", `${editionId} should have notes`);
  assert.notEqual(edition.notes.trim(), "", `${editionId} notes should not be blank`);
}

for (const [versionId, version] of Object.entries(metadata.versions)) {
  assert.equal(typeof version.label, "string", `${versionId} should have a label`);
  assert.equal(version.remoteScriptRuntime, "python3", `${versionId} should document Python 3 Remote Scripts`);
  assert.equal(typeof version.notes, "string", `${versionId} should have notes`);
  assert.notEqual(version.notes.trim(), "", `${versionId} notes should not be blank`);
}

const endpointClassifications = listEndpointRiskClassifications();
const expectedEndpointTiers = new Map(endpointClassifications.map((classification) => [
  classification.subject,
  classification.tier
]));
const documentedEndpoints = new Map();

for (const endpoint of metadata.endpointExpectations) {
  assert.equal(typeof endpoint.route, "string", "endpoint route should be a string");
  assert.equal(typeof endpoint.tier, "string", `${endpoint.route} should declare a risk tier`);
  assert.equal(typeof endpoint.remoteScriptExpectation, "string", `${endpoint.route} should declare Remote Script expectation`);
  assert.equal(typeof endpoint.editionImpact, "string", `${endpoint.route} should declare edition impact`);
  assert.equal(typeof endpoint.versionImpact, "string", `${endpoint.route} should declare version impact`);
  assert.notEqual(endpoint.editionImpact.trim(), "", `${endpoint.route} edition impact should not be blank`);
  assert.notEqual(endpoint.versionImpact.trim(), "", `${endpoint.route} version impact should not be blank`);
  assert.equal(documentedEndpoints.has(endpoint.route), false, `${endpoint.route} should be documented once`);
  assert.equal(expectedEndpointTiers.get(endpoint.route), endpoint.tier, `${endpoint.route} tier should match risk policy`);
  assert.equal(REMOTE_SCRIPT_EXPECTATIONS.has(endpoint.remoteScriptExpectation), true, `${endpoint.route} has unknown Remote Script expectation`);

  if (endpoint.remoteScriptExpectation.endsWith("_501")) {
    assert.equal(endpoint.unsupportedStatus, 501, `${endpoint.route} should document explicit 501 status`);
  }

  documentedEndpoints.set(endpoint.route, endpoint);
}

assert.deepEqual([...documentedEndpoints.keys()].sort(), [...expectedEndpointTiers.keys()].sort());

for (const route of KNOWN_UNSUPPORTED_REMOTE_SCRIPT_ROUTES) {
  const endpoint = documentedEndpoints.get(route);
  assert.equal(endpoint?.remoteScriptExpectation, "unsupported_501", `${route} should be an explicit unsupported 501 expectation`);
  assert.equal(endpoint.unsupportedStatus, 501, `${route} should carry unsupported status 501`);
}

assert.equal(metadata.editions.liveLite.tracks, 8);
assert.equal(metadata.editions.liveLite.sendReturnTracks, 2);
assert.equal(metadata.editions.liveStandard.maxForLive, "optional_add_on");
assert.equal(metadata.editions.liveSuite.maxForLive, "included");

console.log("compatibility matrix ok");

function parseCompatibilityMetadata(documentText) {
  const match = documentText.match(/```json compatibility-metadata\n([\s\S]*?)\n```/);
  assert.ok(match, "compatibility metadata JSON block should exist");

  return JSON.parse(match[1]);
}
