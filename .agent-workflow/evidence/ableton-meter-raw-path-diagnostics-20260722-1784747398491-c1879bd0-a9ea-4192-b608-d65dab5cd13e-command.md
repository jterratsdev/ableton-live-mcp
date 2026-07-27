# Evidence ableton-meter-raw-path-diagnostics-20260722: command

- Role: qa
- Summary: Post-install live check: installed live_meter_cache.py and live_mixer.py match source byte-for-byte, but eight /meters samples still omit meterDiagnostics entirely. Meter pollCount continued at 15559 and Ableton Log.txt has no AbletonMcpBridge initialization after 11:43:21 local time, proving the running Control Surface instance was not reloaded after installation. Existing runtime remains zero-only and reliableForMixing=false; no set writes were performed.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
