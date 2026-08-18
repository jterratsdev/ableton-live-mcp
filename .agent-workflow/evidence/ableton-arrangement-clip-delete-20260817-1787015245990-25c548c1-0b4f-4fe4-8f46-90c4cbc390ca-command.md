# Evidence ableton-arrangement-clip-delete-20260817: command

- Role: qa
- Summary: Running focused Node and Python fake-Live tests plus npm test produces exit code 0 without invoking a mutating endpoint on the user's active Ableton Set.
- Path: test/arrangement-clip-delete.mjs
- Command: node test/arrangement-clip-delete.mjs && python3 test/live_arrangement_delete_test.py && npm test
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: api
- Assertions: Request contract and request payload are asserted. Response body, response contract, error shape, permissions, idempotency, and schema are asserted. Sandbox mock contract state proves the external side effect on fake-Live Arrangement clips and confirms no external side effect on the active Ableton Set; captured requests contain zero calls to port 9789.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
