# Evidence ableton-capability-aware-tool-exposure-20260819: command

- Role: qa
- Summary: Verifier contract capability-aware-tool-list passed for AC1-AC6 using isolated Remote Script, development, malformed, unreachable, cache-expiry, recovery, direct-call, and workflow fixtures.
- Path: test/capability-aware-tools.mjs
- Command: node test/capability-aware-tools.mjs
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: capability-aware-tool-list
- Automation surface: api
- Assertions: Request contract: JSON-RPC initialize, tools/list, tools/call, and GET /capabilities fixtures. Response contract and schema: exact capability modes, canonical route status/reason arrays, tool names/descriptions, JSON-RPC capability error, and workflow availability fields. External side effect or persisted state: development adapter serialized state is equal before and after capability reads; unsupported calls record zero downstream action requests. Sandbox/mock/contract validation: in-memory Node adapters, fake bridge, fake clock, Python Remote Script object, and Python subprocess prove Remote/development/malformed/unreachable/expiry/recovery behavior without active bridge or Live Set contact.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
