# Evidence ableton-ssd-multi-output-workflow-20260817: command

- Role: qa
- Summary: Running the targeted Node and Python fake-Live tests plus npm test produces exit code 0, and captured request logs contain zero calls to a mutating endpoint on the user's active Ableton Set.
- Path: test/plugin-output-routing.mjs
- Command: node test/plugin-output-routing.mjs && python3 test/live_plugin_routing_test.py && npm test
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: api
- Assertions: Request contract and payload are asserted. Response body, response contract, error shape, permissions, idempotency, and schema are asserted. Sandbox mock contract state proves the external side effect on fake-Live receiver tracks and confirms no external side effect on the active Ableton Set; captured requests contain zero mutating calls to port 9789.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
