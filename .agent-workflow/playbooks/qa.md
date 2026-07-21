# QA Playbook

## QA Checklist

- Map each acceptance criterion to deterministic verification or a documented manual check.
- Reject fragmented acceptance criteria before planning tests. Role names, phase names, headings, or partial clauses are not executable criteria.
- Confirm changed behavior, regression areas, edge cases, data setup, and environment assumptions.
- Build an AC-to-evidence matrix. Each row must name the acceptance criterion, test type, fixture/setup, command or artifact, expected observable result, actual result, and pass/fail/deferred status.
- Define concrete test scenarios before approving evidence. Each scenario must include setup, action, expected outcome, and one or more assertions that prove the product behavior.
- Before approving a QA handoff, explicitly reason through potential scenarios, expected results, the target environment or product surface, how actual results will be collected, and whether the evidence proves the acceptance criteria.
- Choose evidence based on the real execution environment: cloud service, database, CLI, API, web app, mobile app, desktop app, workflow/runtime, integration, generated artifact, or local sandbox. Record why the selected surface is sufficient.
- For agent/chat changes, assert the agent answered the expected intent, preserved required constraints, and used or rejected inherited Orchestra skills, rules, task context, and guardrails as expected.
- For API changes, assert status code, response schema, response body, persisted receiver-side state, errors, and redaction behavior match the contract.
- For CLI changes, assert exit code, stdout/stderr or JSON shape, generated files/events, and user-safe failure text.
- For workflow changes, assert parent actions, lifecycle events, phase transitions, gate behavior, resume behavior, and handoff/evidence artifacts using structured state instead of parsing human prose.
- For generated artifacts, assert the expected files exist, content matches the requested scenario, metadata/provenance is correct, and unsafe or wrong-target content is excluded.
- Challenge whether the test fixture actually triggers the risk. If the bug is about split detection, handoffs, failback, queues, gates, or specialist roles, require a scenario large or risky enough to exercise that behavior.
- For any product surface, use isolated fixtures that create the required users, data, project state, tasks, roles, acceptance criteria, devices/environments, expected files, events, and artifacts. Use the configured E2E fixture path, sandbox org, emulator, container, device farm, or test environment when provided; otherwise default local disposable fixtures to `/tmp`.
- For release-impacting work, map validation to the release-blocking E2E battery catalog from #380/#428. Select the relevant product-risk layer (installed CLI, browser console, workflow lifecycle, runtime delegation, security boundary, acceptance evidence, recovery/repair, provider-backed delegation, docs/site, or packaging) and state whether each P0 battery passed, is out of scope, deferred with owner/rationale, or blocks release.
- Do not approve a weaker surrogate. If the requested behavior is workflow, CLI, API, integration, generated artifact, mobile, desktop, or data behavior, validate that surface directly instead of substituting a generic browser or smoke test.
- For generated skills, rules, runtime guidance, or Markdown artifacts, validate the full integration flow: detected or explicit context, command execution, generated paths, managed metadata, target-specific content, refresh/drift behavior, user-content preservation, and wrong-target exclusion.
- Record exact commands, pass/fail result, artifacts, known gaps, and release recommendation.

## Worked Example Requirements

Use examples as assertion templates, not as proof by themselves. Every QA plan must adapt the relevant examples into concrete setup, action, expected result, positive assertions, and negative assertions.

- Chat/agent reply: setup includes a task, role/profile, inherited skills/rules, and a prompt with expected intent; action sends the chat or subagent request; expected result names the answer, constraints, and required tool/rule usage; assert the reply satisfies intent, cites/uses allowed context, and preserves guardrails; negative assertion: fail if the answer is generic, ignores inherited skills/rules, invents unavailable tools, or leaks unrelated context.
- API response: setup includes auth, tenant/workspace scope, request payload, and receiver-side fixture state; action calls the endpoint; expected result names status code, schema, body, persisted state, events, and redaction; assert contract fields and downstream state match; negative assertion: fail if a success status hides an error body, cross-scope data appears, or sensitive fields are unredacted.
- CLI command: setup includes isolated workspace, config, task data, and expected files/events; action runs the exact command; expected result names exit code, stdout/stderr or JSON shape, generated files, and state changes; assert output plus filesystem/event state; negative assertion: fail if the command merely exits zero while omitting required artifacts or emitting unsafe/internal error text.
- Workflow transition: setup includes task phase, gates, reviews, evidence, and parent actions; action runs or resumes the workflow; expected result names allowed transition, blocked transition, return loop, and release artifact; assert structured run state, handoff contents, and parent action lifecycle; negative assertion: fail if human prose claims success while state remains blocked or parent actions are missing.
- Generated artifact: setup includes requested artifact type, source data, target runtime, and unsafe/wrong-target content; action runs generation; expected result names files, metadata, provenance, content sections, and exclusions; assert generated paths and content match the scenario; negative assertion: fail if stale files, wrong runtime metadata, raw prompts, or unsafe content are included.
- UI rendering: setup includes viewport, route, user state, data fixtures, and accessibility expectations; action renders and interacts through the browser; expected result names visible state, loading/empty/error/success behavior, responsive layout, and persisted/API effects; assert locator-visible behavior and receiver state; negative assertion: fail if the DOM exists but text overlaps, controls are inaccessible, or the API state did not change.
- Async/background work: setup includes queue/job/event fixture, retry policy, timeout, and observable sink; action triggers the job; expected result names queued, running, completed/failed, retry/dead-letter behavior, and user-visible status; assert event/job/log state and final side effect; negative assertion: fail if only the trigger command ran while the job never completed or errors were swallowed.
- Permissions/security: setup includes authorized and unauthorized identities, scopes, hostile inputs, and redaction expectations; action attempts allowed and denied paths; expected result names permit/deny behavior, safe errors, audit/log event, and no secret exposure; assert least-privilege state and redacted outputs; negative assertion: fail if unauthorized data is visible, stack traces leak, or shell/path input is executed.
- Data persistence: setup includes initial records, transaction boundary, migration/version state, and reload/reconnect path; action performs create/update/delete or restore; expected result names persisted rows/documents, indexes/events, reload behavior, and rollback/idempotency; assert database/file/API state after restart or reload; negative assertion: fail if the UI shows temporary state that disappears after reload or duplicates appear after retry.

## Regression

- Identify critical flows, prior defects, adjacent modules, and brittle integration points.
- Include negative, edge, and return-loop cases when guardrails or automata-like workflow transitions are part of the change.
- Prefer existing automated coverage before adding new tests; note any intentional manual coverage.

## Smoke Test

- Define the smallest high-confidence smoke path for the changed behavior.
- Include CLI, API, or browser smoke evidence based on the user-facing surface.

- Verify acceptance criteria, regressions, edge cases, and evidence quality.
- Reject tests that only prove an action ran without asserting the resulting product state: UI/mobile visible state, API receiver state, persisted data, async event/job, generated artifacts, stdout/stderr, files, or workflow transition state.
- E2E evidence must prove the functional journey plus integration result for the requested surface, with assertions mapped back to each acceptance criterion.
- For workflow/state-machine behavior, verify at least one allowed transition, one blocked transition, one return loop to the responsible role, resume behavior after correction, and final handoff/release artifact content.
- For UI evidence, include viewport/responsive checks and annotate visual defects with screenshots or video. For CLI evidence, assert exit code plus stdout/stderr and generated files/events. For API/integration evidence, assert contract plus receiver-side state, mock/sandbox records, webhook/event/log output, or a documented deferral.
- If evidence is missing, too generic, or not mapped to acceptance criteria, return changes/block with concrete findings instead of pass.
- Prefer deterministic automated checks; add browser evidence for UI flows.
- State residual risks and whether release should proceed.
