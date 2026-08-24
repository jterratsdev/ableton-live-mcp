# Runtime Child Prompt: ableton-capability-aware-tool-exposure-20260819

- Runtime: codex-cli
- Task id: ableton-capability-aware-tool-exposure-20260819
- Phase: po
- Role: product_owner
- Session id: ableton-capability-aware-tool-exposure-20260819:wfrun-1787181760099-a7f5ab:po:codex-cli
- Direct provider API calls: forbidden

## Goal
Make MCP tool discovery and workflow guidance accurately reflect the active bridge, hiding hard-unsupported Live actions while preserving MCP-owned local capabilities and explicitly labeling conditional behavior.

## Acceptance Criteria
- A Remote Script capability response reports the active bridge mode and a support status plus reason for every mapped HTTP route, and its route set is checked against the Node registry.
- When tools/list runs against a Remote Script capability fixture, tools backed only by unsupported routes are absent while MCP-owned local MIDI import, rendered-file analysis, diagnostics, risk tools, and supported routes remain present.
- When tools/list runs against the deterministic development bridge, development-supported render, bounce, automation, reorder, consolidation, and mastering tools remain present; an unavailable or malformed capability handshake produces a conservative deterministic list without claiming unsupported Live writes.
- Conditional tools remain discoverable only with explicit capability language and target-level probes where available; snapshot, plugin inventory, plugin parameter, mastering target, meter, locator, and Arrangement descriptions state their observable limits.
- High-level workflow plans returned through MCP omit unsupported steps or mark them blocked with the exact capability reason, and no Remote Script workflow recommends render, bounce, automation, device reorder, or consolidation as executable.
- Focused Node and Python contract tests, registry parity/static checks, py_compile, npm test, and git diff --check exit 0 without contacting the active bridge or mutating a Live Set.

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

### Omitted

- architect-diagram-generate (diagrams-generate): omitted: role product_owner is not allowed
- architect-diagram-lint (diagrams-lint): omitted: role product_owner is not allowed
- qa-playwright-plan (playwright-plan): omitted: role product_owner is not allowed
- qa-evidence-check (qa-evidence-check): omitted: role product_owner is not allowed
- qa-playwright-evidence (playwright-evidence): omitted: role product_owner is not allowed
- release-check (release-check): omitted: role product_owner is not allowed
- release-readiness (release-readiness): omitted: role product_owner is not allowed
- release-benchmark-task (benchmark-task): omitted: role product_owner is not allowed

## Context Loading Policy
- Use the Preprocessed Runtime Context bundle by default.
- Cite full source paths from the bundle when deeper inspection is required; do not load raw files unless the reduced bundle is insufficient for the assigned work.
- Preserve omitted content warnings in the handoff when they affect confidence or verification scope.

## Required Context Files

- .agent-workflow/playbooks/po.md
  - source: phase-playbook
  - loadMode: full
  - required: true
  - sha256: 0cb898fe6258233aed77ae372cf59a22dc9f8ac0466ca413d89c05ca70fe013f
  - reason: Required po phase playbook for product_owner runtime work.
- AGENTS.md
  - source: runtime-instructions
  - loadMode: excerpt
  - required: true
  - sha256: ca348a8005c76d48ca2a6313695f83db573e73d71cc15e12e3054bcf8aa76882
  - reason: Required root runtime instructions for project-wide agent behavior.

## Generated Context Pack

- unavailable: context pack requires a fresh context index: context index has not been built

## Preprocessed Runtime Context

- config.maxLinesPerFile: 80
- config.totalLineBudget: 360
- original: 31 lines / 2253 bytes
- final: 41 lines / 2978 bytes
- omittedContentWarning: One or more context files were reduced; cite source paths when full files are needed.

### .agent-workflow/playbooks/po.md

- sourcePath: .agent-workflow/playbooks/po.md
- strategy: passthrough
- originalSize: 8 lines / 651 bytes
- finalSize: 8 lines / 651 bytes
- omittedContentWarning: none
- reason: Required po phase playbook for product_owner runtime work.

```
# PO Playbook

- Refine acceptance criteria into testable outcomes.
- State assumptions, non-goals, ambiguity, competing interpretations, tradeoffs, and concrete success criteria before architecture starts.
- Check whether the task is functionally oversized: multiple journeys, unrelated outcomes, too many acceptance criteria, or hidden release/support scope.
- If scope is too large, record a split recommendation with rationale, proposed child stories, dependencies, risks, and owner roles before architecture starts.
- Confirm backlog item ID, dependencies, assumptions, and edge cases.
- Clarify what is out of scope before implementation starts.
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

### .agent-workflow/playbooks/po.md

```md
# PO Playbook

- Refine acceptance criteria into testable outcomes.
- State assumptions, non-goals, ambiguity, competing interpretations, tradeoffs, and concrete success criteria before architecture starts.
- Check whether the task is functionally oversized: multiple journeys, unrelated outcomes, too many acceptance criteria, or hidden release/support scope.
- If scope is too large, record a split recommendation with rationale, proposed child stories, dependencies, risks, and owner roles before architecture starts.
- Confirm backlog item ID, dependencies, assumptions, and edge cases.
- Clarify what is out of scope before implementation starts.
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


## Primary Skill Context
### Collection Standards
- ID: collection-standards
- Entry: skills/collection-standards/SKILL.md
- Load budget: small
- Rationale: eligible task roles: developer, qa; task text matches triggers: map, fixture, fixtures; risk areas match: sre
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
- Rationale: eligible task roles: architect, developer, qa; task text matches triggers: documentation, docs, truth
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

### Doc Sync
- ID: doc-sync
- Entry: skills/doc-sync/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: architect, product_owner; task text matches triggers: documentation, docs
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

### Chaos Resilience Testing
- ID: chaos-resilience-testing
- Entry: skills/chaos-resilience-testing/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: qa, architect, developer; risk areas match: sre
- Instructions:
  - Classify each failure as fail-closed, degrade-with-recovery, or bounded-retry before implementation.
  - Use deterministic stubs, fake providers, fixture corruption, injected stores, and bounded timeout simulation instead of random production-style fault injection for MVP validation.
  - Cover relevant failures: provider/API unavailable, corrupted state, stale reads, approval races, budget exhaustion, policy failure, audit write failure, offline mode, and tenant or regulatory boundary enforcement.
  - Capture observable evidence for final state, emitted events, user/operator messages, skipped activation, blocked gates, and recovery paths mapped to acceptance criteria.
  - Treat security, compliance, tenant isolation, approvals, regulated authority, secrets, and payment failures as fail-closed unless Product/Security/Compliance explicitly accept the risk.
- Evidence:
  - command
  - file
  - log
  - report
  - trace

### Diagram Export
- ID: diagram-export
- Entry: skills/diagram-export/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: architect; task text matches triggers: flow
- Instructions:
  - Identify the diagram purpose and authoritative architecture sources before drawing.
  - Choose the diagram style from the decision matrix before drafting.
  - Prefer text-native diagrams such as Mermaid unless the project requires another format.
  - Run orchestra diagrams lint --file <diagram.mmd> before sharing Mermaid diagrams.
  - Attach lint evidence to the workflow when the diagram supports delivery.
- Evidence:
  - file
  - report

### Oclif Plugin Development
- ID: oclif-plugin-development
- Entry: skills/oclif-plugin-development/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: developer, architect, qa; task text matches triggers: plugin
- Instructions:
  - Keep oclif command modules logicless: parse flags and args, call one service or use-case, format output, and map expected errors to user-safe messages.
  - Define plugin id, commands, hooks, capabilities, permissions, configuration schema, UI contributions, evidence expectations, host compatibility, and security constraints before implementation.
  - Use typed manifests and registries instead of hardcoded command or hook lists; load collection-standards when plugin work repeats command matrices, roles, statuses, fixtures, selectors, or validators.
  - Validate CLI plugins with exit code, stdout, stderr, JSON contract, help output, hook invocation, generated files, install/link/package smoke, and Playwright evidence when UI is involved.
  - Review plugin security for shell args arrays, path traversal, URL validation, secrets, dependency risk, least privilege permissions, and untrusted plugin boundaries.
- Evidence:
  - command
  - file
  - report
  - screenshot
  - trace

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

### Proactive Orchestra
- ID: proactive-orchestra
- Entry: skills/proactive-orchestra/SKILL.md
- Load budget: small
- Rationale: eligible task roles: architect, developer, qa; task text matches triggers: workflow
- Instructions:
  - Start with health and task list before implementation when .agent-workflow exists.
  - Run pre-run validation before coding and resolve missing estimate, workflow, evidence, or review checks.
  - Record user-accepted deviations as decisions instead of silently skipping workflow steps.
- Evidence:
  - command
  - report
  - file

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
- Rationale: risk areas match: sre
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
- Missing evidence: command

Steps:
- Implement, unit test, validate, and hand off to QA.

## Phase Playbook: po

Source: .agent-workflow/playbooks/po.md

# PO Playbook

- Refine acceptance criteria into testable outcomes.
- State assumptions, non-goals, ambiguity, competing interpretations, tradeoffs, and concrete success criteria before architecture starts.
- Check whether the task is functionally oversized: multiple journeys, unrelated outcomes, too many acceptance criteria, or hidden release/support scope.
- If scope is too large, record a split recommendation with rationale, proposed child stories, dependencies, risks, and owner roles before architecture starts.
- Confirm backlog item ID, dependencies, assumptions, and edge cases.
- Clarify what is out of scope before implementation starts.

## Return Contract
- Write or summarize result evidence for .agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787181760099-a7f5ab-po-product_owner-runtime-handoff.md.
- Start the result artifact with these exact metadata lines:
  - Task id: ableton-capability-aware-tool-exposure-20260819
  - Phase: po
  - Role: product_owner
  - Runtime: codex-cli
  - Session id: ableton-capability-aware-tool-exposure-20260819:wfrun-1787181760099-a7f5ab:po:codex-cli
- Include touched files, commands run, pass/fail result, risks, and close status.
- Include a `Consumed Context Files` section listing required files read, applied rules, and required rules that were not applicable with reasons.
- Include a `Test Scenarios and Expected Results` section with the target surface or environment (cloud, database, CLI, API, web app, mobile app, desktop app, workflow/runtime, integration, generated artifact, or local sandbox), the expected observable result for each scenario, and how the result was obtained.
- Critically state whether the produced evidence satisfies each acceptance criterion; mark gaps, weak evidence, or environment limitations as release-blocking unless the Product Owner explicitly accepts the risk.
- If a required context file was missing or not used, mark the handoff as changes/block with concrete impact.

## Lifecycle Self-Report
- After writing .agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787181760099-a7f5ab-po-product_owner-runtime-handoff.md, run: orchestra runtime spawn-lifecycle --session ableton-capability-aware-tool-exposure-20260819:wfrun-1787181760099-a7f5ab:po:codex-cli --status completed --agent-id codex-cli:child --artifact .agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787181760099-a7f5ab-po-product_owner-runtime-handoff.md
- If blocked or failed before completion, run: orchestra runtime spawn-lifecycle --session ableton-capability-aware-tool-exposure-20260819:wfrun-1787181760099-a7f5ab:po:codex-cli --status failed --agent-id codex-cli:child --summary "<safe failure summary>"
- If this runtime cannot execute shell commands, include the exact lifecycle command in the final runtime notification so the parent or watcher can reconcile it.