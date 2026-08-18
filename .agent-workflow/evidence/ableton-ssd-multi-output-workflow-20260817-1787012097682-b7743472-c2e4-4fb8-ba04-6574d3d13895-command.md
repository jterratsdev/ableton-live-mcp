# Evidence ableton-ssd-multi-output-workflow-20260817: command

- Role: qa
- Summary: Tests assert unsupported output names and partial routing failures return errors without leaving newly created receiver tracks behind, and repeated setup avoids duplicate receiver tracks.
- Path: test/live_plugin_routing_test.py
- Command: node test/plugin-output-routing.mjs && python3 test/live_plugin_routing_test.py
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: integration
- Assertions: Request payload failure cases are asserted. Response acknowledgement and error contract are asserted. Fake-Live receiver-side state proves the external side effect: rollback leaves zero created tracks and repeated apply leaves zero duplicates.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
