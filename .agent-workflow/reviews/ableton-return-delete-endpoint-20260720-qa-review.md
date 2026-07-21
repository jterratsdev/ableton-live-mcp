# Review ableton-return-delete-endpoint-20260720: qa

- Result: approve
- Severity: info
- Findings: Reviewed implementation and validation evidence for DELETE /returns. Development adapter validates returnIndex, removes the return from state, reindexes remaining returns, removes deleted send names from tracks, and returns 404 for out-of-range indices. Remote Script uses Live delete_return_track when exposed and returns contract-shaped 501 when unsupported. npm test and Python compile passed.
- Recommendation: Approve delete return endpoint for local handoff; Live deletion support must be confirmed against the user's Ableton Live version.
