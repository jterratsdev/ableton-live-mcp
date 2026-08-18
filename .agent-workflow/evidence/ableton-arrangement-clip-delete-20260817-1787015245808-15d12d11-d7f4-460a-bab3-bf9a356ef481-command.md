# Evidence ableton-arrangement-clip-delete-20260817: command

- Role: qa
- Summary: Tests confirm stale, missing, duplicated, ambiguous, or partially unsupported selections fail closed without deleting a different clip, and the response reports per-clip verification results.
- Path: test/live_arrangement_delete_test.py
- Command: node test/arrangement-clip-delete.mjs && python3 test/live_arrangement_delete_test.py
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: integration
- Assertions: Request payload failure cases are asserted. Response acknowledgement and error contract are asserted. Fake-Live receiver-side state proves the external side effect: stale, missing, duplicate, ambiguous, and partial-support failures leave zero deleted clips, while success returns per-clip verifiedAbsent results.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
