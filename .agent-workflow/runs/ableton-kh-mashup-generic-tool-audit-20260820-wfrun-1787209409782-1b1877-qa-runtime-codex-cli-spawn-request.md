# Runtime Spawn Request: ableton-kh-mashup-generic-tool-audit-20260820

- Task id: ableton-kh-mashup-generic-tool-audit-20260820
- Runtime: Codex CLI (codex-cli)
- Phase: qa
- Role: qa
- Session id: ableton-kh-mashup-generic-tool-audit-20260820:wfrun-1787209409782-1b1877:qa:codex-cli
- Status: requested
- Async mode: full-async
- Default parent wait: false
- Completion: lifecycle-event-or-explicit-poll
- Spawn bridge mode: parent-tool
- Parent runtime tool: spawn_agent
- Direct provider API calls: forbidden
- directProviderApiAllowed=false
- Context tokens: 8637/3000

## Parent Runtime Action
- Action kind: codex-spawn-agent
- Native tool: spawn_agent
- Runtime bridge guidance: Render a spawn request artifact that the parent Codex runtime can execute with its spawn_agent tool.
- Parent runtime should call spawn_agent with the assignment below.
- Orchestra only rendered this request and recorded provenance.
- Call spawn_agent from the active Codex parent runtime with the prompt artifact as the child assignment.
- Prefer background execution and avoid waiting unless the next parent step is blocked.
- Record spawned and terminal lifecycle states with the returned agent id.
- Spawn lifecycle: orchestra runtime spawn-lifecycle --session ableton-kh-mashup-generic-tool-audit-20260820:wfrun-1787209409782-1b1877:qa:codex-cli --status spawned --agent-id <agent-id>
- Complete lifecycle: orchestra runtime spawn-lifecycle --session ableton-kh-mashup-generic-tool-audit-20260820:wfrun-1787209409782-1b1877:qa:codex-cli --status completed --agent-id <agent-id> --artifact .agent-workflow/handoffs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-qa-qa-runtime-handoff.md
- Failure lifecycle: orchestra runtime spawn-lifecycle --session ableton-kh-mashup-generic-tool-audit-20260820:wfrun-1787209409782-1b1877:qa:codex-cli --status failed --agent-id <agent-id> --summary "<safe failure summary>"
- Parent should return control immediately after launching or recording the request.
- Parent should reconcile completion through lifecycle notification or explicit later polling.

## Assignment
- Ownership paths: src, bridge, ableton_remote_scripts, docs, test
- Delegation intent: execute
- Allowed commands: bash(orchestra *), npm run format, npm run build, npm run precommit
- Expected artifacts: code diff, test evidence, handoff notes
- Prompt artifact: .agent-workflow/runs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-qa-runtime-codex-cli-spawn-prompt.md
- Context manifest artifact: .agent-workflow/runs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-qa-runtime-codex-cli-context-manifest.json
- Expected result artifact: .agent-workflow/handoffs/ableton-kh-mashup-generic-tool-audit-20260820-wfrun-1787209409782-1b1877-qa-qa-runtime-handoff.md

## Scoped CLI Capabilities

- Guidance: if an official Orchestra command applies, use the exposed capability and structured argv array before creating ad hoc scripts.
- Command construction contract: pass executable and args as separate argv entries; do not build shell strings with interpolation.

### Exposed

- architect-diagram-generate
  - commandId: diagrams-generate
  - executable: orchestra
  - argsTemplate: ["diagrams","generate","--input","<model.json>","--output","<diagram.svg>","--task","<task-id>","--retain-iterations","--json"]
  - purpose: Generate deterministic SVG diagrams from typed architecture model payloads.
  - allowedRoles: architect, technical_writer, qa
  - requiredContext: diagram model JSON path, workspace-relative SVG output path, task id when recording evidence
  - outputContract: JSON model path, SVG path, validation findings, iteration count, retained iteration artifacts, and optional evidence metadata.
  - evidenceType: file
  - riskLevel: low
  - approvalPolicy: none
  - reason: exposed: role allowed and task signals match
- architect-workflow-template-render
  - commandId: workflow-render
  - executable: orchestra
  - argsTemplate: ["workflow","render","--task","<task-id>","--phase","<phase>","--target","<runtime-target>","--json"]
  - purpose: Render official workflow template guidance for the current task and phase.
  - allowedRoles: architect, product_owner, product_manager, developer, qa
  - requiredContext: task id, phase, runtime target
  - outputContract: JSON workflow template selection and rendered guidance for scoped agent consumption.
  - evidenceType: report
  - riskLevel: low
  - approvalPolicy: none
  - reason: exposed: role allowed and task signals match
- qa-playwright-plan
  - commandId: playwright-plan
  - executable: orchestra
  - argsTemplate: ["playwright","plan","--task","<task-id>","--json"]
  - purpose: Plan Playwright scenarios for browser-based E2E, smoke, and regression validation.
  - allowedRoles: qa, developer
  - requiredContext: task id, acceptance criteria
  - outputContract: JSON scenario plan mapped to task acceptance criteria and target surfaces.
  - evidenceType: report
  - riskLevel: low
  - approvalPolicy: none
  - reason: exposed: role allowed and phase matches
- qa-evidence-check
  - commandId: qa-evidence-check
  - executable: orchestra
  - argsTemplate: ["qa","evidence-check","--surface","<surface>","--type","<type>","--path","<file>","--json"]
  - purpose: Validate observable QA evidence shape before recording or handing it off.
  - allowedRoles: qa, developer, release_manager
  - requiredContext: surface, evidence type, artifact path or command result
  - outputContract: JSON evidence validation status with missing fields and deferred evidence guidance.
  - evidenceType: report
  - riskLevel: low
  - approvalPolicy: none
  - reason: exposed: role allowed and task signals match
- qa-playwright-evidence
  - commandId: playwright-evidence
  - executable: orchestra
  - argsTemplate: ["playwright","evidence","--task","<task-id>","--kind","<kind>","--path","<file>","--summary","<summary>"]
  - purpose: Attach screenshots, traces, videos, or reports from Playwright validation to the workflow evidence stream.
  - allowedRoles: qa, developer
  - requiredContext: task id, artifact kind, artifact path, evidence summary
  - outputContract: Recorded workflow evidence artifact reference for browser validation evidence.
  - evidenceType: screenshot
  - riskLevel: low
  - approvalPolicy: none
  - reason: exposed: role allowed and task signals match
- release-check
  - commandId: release-check
  - executable: orchestra
  - argsTemplate: ["release","check","--json"]
  - purpose: Check current release readiness gates before a release decision.
  - allowedRoles: release_manager, qa, developer
  - requiredContext: workspace release state, recorded evidence and reviews
  - outputContract: JSON release readiness status with blockers, warnings, and checked gates.
  - evidenceType: command
  - riskLevel: medium
  - approvalPolicy: workflow-gate
  - reason: exposed: role allowed and task signals match
- release-readiness
  - commandId: release-readiness
  - executable: orchestra
  - argsTemplate: ["release","readiness","--version","<version>","--manifest","<file>","--json"]
  - purpose: Block tag readiness when included release manifest items are missing evidence.
  - allowedRoles: release_manager, qa
  - requiredContext: version, release inclusion manifest, release evidence
  - outputContract: JSON tag-readiness result with missing evidence and blocking release items.
  - evidenceType: report
  - riskLevel: medium
  - approvalPolicy: workflow-gate
  - reason: exposed: role allowed and task signals match
- release-benchmark-task
  - commandId: benchmark-task
  - executable: orchestra
  - argsTemplate: ["benchmark","--task","<task-id>","--json"]
  - purpose: Benchmark completed task effort and quality signals after delivery evidence exists.
  - allowedRoles: release_manager, qa, architect
  - requiredContext: task id, completed workflow evidence
  - outputContract: JSON benchmark result with task sizing, quality signals, and calibration data.
  - evidenceType: report
  - riskLevel: low
  - approvalPolicy: none
  - reason: exposed: role allowed and phase matches

### Omitted

- architect-diagram-lint (diagrams-lint): omitted: role qa is not allowed

## Required Context Files

- .agent-workflow/playbooks/qa.md
  - source: phase-playbook
  - loadMode: full
  - required: true
  - sha256: d04b2e0f43e1b986708678556ec981729ef706a4881cca7b488ef20112ab6ed9
  - reason: Required qa phase playbook for qa runtime work.
- AGENTS.md
  - source: runtime-instructions
  - loadMode: excerpt
  - required: true
  - sha256: ca348a8005c76d48ca2a6313695f83db573e73d71cc15e12e3054bcf8aa76882
  - reason: Required root runtime instructions for project-wide agent behavior.
- rules/development/semantic-code.md
  - source: rule
  - loadMode: full
  - required: true
  - sha256: fd93b7ee2fd98512a9aa14999b9bf5f970a245ebff153f9503821bc10fc7a7fe
  - reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.
- rules/testing-discipline.mdc
  - source: rule
  - loadMode: excerpt
  - required: true
  - sha256: d98d4409fb1eceb2dbffdd5d51b473d86514cb09473d360fc7a1aa8b3f4200b3
  - reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.
- rules/delivery-quality-gates.mdc
  - source: rule
  - loadMode: excerpt
  - required: true
  - sha256: 05e5c1ef1d21dd2ac44ca37a91c0edefe86913b151113903660d98386ecae93f
  - reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.
- rules/agent-collaboration.mdc
  - source: rule
  - loadMode: full
  - required: true
  - sha256: 38a79bcf143151db69891027ab92b770f0045dae608027b8a9b5e0cc40909563
  - reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.

## Generated Context Pack

- unavailable: context pack requires a fresh context index: context index has not been built

## Preprocessed Runtime Context

- config.maxLinesPerFile: 80
- config.totalLineBudget: 360
- original: 224 lines / 20611 bytes
- final: 234 lines / 21319 bytes
- omittedContentWarning: One or more context files were reduced; cite source paths when full files are needed.

### .agent-workflow/playbooks/qa.md

- sourcePath: .agent-workflow/playbooks/qa.md
- strategy: passthrough
- originalSize: 56 lines / 9640 bytes
- finalSize: 56 lines / 9640 bytes
- omittedContentWarning: none
- reason: Required qa phase playbook for qa runtime work.

```
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
```

### AGENTS.md

- sourcePath: AGENTS.md
- strategy: passthrough
- originalSize: 23 lines / 1602 bytes
- finalSize: 23 lines / 1601 bytes
- omittedContentWarning: none
- reason: Required root runtime instructions for project-wide agent behavior.

```
<!-- open-orchestra:start block-id="runtime-bootstrap" generator="open-orchestra runtime bootstrap" version="2" target="codex" source-manifest="open-orchestra command-manifest,runtime-bootstrap" content-sha256="58bb0cb8693a9ad87704816cf8143e186b8b5617441cbdab34800282e3682aae" updated-at="2026-07-16T05:38:13.653Z" -->
# Open Orchestra Runtime Bootstrap

Runtime target: Codex. Reference Open Orchestra from AGENTS.md so local CLI work follows workflow gates.

## Non-Negotiable Runtime Rules

These rules are non-negotiable. Follow them in every conversation and every work block:

- Use Orchestra for all project work: planning, implementation, fixes, reviews, QA, release, CI, research, and documentation.
- Do not edit files, run implementation work, or dispatch agents before a matching Orchestra task exists and a workflow run is active.
- Always run the runtime health preflight, inspect active tasks, and validate pre-run context before work.
- If a gate is paused, stop and wait for explicit user approval before continuing.
- Record real evidence: commands, files, outputs, logs, screenshots, traces, or explicit deferred-risk rationale.
- Never treat simulated handoffs, generated summaries, or workflow state alone as proof of completed QA.
- Never push, tag, publish, or deploy without explicit user instruction.

Use Open Orchestra as the local control plane when `.agent-workflow/` exists.
The active LLM runtime is the parent agent. Orchestra renders spawn requests and records lifecycle; it does not call provider APIs directly.

## Orchestra Workflow — Required for All Work

Every
```

### rules/development/semantic-code.md

- sourcePath: rules/development/semantic-code.md
- strategy: passthrough
- originalSize: 28 lines / 1398 bytes
- finalSize: 28 lines / 1398 bytes
- omittedContentWarning: none
- reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.

```
# Semantic Code

Code must be readable by intent before it is explained by comments.

## Naming

- Use domain language for modules, functions, variables, types, and test names.
- Prefer names that reveal purpose and observable behavior, such as `validateReleaseGateEvidence`, not vague names such as `processData`.
- Boolean names must make the predicate clear: `isReady`, `hasEvidence`, `canRetry`, `shouldBlockRelease`.

## Structure

- Keep entry points thin. Move decisions and business rules into focused domain, service, or policy modules.
- Extract helpers when a reader needs comments to understand a block of code.
- Avoid generic containers in public APIs when narrow types or explicit models can describe the contract.
- Avoid hardcoded command lists, statuses, roles, labels, or fixture values when a typed registry or catalog can be the source of truth.

## Comments

- Comments explain why, trade-offs, invariants, or external constraints.
- Do not add comments that restate what the code already says.
- If a function needs line-by-line comments to be understandable, refactor the names, types, or helper boundaries.

## Review Checklist

- A reviewer can identify the domain intent from names and file boundaries without tracing every line.
- New code follows the existing project vocabulary and layering.
- Tests read like behavior specifications and use meaningful scenario names.
```

### rules/testing-discipline.mdc

- sourcePath: rules/testing-discipline.mdc
- strategy: passthrough
- originalSize: 34 lines / 1616 bytes
- finalSize: 34 lines / 1616 bytes
- omittedContentWarning: none
- reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.

```
---
description: TDD, BDD, and testing best practices — stack-agnostic
alwaysApply: true
---

# Testing Discipline

## Test-Driven Development (TDD)

- Write the test **before** or **alongside** the implementation. At minimum, tests must exist before the PR.
- Red → Green → Refactor. Start with a failing test, make it pass with minimal code, then clean up.
- Every development task must include unit tests for new or changed business logic before it is handed to QA.

## Behavior-Driven Development (BDD)

- Test **behavior**, not implementation. Test what the function does, not how it does it.
- Name tests as specifications: `it('rejects orders with zero quantity')`, not `it('test1')`.
- One assertion per test method. If you need multiple, it's multiple behaviors — split them.

## Test Structure

- **Arrange → Act → Assert.** Separate setup, execution, and verification with blank lines.
- Use factory functions or builders for test data — never copy-paste fixtures across test files.
- QA automation, E2E suites, contract tests, and test scripts that repeat fixture collections, selectors, expected outputs, or command matrices must load the `collection-standards` skill.
- Tests must be deterministic. No reliance on system clock, network, or random values without seeding.

## Sync Tests

- If data is duplicated across packages (e.g., type definitions, config arrays), a test must assert both copies are identical.
- Schema changes in a source of truth must break a test somewhere — if they don't, add one.

## Coverage

- Target **90%+ line coverage** for business logic. Infrastructure
```

### rules/delivery-quality-gates.mdc

- sourcePath: rules/delivery-quality-gates.mdc
- strategy: passthrough
- originalSize: 23 lines / 1604 bytes
- finalSize: 23 lines / 1604 bytes
- omittedContentWarning: none
- reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.

```
---
description: Required delivery flow from development through QA automation and evidence
alwaysApply: true
---

# Delivery Quality Gates

Development work is not complete when code compiles. Every implementation must move through developer verification, QA review, automation planning, and evidence capture.

## Developer Gate

- Developer delivers code with unit tests for new or changed business logic.
- Unit tests must cover success paths, failure paths, and relevant boundary cases.
- Developer must run the focused unit test suite and report the exact command and result.
- If unit tests are not feasible, Developer must document the technical reason and propose the smallest testable refactor.
- Developer must address API, data, frontend, performance, concurrency, config, and AI-assisted development rules when the change touches those areas.

## QA Gate

- QA receives the Developer handoff before release approval.
- Workflow gate approval is not a status shortcut. `po→architect` can be approved only when the issue/task has user-validated scope, non-goals, assumptions, priority, acceptance criteria, and sizing context. `qa→release` can be approved only after real implementation evidence, QA findings, BA/PO acceptance, and Architect review when technical contracts changed.
- Generated handoffs with `Acceptance Criteria: none` are incomplete for release purposes. Pull the criteria from the linked GitHub issue or Orchestra task, record a review finding, and block release until the criteria/evidence gap is fixed or explicitly risk-accepted by the Product Owner.
- QA must produc
```

### rules/agent-collaboration.mdc

- sourcePath: rules/agent-collaboration.mdc
- strategy: passthrough
- originalSize: 60 lines / 4751 bytes
- finalSize: 60 lines / 4751 bytes
- omittedContentWarning: none
- reason: Required qa rule selected from the neutral rule catalog for role-specific execution quality.

```
---
description: Cross-agent collaboration, handoffs, and decision protocol — stack-agnostic
alwaysApply: true
---

# Agent Collaboration

Agents must collaborate through explicit artifacts and review checkpoints. Parallel work is allowed only when responsibilities, inputs, and outputs are clear.

## Shared Context
- Start with a shared task brief: goal, backlog item, constraints, assumptions, risks, and definition of done.
- Confirm the GitHub issue exists and has been technically refined before starting each work block.
- Keep a visible decision log for architecture choices, scope cuts, security exceptions, and release trade-offs.
- Treat unresolved questions as blockers when they affect user value, data contracts, security, or deployment.

## User Alignment Gate
- Before implementation, discuss the proposed solution and architecture with the user.
- Present the plan in concrete terms: scope, files or modules likely to change, domain/model changes, service/integration changes, controller/entry-point changes, data flow, risks, trade-offs, test strategy, and expected evidence.
- Do not start coding when the architecture, acceptance criteria, or user-visible behavior is ambiguous.
- If the task is a trivial mechanical edit, state that no architecture decision is involved and proceed with the smallest safe change.
- If new information invalidates the agreed plan, pause and realign with the user before continuing.

## Collaboration Flow
- Product Owner and Analyst define acceptance criteria before Developer or QA treat the task as ready.
- Product Owner and Business Analyst must validate user stories, definitions, assumptions, acceptance criteria, non-goals, and priority with the user before approving the `po→architect` handoff.
- If user validation is missing or scope is still ambiguous, keep the task in refinement, record the open question, and do not route it to Architect as ready-for-design.
- Architect and Security review designs before implementation when work touches boundaries, data, auth, infra, or external integrations.
- UX/UI Designer reviews user-facing flows before implementation when the task changes screens, copy, navigation, onboarding, or accessibility.
- SRE, DBA, Compliance/Privacy, and Release Manager review before release when reliability, database, regulatory, or rollout risk is material.
- Developer starts implementation only after the user alignment gate and required role reviews are complete.
- Developer shares implementation notes, unit test evidence, and changed behavior with QA, DevOps, and Security before final verification.
- QA, DevOps, and Security report release blockers back to Product Owner for go/no-go decisions.
- Developer work must pass through QA review before release approval.

## Handoff Contract
- Every handoff must include: current status, files or components touched, decisions made, risks, test evidence, and remaining work.
- Do not hand off vague ownership such as "finish the backend". Name the exact module, behavior, or artifact.
- If another agent's output is incomplete or contradictory, pause and reconcile before building on it.
- Developer-to-QA handoff must include unit tests added or updated, exact test commands run, known gaps, and any recommended Playwright coverage.

## Parallel Work Rules
- Split work by stable boundaries: feature slice, module, test suite, infrastructure component, or documentation artifact.
- Agents working in parallel must publish assumptions early and update them when code or requirements change.
- Avoid duplicate edits to the same files. If overlap is unavoidable, assign one integration owner.

## Review Protocol
- Review from the role's responsibility, not personal preference.
- Findings must include severity, affected artifact, expected behavior, actual risk, and a concrete recommendation.
- Approval means the reviewer accepts the residual risk for their role.

## Conflict Resolution
- Product value conflicts are resolved by Product Owner with Product Manager input.
- Technical direction conflicts are resolved by Architect with Developer and DevOps input.
- Verification conflicts are resolved by QA using acceptance criteria and reproducible evidence.
- Security conflicts are resolved by Security unless the Product Owner records explicit risk acceptance.
- UX conflicts are resolved by UX/UI Designer with Product Owner input.
- Reliability conflicts are resolved by SRE with DevOps and Architect input.
- Data and database conflicts are resolved by Data Engineer or DBA according to ownership.
- Release timing conflicts are resolved by Release Manager with Product Owner input.
- Compliance and privacy conflicts are resolved by Compliance/Privacy unless formal risk acceptance is recorded.
```

### src

- sourcePath: src
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 137 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: src
Raw directory contents were not loaded into runtime context. Inspect targeted files under this path when needed.
```

### bridge

- sourcePath: bridge
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 140 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: bridge
Raw directory contents were not loaded into runtime context. Inspect targeted files under this path when needed.
```

### ableton_remote_scripts

- sourcePath: ableton_remote_scripts
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 156 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: ableton_remote_scripts
Raw directory contents were not loaded into runtime context. Inspect targeted files under this path when needed.
```

### docs

- sourcePath: docs
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 138 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: docs
Raw directory contents were not loaded into runtime context. Inspect targeted files under this path when needed.
```

### test

- sourcePath: test
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 138 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: test
Raw directory contents were not loaded into runtime context. Inspect targeted files under this path when needed.
```


## Loaded Context Excerpts

### .agent-workflow/playbooks/qa.md

```md
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
```

### AGENTS.md

```md
<!-- open-orchestra:start block-id="runtime-bootstrap" generator="open-orchestra runtime bootstrap" version="2" target="codex" source-manifest="open-orchestra command-manifest,runtime-bootstrap" content-sha256="58bb0cb8693a9ad87704816cf8143e186b8b5617441cbdab34800282e3682aae" updated-at="2026-07-16T05:38:13.653Z" -->
# Open Orchestra Runtime Bootstrap

Runtime target: Codex. Reference Open Orchestra from AGENTS.md so local CLI work follows workflow gates.

## Non-Negotiable Runtime Rules

These rules are non-negotiable. Follow them in every conversation and every work block:

- Use Orchestra for all project work: planning, implementation, fixes, reviews, QA, release, CI, research, and documentation.
- Do not edit files, run implementation work, or dispatch agents before a matching Orchestra task exists and a workflow run is active.
- Always run the runtime health preflight, inspect active tasks, and validate pre-run context before work.
- If a gate is paused, stop and wait for explicit user approval before continuing.
- Record real evidence: commands, files, outputs, logs, screenshots, traces, or explicit deferred-risk rationale.
- Never treat simulated handoffs, generated summaries, or workflow state alone as proof of completed QA.
- Never push, tag, publish, or deploy without explicit user instruction.

Use Open Orchestra as the local control plane when `.agent-workflow/` exists.
The active LLM runtime is the parent agent. Orchestra renders spawn requests and records lifecycle; it does not call provider APIs directly.

## Orchestra Workflow — Required for All Work

Every
```

### rules/development/semantic-code.md

```md
# Semantic Code

Code must be readable by intent before it is explained by comments.

## Naming

- Use domain language for modules, functions, variables, types, and test names.
- Prefer names that reveal purpose and observable behavior, such as `validateReleaseGateEvidence`, not vague names such as `processData`.
- Boolean names must make the predicate clear: `isReady`, `hasEvidence`, `canRetry`, `shouldBlockRelease`.

## Structure

- Keep entry points thin. Move decisions and business rules into focused domain, service, or policy modules.
- Extract helpers when a reader needs comments to understand a block of code.
- Avoid generic containers in public APIs when narrow types or explicit models can describe the contract.
- Avoid hardcoded command lists, statuses, roles, labels, or fixture values when a typed registry or catalog can be the source of truth.

## Comments

- Comments explain why, trade-offs, invariants, or external constraints.
- Do not add comments that restate what the code already says.
- If a function needs line-by-line comments to be understandable, refactor the names, types, or helper boundaries.

## Review Checklist

- A reviewer can identify the domain intent from names and file boundaries without tracing every line.
- New code follows the existing project vocabulary and layering.
- Tests read like behavior specifications and use meaningful scenario names.
```

### rules/testing-discipline.mdc

```md
---
description: TDD, BDD, and testing best practices — stack-agnostic
alwaysApply: true
---

# Testing Discipline

## Test-Driven Development (TDD)

- Write the test **before** or **alongside** the implementation. At minimum, tests must exist before the PR.
- Red → Green → Refactor. Start with a failing test, make it pass with minimal code, then clean up.
- Every development task must include unit tests for new or changed business logic before it is handed to QA.

## Behavior-Driven Development (BDD)

- Test **behavior**, not implementation. Test what the function does, not how it does it.
- Name tests as specifications: `it('rejects orders with zero quantity')`, not `it('test1')`.
- One assertion per test method. If you need multiple, it's multiple behaviors — split them.

## Test Structure

- **Arrange → Act → Assert.** Separate setup, execution, and verification with blank lines.
- Use factory functions or builders for test data — never copy-paste fixtures across test files.
- QA automation, E2E suites, contract tests, and test scripts that repeat fixture collections, selectors, expected outputs, or command matrices must load the `collection-standards` skill.
- Tests must be deterministic. No reliance on system clock, network, or random values without seeding.

## Sync Tests

- If data is duplicated across packages (e.g., type definitions, config arrays), a test must assert both copies are identical.
- Schema changes in a source of truth must break a test somewhere — if they don't, add one.

## Coverage

- Target **90%+ line coverage** for business logic. Infrastructure
```

### rules/delivery-quality-gates.mdc

```md
---
description: Required delivery flow from development through QA automation and evidence
alwaysApply: true
---

# Delivery Quality Gates

Development work is not complete when code compiles. Every implementation must move through developer verification, QA review, automation planning, and evidence capture.

## Developer Gate

- Developer delivers code with unit tests for new or changed business logic.
- Unit tests must cover success paths, failure paths, and relevant boundary cases.
- Developer must run the focused unit test suite and report the exact command and result.
- If unit tests are not feasible, Developer must document the technical reason and propose the smallest testable refactor.
- Developer must address API, data, frontend, performance, concurrency, config, and AI-assisted development rules when the change touches those areas.

## QA Gate

- QA receives the Developer handoff before release approval.
- Workflow gate approval is not a status shortcut. `po→architect` can be approved only when the issue/task has user-validated scope, non-goals, assumptions, priority, acceptance criteria, and sizing context. `qa→release` can be approved only after real implementation evidence, QA findings, BA/PO acceptance, and Architect review when technical contracts changed.
- Generated handoffs with `Acceptance Criteria: none` are incomplete for release purposes. Pull the criteria from the linked GitHub issue or Orchestra task, record a review finding, and block release until the criteria/evidence gap is fixed or explicitly risk-accepted by the Product Owner.
- QA must produc
```

### rules/agent-collaboration.mdc

```md
---
description: Cross-agent collaboration, handoffs, and decision protocol — stack-agnostic
alwaysApply: true
---

# Agent Collaboration

Agents must collaborate through explicit artifacts and review checkpoints. Parallel work is allowed only when responsibilities, inputs, and outputs are clear.

## Shared Context
- Start with a shared task brief: goal, backlog item, constraints, assumptions, risks, and definition of done.
- Confirm the GitHub issue exists and has been technically refined before starting each work block.
- Keep a visible decision log for architecture choices, scope cuts, security exceptions, and release trade-offs.
- Treat unresolved questions as blockers when they affect user value, data contracts, security, or deployment.

## User Alignment Gate
- Before implementation, discuss the proposed solution and architecture with the user.
- Present the plan in concrete terms: scope, files or modules likely to change, domain/model changes, service/integration changes, controller/entry-point changes, data flow, risks, trade-offs, test strategy, and expected evidence.
- Do not start coding when the architecture, acceptance criteria, or user-visible behavior is ambiguous.
- If the task is a trivial mechanical edit, state that no architecture decision is involved and proceed with the smallest safe change.
- If new information invalidates the agreed plan, pause and realign with the user before continuing.

## Collaboration Flow
- Product Owner and Analyst define acceptance criteria before Developer or QA treat the task as ready.
- Product Owner and Business Analyst must validate user stories, definitions, assumptions, acceptance criteria, non-goals, and priority with the user before approving the `po→architect` handoff.
- If user validation is missing or scope is still ambiguous, keep the task in refinement, record the open question, and do not route it to Architect as ready-for-design.
- Architect and Security review designs before implementation when work touches boundaries, data, auth, infra, or external integrations.
- UX/UI Designer reviews user-facing flows before implementation when the task changes screens, copy, navigation, onboarding, or accessibility.
- SRE, DBA, Compliance/Privacy, and Release Manager review before release when reliability, database, regulatory, or rollout risk is material.
- Developer starts implementation only after the user alignment gate and required role reviews are complete.
- Developer shares implementation notes, unit test evidence, and changed behavior with QA, DevOps, and Security before final verification.
- QA, DevOps, and Security report release blockers back to Product Owner for go/no-go decisions.
- Developer work must pass through QA review before release approval.

## Handoff Contract
- Every handoff must include: current status, files or components touched, decisions made, risks, test evidence, and remaining work.
- Do not hand off vague ownership such as "finish the backend". Name the exact module, behavior, or artifact.
- If another agent's output is incomplete or contradictory, pause and reconcile before building on it.
- Developer-to-QA handoff must include unit tests added or updated, exact test commands run, known gaps, and any recommended Playwright coverage.

## Parallel Work Rules
- Split work by stable boundaries: feature slice, module, test suite, infrastructure component, or documentation artifact.
- Agents working in parallel must publish assumptions early and update them when code or requirements change.
- Avoid duplicate edits to the same files. If overlap is unavoidable, assign one integration owner.

## Review Protocol
- Review from the role's responsibility, not personal preference.
- Findings must include severity, affected artifact, expected behavior, actual risk, and a concrete recommendation.
- Approval means the reviewer accepts the residual risk for their role.

## Conflict Resolution
- Product value conflicts are resolved by Product Owner with Product Manager input.
- Technical direction conflicts are resolved by Architect with Developer and DevOps input.
- Verification conflicts are resolved by QA using acceptance criteria and reproducible evidence.
- Security conflicts are resolved by Security unless the Product Owner records explicit risk acceptance.
- UX conflicts are resolved by UX/UI Designer with Product Owner input.
- Reliability conflicts are resolved by SRE with DevOps and Architect input.
- Data and database conflicts are resolved by Data Engineer or DBA according to ownership.
- Release timing conflicts are resolved by Release Manager with Product Owner input.
- Compliance and privacy conflicts are resolved by Compliance/Privacy unless formal risk acceptance is recorded.
```


## Selected Skills
- proactive-orchestra: eligible task roles: architect, qa; task text matches triggers: orchestra, workflow, handoff, evidence
- source-of-truth: eligible task roles: architect, qa; task text matches triggers: source, docs, verify, truth
- prompt-registry: eligible task roles: qa; task text matches triggers: ui, docs; task touches files, so prompt registry can preserve artifact intent
- oclif-plugin-development: eligible task roles: architect, qa; task text matches triggers: plugin, plugins
- pr-review: eligible task roles: qa, architect; task text matches triggers: pr, review
- audio-video-transcription: eligible task roles: qa, architect; task text matches triggers: audio
- collection-standards: eligible task roles: qa; task text matches triggers: map
- diagram-export: eligible task roles: architect; task text matches triggers: flow
- doc-sync: eligible task roles: architect; task text matches triggers: docs
- playwright-evidence: eligible task roles: qa; task text matches triggers: ui
- static-analysis: eligible task roles: qa; task text matches triggers: test
- release-readiness: task text matches triggers: rollback

## Guardrails
- Execute only through the active parent runtime, not through direct vendor APIs.
- Do not include secrets, full transcripts, or unrelated workspace context in the child prompt.
- Respect ownership paths and active locks before editing.
- Return a concise handoff with touched files, test evidence, risks, and close status.
- Handoff must include `Consumed Context Files` with required files read, rules applied, and non-applicable required rules with reasons.
- Close or mark the delegated session failed if the parent tool cannot create a child agent.
- Guardrail status: allow
- Requested spawns: 1/3
- Active delegates: 0/3
- Delegation depth: 0/1
- Context budget: 3000/3000
- Spawn budget: 6000
- Timeout ms: 600000
- Stale claim TTL ms: 1800000
- Nested delegation allowed: false
- Handoff max chars: 4000
- Guardrail reasons: none

## Quality Warnings
- context token estimate 8637 exceeds budget 3000

## Phase Playbook: qa

Source: .agent-workflow/playbooks/qa.md

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

## Tool Permission Policy
- Mode: runtime-managed
- Explicit opt-in required: false
- Read-only tools: none
- Write tools: none
- Shell tools: none
- Autonomous flags: none
- Gated flags: none
- Warning: Codex permission flags are managed by the active Codex CLI/session; Orchestra renders briefs and does not inject direct execution flags.