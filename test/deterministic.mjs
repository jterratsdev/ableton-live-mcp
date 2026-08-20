const deterministicSuites = [
  "./smoke.mjs",
  "./regression.mjs",
  "./bridge.mjs",
  "./contracts.mjs",
  "./remote-script-static.mjs",
  "./live-mastering.mjs",
  "./project-lifecycle.mjs",
  "./plugin-output-routing.mjs",
  "./arrangement-clip-delete.mjs",
  "./arrangement-insertion.mjs",
  "./scene-tempo-signature.mjs",
  "./scene-tempo-signature-mcp.mjs",
  "./live-track-operations.mjs",
  "./edition-capacity.mjs",
  "./live-meter-cache.mjs",
  "./live-volume-write.mjs",
  "../scripts/check-doctor-diagnostics.mjs",
  "./render-export.mjs",
  "./risk-policy.mjs",
  "./preset-intelligence.mjs",
  "./snapshot-rollback.mjs",
  "./observability.mjs",
  "./capability-aware-tools.mjs",
  "./compatibility-matrix.mjs",
  "./workflow-plans.mjs",
  "../scripts/check-installer.mjs",
  "../scripts/check-package-release.mjs"
];

for (const suite of deterministicSuites) {
  await import(suite);
}

console.log("deterministic test suite ok");
