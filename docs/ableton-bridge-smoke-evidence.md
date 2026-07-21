# Ableton Bridge Smoke Evidence

Task: `ableton-bridge-real-smoke-20260716`
Date: 2026-07-16
Environment: local deterministic bridge on loopback, MCP server without `ABLETON_MCP_DRY_RUN`

## Acceptance Criteria Coverage

| AC | Test | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| A non-dry-run smoke test exercises the MCP server through the HTTP bridge. | `npm run smoke:bridge` | Pass | `test/evidence/ableton-bridge-smoke-report.json` | The script starts the local HTTP bridge, starts the MCP server with `ABLETON_BRIDGE_URL`, and removes `ABLETON_MCP_DRY_RUN`. |
| Evidence captures request/response shape and observable bridge state changes. | `npm run smoke:bridge` | Pass | `test/evidence/ableton-bridge-smoke-report.json` | The JSON report stores each JSON-RPC request, parsed MCP response content, tempo change `124 -> 132`, transport `false -> true -> false`, project summary, and plugin filter result. |
| Any Ableton-unavailable constraint is documented with a deterministic local substitute and owner for live verification. | Evidence report + this document | Deferred external verification | `deferredExternalVerification` in `test/evidence/ableton-bridge-smoke-report.json` | Owner: QA + developer with an Ableton Live environment. Rationale: this repo currently contains a deterministic bridge adapter, not a live Ableton adapter. |

## Commands

| Command | Result | Output artifact |
| --- | --- | --- |
| `npm run smoke:bridge` | Pass | `test/evidence/ableton-bridge-smoke-report.json` |
| `npm test` | Pass | Console output: `smoke ok`, `regression ok`, `bridge ok` |

## External Verification

| System | Correlation ID | Evidence | Result |
| --- | --- | --- | --- |
| Deterministic development bridge | Local process, ephemeral loopback port | `test/evidence/ableton-bridge-smoke-report.json` | Pass |
| Ableton Live real adapter | Not available in this workspace | Follow-up owner: QA + developer with Ableton Live environment | Deferred |

## Observable Outcome Assertions

- Request payload: `test/evidence/ableton-bridge-smoke-report.json` records each JSON-RPC request for `ableton_get_status`, `ableton_get_project`, `ableton_set_tempo`, `ableton_start_transport`, `ableton_stop_transport`, and `ableton_list_plugins`.
- Response / acknowledgement: the same report records parsed MCP response content for every call and asserts `ok: true` responses for bridge-backed operations.
- Contract: the smoke validates the documented bridge response contract for status, project, tempo, transport, and plugin listing through the MCP `tools/call` response shape.
- External side effect / receiver state: the deterministic bridge receiver state changes are observed by reading status after `ableton_set_tempo` and `ableton_start_transport`; the report records tempo `124 -> 132` and transport `false -> true -> false`.
- Deferred external validation: live Ableton verification is deferred because Ableton Live and a real adapter are not available in this workspace. Owner is QA + developer with an Ableton Live environment. Next command after a real adapter is running: `ABLETON_BRIDGE_URL=http://127.0.0.1:9789 npm run smoke:bridge`.

## Risks / Gaps

| Gap | Owner | PO accepted? | Rationale |
| --- | --- | --- | --- |
| Live DAW state was not observed directly. | QA + developer with Ableton Live environment | Pending | The current milestone can prove MCP-to-HTTP bridge behavior locally. Direct Ableton verification requires Ableton Live and a real adapter process. |
