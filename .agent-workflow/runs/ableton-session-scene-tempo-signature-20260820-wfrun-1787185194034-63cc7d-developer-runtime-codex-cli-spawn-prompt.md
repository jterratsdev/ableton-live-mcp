# Runtime Child Prompt: ableton-session-scene-tempo-signature-20260820

- Runtime: codex-cli
- Task id: ableton-session-scene-tempo-signature-20260820
- Phase: developer
- Role: developer
- Session id: ableton-session-scene-tempo-signature-20260820:wfrun-1787185194034-63cc7d:developer:codex-cli
- Direct provider API calls: forbidden

## Goal
Expose capability-gated MCP operations for reading and safely setting or clearing per-scene tempo and time-signature overrides in Ableton Session View, without claiming Arrangement timeline automation.

## Acceptance Criteria
- AC1. For a required zero-based sceneIndex, a read-only capability call returns exact target metadata {sceneIndex,name} and separate {readable,writable,reason} results for Scene.tempo, Scene.tempo_enabled, the composite time signature value (with component detail for Scene.time_signature_numerator and Scene.time_signature_denominator), and Scene.time_signature_enabled; it performs no setter call, and any absent, descriptor-incompatible, or exception-raising probe is unavailable with a non-empty reason rather than inferred from Live edition.
- AC2. The mutation input accepts only an exact existing integer sceneIndex plus at least one of tempo or timeSignature; each family is a tagged action: tempo is {action:set,bpm} or {action:clear}, and timeSignature is {action:set,numerator,denominator} or {action:clear}. It rejects negative, fractional, stale/out-of-range indexes, fuzzy/name-only targeting, unknown actions, clear actions carrying values, non-finite or out-of-range BPM outside inclusive 20..999, numerator outside integer 1..32, and denominators outside 1,2,4,8,16,32 before any write.
- AC3. The index is the authoritative Session-scene identity for the serialized request: resolution is exactly song.scenes[sceneIndex], duplicate or empty names are allowed, names are descriptive only, and every post-write or rollback readback reacquires song.scenes[sceneIndex] so recreated proxy objects succeed while a missing or structurally changed target fails verification; no other scene, global Song tempo/signature, clip, transport, or launch state is touched.
- AC4. Preflight reads one complete observable target snapshot and verifies all operation-required capabilities before any write. Set tempo requires readable/writable tempo and tempo_enabled; clear tempo requires readable tempo plus readable/writable tempo_enabled. Set signature requires readable/writable numerator, denominator, and time_signature_enabled; clear signature requires readable numerator and denominator plus readable/writable time_signature_enabled. A combined request fails closed as a whole when either requested family is unsupported, including idempotent requests.
- AC5. Set writes value before enable: tempo then tempo_enabled=true; signature numerator, denominator, then time_signature_enabled=true; a combined request applies tempo family then signature family. Clear writes only the corresponding enable=false and never overwrites a hidden retained value. Already-equal requests may skip physical setters but still run full preflight and fresh readback. Success is returned only after fresh-proxy readback exactly observes enabled=true and requested values for set, or enabled=false with Live sentinel -1 values normalized as null while preserving the exact raw observations for clear.
- AC6. The operation is atomic across all requested fields: on any setter exception, target re-resolution failure, readback exception, or value/enable mismatch, it rolls back every field actually written in reverse transaction order toward the complete pre-mutation observable snapshot, reacquires the scene, and verifies the full target fingerprint and all readable tempo/signature fields. The error reports the original failure, rollback attempted/succeeded, any rollback failures, and final observed state; it never reports success after failed verification. Disabled pre-state is restored by disabling the family and verifying its -1 sentinels because Live does not expose the hidden retained value.
- AC7. The response returns target {sceneIndex,name}, requested actions, exact normalized and raw observed tempo/signature values and enable states, changed/no-op status, and capability details. The scene mutation tool is listed only when the active bridge handshake truthfully supports its route; deterministic development fixtures expose equivalent behavior, while absent, malformed, or unreachable capability handshakes fail closed.
- AC8. Tool copy and authoritative docs state that these overrides take effect only when the Session scene is later launched by the user or another explicit launch operation; this operation itself never launches a scene and never creates, edits, or promises Arrangement tempo envelopes, Arrangement time-signature markers, or global Song fallback writes.
- AC9. Offline Node and Python fake-Live tests assert full and partial capability matrices, missing/raising properties, validation with zero setter calls, duplicate scene names and exact indexes, set/combined set/idempotency, clear/disable sentinels, mid-sequence failure rollback, rollback failure reporting, recreated-proxy readback, readback mismatch rollback, route/tool registry parity, malformed handshake fail-closed behavior, py_compile, focused MCP-to-HTTP behavior, npm test, and git diff --check without contacting the active bridge or mutating a Live Set.

## Ownership Paths
- src
- bridge
- ableton_remote_scripts/AbletonMcpBridge
- docs
- test

## Delegation Intent
- Intent: execute

## Allowed Commands
- bash(orchestra *)
- npm run format
- npm run build
- npm run precommit

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
  - reason: exposed: role allowed and phase matches
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

## Context Loading Policy
- Use the Preprocessed Runtime Context bundle by default.
- Cite full source paths from the bundle when deeper inspection is required; do not load raw files unless the reduced bundle is insufficient for the assigned work.
- Preserve omitted content warnings in the handoff when they affect confidence or verification scope.

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
- original: 220 lines / 12310 bytes
- final: 230 lines / 13035 bytes
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


## Primary Skill Context
### Agent Learning
- ID: agent-learning
- Entry: skills/agent-learning/SKILL.md
- Load budget: small
- Rationale: eligible task roles: developer, qa; task text matches triggers: failure, failed, error
- Instructions:
  - Search relevant lessons before repeating risky operations.
  - After reusable failures, record operation, error signature, root cause, fix, prevention, and verification.
  - Promote repeated lessons into versioned skills or rules after review.
- Evidence:
  - file

### Collection Standards
- ID: collection-standards
- Entry: skills/collection-standards/SKILL.md
- Load budget: small
- Rationale: eligible task roles: developer, qa; task text matches triggers: fixture, fixtures, matrices
- Instructions:
  - If the same collection, mapping, option list, fixture set, command matrix, provider list, role/status list, selector list, or validator set appears in more than one place, replace duplicates with a typed source of truth.
  - Choose the smallest source-of-truth shape that fits the codebase: exported constant, enum-like union, registry, builder, factory, fixture helper, page object, or config-derived adapter.
  - Derive arrays, maps, dropdown options, validators, test fixtures, script arguments, CI matrices, and docs/examples from that source instead of maintaining parallel hardcoded lists.
  - For joins, lookups, assertions, log scans, API payload checks, and command matrices, prefer O(n) or bounded processing by building lookup maps or indexes once; avoid nested scans, repeated full-list filters, N+1 calls, and unbounded synchronous work.
  - If higher complexity is intentional, document the input bound or measured trade-off and include regression evidence with representative multi-item data.
- Evidence:
  - file
  - command
  - report

### Source of Truth
- ID: source-of-truth
- Entry: skills/source-of-truth/SKILL.md
- Load budget: small
- Rationale: eligible task roles: architect, developer, qa; task text matches triggers: docs, verify, truth
- Instructions:
  - Select source groups before acting and load only sources relevant to the task.
  - Prefer local project sources first and official vendor docs for current APIs or tools.
  - If sources conflict, record the conflict as a blocker or decision.
- Evidence:
  - file
  - report

### Prompt Registry
- ID: prompt-registry
- Entry: skills/prompt-registry/SKILL.md
- Load budget: small
- Rationale: eligible task roles: developer, qa; task text matches triggers: ui, docs; task touches files, so prompt registry can preserve artifact intent
- Instructions:
  - Before substantial generation, read the relevant .generated-prompts register.
  - After substantial changes, update one entry with task, role, decisions, evidence, and prompt summary.
  - Do not update the register for typo-only, formatting-only, or single-line mechanical fixes.
- Evidence:
  - file

### PR Review
- ID: pr-review
- Entry: skills/pr-review/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: qa, architect; task text matches triggers: pr, diff
- Instructions:
  - Review behavior, tests, risks, rollout, rollback, and missing evidence before summaries.
  - Lead with findings and blockers, then summarize changes.
  - Reference local files, task context, reviews, and evidence rather than generated claims.
- Evidence:
  - file
  - report

### Diagram Export
- ID: diagram-export
- Entry: skills/diagram-export/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: architect; task text matches triggers: sequence
- Instructions:
  - Identify the diagram purpose and authoritative architecture sources before drawing.
  - Choose the diagram style from the decision matrix before drafting.
  - Prefer text-native diagrams such as Mermaid unless the project requires another format.
  - Run orchestra diagrams lint --file <diagram.mmd> before sharing Mermaid diagrams.
  - Attach lint evidence to the workflow when the diagram supports delivery.
- Evidence:
  - file
  - report

### Doc Sync
- ID: doc-sync
- Entry: skills/doc-sync/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: architect, product_owner; task text matches triggers: docs
- Instructions:
  - Identify changed behavior, architecture, release surface, workflows, commands, and user-facing copy from the task, issue, diff, and evidence.
  - Update the smallest authoritative documentation surfaces for the audience: README, CHANGELOG, docs, prompt registers, and public site.
  - Update .generated-prompts/code.md or .generated-prompts/services.md after substantial class, model, service, controller, or module changes.
  - Update .generated-prompts/docs.md or .generated-prompts/diagrams.md after substantial docs, architecture, ADR, runbook, changelog, or Mermaid changes.
  - Run `orchestra doc-sync audit --task <id>` before handoff to detect missing documentation prompt registry entries and lesson capture opportunities.
  - Validate command examples against the command manifest, help output, or repo-local CLI before publishing documentation.
- Evidence:
  - file
  - report
  - command

### Model Evaluation
- ID: model-evaluation
- Entry: skills/model-evaluation/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: architect; task text matches triggers: fallback
- Instructions:
  - Define eval objectives, cases, rubric, and expected behavior before changing prompts or routing.
  - Compare model/provider behavior for material changes and record disagreements.
  - Avoid storing raw sensitive prompts or responses in provenance artifacts.
- Evidence:
  - report
  - file

### Playwright Evidence
- ID: playwright-evidence
- Entry: skills/playwright-evidence/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: qa; task text matches triggers: ui
- Instructions:
  - Plan user-value scenarios from acceptance criteria before writing tests.
  - Use resilient locators and page objects for repeated flows.
  - Attach screenshots, traces, videos, or reports as evidence for release decisions.
- Evidence:
  - screenshot
  - trace
  - video
  - report

### Static Analysis
- ID: static-analysis
- Entry: skills/static-analysis/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: developer, qa; task text matches triggers: test
- Instructions:
  - Inspect configured local checks before inventing commands.
  - Run the smallest relevant check first, then the full gate before handoff or commit.
  - Record command evidence and treat failed required checks as blockers unless explicitly deferred.
- Evidence:
  - command
  - report

### Release Readiness
- ID: release-readiness
- Entry: skills/release-readiness/SKILL.md
- Load budget: normal
- Rationale: task text matches triggers: rollback
- Instructions:
  - Validate gates, evidence, locks, reviews, rollback, observability, and support readiness.
  - Treat missing rollback or unresolved critical QA/security/SRE findings as blockers.
  - Record release evidence and accepted residual risks explicitly.
- Evidence:
  - command
  - report
  - file


## Workflow Template Guidance

### Implementation

Implement a scoped code change with unit tests and review handoff.

- Roles: developer, tech_lead, qa
- Inputs: goal, scope, acceptance criteria, changed paths
- Outputs: code diff, unit tests, developer handoff
- Evidence: command, file
- Gates: architecture, qa-release
- Missing evidence: none

Steps:
- Implement, unit test, validate, and hand off to QA.

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

## Return Contract
- Write or summarize result evidence for .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787185194034-63cc7d-developer-developer-runtime-handoff.md.
- Start the result artifact with these exact metadata lines:
  - Task id: ableton-session-scene-tempo-signature-20260820
  - Phase: developer
  - Role: developer
  - Runtime: codex-cli
  - Session id: ableton-session-scene-tempo-signature-20260820:wfrun-1787185194034-63cc7d:developer:codex-cli
- Include touched files, commands run, pass/fail result, risks, and close status.
- Include a `Consumed Context Files` section listing required files read, applied rules, and required rules that were not applicable with reasons.
- Include a `Test Scenarios and Expected Results` section with the target surface or environment (cloud, database, CLI, API, web app, mobile app, desktop app, workflow/runtime, integration, generated artifact, or local sandbox), the expected observable result for each scenario, and how the result was obtained.
- Critically state whether the produced evidence satisfies each acceptance criterion; mark gaps, weak evidence, or environment limitations as release-blocking unless the Product Owner explicitly accepts the risk.
- If a required context file was missing or not used, mark the handoff as changes/block with concrete impact.

## Lifecycle Self-Report
- After writing .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787185194034-63cc7d-developer-developer-runtime-handoff.md, run: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787185194034-63cc7d:developer:codex-cli --status completed --agent-id codex-cli:child --artifact .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787185194034-63cc7d-developer-developer-runtime-handoff.md
- If blocked or failed before completion, run: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787185194034-63cc7d:developer:codex-cli --status failed --agent-id codex-cli:child --summary "<safe failure summary>"
- If this runtime cannot execute shell commands, include the exact lifecycle command in the final runtime notification so the parent or watcher can reconcile it.