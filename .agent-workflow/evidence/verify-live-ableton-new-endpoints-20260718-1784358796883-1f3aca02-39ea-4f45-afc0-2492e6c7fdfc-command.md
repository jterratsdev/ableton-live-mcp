# Evidence verify-live-ableton-new-endpoints-20260718: command

- Role: qa
- Summary: Live verification after user reselected AbletonMcpBridge: /project returned ok with tempo 140, timeSignature 3/4, and four slot 0 clips at 249 beats. New endpoints are not live yet: GET /clips/notes returned 404 unsupported, POST /signature returned 404 unsupported, POST /project/save returned 404 unsupported. Attempted to copy updated AbletonMcpBridge files into /Applications/Ableton Live 12 Lite.app/.../AbletonMcpBridge, but all cp operations failed with Permission denied because the installed directory is root-owned. User must run the sudo install script from an interactive terminal, then reselect/restart AbletonMcpBridge.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
