# Evidence ableton-session-scene-tempo-signature-20260820: report

- Role: qa
- Summary: Static diagnosis: Remote Script returns HTTP 501 by design for POST /automation; AbletonMcpBridge.py raises explicit unsupported-envelope error before any Live call. MCP ableton_set_automation maps directly to that route and is classified unsupported/hidden for Remote Script. POST /tempo and POST /signature are separate global setters; Session scene overrides use distinct conditional routes. No bridge or Set was contacted.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
