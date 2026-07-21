# Review ableton-mixer-volume-contract-fix-20260721: developer

- Result: approve
- Severity: info
- Findings: Raw Live mixer values are no longer labelled as dB in Live summaries. Write fields remain dB targets; readback now separates raw values from parsed display dB values. Deterministic tests and Python compile pass. Live validation requires reinstall/restart because Remote Script files changed.
- Recommendation: Reinstall AbletonMcpBridge and restart Live before live read-only smoke validation.
