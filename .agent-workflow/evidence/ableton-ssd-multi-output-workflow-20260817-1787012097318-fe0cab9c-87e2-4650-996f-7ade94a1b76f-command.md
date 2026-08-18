# Evidence ableton-ssd-multi-output-workflow-20260817: command

- Role: qa
- Summary: A listed MCP planning tool asserts the SSD5 source track and available plugin output channels, returning a proposed receiver-track map without changing project state.
- Path: test/plugin-output-routing.mjs
- Command: node test/plugin-output-routing.mjs
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: integration
- Assertions: Request payload is asserted. Response acknowledgement and response contract are asserted. The sandbox contract bridge receiver-side state proves the external side effect is no project-state mutation for plan.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
