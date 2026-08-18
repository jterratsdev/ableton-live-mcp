# Evidence ableton-live-plugin-parameter-audit-20260817: command

- Role: qa
- Summary: Per-chain parameter audit read all 28 devices from the active Set.
- Path: not applicable
- Command: Node fetch audit of GET /project and GET /devices/parameters for track, return, and master chains
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: shell
- Assertions: Exit status 0. Observable output records each device location, kind, parameterCount, parameter names, and available fields; Gateway=14 each, Valhalla=19 each, Kotelnikov=22, SSD5=1, Ample Bass=1, Youlean=1, and TDR Nova=1 or 2.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
