Task id: ableton-ssd-multi-output-workflow-20260817
Phase: developer
Role: developer
Runtime: codex-cli
Session id: ableton-ssd-multi-output-workflow-20260817:wfrun-1787002057777-44ad19:developer:codex-cli

# Developer handoff: safe SSD5 multi-output MCP workflow

## Runtime status

Developer implementation is complete and ready for QA. The workflow adds a read-only plan surface and an explicit atomic apply surface for SSD5 output receivers. Automated validation used only deterministic development and fake-Live objects; no request was sent to the running Ableton bridge, no active Set was mutated, and nothing was installed, restarted, pushed, published, or deployed.

## Consumed context

- `.agent-workflow/runs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-developer-runtime-codex-cli-spawn-prompt.md`
- `.agent-workflow/runs/ableton-ssd-multi-output-workflow-20260817-wfrun-1787002057777-44ad19-developer-runtime-codex-cli-context-manifest.json`
- `.agent-workflow/playbooks/developer.md`, `AGENTS.md`, and every required development/testing rule named by the runtime prompt
- `skills/collection-standards/SKILL.md` and `skills/prompt-registry/SKILL.md`
- Existing MCP tool, bridge, risk-policy, observability, compatibility, Remote Script, and deterministic-test conventions

## Changed files and traceability

- `src/plugin-output-routing-tools.js`, `src/tools.js`, `src/bridge.js`, `src/risk-policy.js`: AC1/AC2 listed MCP schemas, validation, dispatch, bridge actions, and read/safe-write classifications.
- `bridge/development/plugin-output-routing.js`, `bridge/development/routing-options.js`, `bridge/development-adapter.js`, `bridge/http-server.js`, `bridge/observability.js`: AC1-AC3 deterministic plan/apply behavior, exact and ambiguity-safe routing resolution, idempotence, rollback, HTTP wiring, and support metadata.
- `ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py`, `live_plugin_routing_validation.py`, `live_routing_options.py`, `AbletonMcpBridge.py`, `live_observability.py`: AC1-AC3 modern routing-dictionary and legacy routing support, exact identifier/display selection, Monitor In, readback, and identity-based reverse rollback.
- `test/plugin-output-routing.mjs`, `test/live_plugin_routing_test.py`, `test/deterministic.mjs`, `test/remote-script-static.mjs`, `test/compatibility-matrix.mjs`: AC1-AC4 deterministic and static coverage.
- `docs/ssd5-multi-output.md`, `docs/ableton-bridge-contract.md`, `docs/ableton-python-remote-script.md`, `docs/ableton-compatibility.md`, `docs/risk-policy.md`: public contract, safety model, compatibility metadata, and active-Set bootstrap instructions.
- `.generated-prompts/code.md`, `.generated-prompts/tests.md`, `.generated-prompts/docs.md`, `.generated-prompts/services.md`: Prompt Registry traceability required by the selected skill; this is the only scope expansion beyond task-owned paths.

## Required Handoff Field Coverage

- changedComponents: covered - Every task-owned product, test, documentation, and prompt-registry path is listed in Changed files and traceability and in the machine-readable contract below.
- behaviorChanged: covered - Behavior and safety guarantees records both public operations, strict matching, bootstrap diagnostics, idempotence, verification, and rollback.
- unitTests: covered - Deterministic Node MCP-to-ephemeral-bridge and Python fake-Live tests cover AC1-AC4; full npm test also passed.
- commandsRun: covered - Exact commands, exit status, and asserted result are recorded in Commands and Results and the machine-readable contract.
- changedFileTraceability: covered - Each concrete changed path is associated with AC1, AC2, AC3, AC4, or required registry/documentation support below.
- simplicityReview: covered - New business logic remains in focused modules and oversized entrypoints receive thin wiring only.
- goalVerificationMap: covered - AC1-AC4 are each mapped to exact commands, paths, and assertions.
- knownGaps: covered - Live installation/restart, active-Set runtime proof, manual SSD5 internal output assignment, and explicit apply approval are deferred with next steps.
- architecturalConcerns: covered - Architectural Concerns (inherited) and Architectural Concerns (self-imposed) are explicit below.
- realProductProof: covered - The real local MCP dispatch to HTTP bridge to development adapter ran on an ephemeral loopback server; real Ableton runtime proof is explicitly deferred because active-Set mutation and install/restart were prohibited.

## Behavior and safety guarantees

- `ableton_plan_plugin_output_routing` validates the exact source track and SSD5 device and never changes routing or creates tracks.
- Live output channels are reported only when already observable from an audio receiver whose current input routing type is the requested source. Otherwise the response contains `discoveryStatus: receiver_required`, an empty channel list, and a manual bootstrap diagnostic.
- `sourceRoutingType` matches only an exact Live display name or identifier. An exact identifier has precedence; a display name shared by different identifiers fails as ambiguous. Output channels match only exact, unambiguous display names. No fuzzy matching or inferred labels exist.
- `receiver_required` is returned only after the requested source routing option is proven available. An unknown selector returns `404 sourceRoutingType is not available` without changing state.
- `ableton_apply_plugin_output_routing` accepts an explicit output-to-track array, preflights observable channels and name conflicts, creates only missing audio tracks, sets Monitor In, and verifies routing plus monitoring readback.
- Repeated apply reuses only exact verified receiver matches. A same-name mismatched receiver fails rather than being rewritten or duplicated.
- Any failure after track creation deletes every track created by that request in reverse order, locating each by object identity; existing tracks are never deleted or modified.

## Simplicity review

The change adds two narrow public operations and keeps existing large MCP/Remote Script/adapter entrypoints as thin wiring. Routing behavior, validation, and modern/legacy option handling live in focused modules below 300 lines. Collection lookups use sets/maps and bounded 64-route input. No dependency, unrelated cleanup, broad rewrite, GUI automation, plugin-host attachment, or SSD5 internal-mixer control was introduced.

## Goal Verification Map

- AC1 — `A listed MCP planning tool asserts the SSD5 source track and available plugin output channels, returning a proposed receiver-track map without changing project state.` Evidence: `node test/plugin-output-routing.mjs` and `python3 test/live_plugin_routing_test.py`; paths `src/plugin-output-routing-tools.js`, `bridge/development/plugin-output-routing.js`, `ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py`, `test/plugin-output-routing.mjs`, and `test/live_plugin_routing_test.py`; assertions verify tool listing, byte-for-byte unchanged plan state, exact channels and proposed map, exact identifiers, ambiguity rejection, unavailable-selector rejection, and `receiver_required` only for a valid source type without an observer.
- AC2 — `A listed MCP apply tool accepts an explicit output-to-track map and tests assert it creates audio tracks with exact names, source routing type/channel, Monitor In state, and observable readback.` Evidence: the same focused Node/Python commands; paths `src/plugin-output-routing-tools.js`, `bridge/development/plugin-output-routing.js`, `ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py`, `test/plugin-output-routing.mjs`, and `test/live_plugin_routing_test.py`; assertions verify exact receiver names, source type/identifier, exact channels, monitoring state `0`/Monitor In on every created track, and `verified: true` readback through MCP dispatch and fake Live.
- AC3 — `Tests assert unsupported output names and partial routing failures return errors without leaving newly created receiver tracks behind, and repeated setup avoids duplicate receiver tracks.` Evidence: `node test/plugin-output-routing.mjs` and `python3 test/live_plugin_routing_test.py`; paths `bridge/development/plugin-output-routing.js`, `ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py`, `test/plugin-output-routing.mjs`, and `test/live_plugin_routing_test.py`; assertions verify unsupported/ambiguous channels create nothing, partial routing and name failures remove request-created objects by identity, conflicting same-name tracks fail, duplicate request fields reject, unrelated duplicate names do not block, and repeat apply reports zero new tracks.
- AC4 — `Command output asserts targeted Node and Python fake-Live tests plus npm test exit successfully and no request invokes a mutating endpoint on the user's active Ableton Set.` Evidence: `node test/plugin-output-routing.mjs` exited 0 with `plugin output routing ok`; `python3 test/live_plugin_routing_test.py` exited 0 with 15 tests passing; `npm test` exited 0 ending with `deterministic test suite ok`; focused tests use direct fake objects and an OS-assigned ephemeral localhost bridge and no command or request used the active Ableton bridge at `127.0.0.1:9789`.

## Commands and Results

- `node test/plugin-output-routing.mjs` exited 0 with `plugin output routing ok` after the sandbox-approved ephemeral localhost run.
- `python3 test/live_plugin_routing_test.py` exited 0: 15 tests passed after QA remediation.
- `npm test` exited 0 with all deterministic suites passing, ending in `deterministic test suite ok`.
- `node test/remote-script-static.mjs`, `node test/risk-policy.mjs`, and `node test/observability.mjs` exited 0.
- `python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing_validation.py ableton_remote_scripts/AbletonMcpBridge/live_routing_options.py` exited 0.
- `git diff --check` exited 0.
- `orchestra doc-sync audit --task ableton-ssd-multi-output-workflow-20260817` passed.
- Orchestra command, file, deferral, and developer-review evidence is recorded under `.agent-workflow/evidence/` and `.agent-workflow/reviews/` for this task.

## Architectural Concerns (inherited)

The pre-existing `src/tools.js`, `src/risk-policy.js`, `bridge/development-adapter.js`, `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`, and `ableton_remote_scripts/AbletonMcpBridge/live_mixer.py` are at or above module-boundary thresholds. This task adds only thin imports, routes, registrations, and method delegates to them and keeps new business rules in focused modules.

## Architectural Concerns (self-imposed)

- Two new MCP/HTTP operations are necessary because discovery must remain read-only while track creation is an explicit safe-write; combining them would violate the task's safety contract.
- Three focused Python modules separate workflow, routing-option compatibility, and request collection validation. Existing `AbletonMcpBridge.py` and `live_mixer.py` are already over the boundary threshold, so adding the business rules there was not acceptable.
- One focused JavaScript domain module and one MCP-schema module keep the already oversized `src/tools.js` and development adapter thin.
- `docs/ssd5-multi-output.md` is a separate guide because the manual receiver bootstrap and SSD5 internal-mixer prerequisite are operational instructions, not merely endpoint fields.

## Deferrals and Known Gaps

- The updated Remote Script has not been installed into Ableton and Ableton has not been restarted. Runtime behavior inside the user's Live version remains deferred.
- SSD5's internal mixer output assignments remain manual inside the plugin UI; the bridge cannot safely expose or set those hidden controls.
- For the active Set, first install/restart the updated Remote Script, manually route one disposable/existing audio receiver's Audio From to `Batería`, then call only the read-only plan. Review its exact labels before requesting any apply call.
- Applying the receiver map to the active Set requires separate explicit user approval. This developer phase did not perform that action.

## Real Product Proof

Status: local product path passed; external Ableton runtime proof deferred.

The Node focused test executed the actual MCP tool dispatch through an ephemeral HTTP bridge into `DevelopmentAbletonAdapter`, then asserted plan non-mutation and apply readback. Python tests executed the production Live-routing module against deterministic fake-Live objects. The updated Remote Script was deliberately not installed/restarted and no mutating call targeted the user's active Ableton Set. The active-Set next step is user-owned: install/restart, manually bootstrap one receiver so Live exposes SSD5 channel choices, run the read-only plan, review exact labels, then separately authorize apply.

## Machine-Readable Handoff Contract

```json
{
  "changedComponents": [
    "src/plugin-output-routing-tools.js",
    "src/tools.js",
    "src/bridge.js",
    "src/risk-policy.js",
    "bridge/development/plugin-output-routing.js",
    "bridge/development/routing-options.js",
    "bridge/development-adapter.js",
    "bridge/http-server.js",
    "bridge/observability.js",
    "ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py",
    "ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing_validation.py",
    "ableton_remote_scripts/AbletonMcpBridge/live_routing_options.py",
    "ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py",
    "ableton_remote_scripts/AbletonMcpBridge/live_observability.py",
    "test/plugin-output-routing.mjs",
    "test/live_plugin_routing_test.py",
    "test/deterministic.mjs",
    "test/remote-script-static.mjs",
    "test/compatibility-matrix.mjs",
    "docs/ssd5-multi-output.md",
    "docs/ableton-bridge-contract.md",
    "docs/ableton-python-remote-script.md",
    "docs/ableton-compatibility.md",
    "docs/risk-policy.md",
    ".generated-prompts/code.md",
    ".generated-prompts/tests.md",
    ".generated-prompts/docs.md",
    ".generated-prompts/services.md"
  ],
  "behaviorChanged": [
    "Added a read-only SSD5 plugin-output routing planner with structured receiver bootstrap diagnostics",
    "Added an explicit atomic and idempotent receiver-track apply operation with exact routing, Monitor In, verified readback, and reverse identity rollback",
    "Made display-name selection fail closed on ambiguity while preserving unique exact identifier selection",
    "Reject unavailable sourceRoutingType before returning receiver_required"
  ],
  "unitTests": [
    "test/plugin-output-routing.mjs",
    "test/live_plugin_routing_test.py",
    "test/deterministic.mjs",
    "test/remote-script-static.mjs",
    "test/compatibility-matrix.mjs"
  ],
  "commandsRun": [
    {
      "command": "node test/plugin-output-routing.mjs",
      "exitCode": 0,
      "result": "plugin output routing ok"
    },
    {
      "command": "python3 test/live_plugin_routing_test.py",
      "exitCode": 0,
      "result": "15 tests passed"
    },
    {
      "command": "npm test",
      "exitCode": 0,
      "result": "all deterministic suites passed; deterministic test suite ok"
    },
    {
      "command": "node test/remote-script-static.mjs && node test/risk-policy.mjs && node test/observability.mjs",
      "exitCode": 0,
      "result": "all focused static, policy, and observability checks passed"
    },
    {
      "command": "python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing_validation.py ableton_remote_scripts/AbletonMcpBridge/live_routing_options.py",
      "exitCode": 0,
      "result": "Python compilation passed"
    },
    {
      "command": "git diff --check",
      "exitCode": 0,
      "result": "no whitespace errors"
    },
    {
      "command": "orchestra doc-sync audit --task ableton-ssd-multi-output-workflow-20260817",
      "exitCode": 0,
      "result": "documentation sync audit passed"
    }
  ],
  "changedFileTraceability": [
    {
      "acceptanceCriteria": ["AC1", "AC2"],
      "paths": ["src/plugin-output-routing-tools.js", "src/tools.js", "src/bridge.js", "src/risk-policy.js"],
      "assertion": "MCP schemas, listing, validation, dispatch, bridge actions, and read/safe-write classification"
    },
    {
      "acceptanceCriteria": ["AC1", "AC2", "AC3"],
      "paths": ["bridge/development/plugin-output-routing.js", "bridge/development/routing-options.js", "bridge/development-adapter.js", "bridge/http-server.js", "bridge/observability.js"],
      "assertion": "Deterministic plan/apply, strict resolution, bootstrap, idempotence, rollback, readback, HTTP, and support metadata"
    },
    {
      "acceptanceCriteria": ["AC1", "AC2", "AC3"],
      "paths": ["ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing.py", "ableton_remote_scripts/AbletonMcpBridge/live_plugin_routing_validation.py", "ableton_remote_scripts/AbletonMcpBridge/live_routing_options.py", "ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py", "ableton_remote_scripts/AbletonMcpBridge/live_observability.py"],
      "assertion": "Modern dictionary and legacy routing support, strict selectors, Monitor In, verified readback, and identity rollback"
    },
    {
      "acceptanceCriteria": ["AC1", "AC2", "AC3", "AC4"],
      "paths": ["test/plugin-output-routing.mjs", "test/live_plugin_routing_test.py", "test/deterministic.mjs", "test/remote-script-static.mjs", "test/compatibility-matrix.mjs"],
      "assertion": "Deterministic behavior, rollback, parity, static registry, compatibility, and full-suite coverage"
    },
    {
      "acceptanceCriteria": ["AC1", "AC2", "AC3", "AC4"],
      "paths": ["docs/ssd5-multi-output.md", "docs/ableton-bridge-contract.md", "docs/ableton-python-remote-script.md", "docs/ableton-compatibility.md", "docs/risk-policy.md", ".generated-prompts/code.md", ".generated-prompts/tests.md", ".generated-prompts/docs.md", ".generated-prompts/services.md"],
      "assertion": "Public contract, safety/compatibility guidance, bootstrap gap, and required prompt-registry traceability"
    }
  ],
  "simplicityReview": {
    "result": "pass",
    "assertion": "Two narrow public operations; focused modules under 300 lines; thin wiring in pre-existing oversized entrypoints; no new dependency or unrelated rewrite"
  },
  "goalVerificationMap": [
    {
      "acceptanceCriterion": "AC1",
      "commands": ["node test/plugin-output-routing.mjs", "python3 test/live_plugin_routing_test.py"],
      "paths": ["test/plugin-output-routing.mjs", "test/live_plugin_routing_test.py"],
      "assertions": ["tool listed", "plan state unchanged", "exact channels and proposed map", "valid bootstrap diagnostic", "strict source selection"]
    },
    {
      "acceptanceCriterion": "AC2",
      "commands": ["node test/plugin-output-routing.mjs", "python3 test/live_plugin_routing_test.py"],
      "paths": ["test/plugin-output-routing.mjs", "test/live_plugin_routing_test.py"],
      "assertions": ["exact receiver names", "exact source type and channel", "Monitor In on every created track", "verified readback"]
    },
    {
      "acceptanceCriterion": "AC3",
      "commands": ["node test/plugin-output-routing.mjs", "python3 test/live_plugin_routing_test.py"],
      "paths": ["test/plugin-output-routing.mjs", "test/live_plugin_routing_test.py"],
      "assertions": ["unsupported and ambiguous routes reject", "partial failures rollback created identities", "conflicts reject", "repeat apply creates no duplicates"]
    },
    {
      "acceptanceCriterion": "AC4",
      "commands": ["node test/plugin-output-routing.mjs", "python3 test/live_plugin_routing_test.py", "npm test"],
      "paths": ["test/plugin-output-routing.mjs", "test/live_plugin_routing_test.py", "package.json"],
      "assertions": ["focused Node exits 0", "15 fake-Live tests exit 0", "npm test exits 0", "only fake objects and an ephemeral bridge are used; no mutating active-Set request is invoked"]
    }
  ],
  "knownGaps": [
    {
      "gap": "Updated Remote Script not installed or restarted and active Ableton runtime not exercised",
      "owner": "user/project",
      "nextStep": "Install and restart, manually bootstrap an SSD5 receiver, then run the read-only plan"
    },
    {
      "gap": "SSD5 internal mixer output assignments are not exposed through the Live Object Model",
      "owner": "user",
      "nextStep": "Assign SSD5 kit-piece outputs in the plugin UI before discovery"
    },
    {
      "gap": "Active-Set apply remains unexecuted",
      "owner": "user",
      "nextStep": "Review exact plan labels and separately authorize the mutating apply operation"
    }
  ],
  "architecturalConcerns": {
    "inherited": [
      "Pre-existing oversized src/tools.js, src/risk-policy.js, bridge/development-adapter.js, AbletonMcpBridge.py, and live_mixer.py require thin wiring only"
    ],
    "selfImposed": [
      "Separate read-only plan and explicit safe-write apply public operations",
      "Focused Python workflow, routing compatibility, and validation modules",
      "Focused JavaScript domain and MCP schema modules",
      "Dedicated SSD5 operational guide"
    ]
  },
  "realProductProof": {
    "status": "local_product_path_passed_external_live_deferred",
    "localProof": "Actual MCP dispatch -> ephemeral HTTP bridge -> DevelopmentAbletonAdapter executed and plan/apply readback assertions passed; production Python routing executed against deterministic fake-Live objects",
    "externalDeferral": "Updated Remote Script was not installed/restarted and no mutating request targeted the user's active Ableton Set",
    "nextStep": "User installs/restarts, manually bootstraps one SSD5 receiver, runs read-only plan, reviews exact labels, and separately authorizes apply"
  }
}
```

## QA remediation

- Resolved the QA High finding where duplicate exact display names with different identifiers silently selected the first option. Both modern/legacy Python routing and deterministic JavaScript parity now reject the ambiguous label, while an exact identifier still selects its corresponding option.
- Resolved the QA High finding where an unavailable `sourceRoutingType` was misreported as `receiver_required`. Planning now proves the option exists somewhere in Live's available routing types before deciding whether a routed receiver bootstrap is needed.
- Added zero-mutation Python and Node regressions for ambiguous source labels, exact identifier precedence, unavailable selectors, and ambiguous output-channel labels. Focused and full deterministic gates pass.
