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

Every piece of work — feature, bug fix, architecture decision, stack definition, PO refinement, or research spike —
MUST go through the Orchestra workflow. Do not start any work without a registered task and a running workflow.

### Managed Work Routing for External Runtimes

External runtimes and provider-backed agents — including Claude, Codex, Cursor, VS Code, Windsurf, OpenCode, and generic LLM runners — must infer managed work intent from natural language.
When the user asks to implement, fix, review, release, deploy, plan, research, investigate, spike, groom, estimate, validate, QA, or document work in a project with `.agent-workflow/`, route the request through Orchestra instead of executing ad hoc.
The required routing sequence is:
1. Load workspace state with `orchestra health --json` and `orchestra task list --json --status pending,blocked,in_progress`.
2. Reuse the matching active task when one exists; otherwise create or refine a task with `orchestra task add` before doing implementation, research, or provider calls.
3. Record the estimate and run `orchestra validate --pre-run --task <ID> --json`; if context is missing, resume or register the workflow before editing files.
4. Start or resume the workflow with `orchestra workflow run --task <ID> --gates phase` or `orchestra workflow run --task <ID> --resume <run-id>`.
5. If acceptance criteria, sizing, or gate approval is missing, stop and record clarification/review instead of bypassing the workflow.
This hardening is for external runtimes. The local provider/backbone path may stay tightly coupled to Orchestra internals, but it must not be used as a precedent for Claude, Codex, Cursor, VS Code, Windsurf, OpenCode, or generic provider behavior.

### Step 1 — Register the task
```
orchestra task add --id <ID> --title "<title>" --owner <role> --paths "<files>" --goal "<goal>"
```
Use the correct owner role for the type of work:
- Architecture / stack decisions → `architect`
- Product strategy / roadmap → `product_manager`
- Backlog refinement / acceptance criteria → `product_owner`
- Implementation → `developer`
- Verification / QA → `qa`
- Release / deploy → `release_manager`

### Step 2 — Declare effort baseline
```
orchestra estimate --task <ID> --sizing <xs|s|m|l|xl> --solo-days <N> --ai-unguided-days <N> --ai-guided-days <N>
```
Do not run `orchestra workflow run` until this estimate is recorded; an unestimated task signals incomplete planning.

### Step 3 — Run the autonomous workflow
```
orchestra workflow run --task <ID> --gates phase
```
The workflow sequences PM → PO → Architect → Developer → QA → Release.
Execution mode is selected from sizing when no explicit `--phase-execution` is provided:
- `xs` (1 point): `single-agent` so all phases run inline without spawn overhead.
- `s` (2–3 points): `single-agent` by default; use `subagents` when the work is separable.
- `m`, `l`, `xl`: `subagents` so phase work is isolated and reviewable.
For xs/s tasks, prefer `orchestra workflow run --task <ID> --gates phase --phase-execution single-agent` when you need to be explicit. The parent agent still produces handoffs, evidence, and reviews for every phase.
The agent (Claude Code) is responsible for executing every phase in sequence — acting as PM, then PO, then Architect, then Developer, then QA, then Release — before marking work complete.
Never pass `--from-phase`, `--skip-phases`, or any phase-shortcut flag. If a phase seems irrelevant, record a bypass rationale with `orchestra validate --pre-run --task <ID> --bypass --bypass-rationale "..."` instead.
Gates pause at `po→architect` and `qa→release` for human review.
The architect phase requires a sizing decision before proceeding:
```
orchestra decision add --task <ID> --owner architect --title "Story sizing" \
  --decision "<xs|s|m|l|xl> [N points]" --context "..." --consequences "..." --status accepted
```

### Step 4 — Collaborate through the phases
Each phase routes work to the right role. Pass your comments, requirements, or context via:
- `orchestra decision add` — architecture decisions, stack choices, accepted trade-offs
- `orchestra review` — review findings from any role
- `orchestra workflow clarify` — blocking questions from developer/QA to PO or architect
- `orchestra evidence add` — artifacts, commands run, test results

### Step 5 — Resume after gates
```
orchestra workflow run --task <ID> --resume <run-id>
```
At a `po→architect` or `qa→release` gate, stop work, surface the handoff artifact to the user, and wait for explicit approval before resuming — do not self-approve or continue autonomously.
Gate approval is not automatic. Before approving `po→architect`, verify the GitHub issue or Orchestra task has user-validated acceptance criteria, non-goals, assumptions, priority, and sizing context.
Before approving `qa→release`, verify real implementation evidence exists: changed files, exact validation commands, test results, QA findings, BA/PO acceptance, and Architect review when technical contracts changed.
If a generated handoff says `Acceptance Criteria: none`, treat it as incomplete. Pull criteria from the linked issue/task, record a review finding, and do not approve release until the gap is fixed or explicitly risk-accepted.

### Step 6 — Benchmark after completion
```
orchestra benchmark --task <ID>
```
A task is not complete until `orchestra benchmark` has run. Do not close the task or mark it done beforehand.

## Active Work
- At session start, run `orchestra health --runtime codex-cli --json` before implementation or file edits.
- Run `orchestra task list --json --status pending,blocked,in_progress` and identify resumable work before creating a new task.
- For the active task, run context, delegation, plan, skills, protocol, and workflow render commands.
- Run `orchestra validate --pre-run --task <ID> --json` before implementation; resolve missing estimate, workflow run, evidence, or review checks.
- Loading or estimating a task is not enough. If validation reports `workflowRun` missing, run `orchestra workflow run --task <ID> --gates phase` or resume the existing run before implementation, handoff, QA, or release work.
- If a user accepts a smaller/advisory path, record it with `orchestra validate --pre-run --task <ID> --bypass --bypass-rationale "..."`.
- After `orchestra workflow run` completes a phase or reports a pending action, immediately run `orchestra runtime parent-actions --task <ID> --json` and dispatch any actionable `claude-agent-request` items before continuing.
- Codex recurring preflight: before each new work block and after any context shift, compaction, resume, interruption, or role handoff, rerun `orchestra health --runtime codex-cli --json`, `orchestra task list --json --status pending,blocked,in_progress`, and `orchestra validate --pre-run --task <ID> --json`.
- Treat `activeOrchestraContext: false` or non-empty `missingActiveContext` from pre-run validation as a drift warning; reload the task context and resume/register the workflow before editing files.
- Codex has no native recurring hook in this project, so this managed guidance and validation command are the fallback enforcement mechanism; the `--runtime codex-cli` flag is what registers the active runtime in `.agent-workflow/active-runtime.json`.

## Runtime-Native Background Spawn
- When a workflow phase returns `completionMode=detached`, keep the parent conversation available and do not block on the child unless the user explicitly asks to wait.
- After `orchestra workflow run` reports a pending parent runtime action, immediately inspect `orchestra runtime parent-actions --task <ID> --json` and consume safe actions supported by the active runtime.
- Codex parent runtimes should call `spawn_agent` for `codex-spawn-agent` actions using the `promptArtifact`, then record `spawned` with the returned agent id.
- Do not auto-consume actions when the user explicitly asked to pause, when the action is queued, or when the runtime/tool is unavailable or unsafe.
- Use `orchestra runtime spawn-request --task <ID> --role <role> --phase <phase> --run-id <run-id>` to render the assignment packet.
- Record child state with `orchestra runtime spawn-lifecycle --session <session-id> --status <spawned|active|completed|failed> --agent-id <id>`.
- Resume the workflow after the child completes with `orchestra workflow run --task <ID> --resume <run-id>`.
- Codex parent runtimes should use `spawn_agent` for the rendered packet and avoid waiting by default.

## Task Loop
- `orchestra health` - Check local tools and workflow readiness. With --runtime, persists the active runtime to .agent-workflow/active-runtime.json so subsequent commands know who the parent is.
- `orchestra task list` - List local workflow tasks. Workflow phase subtasks are hidden by default.
- `orchestra delegation decide --task <id>` - Decide whether to delegate.
- `orchestra skills plan --task <id>` - Select task-scoped skills.
- `orchestra skills render --target <generic|claude|cursor|codex|vscode|windsurf>` - Render skills for a runtime.
- `orchestra protocol render` - Render subagent protocol.
- `orchestra workflow render --task <id>` - Render workflow templates.
- `orchestra summary` - Summarize workspace state.
- `orchestra context --task <id>` - Read task context bundle.
- `orchestra plan --task <id>` - Render role execution plan.
- `orchestra gate --gate <architecture> --task <id>` - Evaluate workflow gate.
- `orchestra review --task <id> --role <role> --result <approve|block|changes> --findings <text> --recommendation <text>` - Record reviewer outcome.
- `orchestra evidence add --task <id> --role <role> --type <command|file|screenshot|trace|video|log|report> --summary <text>` - Record delivery evidence.

## Completion
- Run the project validation gate.
- Record command/file/browser evidence with `orchestra evidence add`.
- Record review outcome with `orchestra review`.
- Update task status only after evidence and review are present.
- **Never run `git push` without explicit user instruction.** Completing a task, finishing QA, or closing a workflow run does not authorize a push.

## Command Discovery
- Use `orchestra commands manifest --json` for command metadata.
- Use `orchestra --help` for human-readable help.
<!-- open-orchestra:end block-id="runtime-bootstrap" -->
