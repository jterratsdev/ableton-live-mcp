# Review review-code-patterns-20260716: qa

- Result: changes
- Severity: info
- Findings: MIDI clip note validation is incomplete: schema declares pitch/start/duration/velocity constraints, but validateToolInput only checks notes is an array; invalid note values are accepted and forwarded. list_plugins accepts kind/query but the real GET bridge call sends GET /plugins with no query/body, so filters are dropped outside dry-run. Bridge config reads ABLETON_BRIDGE_URL and ABLETON_BRIDGE_TIMEOUT_MS directly without startup validation or local-only enforcement, despite local-bridge/security rules. src/server.js is 350 lines and mixes tool registry, dispatch, protocol loop, validation, and schema helpers, exceeding the local 300-line module-boundary threshold. README MCP client config references a stale absolute path outside this repo.
- Recommendation: Keep the scaffold, but split tool contracts/validation from stdio handling, add deep boundary validation plus negative tests, encode GET filters as query params or document/remove them, validate config at startup including timeout and loopback URL policy, and update README path before broader use.
