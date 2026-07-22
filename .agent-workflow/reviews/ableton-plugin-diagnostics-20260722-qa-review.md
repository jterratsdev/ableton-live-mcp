# Review ableton-plugin-diagnostics-20260722: qa

- Result: approve
- Severity: info
- Findings: Added ableton_diagnose_plugins as a read-only MCP tool. It scans VST3/AU plugin bundles on disk, compares against Ableton /plugins and /browser/search, reports installed_not_indexed/available/not_installed states, and recommends safe rescan actions. Deterministic tests, risk policy, smoke, npm pack, and a live read-only diagnostic passed.
- Recommendation: Ready for commit. Use this diagnostic before attempting to load plugins that are expected on disk but absent from Ableton search.
