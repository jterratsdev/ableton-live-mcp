# Review ableton-rendered-audio-metering-20260722: qa

- Result: approve
- Severity: info
- Findings: Master and optional stem files are measured through ffprobe plus ffmpeg ebur128/volumedetect. The MCP executes analysis locally even with the real Remote Script bridge active, reports explicit backend provenance, sets reliableForMixing only after required metrics exist, rejects invalid/duplicate inputs, and never mutates the Live set.
- Recommendation: Accept the rendered-audio metering workflow. Continue treating Live Remote Script meters as unavailable for automated mixing and use exported master/stem files for verified measurements.
