# Evidence ableton-arrangement-clip-delete-20260817: command

- Role: qa
- Summary: Tests confirm stale, missing, duplicated, ambiguous, or partially unsupported selections fail closed before mutation; if a later Track.delete_clip call fails, Song.undo restores every clip already deleted and readback verifies the original Arrangement state, otherwise the response reports rollback failure explicitly.
- Path: test/live_arrangement_delete_test.py
- Command: node test/arrangement-clip-delete.mjs && python3 test/live_arrangement_delete_test.py && npm test
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: api
- Assertions: Request contract and all failure-case payloads are asserted. Response body, error shape, permissions, rollback status, and schema are asserted. Fake-Live persisted state proves stale, missing, duplicate, ambiguous, and unsupported selections make zero mutations; a forced third-delete failure after two successful deletes invokes Song.undo exactly twice and restores the complete observable Arrangement fingerprint with recreated proxies. Undo failure and fingerprint mismatch return explicit rollback-failed 500 responses. Sandbox execution contains zero active Ableton calls.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
