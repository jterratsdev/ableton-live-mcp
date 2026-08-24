# Review ableton-suite-vs-lite-sdk-capability-research-20260818: qa

- Result: approve
- Severity: info
- Findings: AC1 pass: official current entitlement matrix includes all requested Lite/Suite categories and preserves the official instrument/effect count discrepancy. AC2 pass: official LOM plus installed Lite 12.4.2/Suite 12.4.3 resources classify save, Arrangement insertion, tempo envelopes, parameters, and routing using exact symbols or explicit absence. AC3 pass: each limitation has classification and recommendation. AC4 pass: only a read-only Suite GET /status was called; no Set mutation or save.
- Recommendation: Accept the research. Keep save absent; create a separate version-gated Arrangement insertion task with callable probes, readback, undo, and disposable-Set validation.
