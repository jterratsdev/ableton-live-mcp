# Evidence ableton-ssd-multi-output-workflow-20260817: command

- Role: qa
- Summary: Targeted Node and Python fake-Live tests plus npm test exit successfully without invoking a mutating endpoint on the user's active Ableton Set.
- Path: test/plugin-output-routing.mjs
- Command: node test/plugin-output-routing.mjs && python3 test/live_plugin_routing_test.py && npm test
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: api
- Assertions: Request contract and request payload are asserted. Response body, response contract, error shape, permissions, and schema are asserted. Sandbox mock contract state proves side effects and confirms no external side effect on active Ableton.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
