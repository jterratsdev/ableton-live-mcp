# Review ableton-meter-raw-path-diagnostics-20260722: architect

- Result: approve
- Severity: info
- Findings: Add bounded per-target diagnostics in LiveMeterCache.snapshot. Report canonical song object path, Python proxy type, has_audio_output, and three fixed property records containing directRaw, cachedRaw, cachedSource, timestamps, listener registration, and listener error. Preserve existing selected meter values and reliability classification.
- Recommendation: Implement without probing undocumented alternate properties and require live reinstall validation before completion.
