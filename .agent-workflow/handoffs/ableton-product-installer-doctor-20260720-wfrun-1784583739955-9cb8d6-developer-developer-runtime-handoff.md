Task id: ableton-product-installer-doctor-20260720
Phase: developer
Role: developer
Runtime: codex-cli
Session id: ableton-product-installer-doctor-20260720:wfrun-1784583739955-9cb8d6:developer:codex-cli

## Close Status

Changes. Developer implementation and deterministic validation are complete. Final production release should still require QA on a machine with Ableton Live running and `AbletonMcpBridge` selected as a Control Surface.

## Touched Files

- `src/doctor.js` - new read-only doctor CLI and importable diagnostic functions.
- `scripts/check-doctor-diagnostics.mjs` - deterministic doctor diagnostic checks under the task-owned `scripts` path.
- `scripts/install-ableton-remote-script.sh` - installer now points users to `npm run doctor` for verification.
- `package.json` - adds `doctor` and `doctor:test`; includes doctor check in `npm test` while preserving concurrently added live smoke scripts.
- `docs/ableton-python-remote-script.md` - documents doctor verification, JSON diagnostics, and stale-runtime restart guidance.
- `.generated-prompts/code.md` - scope expansion required by prompt-registry skill to trace substantial code generation.
- `.agent-workflow/handoffs/ableton-product-installer-doctor-20260720-wfrun-1784583739955-9cb8d6-developer-developer-runtime-handoff.md` - required runtime handoff artifact.

## Commands Run

- `orchestra health --runtime codex-cli --json` - pass/degraded overall; package, workflow, generated guidance pass; GitHub auth not checked by design.
- `orchestra task list --json --status pending,blocked,in_progress` - confirmed task `ableton-product-installer-doctor-20260720` exists.
- `orchestra validate --pre-run --task ableton-product-installer-doctor-20260720 --json` - failed on missing evidence/review; workflow run and active context were present. This handoff and evidence address the missing developer evidence.
- `npm run doctor:test` - pass, `doctor diagnostics ok`.
- `npm run doctor -- --help` - pass, prints doctor usage and supported options.
- `npm run doctor -- --app-path /tmp/missing-ableton.app --json` - expected exit 1 with JSON report; confirmed `app_not_found` diagnosis and structured fields.
- `npm test` - pass: `smoke ok`, `regression ok`, `bridge ok`, `remote script static ok`, `doctor diagnostics ok`.
- `orchestra doc-sync audit --task ableton-product-installer-doctor-20260720` - pass.
- `orchestra evidence add ...` - recorded command/file evidence for `npm test`, doc-sync audit, and changed files.

## Acceptance Criteria Coverage

- Doctor command reports Ableton app path, installed Remote Script path, file freshness, Live PID, bridge status, and stale-runtime diagnosis: satisfied by `src/doctor.js`; deterministic coverage in `scripts/check-doctor-diagnostics.mjs`; missing-app JSON probe confirms structured output. Live PID detection is implemented through local process inspection but was not validated against a real Ableton process in this sandbox.
- Installer guidance lets users verify installation without manual curl commands: satisfied by `scripts/install-ableton-remote-script.sh` and `docs/ableton-python-remote-script.md`, both pointing to `npm run doctor`.
- Tests or deterministic checks for diagnostic output where feasible: satisfied by `npm run doctor:test` and aggregate `npm test`.

## Test Scenarios and Expected Results

- Target surface: CLI/local sandbox. Scenario: healthy installed Remote Script with mocked running Live process and mocked reachable `/status`. Expected: report is `ok: true`, app and installed paths are populated, freshness is `fresh`, PID is reported, bridge body is captured, diagnosis is `not_detected`. Obtained by `npm run doctor:test`.
- Target surface: CLI/local sandbox. Scenario: installed `http_bridge.py` differs from bundled source. Expected: report is `ok: false`, freshness is `stale`, changed file list includes `http_bridge.py`, diagnosis is `installed_files_stale`. Obtained by `npm run doctor:test`.
- Target surface: CLI/local sandbox. Scenario: missing Ableton app path. Expected: JSON report includes `abletonApp.found: false`, installed path that would be checked, and `app_not_found` diagnosis. Obtained by `npm run doctor -- --app-path /tmp/missing-ableton.app --json`.
- Target surface: project validation. Scenario: existing MCP, bridge, Remote Script static tests plus doctor diagnostics. Expected: all existing checks continue to pass and doctor diagnostics are part of `npm test`. Obtained by `npm test`.
- Target surface: desktop app/integration. Scenario: actual Ableton Live process with selected `AbletonMcpBridge` Control Surface. Expected: doctor reports real PID and reachable bridge. Not obtained in this workspace; release-blocking until QA runs on a Live-enabled machine or PO accepts the risk.

## Risks and Known Gaps

- Release-blocking integration gap: no real Ableton Live process or in-Live Python Remote Script runtime was available, so real PID matching and live bridge reachability were not observed end to end.
- `src/doctor.js` is 369 lines, above the local 300-line module-boundary guideline. Splitting CLI formatting, file freshness, process inspection, and bridge probing would require source paths beyond the assigned `src/doctor.js` ownership. I kept the implementation in one file and exported pure diagnostic seams for deterministic checks.
- Git status could not be inspected because this workspace shell reports it is not a Git repository. Concurrent changes were handled by re-reading `package.json` after a patch conflict and preserving the existing live smoke script additions.

## Simplicity Review

The diff is scoped to the requested doctor/install/docs/package surfaces plus workflow-required prompt registry and handoff artifacts. No dependencies, frameworks, network services, or broad rewrites were added. The doctor is read-only and reuses existing `src/config.js` bridge URL validation. The deterministic check lives in `scripts/` because `test/` was outside the stated ownership paths.

## Goal-to-Verification Map

- Product-grade install diagnostics: `src/doctor.js`, verified by `npm run doctor:test`, missing-app JSON probe, and `npm test`.
- Verification guidance without manual curl: installer and Remote Script docs updated, validated by `npm run doctor -- --help` and `orchestra doc-sync audit`.
- Diagnostic output checks: `scripts/check-doctor-diagnostics.mjs`, verified by `npm run doctor:test` and `npm test`.

## Consumed Context Files

- `.agent-workflow/runs/ableton-product-installer-doctor-20260720-wfrun-1784583739955-9cb8d6-developer-runtime-codex-cli-spawn-prompt.md` - read in full via chunked shell output after initial truncation.
- `.agent-workflow/playbooks/developer.md` - applied developer phase requirements from the runtime context.
- `AGENTS.md` - applied Orchestra workflow and evidence rules from the runtime context.
- `rules/development/semantic-code.md` - applied naming/readability guidance.
- `rules/development-engineering.mdc` - applied local architecture and verification guidance; full file was reduced in prompt context, but relevant excerpt was sufficient.
- `rules/dry-clean-code.mdc` - applied no-dependency/no-dead-code guidance.
- `rules/module-boundaries.mdc` - applied module-size guidance; residual `src/doctor.js` size risk is recorded above.
- `rules/testing-discipline.mdc` - applied deterministic test guidance; full file was reduced in prompt context, but relevant excerpt was sufficient.
- `skills/prompt-registry/SKILL.md` - applied; updated `.generated-prompts/code.md`.
- `skills/source-of-truth/SKILL.md` - applied; used local project source and docs as authoritative sources.
- `skills/static-analysis/SKILL.md` - applied; inspected package scripts and ran focused then aggregate checks.
- `skills/doc-sync/SKILL.md` - applied; updated docs and ran doc-sync audit.
- `skills/playwright-evidence/SKILL.md` - not applicable because there is no web UI/browser surface in this task.
- `skills/pr-review/SKILL.md` - not applicable because this child assignment is implementation, not PR review.

## Architectural Concerns (inherited)

None.

## Architectural Concerns (self-imposed)

- `src/doctor.js` exceeds 300 lines. Existing project patterns would normally favor splitting file freshness, process lookup, bridge probe, and CLI formatting into focused modules, but the assigned source ownership only included `src/doctor.js`. Scope expansion to more `src/` files was avoided.
- `.generated-prompts/code.md` is outside the declared ownership paths. This was required by the prompt-registry skill selected in the child assignment for substantial code/docs work.

## structured

```json
{
  "architecturalConcerns": {
    "inherited": [],
    "selfImposed": [
      {
        "path": "src/doctor.js",
        "concern": "File exceeds 300 lines because the assignment constrained source ownership to a single doctor module.",
        "whySimplerAlternativeInsufficient": "Splitting into smaller source modules would require scope expansion beyond the assigned src/doctor.js path."
      },
      {
        "path": ".generated-prompts/code.md",
        "concern": "Prompt registry update is outside ownership paths.",
        "whySimplerAlternativeInsufficient": "The selected prompt-registry skill requires tracing substantial code generation."
      }
    ]
  }
}
```
