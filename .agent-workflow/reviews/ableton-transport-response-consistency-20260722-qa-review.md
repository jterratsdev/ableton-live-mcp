# Review ableton-transport-response-consistency-20260722: qa

- Result: approve
- Severity: info
- Findings: Live validation proves start_playing and stop_playing update song.is_playing after the command callback. The new contract reports requested state in playing, preserves immediate readback in observedPlaying, marks confirmed=false during deferred transitions, and GET /status confirms the final state correctly.
- Recommendation: Accept the transport response fix and document clients to use GET /status when confirmed=false.
