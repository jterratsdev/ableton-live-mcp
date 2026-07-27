# Review ableton-transport-response-consistency-20260722: architect

- Result: approve
- Severity: info
- Findings: Use an accepted-command plus observed-readback contract. Command response playing/requestedPlaying must equal the requested target; observedPlaying captures song.is_playing immediately after the Live method; confirmed indicates equality. This avoids false stop responses without hiding deferred host state.
- Recommendation: Apply the same response shape to start and stop in both adapters and document GET /status as authoritative.
