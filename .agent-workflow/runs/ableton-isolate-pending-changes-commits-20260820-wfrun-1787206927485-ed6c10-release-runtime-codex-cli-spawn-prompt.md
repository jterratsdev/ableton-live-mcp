# Runtime Child Prompt: ableton-isolate-pending-changes-commits-20260820

- Runtime: codex-cli
- Task id: ableton-isolate-pending-changes-commits-20260820
- Phase: release
- Role: release_manager
- Session id: ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli
- Direct provider API calls: forbidden

## Goal
Audit the shared dirty worktree, map product changes to completed task evidence, create coherent non-overlapping local commits for verified changes, and report every intentionally uncommitted item without pushing, tagging, publishing, installing, or touching Live.

## Acceptance Criteria
- Every tracked and untracked worktree path is classified as a verified feature/fix, workflow evidence, disposable/local artifact, ambiguous user change, or unrelated deferred work before staging.
- Commits are organized by coherent reviewed feature boundaries and contain only files or hunks traceable to their task handoffs and test evidence; ambiguous files and disposable Ableton Sets remain uncommitted and unmodified.
- The deletion of live_project.py, the untracked qa path, test Project directory, generated workflow artifacts, and overlapping shared entrypoint hunks receive explicit disposition evidence before any related staging.
- Relevant focused tests and the full deterministic npm suite pass against the final committed tree, and git diff --check plus package-content checks report no release-blocking defect.
- The handoff lists created commit hashes/messages, exact included task scopes, tests, and the complete remaining git status; it performs no push, tag, npm publish, version bump, Remote Script installation, Ableton restart, or Live Set mutation.
- After commits and validation, the exact committed Remote Script source is installed into Ableton Live Suite using the project installer or an equivalent recoverable replacement, the prior installed directory is backed up, and a recursive source-to-installed comparison reports no difference; Ableton is not restarted and no bridge or Set call is made.

## Ownership Paths
- src
- bridge
- ableton_remote_scripts
- docs
- test
- README.md
- .generated-prompts
- .agent-workflow

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
  - reason: exposed: role allowed and task signals match

### Omitted

- architect-diagram-generate (diagrams-generate): omitted: role release_manager is not allowed
- architect-diagram-lint (diagrams-lint): omitted: role release_manager is not allowed
- architect-workflow-template-render (workflow-render): omitted: role release_manager is not allowed
- qa-playwright-plan (playwright-plan): omitted: role release_manager is not allowed
- qa-playwright-evidence (playwright-evidence): omitted: role release_manager is not allowed

## Context Loading Policy
- Use the Preprocessed Runtime Context bundle by default.
- Cite full source paths from the bundle when deeper inspection is required; do not load raw files unless the reduced bundle is insufficient for the assigned work.
- Preserve omitted content warnings in the handoff when they affect confidence or verification scope.

## Required Context Files

- .agent-workflow/playbooks/release.md
  - source: phase-playbook
  - loadMode: full
  - required: true
  - sha256: 2545963f5d00c88bc7869738278327848892dfd95b1afb7fd82a2d2b887c9af2
  - reason: Required release phase playbook for release_manager runtime work.
- AGENTS.md
  - source: runtime-instructions
  - loadMode: excerpt
  - required: true
  - sha256: ca348a8005c76d48ca2a6313695f83db573e73d71cc15e12e3054bcf8aa76882
  - reason: Required root runtime instructions for project-wide agent behavior.
- rules/release-rollback.mdc
  - source: rule
  - loadMode: full
  - required: true
  - sha256: c43c1787268566489058587567eb1b1c8f01e5063e38749184503f2a1357ed21
  - reason: Required release_manager rule selected from the neutral rule catalog for role-specific execution quality.
- rules/delivery-quality-gates.mdc
  - source: rule
  - loadMode: excerpt
  - required: true
  - sha256: 05e5c1ef1d21dd2ac44ca37a91c0edefe86913b151113903660d98386ecae93f
  - reason: Required release_manager rule selected from the neutral rule catalog for role-specific execution quality.

## Generated Context Pack

- unavailable: context pack requires a fresh context index: context index has not been built

## Preprocessed Runtime Context

- config.maxLinesPerFile: 80
- config.totalLineBudget: 360
- original: 345 lines / 14734 bytes
- final: 190 lines / 10157 bytes
- omittedContentWarning: One or more context files were reduced; cite source paths when full files are needed.

### .agent-workflow/playbooks/release.md

- sourcePath: .agent-workflow/playbooks/release.md
- strategy: passthrough
- originalSize: 18 lines / 1135 bytes
- finalSize: 18 lines / 1135 bytes
- omittedContentWarning: none
- reason: Required release phase playbook for release_manager runtime work.

```
# Release Playbook

## Deployment Risk Challenge

- Challenge rollout, rollback, config, API, security-boundary, observability, and production-impact complexity before sign-off.
- Flag smells such as excessive rollout waves for the story size, rollback complexity disproportionate to the change, production-impacting config/API changes, security-boundary changes, and missing observability.
- If challenge findings exceed the project's risk threshold, record a blocking release review or action-policy approval request instead of approving the runbook.
- If no challenge findings exist, state `None` explicitly.

- Confirm CI, versioning, release notes, rollback path, and operational risk.
- Verify published artifacts or deployment evidence before closing the work.
- Record go/no-go rationale and any follow-up monitoring needs.

## Release Promote

- Validate changelog or release note impact, smoke evidence, rollback evidence, and customer/support readiness.
- Confirm whether the change ships alone or is batched with adjacent completed tasks.
- Record promote, hold, or accepted-risk rationale before closing the release phase.
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

### rules/release-rollback.mdc

- sourcePath: rules/release-rollback.mdc
- strategy: passthrough
- originalSize: 32 lines / 1797 bytes
- finalSize: 32 lines / 1797 bytes
- omittedContentWarning: none
- reason: Required release_manager rule selected from the neutral rule catalog for role-specific execution quality.

```
---
description: Release readiness, rollout, rollback, and post-release monitoring
alwaysApply: true
---

# Release & Rollback

Every release must be deployable, observable, and reversible. A feature is not ready if the team cannot monitor it or recover from it.

For rollout tooling, synthetic monitoring, SLOs, on-call, and operational reporting categories, see **devops-tooling.mdc**.

## Release Readiness
- Confirm Definition of Done, QA evidence, security review, migration status, and unresolved risks before release.
- Identify deployment target, release owner, release window, affected users, and communication needs.
- List feature flags, configuration changes, migrations, background jobs, and third-party dependencies.
- Verify observability exists for the changed behavior: logs, metrics, traces, dashboards, and alerts when applicable.

## Rollout Strategy
- Prefer small, reversible releases over large batches.
- Use feature flags, canaries, phased rollout, or dark launch for risky user-facing or infrastructure changes.
- Database changes must be backward compatible when possible and safe across rolling deploys.
- Long-running migrations must have progress monitoring and an interruption plan.

## Rollback Plan
- Every release must state how to rollback code, configuration, feature flags, and migrations.
- If rollback is not possible, document the forward-fix plan and get Product Owner risk acceptance before release.
- Do not release when rollback depends on manual guesswork or undocumented production console changes.

## Post-Release
- Monitor agreed signals after release: errors, latency, saturation, conversion, usage, and user-facing failures.
- Define who watches the release and for how long.
- Capture incidents, regressions, and follow-up work as backlog items.
```

### rules/delivery-quality-gates.mdc

- sourcePath: rules/delivery-quality-gates.mdc
- strategy: passthrough
- originalSize: 23 lines / 1604 bytes
- finalSize: 23 lines / 1604 bytes
- omittedContentWarning: none
- reason: Required release_manager rule selected from the neutral rule catalog for role-specific execution quality.

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

### README.md

- sourcePath: README.md
- strategy: section-extraction
- originalSize: 249 lines / 8596 bytes
- finalSize: 80 lines / 3010 bytes
- omittedContentWarning: Reduced from 249 lines using section-extraction; full source remains at README.md.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
# Ableton Live MCP

Local MCP stdio server for inspecting and controlling Ableton Live through a
local bridge.

Current package version: `0.1.0`.

Product site: [ableton-mcp.jterrats.dev](https://ableton-mcp.jterrats.dev)

This repo does not assume a specific Ableton integration layer. The MCP server
speaks JSON-RPC over stdio to an MCP client, then forwards tool calls to a local
HTTP bridge that you can implement with Max for Live, Ableton's Extensions SDK,
## Product Workflows

Start with [docs/product-workflows.md](docs/product-workflows.md) for end-to-end
setup, MIDI import, instrument assignment, arrangement, mixing, mastering,
validation, and export workflows. The guide also documents safe operating rules
for open user sets, destructive commands, explicit export approval, and
unsupported bridge operations.

## Tools

The exact `tools/list` response is capability-aware. It reads the active
bridge's read-only `GET /capabilities` contract, hides hard-unsupported bridge
actions, keeps MCP-local analysis/risk/workflow tools, and labels
target-dependent tools `Conditional`. Clients should re-list tools after
reconnecting or changing bridges. An unavailable or malformed handshake fails
closed and does not advertise unverified Live writes.

Read and inspect:

- `ableton_get_status`
## Production Workflow

For meaningful LLM control, the recommended sequence is:

1. `ableton_get_status`, `ableton_get_project`,
   `ableton_get_arrangement`, and `ableton_get_production_report` to inspect
   transport, tracks, devices, clips, locators, routing, meters, returns, and
   mixer state.
2. `ableton_create_snapshot` before broad edits. For real user sets, also save
   or duplicate the `.als` file before destructive, export, or mastering work.
3. `ableton_list_plugins` and `ableton_search_browser` so the LLM can choose
   available instruments, effects, presets, samples, racks, grooves, plugins,
## Quick Start

From npm:

```sh
npx -y @jterrats/ableton-live-mcp --help
```

Install the bundled Ableton Remote Script:

```sh
npx -y @jterrats/ableton-live-mcp install-remote-script --app-path "/Applications/Ableton Live 12 Lite.app"
## MCP Client Config

Use this shape in an MCP client that supports stdio servers:

```json
{
  "mcpServers": {
    "ableton-live": {
      "command": "npx",
      "args": ["-y", "@jterrats/ableton-live-mcp"],
      "env": {
        "ABLETON_BRIDGE_URL": "http://127.0.0.1:9789"
## Bridge

The local bridge must listen on `ABLETON_BRIDGE_URL` and implement the HTTP
contract in [docs/ableton-bridge-contract.md](docs/ableton-bridge-contract.md).

This repo includes a deterministic development bridge for local MCP integration
tests. It listens on `127.0.0.1:9789` by default, or on `ABLETON_BRIDGE_PORT`
when configured, and implements the product workflow surface without requiring
Ableton Live.

For the real Ableton Live adapter, install the Python Remote Script documented
in [docs/ableton-python-remote-script.md](docs/ableton-python-remote-script.md).
```

### .generated-prompts

- sourcePath: .generated-prompts
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 152 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: .generated-prompts
Raw directory contents were not loaded into runtime context. Inspect targeted files under this path when needed.
```

### .agent-workflow

- sourcePath: .agent-workflow
- strategy: directory-reference
- originalSize: 0 lines / 0 bytes
- finalSize: 2 lines / 149 bytes
- omittedContentWarning: Directory source was referenced without reading raw directory contents.
- reason: Delegated ownership path; cite this path instead of loading raw file content by default.

```
Directory reference: .agent-workflow
Raw directory contents were not loaded into runtime context. Inspect targeted files under this path when needed.
```


## Loaded Context Excerpts

### .agent-workflow/playbooks/release.md

```md
# Release Playbook

## Deployment Risk Challenge

- Challenge rollout, rollback, config, API, security-boundary, observability, and production-impact complexity before sign-off.
- Flag smells such as excessive rollout waves for the story size, rollback complexity disproportionate to the change, production-impacting config/API changes, security-boundary changes, and missing observability.
- If challenge findings exceed the project's risk threshold, record a blocking release review or action-policy approval request instead of approving the runbook.
- If no challenge findings exist, state `None` explicitly.

- Confirm CI, versioning, release notes, rollback path, and operational risk.
- Verify published artifacts or deployment evidence before closing the work.
- Record go/no-go rationale and any follow-up monitoring needs.

## Release Promote

- Validate changelog or release note impact, smoke evidence, rollback evidence, and customer/support readiness.
- Confirm whether the change ships alone or is batched with adjacent completed tasks.
- Record promote, hold, or accepted-risk rationale before closing the release phase.
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

### rules/release-rollback.mdc

```md
---
description: Release readiness, rollout, rollback, and post-release monitoring
alwaysApply: true
---

# Release & Rollback

Every release must be deployable, observable, and reversible. A feature is not ready if the team cannot monitor it or recover from it.

For rollout tooling, synthetic monitoring, SLOs, on-call, and operational reporting categories, see **devops-tooling.mdc**.

## Release Readiness
- Confirm Definition of Done, QA evidence, security review, migration status, and unresolved risks before release.
- Identify deployment target, release owner, release window, affected users, and communication needs.
- List feature flags, configuration changes, migrations, background jobs, and third-party dependencies.
- Verify observability exists for the changed behavior: logs, metrics, traces, dashboards, and alerts when applicable.

## Rollout Strategy
- Prefer small, reversible releases over large batches.
- Use feature flags, canaries, phased rollout, or dark launch for risky user-facing or infrastructure changes.
- Database changes must be backward compatible when possible and safe across rolling deploys.
- Long-running migrations must have progress monitoring and an interruption plan.

## Rollback Plan
- Every release must state how to rollback code, configuration, feature flags, and migrations.
- If rollback is not possible, document the forward-fix plan and get Product Owner risk acceptance before release.
- Do not release when rollback depends on manual guesswork or undocumented production console changes.

## Post-Release
- Monitor agreed signals after release: errors, latency, saturation, conversion, usage, and user-facing failures.
- Define who watches the release and for how long.
- Capture incidents, regressions, and follow-up work as backlog items.
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


## Primary Skill Context
### PR Review
- ID: pr-review
- Entry: skills/pr-review/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: release_manager; task text matches triggers: pr, review, diff; risk areas match: release
- Instructions:
  - Review behavior, tests, risks, rollout, rollback, and missing evidence before summaries.
  - Lead with findings and blockers, then summarize changes.
  - Reference local files, task context, reviews, and evidence rather than generated claims.
- Evidence:
  - file
  - report

### Prompt Registry
- ID: prompt-registry
- Entry: skills/prompt-registry/SKILL.md
- Load budget: small
- Rationale: task text matches triggers: prompt, generated, artifact, ui, docs; task touches files, so prompt registry can preserve artifact intent
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
- Rationale: eligible task roles: release_manager; task text matches triggers: docs, readme; risk areas match: release
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

### Proactive Orchestra
- ID: proactive-orchestra
- Entry: skills/proactive-orchestra/SKILL.md
- Load budget: small
- Rationale: eligible task roles: release_manager; task text matches triggers: workflow, handoff, evidence
- Instructions:
  - Start with health and task list before implementation when .agent-workflow exists.
  - Run pre-run validation before coding and resolve missing estimate, workflow, evidence, or review checks.
  - Record user-accepted deviations as decisions instead of silently skipping workflow steps.
- Evidence:
  - command
  - report
  - file

### QA Evidence Pack
- ID: qa-evidence-pack
- Entry: skills/qa-evidence-pack/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: release_manager; task text matches triggers: test evidence, trace; risk areas match: release
- Instructions:
  - Map every acceptance criterion to automated, manual, contract/mock, external verification, or deferred evidence with owner and rationale.
  - Capture observable outcomes: web visible state and artifacts, CLI exit/stdout/stderr/final state, API contracts and side effects, and integration receiver evidence.
  - For E2E work, validate the complete functional and integration journey instead of isolated command success; include setup, execution, state transition, final artifact, and acceptance-criteria mapping.
  - For generated skills, rules, runtime guidance, or Markdown artifacts, assert the runtime context, generated file paths, managed metadata, target-specific content, refresh/drift behavior, user-content preservation, and absence of wrong-target content.
  - For visual defects, attach source or expected image, actual image, diff when practical, and an annotated screenshot with concise overlays that identify the defect.
  - Store large evidence artifacts as files and reference paths from a compact report instead of pasting raw logs into agent context.
- Evidence:
  - command
  - file
  - screenshot
  - trace
  - video
  - log
  - report

### Release Readiness
- ID: release-readiness
- Entry: skills/release-readiness/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: release_manager; task text matches triggers: release; risk areas match: release
- Instructions:
  - Validate gates, evidence, locks, reviews, rollback, observability, and support readiness.
  - Treat missing rollback or unresolved critical QA/security/SRE findings as blockers.
  - Record release evidence and accepted residual risks explicitly.
- Evidence:
  - command
  - report
  - file

### Playwright Evidence
- ID: playwright-evidence
- Entry: skills/playwright-evidence/SKILL.md
- Load budget: normal
- Rationale: task text matches triggers: trace, ui; risk areas match: release
- Instructions:
  - Plan user-value scenarios from acceptance criteria before writing tests.
  - Use resilient locators and page objects for repeated flows.
  - Attach screenshots, traces, videos, or reports as evidence for release decisions.
- Evidence:
  - screenshot
  - trace
  - video
  - report

### Chaos Resilience Testing
- ID: chaos-resilience-testing
- Entry: skills/chaos-resilience-testing/SKILL.md
- Load budget: normal
- Rationale: eligible task roles: release_manager; risk areas match: release
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

### Backlog Sync
- ID: backlog-sync
- Entry: skills/backlog-sync/SKILL.md
- Load budget: small
- Rationale: task text matches triggers: story; risk areas match: scope
- Instructions:
  - Confirm backlog IDs and acceptance criteria before implementation.
  - Keep local tasks, docs, and GitHub issues aligned when one changes.
  - Surface missing refinement as a blocker instead of guessing scope.
- Evidence:
  - file
  - report

### Collection Standards
- ID: collection-standards
- Entry: skills/collection-standards/SKILL.md
- Load budget: small
- Rationale: task text matches triggers: map; risk areas match: release
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
- Rationale: task text matches triggers: source, docs
- Instructions:
  - Select source groups before acting and load only sources relevant to the task.
  - Prefer local project sources first and official vendor docs for current APIs or tools.
  - If sources conflict, record the conflict as a blocker or decision.
- Evidence:
  - file
  - report

### Static Analysis
- ID: static-analysis
- Entry: skills/static-analysis/SKILL.md
- Load budget: normal
- Rationale: task text matches triggers: test; risk areas match: release
- Instructions:
  - Inspect configured local checks before inventing commands.
  - Run the smallest relevant check first, then the full gate before handoff or commit.
  - Record command evidence and treat failed required checks as blockers unless explicitly deferred.
- Evidence:
  - command
  - report

### Audio/Video Transcription Evidence
- ID: audio-video-transcription
- Entry: skills/audio-video-transcription/SKILL.md
- Load budget: normal
- Rationale: risk areas match: release
- Instructions:
  - Default to local/offline transcription engines and require explicit policy opt-in before any external provider receives media or transcript content.
  - Record provenance for every transcript: workflow-local source artifact, hash, duration, language, engine/provider/model, actor, task, timestamp, consent, and retention notes.
  - Redact secrets, tokens, credentials, configured PII, and regulated data markers before persisting transcript artifacts or summaries.
  - Produce compact markdown and structured JSON; emit VTT/SRT only when timestamp quality is available.
  - Map transcript findings to acceptance criteria, decisions, risks, defects, action items, and lesson-learned candidates instead of treating transcript text as self-validating evidence.
- Evidence:
  - file
  - video
  - log
  - report

### Diagram Export
- ID: diagram-export
- Entry: skills/diagram-export/SKILL.md
- Load budget: normal
- Rationale: task text matches triggers: flow
- Instructions:
  - Identify the diagram purpose and authoritative architecture sources before drawing.
  - Choose the diagram style from the decision matrix before drafting.
  - Prefer text-native diagrams such as Mermaid unless the project requires another format.
  - Run orchestra diagrams lint --file <diagram.mmd> before sharing Mermaid diagrams.
  - Attach lint evidence to the workflow when the diagram supports delivery.
- Evidence:
  - file
  - report

### Model Evaluation
- ID: model-evaluation
- Entry: skills/model-evaluation/SKILL.md
- Load budget: normal
- Rationale: task text matches triggers: prompt
- Instructions:
  - Define eval objectives, cases, rubric, and expected behavior before changing prompts or routing.
  - Compare model/provider behavior for material changes and record disagreements.
  - Avoid storing raw sensitive prompts or responses in provenance artifacts.
- Evidence:
  - report
  - file

### Oclif Plugin Development
- ID: oclif-plugin-development
- Entry: skills/oclif-plugin-development/SKILL.md
- Load budget: normal
- Rationale: risk areas match: release
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


## Workflow Template Guidance

### Release Readiness

Validate release, smoke, rollback, and communication readiness.

- Roles: release_manager, qa, sre, technical_writer
- Inputs: approved tasks, qa evidence, rollback plan
- Outputs: release plan, smoke evidence, rollback evidence
- Evidence: command, report
- Gates: release-readiness
- Missing evidence: command, report

Steps:
- Verify smoke, rollback, and release evidence.

## Phase Playbook: release

Source: .agent-workflow/playbooks/release.md

# Release Playbook

## Deployment Risk Challenge

- Challenge rollout, rollback, config, API, security-boundary, observability, and production-impact complexity before sign-off.
- Flag smells such as excessive rollout waves for the story size, rollback complexity disproportionate to the change, production-impacting config/API changes, security-boundary changes, and missing observability.
- If challenge findings exceed the project's risk threshold, record a blocking release review or action-policy approval request instead of approving the runbook.
- If no challenge findings exist, state `None` explicitly.

- Confirm CI, versioning, release notes, rollback path, and operational risk.
- Verify published artifacts or deployment evidence before closing the work.
- Record go/no-go rationale and any follow-up monitoring needs.

## Release Promote

- Validate changelog or release note impact, smoke evidence, rollback evidence, and customer/support readiness.
- Confirm whether the change ships alone or is batched with adjacent completed tasks.
- Record promote, hold, or accepted-risk rationale before closing the release phase.

## Return Contract
- Write or summarize result evidence for .agent-workflow/handoffs/ableton-isolate-pending-changes-commits-20260820-wfrun-1787206927485-ed6c10-release-release_manager-runtime-handoff.md.
- Start the result artifact with these exact metadata lines:
  - Task id: ableton-isolate-pending-changes-commits-20260820
  - Phase: release
  - Role: release_manager
  - Runtime: codex-cli
  - Session id: ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli
- Include touched files, commands run, pass/fail result, risks, and close status.
- Include a `Consumed Context Files` section listing required files read, applied rules, and required rules that were not applicable with reasons.
- Include a `Test Scenarios and Expected Results` section with the target surface or environment (cloud, database, CLI, API, web app, mobile app, desktop app, workflow/runtime, integration, generated artifact, or local sandbox), the expected observable result for each scenario, and how the result was obtained.
- Critically state whether the produced evidence satisfies each acceptance criterion; mark gaps, weak evidence, or environment limitations as release-blocking unless the Product Owner explicitly accepts the risk.
- If a required context file was missing or not used, mark the handoff as changes/block with concrete impact.

## Lifecycle Self-Report
- After writing .agent-workflow/handoffs/ableton-isolate-pending-changes-commits-20260820-wfrun-1787206927485-ed6c10-release-release_manager-runtime-handoff.md, run: orchestra runtime spawn-lifecycle --session ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli --status completed --agent-id codex-cli:child --artifact .agent-workflow/handoffs/ableton-isolate-pending-changes-commits-20260820-wfrun-1787206927485-ed6c10-release-release_manager-runtime-handoff.md
- If blocked or failed before completion, run: orchestra runtime spawn-lifecycle --session ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli --status failed --agent-id codex-cli:child --summary "<safe failure summary>"
- If this runtime cannot execute shell commands, include the exact lifecycle command in the final runtime notification so the parent or watcher can reconcile it.