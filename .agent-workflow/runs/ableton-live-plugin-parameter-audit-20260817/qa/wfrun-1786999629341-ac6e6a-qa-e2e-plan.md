# Generated E2E Plan: ableton-live-plugin-parameter-audit-20260817

- Title: Audit plugin parameter access in active Ableton Set
- Target user: end user
- Style: workflow
- Reason: Matched workflow risk signals; QA must exercise isolated /tmp workflow fixtures, transitions, blocked states, return loops, resume, and generated artifacts.
- Executable runner: ./ableton-live-plugin-parameter-audit-20260817-qa-e2e.sh

## Commands
- node --test test/autonomous-workflow-cli.test.js

## Scenarios
### Scenario 1: A read-only status and project inventory response confirms the active bridge version and lists every device location inspected.
- Source: A read-only status and project inventory response confirms the active bridge version and lists every device location inspected.
- Fixture: isolated temporary Orchestra project under `/tmp` with task-specific acceptance criteria, paths, roles, workflow run state, expected handoffs, and generated artifacts.
- Assertions: verify command exit code, workflow run state, phase transitions, blocked/return/resume behavior when applicable, handoff contents, evidence artifacts, stdout/stderr, and final release readiness state.
- Evidence: command transcript, generated handoff files, workflow run JSONL records, evidence records, and defect report when expected behavior is not proven.

### Scenario 2: For every device in the open Set, a parameter inventory request records the exposed parameter count, names, values, ranges, quantization, enablement, and display strings when available.
- Source: For every device in the open Set, a parameter inventory request records the exposed parameter count, names, values, ranges, quantization, enablement, and display strings when available.
- Fixture: isolated temporary Orchestra project under `/tmp` with task-specific acceptance criteria, paths, roles, workflow run state, expected handoffs, and generated artifacts.
- Assertions: verify command exit code, workflow run state, phase transitions, blocked/return/resume behavior when applicable, handoff contents, evidence artifacts, stdout/stderr, and final release readiness state.
- Evidence: command transcript, generated handoff files, workflow run JSONL records, evidence records, and defect report when expected behavior is not proven.

## Acceptance Criteria Quality Issues
- AC3: "A source-to-runtime comparison visibly classifies missing plugin parameters as Live API exposure, Remote Script serialization, MCP schema, or stale-install limitations and recommends the smallest next implementation step." is not executable evidence (criterion lacks an observable verification verb). QA must block release until PO/BA rewrites it as an observable outcome.

## Real-World Evidence Profiles
- API/integration: execute the real request path or a contract-faithful sandbox/mock, assert request shape, response shape, auth/error behavior, receiver-side state, emitted events/logs, and retry/idempotency behavior when applicable.
- Documents/content: execute the real fetch/import/parse/convert path, validate source document identity and representative content, then validate derived Markdown or generated artifacts preserve required headings, tables, links, metadata, and redaction expectations.
- Workflow/state: exercise allowed and blocked transitions, return loops, resume after correction, generated handoff/evidence artifacts, final release readiness, and JSONL/event state.

## QA Standard Checks
- Build an AC-to-evidence matrix that maps every acceptance criterion to command/artifact, expected result, actual result, and pass/fail/deferred status.
- Use isolated deterministic fixtures; use the configured test environment when provided, otherwise default local disposable project fixtures to `/tmp`.
- Assert resulting product state, not only that a command or browser action executed.
- Block release when evidence is missing, too generic, or not tied to acceptance criteria.
- For workflow/state-machine behavior, cover allowed transition, blocked transition, return loop, resume, and final handoff/release artifact content.

## Fixtures
- authenticated user when the flow requires identity

## Notes
- Prefer mobile-first viewport coverage before desktop expansion
- Attach trace, screenshot, or video when failures occur
