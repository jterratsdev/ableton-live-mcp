# Evidence ableton-live-bridge-validation-20260720: command

- Role: qa
- Summary: Retest after Control Surface reselection: Ableton Log.txt shows AbletonMcpBridge initialized at 2026-07-20T12:25:53, but GET /meters, /browser/search, /arrangement, /production/report and /devices/parameters still return Unsupported endpoint. lsof shows PID 1434 is still the same Live process listening on 127.0.0.1:9789, so Python module caching in the running Ableton process is the remaining blocker.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
