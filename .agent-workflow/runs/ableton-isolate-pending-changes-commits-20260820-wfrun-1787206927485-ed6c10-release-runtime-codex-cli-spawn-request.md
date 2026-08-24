# Runtime Spawn Request: ableton-isolate-pending-changes-commits-20260820

- Task id: ableton-isolate-pending-changes-commits-20260820
- Runtime: Codex CLI (codex-cli)
- Phase: release
- Role: release_manager
- Session id: ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli
- Status: requested
- Async mode: full-async
- Default parent wait: false
- Completion: lifecycle-event-or-explicit-poll
- Spawn bridge mode: parent-tool
- Parent runtime tool: spawn_agent
- Direct provider API calls: forbidden
- directProviderApiAllowed=false
- Context tokens: 9212/3000

## Parent Runtime Action
- Action kind: codex-spawn-agent
- Native tool: spawn_agent
- Runtime bridge guidance: Render a spawn request artifact that the parent Codex runtime can execute with its spawn_agent tool.
- Parent runtime should call spawn_agent with the assignment below.
- Orchestra only rendered this request and recorded provenance.
- Call spawn_agent from the active Codex parent runtime with the prompt artifact as the child assignment.
- Prefer background execution and avoid waiting unless the next parent step is blocked.
- Record spawned and terminal lifecycle states with the returned agent id.
- Spawn lifecycle: orchestra runtime spawn-lifecycle --session ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli --status spawned --agent-id <agent-id>
- Complete lifecycle: orchestra runtime spawn-lifecycle --session ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli --status completed --agent-id <agent-id> --artifact .agent-workflow/handoffs/ableton-isolate-pending-changes-commits-20260820-wfrun-1787206927485-ed6c10-release-release_manager-runtime-handoff.md
- Failure lifecycle: orchestra runtime spawn-lifecycle --session ableton-isolate-pending-changes-commits-20260820:wfrun-1787206927485-ed6c10:release:codex-cli --status failed --agent-id <agent-id> --summary "<safe failure summary>"
- Parent should return control immediately after launching or recording the request.
- Parent should reconcile completion through lifecycle notification or explicit later polling.

## Assignment
- Ownership paths: src, bridge, ableton_remote_scripts, docs, test, README.md, .generated-prompts, .agent-workflow
- Delegation intent: execute
- Allowed commands: bash(orchestra *), npm run format, npm run build, npm run precommit
- Expected artifacts: code diff, test evidence, handoff notes
- Prompt artifact: .agent-workflow/runs/ableton-isolate-pending-changes-commits-20260820-wfrun-1787206927485-ed6c10-release-runtime-codex-cli-spawn-prompt.md
- Context manifest artifact: .agent-workflow/runs/ableton-isolate-pending-changes-commits-20260820-wfrun-1787206927485-ed6c10-release-runtime-codex-cli-context-manifest.json
- Expected result artifact: .agent-workflow/handoffs/ableton-isolate-pending-changes-commits-20260820-wfrun-1787206927485-ed6c10-release-release_manager-runtime-handoff.md

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


## Selected Skills
- pr-review: eligible task roles: release_manager; task text matches triggers: pr, review, diff; risk areas match: release
- prompt-registry: task text matches triggers: prompt, generated, artifact, ui, docs; task touches files, so prompt registry can preserve artifact intent
- doc-sync: eligible task roles: release_manager; task text matches triggers: docs, readme; risk areas match: release
- proactive-orchestra: eligible task roles: release_manager; task text matches triggers: workflow, handoff, evidence
- qa-evidence-pack: eligible task roles: release_manager; task text matches triggers: test evidence, trace; risk areas match: release
- release-readiness: eligible task roles: release_manager; task text matches triggers: release; risk areas match: release
- playwright-evidence: task text matches triggers: trace, ui; risk areas match: release
- chaos-resilience-testing: eligible task roles: release_manager; risk areas match: release
- backlog-sync: task text matches triggers: story; risk areas match: scope
- collection-standards: task text matches triggers: map; risk areas match: release
- source-of-truth: task text matches triggers: source, docs
- static-analysis: task text matches triggers: test; risk areas match: release
- audio-video-transcription: risk areas match: release
- diagram-export: task text matches triggers: flow
- model-evaluation: task text matches triggers: prompt
- oclif-plugin-development: risk areas match: release

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
- context token estimate 9212 exceeds budget 3000

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

## Tool Permission Policy
- Mode: runtime-managed
- Explicit opt-in required: false
- Read-only tools: none
- Write tools: none
- Shell tools: none
- Autonomous flags: none
- Gated flags: none
- Warning: Codex permission flags are managed by the active Codex CLI/session; Orchestra renders briefs and does not inject direct execution flags.