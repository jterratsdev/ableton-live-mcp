# Review ableton-device-reorder-endpoint-20260720: qa

- Result: approve
- Severity: info
- Findings: Reviewed implementation and tests. Development adapter reorders devices and reindexes chains for track, return, and master. Remote Script validates location and indices then returns explicit 501 limitation for reorder instead of ok true no-op. npm test and py_compile passed.
- Recommendation: Approve; Live reorder remains documented unsupported in Remote Script until a reliable API is identified.
