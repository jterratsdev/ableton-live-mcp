# Review ableton-meter-raw-path-diagnostics-20260722: qa

- Result: approve
- Severity: info
- Findings: Acceptance passed. Runtime returns bounded raw path diagnostics for every track, return, and master field. Evidence rules out missing properties, wrong target paths, has_audio_output filtering, listener registration failures, stale cache, stopped transport, muted tracks, and empty clips. Live 12.4.2 Lite's Remote Script API returns zero for all documented output meter properties in this set.
- Recommendation: Keep /meters unavailable for automated balance on this runtime. Use ableton_analyze_audio or ableton_analyze_mix against exported audio for verified levels; do not continue adding speculative Live meter properties.
