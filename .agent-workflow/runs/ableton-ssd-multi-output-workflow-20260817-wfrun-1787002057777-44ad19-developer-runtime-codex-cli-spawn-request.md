# Runtime Spawn Request: ableton-ssd-multi-output-workflow-20260817

- Task id: ableton-ssd-multi-output-workflow-20260817
- Runtime: Codex CLI (codex-cli)
- Phase: developer
- Role: developer
- Session id: ableton-ssd-multi-output-workflow-20260817:wfrun-1787002057777-44ad19:developer:codex-cli
- Status: requested
- Async mode: full-async
- Default parent wait: false
- Completion: lifecycle-event-or-explicit-poll
- Spawn bridge mode: parent-tool
- Parent runtime tool: spawn_agent
- Direct provider API calls: forbidden
- directProviderApiAllowed=false
- Context tokens: 7770/3000

## Parent Runtime Action
- Action kind: codex-spawn-agent
- Native tool: spawn_agent
- Runtime bridge guidance: Render a spawn request artifact that the parent Codex runtime can execute with its spawn_agent tool.
- Parent runtime should call spawn_agent with the assignment below.
- Orchestra only rendered this request and recorded provenance.
- Call spawn_agent from the active Codex parent runtime with the prompt artifact as the child assignment.
- Prefer background execution and avoid waiting unless the next parent step is blocked.
- Record spawned and terminal lifecycle states with the returned agent id.
- Spawn lifecycle: orchestra runtime spawn-lifecycle --session ableton-ssd-multi-output-workflow-20260817:wfrun-1787002057777-44ad19:developer:codex-cli --status spawned --agent-id <agent-id>
- Complete lifecycle: orchestra runtime spawn-lifecycle --session ableton-ssd-multi-output-workflow-20260817:wfrun-1787002057777-44ad19:developer:codex-cli --status completed --agent-id <agent-id> --artifact .agent-workflow/handoffs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-developer-developer-runtime-handoff.md
- Failure lifecycle: orchestra runtime spawn-lifecycle --session ableton-ssd-multi-output-workflow-20260817:wfrun-1787002057777-44ad19:developer:codex-cli --status failed --agent-id <agent-id> --summary "<safe failure summary>"
- Parent should return control immediately after launching or recording the request.
- Parent should reconcile completion through lifecycle notification or explicit later polling.

## Assignment
- Ownership paths: src, bridge, ableton_remote_scripts/AbletonMcpBridge, test, docs, package.json
- Delegation intent: execute
- Allowed commands: bash(orchestra *), npm run format, npm run build, npm run precommit
- Expected artifacts: code diff, test evidence, handoff notes
- Prompt artifact: .agent-workflow/runs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-developer-runtime-codex-cli-spawn-prompt.md
- Context manifest artifact: .agent-workflow/runs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-developer-runtime-codex-cli-context-manifest.json
- Expected result artifact: .agent-workflow/handoffs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-developer-developer-runtime-handoff.md

## Scoped CLI Capabilities

- Guidance: if an official Orchestra command applies, use the exposed capability and structured argv array before creating ad hoc scripts.
- Command construction contract: pass executable and args as separate argv entries; do not build shell strings with interpolation.

### Exposed

- architect-diagram-lint
  - commandId: diagrams-lint
  - executable: orchestra
  - argsTemplate: ["diagrams","lint","--file","<file>","--task","<task-id>","--json"]
  - purpose: Validate Mermaid architecture, workflow, and sequence diagrams before handoff.
  - allowedRoles: architect, developer, technical_writer
  - requiredContext: diagram artifact path, task id when recording evidence
  - outputContract: JSON lint result with validity, diagnostics, optional install hint, and evidence metadata when task is supplied.
  - evidenceType: command
  - riskLevel: low
  - approvalPolicy: none
  - reason: exposed: role allowed and phase matches
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
  - reason: exposed: role allowed and phase matches

### Omitted

- architect-diagram-generate (diagrams-generate): omitted: role developer is not allowed
- release-check (release-check): omitted: no matching phase or task signal for developer
- release-readiness (release-readiness): omitted: role developer is not allowed
- release-benchmark-task (benchmark-task): omitted: role developer is not allowed

## Required Context Files

- .agent-workflow/playbooks/developer.md
  - source: phase-playbook
  - loadMode: full
  - required: true
  - sha256: 798c0085166cffe851bdd45305f25e918dbcf21582ee09de8fdb1c4ee066acc5
  - reason: Required developer phase playbook for developer runtime work.
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
  - reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.
- rules/development-engineering.mdc
  - source: rule
  - loadMode: excerpt
  - required: true
  - sha256: 9d774d70cd61c71590fd24143b776012a381c6041a60ab6523ceba74969f2b90
  - reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.
- rules/dry-clean-code.mdc
  - source: rule
  - loadMode: full
  - required: true
  - sha256: 72ca6b2c89b8254cc8c8d02733e6c2810508a90687b9eed7bf0cb4052093c68d
  - reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.
- rules/module-boundaries.mdc
  - source: rule
  - loadMode: full
  - required: true
  - sha256: f39eeb5e20d6b8c990d60890a19efaaf2a019914f488a519ff12a38b28eeb9dd
  - reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.
- rules/testing-discipline.mdc
  - source: rule
  - loadMode: excerpt
  - required: true
  - sha256: d98d4409fb1eceb2dbffdd5d51b473d86514cb09473d360fc7a1aa8b3f4200b3
  - reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.

## Generated Context Pack

- unavailable: context pack requires a fresh context index: context index has not been built

## Preprocessed Runtime Context

- config.maxLinesPerFile: 80
- config.totalLineBudget: 360
- original: 279 lines / 14047 bytes
- final: 289 lines / 14771 bytes
- omittedContentWarning: One or more context files were reduced; cite source paths when full files are needed.

### .agent-workflow/playbooks/developer.md

- sourcePath: .agent-workflow/playbooks/developer.md
- strategy: passthrough
- originalSize: 12 lines / 1292 bytes
- finalSize: 12 lines / 1292 bytes
- omittedContentWarning: none
- reason: Required developer phase playbook for developer runtime work.

```
# Developer Playbook

- Implement the smallest coherent change that satisfies acceptance criteria.
- Keep business logic typed, tested, and close to existing patterns.
- Include changed-file traceability: every changed file must map to task paths or call out explicit user-approved scope expansion.
- Include a simplicity review that states why the diff is surgical and whether unrelated cleanup, speculative abstractions, broad rewrites, or avoidable new surfaces were introduced.
- Include a goal-to-verification map that links each acceptance criterion or changed behavior to executed evidence, reproduction evidence, equivalence evidence, or an explicit deferred validation with owner and rationale.
- Always include `Architectural Concerns (inherited)` for upstream design drift; write `None` when empty.
- Always include `Architectural Concerns (self-imposed)` for new abstractions, files, metadata, APIs, config, scripts, or workflow changes; write `None` when empty.
- For every self-imposed concern, explain why existing project patterns or a simpler alternative are insufficient.
- Carry architectural concern findings in structured output as `architecturalConcerns.inherited` and `architecturalConcerns.selfImposed`.
- Record evidence, changed files, known gaps, and handoff notes.
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
- reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.

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

### rules/development-engineering.mdc

- sourcePath: rules/development-engineering.mdc
- strategy: passthrough
- originalSize: 21 lines / 1600 bytes
- finalSize: 21 lines / 1600 bytes
- omittedContentWarning: none
- reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.

```
---
description: Stack-agnostic developer implementation standards across common application stacks
alwaysApply: true
---

# Development Engineering

Developer work must start from the existing project shape, preserve the local architecture, and leave verifiable evidence that the changed production artifact works.

## Project Context First
- Read the project manifest, build files, framework config, and existing module boundaries before generating code.
- Infer naming, layering, dependency direction, error style, logging style, and test conventions from nearby code.
- Do not introduce a new framework pattern, repository style, package layout, or dependency injection approach without a recorded architecture decision.
- Keep framework-specific adapters at the boundary. Domain and service code should remain portable where the product permits it.
- Before writing to an existing file, run a module-boundary check: current file size, responsibility, exported surface, and whether the new behavior belongs in domain, model, service, repository, or adapter code.
- Do not increase god-file risk. If a file is already large, multi-purpose, or adapter-shaped, prefer adding a focused module and wiring it from the existing entry point instead of adding more logic.

## Entry Points And Layers
- Controllers, routes, commands, triggers, handlers, jobs, and webhooks must stay thin.
- Delegate business rules to services or domain modules, and delegate I/O to repositories, clients, gateways, or data-access modules.
- Keep request parsing, authorization, validation, orchestration, and persistence r
```

### rules/dry-clean-code.mdc

- sourcePath: rules/dry-clean-code.mdc
- strategy: passthrough
- originalSize: 31 lines / 1870 bytes
- finalSize: 31 lines / 1870 bytes
- omittedContentWarning: none
- reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.

```
---
description: DRY, naming, and clean code standards — stack-agnostic
alwaysApply: true
---

# DRY & Clean Code

## Don't Repeat Yourself
- **Single Source of Truth for data.** If a constant, type, or config exists in one place, every consumer must import or derive from it — never copy-paste.
- When work touches repeated collections, option sets, fixtures, matrices, or collection-processing complexity, load the `collection-standards` skill instead of embedding detailed collection rules here.
- When two blocks share >5 lines of identical structure, extract a reusable function.
- Cross-package type sharing: define once, import at build time, or add a sync test. Never maintain parallel copies.

## Naming
- Names must reveal intent. `processData()` is vague — `validateOrderItems()` is clear.
- Booleans: prefix with `is`, `has`, `can`, `should` (e.g., `isValid`, `hasPermission`).
- Functions that return a value: name by what they return. Functions that perform actions: name by the action.
- No abbreviations except universally known ones (`id`, `url`, `db`, `config`).

## Magic Values
- No hardcoded timeouts, CLI commands, path segments, or error messages scattered in code. Define named constants at module scope or in a shared constants file.
- Repeated inline styles or CSS values must be extracted to variables or design tokens.

## Dead Code
- Never commit commented-out code, `console.log` debris, or unused imports. Delete them — git preserves history.
- Never commit `eslint-disable`, `@SuppressWarnings`, or `// @ts-ignore` without a linked issue explaining why.

## Comments
- Code should be self-documenting. Comments explain **why**, not **what**.
- Delete obvious comments: `// increment counter`, `// return result`, `// handle error`.
- Acceptable: non-obvious business rules, performance trade-offs, workarounds with linked tickets.
```

### rules/module-boundaries.mdc

- sourcePath: rules/module-boundaries.mdc
- strategy: passthrough
- originalSize: 71 lines / 2932 bytes
- finalSize: 71 lines / 2932 bytes
- omittedContentWarning: none
- reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.

```
---
description: Module boundaries, god-file prevention, and thin adapter standards
alwaysApply: true
---

# Module Boundaries

Every code change must preserve clear ownership boundaries. Before adding code
to an existing file, check whether the file is already large, multi-purpose, or
adapter-shaped. If the change would make the file harder to review, create or
reuse the correct domain, model, service, repository, or adapter module instead.

## Pre-Write Check

- Inspect the target file's current responsibility, exported surface, and size
  before editing.
- Treat files over 300 lines, functions over 30 lines, and command/controller
  files with business logic as god-file risk.
- A large existing file is not a reason to keep adding to it. If the new change
  is separable, extract the new behavior into a focused module and wire it from
  the existing entry point.
- If extraction is unsafe in the current task, record a follow-up debt task with
  the reason, affected file, and proposed boundary.

## Expected Layers

- `model` or `types`: narrow public data contracts, discriminated unions,
  schemas, and DTOs.
- `domain`: pure invariants, policy decisions, validation rules, state
  transitions, and calculations.
- `service` or `use-case`: orchestration of domain logic, repositories, clients,
  and side effects for one workflow.
- `repository`, `store`, or `gateway`: persistence, file I/O, network I/O, and
  external system adapters.
- `commands`: CLI adapter only. Parse arguments, call services, format output,
  and convert errors to user-safe messages.
- `web` or `api`: HTTP/UI adapter only. Parse requests, call services, serialize
  responses, and map errors.

## Logicless Commands

Command modules must remain nearly logicless. They may:

- parse flags and positional arguments;
- choose output format;
- call one service/use-case function;
- map expected errors to CLI messages and exit codes.

Command modules must not:

- own business rules or workflow policy;
- perform direct persistence when a repository/service should own it;
- contain repeated hardcoded registries, option lists, status sets, or provider
  matrices;
- implement complex loops, joins, retries, or batching;
- become the primary test target for domain behavior.

## Hardcoded Collections

Repeated hardcoded values must move to a typed source of truth. This applies to
roles, statuses, providers, commands, option lists, validators, selectors,
fixtures, CI matrices, and any key/value collection reused by more than one
consumer. Load `collection-standards` when this risk appears.

## Review Checklist

- Did the author check target file size and responsibility before writing?
- Did new logic land in the correct layer?
- Is the command/controller/route still a thin adapter?
- Are repeated hardcoded collections extracted to a typed source of truth?
- Is there a follow-up debt task when extraction was intentionally deferred?
```

### rules/testing-discipline.mdc

- sourcePath: rules/testing-discipline.mdc
- strategy: passthrough
- originalSize: 34 lines / 1616 bytes
- finalSize: 34 lines / 1616 bytes
- omittedContentWarning: none
- reason: Required developer rule selected from the neutral rule catalog for role-specific execution quality.

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

### ableton_remote_scripts/AbletonMcpBridge

- sourcePath: ableton_remote_scripts/AbletonMcpBridge
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 173 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: ableton_remote_scripts/AbletonMcpBridge
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

### package.json

- sourcePath: package.json
- strategy: passthrough
- originalSize: 59 lines / 1737 bytes
- finalSize: 59 lines / 1736 bytes
- omittedContentWarning: none
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
{
  "name": "@jterrats/ableton-live-mcp",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "description": "Local MCP stdio server for controlling Ableton Live through a local bridge.",
  "author": "Jaime Terrats",
  "keywords": [
    "ableton-live",
    "daw",
    "mcp",
    "model-context-protocol",
    "music-production"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jterratsdev/ableton-live-mcp.git"
  },
  "homepage": "https://ableton-mcp.jterrats.dev",
  "bugs": {
    "url": "https://github.com/jterratsdev/ableton-live-mcp/issues"
  },
  "publishConfig": {
    "access": "public"
  },
  "bin": {
    "ableton-live-mcp": "./src/cli.js"
  },
  "files": [
    "ableton_remote_scripts/",
    "bridge/",
    "docs/",
    "scripts/install-ableton-remote-script.sh",
    "src/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "bridge": "node src/cli.js bridge",
    "check:package": "node scripts/check-package-release.mjs",
    "check:site": "node scripts/check-site.mjs",
    "doctor": "node src/cli.js doctor",
    "doctor:test": "node scripts/check-doctor-diagnostics.mjs",
    "install:ableton-remote-script": "node src/cli.js install-remote-script",
    "prepack": "npm test",
    "start": "node src/cli.js",
    "smoke": "node test/smoke.mjs",
    "smoke:bridge": "node test/bridge-smoke-report.mjs",
    "smoke:live:readonly": "node test/live-smoke-readonly.mjs",
    "smoke:live:safe-write": "node test/live-smoke-safe-write.mjs",
    "smoke:live:contract": "node test/live-contract.mjs",
    "smoke:live:destructive": "node test/live-smoke-suite.mjs destructive",
    "test": "node test/deterministic.mjs"
  },
  "engines": {
    "node": ">=18"
  },
  "license": "MIT"
}
```


## Loaded Context Excerpts

### .agent-workflow/playbooks/developer.md

```md
# Developer Playbook

- Implement the smallest coherent change that satisfies acceptance criteria.
- Keep business logic typed, tested, and close to existing patterns.
- Include changed-file traceability: every changed file must map to task paths or call out explicit user-approved scope expansion.
- Include a simplicity review that states why the diff is surgical and whether unrelated cleanup, speculative abstractions, broad rewrites, or avoidable new surfaces were introduced.
- Include a goal-to-verification map that links each acceptance criterion or changed behavior to executed evidence, reproduction evidence, equivalence evidence, or an explicit deferred validation with owner and rationale.
- Always include `Architectural Concerns (inherited)` for upstream design drift; write `None` when empty.
- Always include `Architectural Concerns (self-imposed)` for new abstractions, files, metadata, APIs, config, scripts, or workflow changes; write `None` when empty.
- For every self-imposed concern, explain why existing project patterns or a simpler alternative are insufficient.
- Carry architectural concern findings in structured output as `architecturalConcerns.inherited` and `architecturalConcerns.selfImposed`.
- Record evidence, changed files, known gaps, and handoff notes.
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

### rules/development-engineering.mdc

```md
---
description: Stack-agnostic developer implementation standards across common application stacks
alwaysApply: true
---

# Development Engineering

Developer work must start from the existing project shape, preserve the local architecture, and leave verifiable evidence that the changed production artifact works.

## Project Context First
- Read the project manifest, build files, framework config, and existing module boundaries before generating code.
- Infer naming, layering, dependency direction, error style, logging style, and test conventions from nearby code.
- Do not introduce a new framework pattern, repository style, package layout, or dependency injection approach without a recorded architecture decision.
- Keep framework-specific adapters at the boundary. Domain and service code should remain portable where the product permits it.
- Before writing to an existing file, run a module-boundary check: current file size, responsibility, exported surface, and whether the new behavior belongs in domain, model, service, repository, or adapter code.
- Do not increase god-file risk. If a file is already large, multi-purpose, or adapter-shaped, prefer adding a focused module and wiring it from the existing entry point instead of adding more logic.

## Entry Points And Layers
- Controllers, routes, commands, triggers, handlers, jobs, and webhooks must stay thin.
- Delegate business rules to services or domain modules, and delegate I/O to repositories, clients, gateways, or data-access modules.
- Keep request parsing, authorization, validation, orchestration, and persistence r
```

### rules/dry-clean-code.mdc

```md
---
description: DRY, naming, and clean code standards — stack-agnostic
alwaysApply: true
---

# DRY & Clean Code

## Don't Repeat Yourself
- **Single Source of Truth for data.** If a constant, type, or config exists in one place, every consumer must import or derive from it — never copy-paste.
- When work touches repeated collections, option sets, fixtures, matrices, or collection-processing complexity, load the `collection-standards` skill instead of embedding detailed collection rules here.
- When two blocks share >5 lines of identical structure, extract a reusable function.
- Cross-package type sharing: define once, import at build time, or add a sync test. Never maintain parallel copies.

## Naming
- Names must reveal intent. `processData()` is vague — `validateOrderItems()` is clear.
- Booleans: prefix with `is`, `has`, `can`, `should` (e.g., `isValid`, `hasPermission`).
- Functions that return a value: name by what they return. Functions that perform actions: name by the action.
- No abbreviations except universally known ones (`id`, `url`, `db`, `config`).

## Magic Values
- No hardcoded timeouts, CLI commands, path segments, or error messages scattered in code. Define named constants at module scope or in a shared constants file.
- Repeated inline styles or CSS values must be extracted to variables or design tokens.

## Dead Code
- Never commit commented-out code, `console.log` debris, or unused imports. Delete them — git preserves history.
- Never commit `eslint-disable`, `@SuppressWarnings`, or `// @ts-ignore` without a linked issue explaining why.

## Comments
- Code should be self-documenting. Comments explain **why**, not **what**.
- Delete obvious comments: `// increment counter`, `// return result`, `// handle error`.
- Acceptable: non-obvious business rules, performance trade-offs, workarounds with linked tickets.
```

### rules/module-boundaries.mdc

```md
---
description: Module boundaries, god-file prevention, and thin adapter standards
alwaysApply: true
---

# Module Boundaries

Every code change must preserve clear ownership boundaries. Before adding code
to an existing file, check whether the file is already large, multi-purpose, or
adapter-shaped. If the change would make the file harder to review, create or
reuse the correct domain, model, service, repository, or adapter module instead.

## Pre-Write Check

- Inspect the target file's current responsibility, exported surface, and size
  before editing.
- Treat files over 300 lines, functions over 30 lines, and command/controller
  files with business logic as god-file risk.
- A large existing file is not a reason to keep adding to it. If the new change
  is separable, extract the new behavior into a focused module and wire it from
  the existing entry point.
- If extraction is unsafe in the current task, record a follow-up debt task with
  the reason, affected file, and proposed boundary.

## Expected Layers

- `model` or `types`: narrow public data contracts, discriminated unions,
  schemas, and DTOs.
- `domain`: pure invariants, policy decisions, validation rules, state
  transitions, and calculations.
- `service` or `use-case`: orchestration of domain logic, repositories, clients,
  and side effects for one workflow.
- `repository`, `store`, or `gateway`: persistence, file I/O, network I/O, and
  external system adapters.
- `commands`: CLI adapter only. Parse arguments, call services, format output,
  and convert errors to user-safe messages.
- `web` or `api`: HTTP/UI adapter only. Parse requests, call services, serialize
  responses, and map errors.

## Logicless Commands

Command modules must remain nearly logicless. They may:

- parse flags and positional arguments;
- choose output format;
- call one service/use-case function;
- map expected errors to CLI messages and exit codes.

Command modules must not:

- own business rules or workflow policy;
- perform direct persistence when a repository/service should own it;
- contain repeated hardcoded registries, option lists, status sets, or provider
  matrices;
- implement complex loops, joins, retries, or batching;
- become the primary test target for domain behavior.

## Hardcoded Collections

Repeated hardcoded values must move to a typed source of truth. This applies to
roles, statuses, providers, commands, option lists, validators, selectors,
fixtures, CI matrices, and any key/value collection reused by more than one
consumer. Load `collection-standards` when this risk appears.

## Review Checklist

- Did the author check target file size and responsibility before writing?
- Did new logic land in the correct layer?
- Is the command/controller/route still a thin adapter?
- Are repeated hardcoded collections extracted to a typed source of truth?
- Is there a follow-up debt task when extraction was intentionally deferred?
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


## Selected Skills
- collection-standards: eligible task roles: developer, qa; task text matches triggers: map, fixture, fixtures
- prompt-registry: eligible task roles: developer, qa; task text matches triggers: ui, docs; task touches files, so prompt registry can preserve artifact intent
- agent-learning: eligible task roles: developer, qa; task text matches triggers: failure, error
- source-of-truth: eligible task roles: developer, qa; task text matches triggers: source, docs
- audio-video-transcription: eligible task roles: qa, developer; task text matches triggers: audio
- oclif-plugin-development: eligible task roles: developer, qa; task text matches triggers: plugin
- playwright-evidence: eligible task roles: qa; task text matches triggers: ui
- pr-review: eligible task roles: qa; task text matches triggers: pr
- proactive-orchestra: eligible task roles: developer, qa; task text matches triggers: workflow
- static-analysis: eligible task roles: developer, qa; task text matches triggers: test
- release-readiness: task text matches triggers: deploy, rollback
- diagram-export: task text matches triggers: flow
- doc-sync: task text matches triggers: docs
- model-evaluation: task text matches triggers: routing

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
- context token estimate 7770 exceeds budget 3000

## Phase Playbook: developer

Source: .agent-workflow/playbooks/developer.md

# Developer Playbook

- Implement the smallest coherent change that satisfies acceptance criteria.
- Keep business logic typed, tested, and close to existing patterns.
- Include changed-file traceability: every changed file must map to task paths or call out explicit user-approved scope expansion.
- Include a simplicity review that states why the diff is surgical and whether unrelated cleanup, speculative abstractions, broad rewrites, or avoidable new surfaces were introduced.
- Include a goal-to-verification map that links each acceptance criterion or changed behavior to executed evidence, reproduction evidence, equivalence evidence, or an explicit deferred validation with owner and rationale.
- Always include `Architectural Concerns (inherited)` for upstream design drift; write `None` when empty.
- Always include `Architectural Concerns (self-imposed)` for new abstractions, files, metadata, APIs, config, scripts, or workflow changes; write `None` when empty.
- For every self-imposed concern, explain why existing project patterns or a simpler alternative are insufficient.
- Carry architectural concern findings in structured output as `architecturalConcerns.inherited` and `architecturalConcerns.selfImposed`.
- Record evidence, changed files, known gaps, and handoff notes.

## Tool Permission Policy
- Mode: runtime-managed
- Explicit opt-in required: false
- Read-only tools: none
- Write tools: none
- Shell tools: none
- Autonomous flags: none
- Gated flags: none
- Warning: Codex permission flags are managed by the active Codex CLI/session; Orchestra renders briefs and does not inject direct execution flags.