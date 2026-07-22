# Review ableton-live-meter-cache-20260722: qa

- Result: approve
- Severity: info
- Findings: Local validation passed. Residual live validation remains because the running Ableton Remote Script must be reinstalled/restarted before listener-backed meter cache can be observed in Live.
- Recommendation: Reinstall AbletonMcpBridge, restart Ableton, launch audible clips/scenes, then sample /meters and confirm meterCache.observedTargetCount > 0 and relevant meterSource fields report listener-cache with non-zero values.
