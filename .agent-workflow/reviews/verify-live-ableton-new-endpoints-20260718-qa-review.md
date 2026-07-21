# Review verify-live-ableton-new-endpoints-20260718: qa

- Result: approve
- Severity: info
- Findings: Live endpoint verification passed for /project, GET /clips/notes, and POST /signature. POST /project/save returns the documented 501 limitation because this Ableton Python API surface does not expose save. The new clip-note readback endpoint now returns real MIDI note data from Live.
- Recommendation: Accept. Treat project save as a known unsupported Live API capability and keep manual save or future alternate save mechanism on the roadmap.
