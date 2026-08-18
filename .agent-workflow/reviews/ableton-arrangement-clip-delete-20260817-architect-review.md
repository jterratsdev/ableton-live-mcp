# Review ableton-arrangement-clip-delete-20260817: architect

- Result: approve
- Severity: info
- Findings: Official Live 12.3.5 LOM provides Track.arrangement_clips and Track.delete_clip(clip), so exact Arrangement deletion is feasible without UI automation. The proposed split plan/delete contract, whole-request preflight, short-lived identity, deterministic ordering, Session isolation, and readback verification address active-Set data-loss risk. Real Live mutation remains deferred.
- Recommendation: Proceed with focused modules and fake-Live contract tests; fail closed on unavailable methods, stale fingerprints, or ambiguity. Do not call the active Ableton bridge.
