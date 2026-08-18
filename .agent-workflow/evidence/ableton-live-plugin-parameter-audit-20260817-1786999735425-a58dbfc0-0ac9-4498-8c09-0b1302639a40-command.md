# Evidence ableton-live-plugin-parameter-audit-20260817: command

- Role: qa
- Summary: Active Ableton bridge status and project inventory were read successfully without writes.
- Path: not applicable
- Command: curl GET http://127.0.0.1:9789/status and /project
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: shell
- Assertions: Exit status 0. Observable output reports tempo 100, playing true, 7 tracks, 2 returns, master chain, and every device and exposed parameter.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
