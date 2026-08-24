Task id: ableton-remove-save-mcp-20260817
Phase: developer
Role: developer
Runtime: codex-cli
Session id: ableton-remove-save-mcp-20260817:wfrun-1787023047317-def58d:developer:codex-cli

# Developer Handoff: Remove Unsupported Project Save

## Outcome

Removed `ableton_save_project` from the MCP tool list and dispatch, and removed the corresponding unsupported Node bridge and Remote Script route. Public docs, compatibility/risk/observability registries, the fake development implementation, and positive fake-save tests no longer claim that Live can save a Set programmatically.

No active Ableton endpoint was called. The user's currently open Set is explicitly excluded from all testing. Any future mutating real-Live validation must use only a separate disposable test Set.

## Required Context Acknowledgement

Applied `AGENTS.md` requirements: health/task/pre-run checks, active Orchestra workflow, evidence and reviews, no active-Set mutation, no package bump, no publish, no commit, and no push. Applied the user-approved scope to remove save rather than replace it with UI automation.

## Consumed Context Files

- `AGENTS.md`: Orchestra workflow and safety requirements.
- `.agent-workflow/runs/parent-execution-9404ee295d02385c3b7cf92b2a142e14b98593df213873bdf012a532c48144dd-request.json`: developer ownership, evidence, and resume contract.
- `src/tools.js`, `src/bridge.js`, `src/risk-policy.js`: MCP definition, dispatch, bridge action, and policy sources.
- `bridge/http-server.js`, `bridge/development-adapter.js`, `bridge/observability.js`: deterministic bridge route, fake implementation, and support registry.
- `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, `live_project.py`, and `live_observability.py`: real Remote Script route, implementation, and support registry.
- `test/project-lifecycle.mjs`, `test/smoke.mjs`, `test/bridge.mjs`, `test/live_project_clip_test.py`, and `test/remote-script-static.mjs`: affected contract and regression coverage.
- `README.md` and affected files under `docs/`: public capability, contract, compatibility, policy, and workflow claims.

## Changed Files and Traceability

- `src/tools.js`: removed the `ableton_save_project` schema and dispatcher entry.
- `src/bridge.js`: removed the `save_project` HTTP action.
- `src/risk-policy.js`: removed the save tool and endpoint classifications.
- `bridge/http-server.js`: removed `POST /project/save` routing.
- `bridge/development-adapter.js`: removed the fake successful `saveProject` implementation.
- `bridge/observability.js`: removed save endpoint support advertising.
- `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`: removed the save import and route.
- `ableton_remote_scripts/AbletonMcpBridge/live_project.py`: deleted the implementation based on non-public/nonexistent host methods.
- `ableton_remote_scripts/AbletonMcpBridge/live_observability.py`: removed save endpoint support advertising.
- `test/project-lifecycle.mjs`: now asserts tool and dispatch absence and zero save bridge calls.
- `test/smoke.mjs`: now asserts tools/list absence and JSON-RPC `-32602 Unknown tool` from tools/call.
- `test/bridge.mjs`: removed positive fake-save integration cases.
- `test/live_project_clip_test.py`: removed invented Song save methods and save cases; retained Session clip deletion cases.
- `test/remote-script-static.mjs`: removed the deleted module and route expectations.
- `README.md`: removed the public tool listing.
- `docs/ableton-bridge-contract.md`: removed the unsupported endpoint contract.
- `docs/ableton-compatibility.md`: removed the misleading host-dependent compatibility entry.
- `docs/ableton-python-remote-script.md`: removed route and behavior claims.
- `docs/risk-policy.md`: removed tool and endpoint classifications.
- `docs/product-workflows.md`: removed save from destructive-tool guidance.
- `docs/high-level-workflows.md`: removed save from workflow exclusions because it is no longer a tool.

All changes map directly to removal of the unsupported save surface. No unrelated source cleanup or abstraction was introduced.

## Commands and Results

- `node test/project-lifecycle.mjs` — exit 0, `project lifecycle contracts ok`.
- `node test/smoke.mjs` — exit 0, `smoke ok`.
- `node test/remote-script-static.mjs` — exit 0, `remote script static ok`.
- `npm test` — exit 0, all 18 suites passed, ending `deterministic test suite ok`.
- `git diff --check` — exit 0.
- Repository `rg` audit for `ableton_save_project|save_project|/project/save|saveProject|live_project` — only negative assertions and the legacy Python test filename remain; no positive implementation, route, registry, or documentation claim remains.

## Real Product Proof

`test/smoke.mjs` launches the actual MCP stdio server, invokes `tools/list`, and verifies that `ableton_save_project` is absent. It then invokes `tools/call` with that exact removed name and observes JSON-RPC error code `-32602` with `Unknown tool: ableton_save_project`. This exercises the real MCP protocol surface rather than only a helper function. The server runs in dry-run mode, so no active bridge or Set is contacted.

## Goal-to-Verification Map

| Acceptance criterion | Observable verification |
| --- | --- |
| `tools/list` excludes `ableton_save_project` | `test/smoke.mjs` and `test/project-lifecycle.mjs` assert absence; both exit 0. |
| `tools/call` rejects the removed tool and no bridge save call occurs | `test/smoke.mjs` asserts `-32602 Unknown tool`; `test/project-lifecycle.mjs` asserts no dispatch member and only the unrelated delete call reaches its bridge spy. |
| No positive save implementation/claim remains and regressions pass | Repository `rg` audit finds only negative assertions/legacy test filename; focused checks and `npm test` exit 0. |

## Unit and Command Evidence

- `.agent-workflow/evidence/ableton-remove-save-mcp-20260817-1787023256513-617d6731-5045-4785-b126-92031cd00965-command.md`
- `.agent-workflow/evidence/ableton-remove-save-mcp-20260817-1787023265236-19c88248-2e6c-400d-83dd-9e6a7d5c236b-file.md`
- `.agent-workflow/reviews/ableton-remove-save-mcp-20260817-developer-review.md`

## Simplicity Review

The diff deletes 202 lines and adds only 13 lines of negative assertions/document wording. It introduces no dependency, module, fallback, capability flag, UI automation, or speculative abstraction. Deleting the false route end-to-end is simpler and safer than retaining an unreachable conditional implementation. The separate `ableton_add_locator` 501 report is deliberately excluded and requires its own diagnosis.

## Handoff Notes

QA should rerun the three focused commands, `npm test`, `git diff --check`, and the repository reference audit. No Live installation or active bridge is needed to prove a removed MCP tool. Do not use the user's open Set; if later real-Live work is authorized, use only a disposable test project.

## Architectural Concerns (inherited)

- The public Live Object Model exposes no save operation, so any advertised Remote Script save capability is false.

## Architectural Concerns (self-imposed)

- None. This task removes a public surface and does not add a replacement mechanism.

```json
{
  "architecturalConcerns": {
    "inherited": [
      {
        "concern": "Live exposes no supported programmatic Set-save method",
        "resolution": "Remove the MCP and bridge save contract completely."
      }
    ],
    "selfImposed": []
  }
}
```
