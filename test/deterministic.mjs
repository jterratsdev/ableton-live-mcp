const deterministicSuites = [
  "./smoke.mjs",
  "./regression.mjs",
  "./bridge.mjs",
  "./contracts.mjs",
  "./remote-script-static.mjs",
  "./live-mastering.mjs",
  "./project-lifecycle.mjs",
  "./arrangement-clip-delete.mjs",
  "./live-meter-cache.mjs",
  "./live-volume-write.mjs",
  "../scripts/check-doctor-diagnostics.mjs",
  "./render-export.mjs",
  "./risk-policy.mjs",
  "./preset-intelligence.mjs",
  "./snapshot-rollback.mjs",
  "./observability.mjs",
  "./compatibility-matrix.mjs",
  "./workflow-plans.mjs",
  "../scripts/check-installer.mjs",
  "../scripts/check-package-release.mjs"
];

for (const suite of deterministicSuites) {
  await import(suite);
}

console.log("deterministic test suite ok");
