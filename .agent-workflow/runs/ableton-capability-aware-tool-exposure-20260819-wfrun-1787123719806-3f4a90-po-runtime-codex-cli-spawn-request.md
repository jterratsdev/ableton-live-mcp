# Runtime Spawn Request: ableton-capability-aware-tool-exposure-20260819

- Task id: ableton-capability-aware-tool-exposure-20260819
- Runtime: Codex CLI (codex-cli)
- Phase: po
- Role: product_owner
- Session id: ableton-capability-aware-tool-exposure-20260819:wfrun-1787123719806-3f4a90:po:codex-cli
- Status: requested
- Async mode: full-async
- Default parent wait: false
- Completion: lifecycle-event-or-explicit-poll
- Spawn bridge mode: parent-tool
- Parent runtime tool: spawn_agent
- Direct provider API calls: forbidden
- directProviderApiAllowed=false
- Context tokens: 7681/3000

## Parent Runtime Action
- Action kind: codex-spawn-agent
- Native tool: spawn_agent
- Runtime bridge guidance: Render a spawn request artifact that the parent Codex runtime can execute with its spawn_agent tool.
- Parent runtime should call spawn_agent with the assignment below.
- Orchestra only rendered this request and recorded provenance.
- Call spawn_agent from the active Codex parent runtime with the prompt artifact as the child assignment.
- Prefer background execution and avoid waiting unless the next parent step is blocked.
- Record spawned and terminal lifecycle states with the returned agent id.
- Spawn lifecycle: orchestra runtime spawn-lifecycle --session ableton-capability-aware-tool-exposure-20260819:wfrun-1787123719806-3f4a90:po:codex-cli --status spawned --agent-id <agent-id>
- Complete lifecycle: orchestra runtime spawn-lifecycle --session ableton-capability-aware-tool-exposure-20260819:wfrun-1787123719806-3f4a90:po:codex-cli --status completed --agent-id <agent-id> --artifact .agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787123719806-3f4a90-po-product_owner-runtime-handoff.md
- Failure lifecycle: orchestra runtime spawn-lifecycle --session ableton-capability-aware-tool-exposure-20260819:wfrun-1787123719806-3f4a90:po:codex-cli --status failed --agent-id <agent-id> --summary "<safe failure summary>"
- Parent should return control immediately after launching or recording the request.
- Parent should reconcile completion through lifecycle notification or explicit later polling.

## Assignment
- Ownership paths: src, bridge, ableton_remote_scripts/AbletonMcpBridge, docs, test
- Delegation intent: execute
- Allowed commands: bash(orchestra *), npm run format, npm run build, npm run precommit
- Expected artifacts: code diff, test evidence, handoff notes
- Prompt artifact: .agent-workflow/runs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787123719806-3f4a90-po-runtime-codex-cli-spawn-prompt.md
- Context manifest artifact: .agent-workflow/runs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787123719806-3f4a90-po-runtime-codex-cli-context-manifest.json
- Expected result artifact: .agent-workflow/handoffs/ableton-capability-aware-tool-exposure-20260819-wfrun-1787123719806-3f4a90-po-product_owner-runtime-handoff.md

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


## Selected Skills
- collection-standards: eligible task roles: developer, qa; task text matches triggers: map, fixture, fixtures; risk areas match: sre
- source-of-truth: eligible task roles: architect, developer, qa; task text matches triggers: documentation, docs, truth
- prompt-registry: eligible task roles: developer, qa; task text matches triggers: ui, docs; task touches files, so prompt registry can preserve artifact intent
- doc-sync: eligible task roles: architect, product_owner; task text matches triggers: documentation, docs
- pr-review: eligible task roles: qa, architect; task text matches triggers: pr, diff
- chaos-resilience-testing: eligible task roles: qa, architect, developer; risk areas match: sre
- diagram-export: eligible task roles: architect; task text matches triggers: flow
- oclif-plugin-development: eligible task roles: developer, architect, qa; task text matches triggers: plugin
- playwright-evidence: eligible task roles: qa; task text matches triggers: ui
- proactive-orchestra: eligible task roles: architect, developer, qa; task text matches triggers: workflow
- static-analysis: eligible task roles: developer, qa; task text matches triggers: test
- release-readiness: risk areas match: sre

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
- context token estimate 7681 exceeds budget 3000

## Phase Playbook: po

Source: .agent-workflow/playbooks/po.md

# PO Playbook

- Refine acceptance criteria into testable outcomes.
- State assumptions, non-goals, ambiguity, competing interpretations, tradeoffs, and concrete success criteria before architecture starts.
- Check whether the task is functionally oversized: multiple journeys, unrelated outcomes, too many acceptance criteria, or hidden release/support scope.
- If scope is too large, record a split recommendation with rationale, proposed child stories, dependencies, risks, and owner roles before architecture starts.
- Confirm backlog item ID, dependencies, assumptions, and edge cases.
- Clarify what is out of scope before implementation starts.

## Tool Permission Policy
- Mode: runtime-managed
- Explicit opt-in required: false
- Read-only tools: none
- Write tools: none
- Shell tools: none
- Autonomous flags: none
- Gated flags: none
- Warning: Codex permission flags are managed by the active Codex CLI/session; Orchestra renders briefs and does not inject direct execution flags.