# Review ableton-return-create-endpoint-20260720: qa

- Result: approve
- Severity: info
- Findings: Reviewed implementation and validation evidence for POST /returns/create. Development adapter validates non-empty name and optional insertion returnIndex, mutates state, reindexes returns, and exposes created return through /returns and /routing/buses. Remote Script uses Live create_return_track when exposed and returns contract-shaped 501 when unsupported. npm test and Python compile passed.
- Recommendation: Approve create return endpoint for local handoff; Live behavior still depends on the selected Ableton API exposing create_return_track.
