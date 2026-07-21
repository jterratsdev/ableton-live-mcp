const deterministicSuites = [
  "./smoke.mjs",
  "./regression.mjs",
  "./bridge.mjs",
  "./remote-script-static.mjs",
  "../scripts/check-doctor-diagnostics.mjs",
  "./render-export.mjs",
  "./risk-policy.mjs",
  "./preset-intelligence.mjs",
  "./snapshot-rollback.mjs",
  "./observability.mjs",
  "./compatibility-matrix.mjs",
  "./workflow-plans.mjs"
];

for (const suite of deterministicSuites) {
  await import(suite);
}

console.log("deterministic test suite ok");
