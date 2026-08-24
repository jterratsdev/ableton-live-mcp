# Handoff ableton-session-scene-tempo-signature-20260820: product_owner to architect

## Task Context
- Title: Control tempo and time signature per Session scene
- Goal: Expose capability-gated MCP operations for reading and safely setting or clearing per-scene tempo and time-signature overrides in Ableton Session View, without claiming Arrangement timeline automation.
- Current owner: developer
- Current status: blocked

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

## Scope And Paths
- src
- bridge
- ableton_remote_scripts/AbletonMcpBridge
- docs
- test

## Phase Handoff
- Status: ready_for_review
- Changed components: Runtime spawn lifecycle completed: ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli
- Behavior changed: Backlog refinement, story sizing, and acceptance criteria
- Unit tests: See phase task evidence
- Commands run: See phase task evidence
- Known gaps: All required transition checks were explicitly assessed.
- Risks: functionalSplitDecision: functional split recommended or explicit accepted-risk decision required: broad path count (5); many acceptance criteria (9); multiple required roles (product_owner, architect, developer, qa)
- Recommended Playwright coverage: not applicable
- Executor provenance: mode=auto; executor=runtime-native-subagent; role=product_owner; phase=po; runtime=codex-cli; session=ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli; artifact=.agent-workflow/runs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-runtime-codex-cli-spawn-request.md; directProviderApiAllowed=false

## Memory Consumption
- Hook: before_handoff
- Lessons consulted: 3
- Python bytecode validation: fix=Set PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache for py_compile and Python-spawning Node fixtures; prevent=Always isolate Python bytecode cache under /tmp for offline validation in the managed workspace
- atomic Scene transaction target isolation: fix=resolve once, observe and compare the original structural fingerprint, then journal immediately before invoking each forward or compensat...; prevent=add adversarial removal and shift fixtures in both runtimes and require identity verification at every setter boundary
- same-fingerprint transaction receiver isolation: fix=capture the exact preflight receiver once and pin all forward and compensation setters to it; reserve fresh index resolution for readback...; prevent=test identity collisions where name, count, property shape, and requested values partially overlap; never use a non-unique fingerprint to...
- Lessons applied: review required in handoff evidence
- Prompt registry entries consulted: 2
- code.md#Session Scene Tempo And Time-Signature Overrides: - **Created:** 2026-08-20 - **Updated:** 2026-08-20 - **Iterations:** 3 - **Task:** ableton-session-scene-tempo-signature-20260820 - **Role:** developer - **Paths:** src/scene-tempo-signature-tools.js, bridge/development/scene-tempo-sign...
- docs.md#Session Scene Override Contract Documentation: - **Created:** 2026-08-20 - **Updated:** 2026-08-20 - **Iterations:** 1 - **Task:** ableton-session-scene-tempo-signature-20260820 - **Role:** developer - **Paths:** README.md, docs/ableton-bridge-contract.md, docs/ableton-python-remote-...
- Prompt registry entries updated: verify via PROMPT_REGISTRY_UPDATED events or accepted rationale before release.

## Transition Guard
- State transition: po (product_owner) -> architect (architect)
- Required fields: backlogItem, acceptanceCriteria, businessRules, assumptions, nonGoals, ambiguityAndTradeoffs, successCriteria, scopeDecision, functionalSplitDecision
- Contract result: evaluated

## Required Handoff Field Coverage
- backlogItem: covered - ableton-session-scene-tempo-signature-20260820: Control tempo and time signature per Session scene
- acceptanceCriteria: covered - AC1. For a required zero-based sceneIndex, a read-only capability call returns exact target metadata {sceneIndex,name} and separate {readable,writable,reason} results for Scene.tempo, Scene.tempo_enabled, the composite time signature value (with component detail for Scene.time_signature_numerator and Scene.time_signature_denominator), and Scene.time_signature_enabled; it performs no setter call, and any absent, descriptor-incompatible, or exception-raising probe is unavailable with a non-empty reason rather than inferred from Live edition.; AC2. The mutation input accepts only an exact existing integer sceneIndex plus at least one of tempo or timeSignature; each family is a tagged action: tempo is {action:set,bpm} or {action:clear}, and timeSignature is {action:set,numerator,denominator} or {action:clear}. It rejects negative, fractional, stale/out-of-range indexes, fuzzy/name-only targeting, unknown actions, clear actions carrying values, non-finite or out-of-range BPM outside inclusive 20..999, numerator outside integer 1..32, and denominators outside 1,2,4,8,16,32 before any write.; AC3. The index is the authoritative Session-scene identity for the serialized request: resolution is exactly song.scenes[sceneIndex], duplicate or empty names are allowed, names are descriptive only, and every post-write or rollback readback reacquires song.scenes[sceneIndex] so recreated proxy objects succeed while a missing or structurally changed target fails verification; no other scene, global Song tempo/signature, clip, transport, or launch state is touched.; AC4. Preflight reads one complete observable target snapshot and verifies all operation-required capabilities before any write. Set tempo requires readable/writable tempo and tempo_enabled; clear tempo requires readable tempo plus readable/writable tempo_enabled. Set signature requires readable/writable numerator, denominator, and time_signature_enabled; clear signature requires readable numerator and denominator plus readable/writable time_signature_enabled. A combined request fails closed as a whole when either requested family is unsupported, including idempotent requests.; AC5. Set writes value before enable: tempo then tempo_enabled=true; signature numerator, denominator, then time_signature_enabled=true; a combined request applies tempo family then signature family. Clear writes only the corresponding enable=false and never overwrites a hidden retained value. Already-equal requests may skip physical setters but still run full preflight and fresh readback. Success is returned only after fresh-proxy readback exactly observes enabled=true and requested values for set, or enabled=false with Live sentinel -1 values normalized as null while preserving the exact raw observations for clear.; AC6. The operation is atomic across all requested fields: on any setter exception, target re-resolution failure, readback exception, or value/enable mismatch, it rolls back every field actually written in reverse transaction order toward the complete pre-mutation observable snapshot, reacquires the scene, and verifies the full target fingerprint and all readable tempo/signature fields. The error reports the original failure, rollback attempted/succeeded, any rollback failures, and final observed state; it never reports success after failed verification. Disabled pre-state is restored by disabling the family and verifying its -1 sentinels because Live does not expose the hidden retained value.; AC7. The response returns target {sceneIndex,name}, requested actions, exact normalized and raw observed tempo/signature values and enable states, changed/no-op status, and capability details. The scene mutation tool is listed only when the active bridge handshake truthfully supports its route; deterministic development fixtures expose equivalent behavior, while absent, malformed, or unreachable capability handshakes fail closed.; AC8. Tool copy and authoritative docs state that these overrides take effect only when the Session scene is later launched by the user or another explicit launch operation; this operation itself never launches a scene and never creates, edits, or promises Arrangement tempo envelopes, Arrangement time-signature markers, or global Song fallback writes.; AC9. Offline Node and Python fake-Live tests assert full and partial capability matrices, missing/raising properties, validation with zero setter calls, duplicate scene names and exact indexes, set/combined set/idempotency, clear/disable sentinels, mid-sequence failure rollback, rollback failure reporting, recreated-proxy readback, readback mismatch rollback, route/tool registry parity, malformed handshake fail-closed behavior, py_compile, focused MCP-to-HTTP behavior, npm test, and git diff --check without contacting the active bridge or mutating a Live Set.
- businessRules: covered - Runtime spawn lifecycle completed: ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli
- assumptions: covered - Live versions may expose Scene tempo and time-signature fields with different writable/enable semantics; the bridge must probe callable/readable/writable behavior and fail closed rather than infer support from Suite edition.
- nonGoals: covered - # Runtime Spawn Request: ableton-session-scene-tempo-signature-20260820

- Task id: ableton-session-scene-tempo-signature-20260820
- Runtime: Codex CLI (codex-cli)
- Phase: po
- Role: product_owner
- Session id: ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli
- Status: requested
- Async mode: full-async
- Default parent wait: false
- Completion: lifecycle-event-or-explicit-poll
- Spawn bridge mode: parent-tool
- Parent runtime tool: spawn_agent
- Direct provider API calls: forbidden
- directProviderApiAllowed=false
- Context tokens: 16168/3000

## Parent Runtime Action
- Action kind: codex-spawn-agent
- Native tool: spawn_agent
- Runtime bridge guidance: Render a spawn request artifact that the parent Codex runtime can execute with its spawn_agent tool.
- Parent runtime should call spawn_agent with the assignment below.
- Orchestra only rendered this request and recorded provenance.
- Call spawn_agent from the active Codex parent runtime with the prompt artifact as the child assignment.
- Prefer background execution and avoid waiting unless the next parent step is blocked.
- Record spawned and terminal lifecycle states with the returned agent id.
- Spawn lifecycle: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli --status spawned --agent-id <agent-id>
- Complete lifecycle: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli --status completed --agent-id <agent-id> --artifact .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-product_owner-runtime-handoff.md
- Failure lifecycle: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli --status failed --agent-id <agent-id> --summary "<safe failure summary>"
- Parent should return control immediately after launching or recording the request.
- Parent should reconcile completion through lifecycle notification or explicit later polling.

## Assignment
- Ownership paths: src, bridge, ableton_remote_scripts/AbletonMcpBridge, docs, test
- Delegation intent: execute
- Allowed commands: bash(orchestra *), npm run format, npm run build, npm run precommit
- Expected artifacts: code diff, test evidence, handoff notes
- Prompt artifact: .agent-workflow/runs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-runtime-codex-cli-spawn-prompt.md
- Context manifest artifact: .agent-workflow/runs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-runtime-codex-cli-context-manifest.json
- Expected result artifact: .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-product_owner-runtime-handoff.md

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
  - reason: exposed: role allowed and phase matches

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
- agent-learning: eligible task roles: developer, qa; task text matches triggers: failure, failed, error
- collection-standards: eligible task roles: developer, qa; task text matches triggers: fixture, fixtures, matrices
- source-of-truth: eligible task roles: architect, developer, qa; task text matches triggers: docs, verify, truth
- prompt-registry: eligible task roles: developer, qa; task text matches triggers: ui, docs; task touches files, so prompt registry can preserve artifact intent
- pr-review: eligible task roles: qa, architect; task text matches triggers: pr, diff
- diagram-export: eligible task roles: architect; task text matches triggers: sequence
- doc-sync: eligible task roles: architect, product_owner; task text matches triggers: docs
- model-evaluation: eligible task roles: architect; task text matches triggers: fallback
- playwright-evidence: eligible task roles: qa; task text matches triggers: ui
- static-analysis: eligible task roles: developer, qa; task text matches triggers: test
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
- context token estimate 16168 exceeds budget 3000

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
- ambiguityAndTradeoffs: covered - # Runtime Spawn Request: ableton-session-scene-tempo-signature-20260820

- Task id: ableton-session-scene-tempo-signature-20260820
- Runtime: Codex CLI (codex-cli)
- Phase: po
- Role: product_owner
- Session id: ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli
- Status: requested
- Async mode: full-async
- Default parent wait: false
- Completion: lifecycle-event-or-explicit-poll
- Spawn bridge mode: parent-tool
- Parent runtime tool: spawn_agent
- Direct provider API calls: forbidden
- directProviderApiAllowed=false
- Context tokens: 16168/3000

## Parent Runtime Action
- Action kind: codex-spawn-agent
- Native tool: spawn_agent
- Runtime bridge guidance: Render a spawn request artifact that the parent Codex runtime can execute with its spawn_agent tool.
- Parent runtime should call spawn_agent with the assignment below.
- Orchestra only rendered this request and recorded provenance.
- Call spawn_agent from the active Codex parent runtime with the prompt artifact as the child assignment.
- Prefer background execution and avoid waiting unless the next parent step is blocked.
- Record spawned and terminal lifecycle states with the returned agent id.
- Spawn lifecycle: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli --status spawned --agent-id <agent-id>
- Complete lifecycle: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli --status completed --agent-id <agent-id> --artifact .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-product_owner-runtime-handoff.md
- Failure lifecycle: orchestra runtime spawn-lifecycle --session ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli --status failed --agent-id <agent-id> --summary "<safe failure summary>"
- Parent should return control immediately after launching or recording the request.
- Parent should reconcile completion through lifecycle notification or explicit later polling.

## Assignment
- Ownership paths: src, bridge, ableton_remote_scripts/AbletonMcpBridge, docs, test
- Delegation intent: execute
- Allowed commands: bash(orchestra *), npm run format, npm run build, npm run precommit
- Expected artifacts: code diff, test evidence, handoff notes
- Prompt artifact: .agent-workflow/runs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-runtime-codex-cli-spawn-prompt.md
- Context manifest artifact: .agent-workflow/runs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-runtime-codex-cli-context-manifest.json
- Expected result artifact: .agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-product_owner-runtime-handoff.md

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
  - reason: exposed: role allowed and phase matches

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
- agent-learning: eligible task roles: developer, qa; task text matches triggers: failure, failed, error
- collection-standards: eligible task roles: developer, qa; task text matches triggers: fixture, fixtures, matrices
- source-of-truth: eligible task roles: architect, developer, qa; task text matches triggers: docs, verify, truth
- prompt-registry: eligible task roles: developer, qa; task text matches triggers: ui, docs; task touches files, so prompt registry can preserve artifact intent
- pr-review: eligible task roles: qa, architect; task text matches triggers: pr, diff
- diagram-export: eligible task roles: architect; task text matches triggers: sequence
- doc-sync: eligible task roles: architect, product_owner; task text matches triggers: docs
- model-evaluation: eligible task roles: architect; task text matches triggers: fallback
- playwright-evidence: eligible task roles: qa; task text matches triggers: ui
- static-analysis: eligible task roles: developer, qa; task text matches triggers: test
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
- context token estimate 16168 exceeds budget 3000

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
- successCriteria: covered - Verifiable success criteria: AC1. For a required zero-based sceneIndex, a read-only capability call returns exact target metadata {sceneIndex,name} and separate {readable,writable,reason} results for Scene.tempo, Scene.tempo_enabled, the composite time signature value (with component detail for Scene.time_signature_numerator and Scene.time_signature_denominator), and Scene.time_signature_enabled; it performs no setter call, and any absent, descriptor-incompatible, or exception-raising probe is unavailable with a non-empty reason rather than inferred from Live edition.; AC2. The mutation input accepts only an exact existing integer sceneIndex plus at least one of tempo or timeSignature; each family is a tagged action: tempo is {action:set,bpm} or {action:clear}, and timeSignature is {action:set,numerator,denominator} or {action:clear}. It rejects negative, fractional, stale/out-of-range indexes, fuzzy/name-only targeting, unknown actions, clear actions carrying values, non-finite or out-of-range BPM outside inclusive 20..999, numerator outside integer 1..32, and denominators outside 1,2,4,8,16,32 before any write.; AC3. The index is the authoritative Session-scene identity for the serialized request: resolution is exactly song.scenes[sceneIndex], duplicate or empty names are allowed, names are descriptive only, and every post-write or rollback readback reacquires song.scenes[sceneIndex] so recreated proxy objects succeed while a missing or structurally changed target fails verification; no other scene, global Song tempo/signature, clip, transport, or launch state is touched.; AC4. Preflight reads one complete observable target snapshot and verifies all operation-required capabilities before any write. Set tempo requires readable/writable tempo and tempo_enabled; clear tempo requires readable tempo plus readable/writable tempo_enabled. Set signature requires readable/writable numerator, denominator, and time_signature_enabled; clear signature requires readable numerator and denominator plus readable/writable time_signature_enabled. A combined request fails closed as a whole when either requested family is unsupported, including idempotent requests.; AC5. Set writes value before enable: tempo then tempo_enabled=true; signature numerator, denominator, then time_signature_enabled=true; a combined request applies tempo family then signature family. Clear writes only the corresponding enable=false and never overwrites a hidden retained value. Already-equal requests may skip physical setters but still run full preflight and fresh readback. Success is returned only after fresh-proxy readback exactly observes enabled=true and requested values for set, or enabled=false with Live sentinel -1 values normalized as null while preserving the exact raw observations for clear.; AC6. The operation is atomic across all requested fields: on any setter exception, target re-resolution failure, readback exception, or value/enable mismatch, it rolls back every field actually written in reverse transaction order toward the complete pre-mutation observable snapshot, reacquires the scene, and verifies the full target fingerprint and all readable tempo/signature fields. The error reports the original failure, rollback attempted/succeeded, any rollback failures, and final observed state; it never reports success after failed verification. Disabled pre-state is restored by disabling the family and verifying its -1 sentinels because Live does not expose the hidden retained value.; AC7. The response returns target {sceneIndex,name}, requested actions, exact normalized and raw observed tempo/signature values and enable states, changed/no-op status, and capability details. The scene mutation tool is listed only when the active bridge handshake truthfully supports its route; deterministic development fixtures expose equivalent behavior, while absent, malformed, or unreachable capability handshakes fail closed.; AC8. Tool copy and authoritative docs state that these overrides take effect only when the Session scene is later launched by the user or another explicit launch operation; this operation itself never launches a scene and never creates, edits, or promises Arrangement tempo envelopes, Arrangement time-signature markers, or global Song fallback writes.; AC9. Offline Node and Python fake-Live tests assert full and partial capability matrices, missing/raising properties, validation with zero setter calls, duplicate scene names and exact indexes, set/combined set/idempotency, clear/disable sentinels, mid-sequence failure rollback, rollback failure reporting, recreated-proxy readback, readback mismatch rollback, route/tool registry parity, malformed handshake fail-closed behavior, py_compile, focused MCP-to-HTTP behavior, npm test, and git diff --check without contacting the active bridge or mutating a Live Set.
- scopeDecision: covered - functional scope requires split review: broad path count (5); many acceptance criteria (9); multiple required roles (product_owner, architect, developer, qa)
- functionalSplitDecision: covered - functional split recommended or explicit accepted-risk decision required: broad path count (5); many acceptance criteria (9); multiple required roles (product_owner, architect, developer, qa)

## Verifier Contracts
- scene-tempo-signature-contract: api; owner=qa; evidence=Focused MCP/HTTP/Python scene tempo-signature contract output plus registry parity, py_compile, npm test, and git diff --check; required=true

## Role Quality Contract
- Contract: generic-advisory
- Validation mode: advisory
- Result: pass
- Transition allowed: true
- Allowed transitions: *
- Return to phase: not required
- Human approval required: false

## Role Contract Requirement Coverage
- Handoff notes: covered - Handoff notes covered.

## Flow-specific required context
- none
