# Evidence ableton-arrangement-clip-delete-20260817: command

- Role: qa
- Summary: A listed read-only MCP planning tool returns exact Arrangement clip candidates with stable track and clip identity, start beat, and length, while tests confirm project state is unchanged.
- Path: test/arrangement-clip-delete.mjs
- Command: node test/arrangement-clip-delete.mjs && python3 test/live_arrangement_delete_test.py
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: integration
- Assertions: Request payload is asserted. Response acknowledgement and response contract are asserted. The sandbox contract bridge receiver-side state proves the external side effect is no project-state mutation for plan, while exact trackIdentity, clipIdentity, startBeat, and lengthBeats are returned.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
