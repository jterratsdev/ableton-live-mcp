# Review ableton-safe-mixing-blockers-20260721: qa

- Result: approve
- Severity: info
- Findings: All three reported blockers are addressed in code and deterministic validation: stale/legacy mixer contracts are surfaced as unsafe, mastering apply defaults to replace_matching with removedDevices reporting, and device parameters can target tracks, returns, and master. Runtime Ableton still reports stale until the Remote Script is reinstalled and Live is restarted.
- Recommendation: Approve code changes; reinstall Remote Script before trusting the active Ableton runtime for mixing/mastering.
