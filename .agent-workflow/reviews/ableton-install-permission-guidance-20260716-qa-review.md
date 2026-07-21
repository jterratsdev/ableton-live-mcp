# Review ableton-install-permission-guidance-20260716: qa

- Result: approve
- Severity: info
- Findings: Installer and docs now explain the observed macOS Operation not permitted failure path: sudo can still fail until the terminal app has App Management or Full Disk Access permission. Syntax and doc-sync validation pass.
- Recommendation: Use the updated instructions to grant App Management/Full Disk Access or copy via Finder, then rerun the install and real bridge smoke.
