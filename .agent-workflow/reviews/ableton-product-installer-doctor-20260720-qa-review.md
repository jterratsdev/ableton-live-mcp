# Review ableton-product-installer-doctor-20260720: qa

- Result: approve
- Severity: info
- Findings: Doctor now recognizes the real Ableton Live 12 Lite process command and reports app path, Remote Script path, file freshness, Live PID, bridge status, and stale-runtime diagnosis. Sandbox-only false negatives were validated away with an escalated doctor run.
- Recommendation: Approve and close; user must reinstall Remote Script to clear the current stale file diagnosis.
