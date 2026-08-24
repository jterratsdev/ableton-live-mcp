Task id: ableton-session-scene-tempo-signature-20260820
Phase: po
Role: product_owner
Runtime: codex-cli
Session id: ableton-session-scene-tempo-signature-20260820:wfrun-1787519127542-f884c8:po:codex-cli

# Product Owner Handoff

## Outcome

- Result: pass for PO refinement; ready for architect review.
- Close status: PO phase complete. This artifact does not approve release or replace implementation and QA evidence.
- Backlog item: `ableton-session-scene-tempo-signature-20260820` — Control tempo and time signature per Session scene.
- Goal: expose capability-gated MCP operations for reading and safely setting or clearing per-Session-scene tempo and time-signature overrides without claiming Arrangement automation.
- Dependencies: Orchestra task context reports dependencies satisfied. Architecture, implementation, offline verification, and the human `qa→release` gate remain downstream controls.

## Scope Decision

Keep the work as one vertical product story. Although it spans five ownership paths and nine acceptance criteria, capability discovery, exact-index targeting, atomic mutation, route advertisement, documentation, and offline contract verification describe one externally indivisible journey. Splitting them would permit an unsafe intermediate state: a mutation without truthful discovery, an advertised tool without a supported route, or documentation that does not match behavior.

Architect and developer may partition modules and test work internally, but the product increment is accepted only when AC1–AC9 pass together.

## In Scope

- Read-only discovery of per-scene tempo and time-signature property capabilities.
- Exact zero-based `sceneIndex` targeting of an existing Session scene.
- Tagged set/clear actions for tempo and time signature, individually or combined.
- Fail-closed preflight, deterministic write ordering, fresh readback, atomic rollback, and explicit failure reporting.
- Conditional tool registration based on a truthful bridge handshake.
- Equivalent deterministic development fixtures, authoritative user-facing copy, and offline Node/Python contract tests.

## Non-Goals

- Arrangement tempo envelopes or Arrangement time-signature markers.
- Global Song tempo or time-signature fallback writes.
- Scene creation, deletion, renaming, launching, or lifecycle management.
- Clip, transport, playback, or launch-state mutation.
- Fuzzy or name-only scene selection.
- Inferring support from Ableton edition, version, or product tier.
- Live Set mutation during offline validation; real-Live validation requires separate explicit approval.
- Installation, publishing, tagging, pushing, or deployment in this PO phase.

## Assumptions and Business Rules

- `song.scenes[sceneIndex]` is the authoritative request-time target; scene names are descriptive and may be empty or duplicated.
- The bridge may expose absent, descriptor-incompatible, or exception-raising properties. These are unavailable capabilities with non-empty reasons, never inferred support.
- Live represents disabled override values with `-1`; normalized output is `null`, while raw observations retain `-1`.
- Live does not expose a disabled family's hidden retained value. Restoring a disabled pre-state therefore means disabling it and verifying the sentinel, not inventing or overwriting a hidden value.
- A combined request is one transaction. If either requested family cannot satisfy full preflight, neither family writes.
- Idempotency does not waive capability checks or fresh readback.
- All forward and rollback setters are pinned to the exact Scene receiver captured at preflight. Fresh `song.scenes[sceneIndex]` resolution is used only for post-write or rollback readback and verification; it must never choose a mutation receiver.
- A stale pinned receiver may fail, but must not redirect a write to a replacement Scene. Such failure is surfaced with rollback diagnostics and cannot be reported as success.

## Ambiguities and Tradeoffs Resolved

- **Index versus object identity:** the serialized API uses exact index, but index alone cannot safely select a later mutation receiver after scene replacement. The accepted interpretation is request-time index resolution plus a pinned preflight receiver for every setter, with fresh index resolution only for canonical verification.
- **Recreated proxies:** a fresh proxy representing the same logical target may satisfy readback. A replacement, removal, shift, missing target, structural change, or value mismatch fails verification; fingerprint similarity alone never authorizes a setter.
- **Clear semantics:** clear disables only. It deliberately preserves an inaccessible retained value instead of fabricating a replacement value.
- **No-op optimization:** equal values may skip physical setters, but fail-closed preflight and verification remain mandatory.
- **Breadth versus split:** keeping one story raises verification cost but preserves one coherent safety boundary and prevents partially usable releases.

## Refined Acceptance Assessment

| AC | PO definition assessment | Evidence status for release |
|---|---|---|
| AC1 | Testable: exact-index discovery returns target metadata and independent readable/writable/reason capability records with zero setters. | Product definition satisfied. Runtime behavior still requires command evidence. |
| AC2 | Testable: schema and boundary matrix rejects every listed invalid shape/value before any write. | Product definition satisfied. Runtime behavior still requires zero-setter tests. |
| AC3 | Testable with duplicate/empty names, exact indexes, recreated proxies, same-fingerprint replacements, removals, and shifts; no unrelated surface may mutate. | Product definition satisfied with pinned-writer clarification. Isolation evidence is release-blocking. |
| AC4 | Testable by full/partial capability matrices, including idempotent and combined requests, with all-or-nothing preflight. | Product definition satisfied. Matrix evidence is release-blocking. |
| AC5 | Testable via setter journals and fresh raw/normalized readback for set, clear, combined, and no-op requests. | Product definition satisfied. Ordering and sentinel evidence is release-blocking. |
| AC6 | Testable through setter/readback/re-resolution failures, reverse compensation, pinned compensation receivers, rollback verification, and rollback-failure reporting. | Product definition satisfied. Atomicity and adversarial replacement evidence is release-blocking. |
| AC7 | Testable through response-shape assertions, route/registry parity, and absent/malformed/unreachable handshake fixtures. | Product definition satisfied. Registry and handshake evidence is release-blocking. |
| AC8 | Testable through authoritative copy inspection and mutation-spy assertions proving no launch, Arrangement, or global fallback behavior. | Product definition satisfied. Documentation and non-mutation evidence is release-blocking. |
| AC9 | Testable command contract is explicit and offline-only. | Product definition satisfied. Exact focused/full command outputs are release-blocking. |

The PO artifact itself satisfies the product-definition aspects of AC1–AC9: scope, observable outcomes, boundaries, edge cases, and success criteria are unambiguous. It does not independently prove the implementation. The current Orchestra context cites an existing QA approval stating AC1–AC9 passed after pinned-receiver remediation, but the context bundle was trimmed and omitted detailed handoffs and most raw evidence. Therefore the downstream workflow must retain or revalidate exact implementation evidence before release; the summary alone is not sufficient proof.

## Test Scenarios and Expected Results

| Scenario | Target surface / environment | Expected observable result | How result was obtained |
|---|---|---|---|
| Capability discovery | API, integration, local sandbox | Exact target metadata; per-property readable/writable/reason details; no setter calls; unsupported probes fail closed. | Derived directly from AC1 and converted into observable assertions. |
| Input validation matrix | MCP/HTTP API, local sandbox | Every invalid index/action/value is rejected before any setter; exact valid existing indexes proceed. | Derived from AC2 boundary list. |
| Duplicate and empty names | Integration, Python/Node fake Live | Only the indexed scene is targeted; names never select a scene. | Derived from AC3 identity rule. |
| Partial capability and combined request | Integration, local sandbox | Missing any required property rejects the whole operation, including an otherwise supported family and idempotent input. | Derived from AC4 all-or-nothing preflight. |
| Set, clear, combined, idempotent | Integration, local sandbox | Journal order matches AC5; clear writes only enable false; normalized/raw sentinels are exact; no-op still verifies. | Derived from AC5 ordering and observation rules. |
| Mid-sequence setter failure | Integration, local sandbox | Every actually written field is compensated in reverse order and full final state is reported. | Derived from AC6 transaction contract. |
| Same-fingerprint replacement or shifted scene | Integration, adversarial fake Live | Replacement receives zero setters; pinned original receives attempted forward/rollback setters; fresh readback prevents false success. | Derived from accepted pinned-receiver decision resolving AC3/AC6 ambiguity. |
| Recreated proxy readback | Integration, fake Live | Canonical fresh readback succeeds when it observes the expected logical target and exact values. | Derived from AC3/AC5. |
| Rollback failure | Integration, local sandbox | Original failure remains primary; rollback attempted/succeeded, individual failures, and final observed state are explicit; success is impossible. | Derived from AC6. |
| Handshake and tool registry parity | Workflow/runtime, integration | Tool appears only with a valid supported route; absent, malformed, or unreachable handshake hides it; fixture matches production semantics. | Derived from AC7. |
| Documentation boundary | Generated artifact / docs | Copy says effect occurs only on later explicit scene launch and disclaims scene launch, Arrangement automation, and global fallback. | Derived from AC8. |
| Offline release contract | CLI, local sandbox | Focused MCP/HTTP/Python tests, registry parity, `py_compile`, `npm test`, and `git diff --check` pass without bridge contact or Live Set mutation. | Derived from AC9; execution belongs to developer/QA. |

## Risks and Release Blockers

- Highest risk: an index-resolved replacement Scene receiving forward or rollback setters. Required mitigation is the pinned preflight receiver invariant plus adversarial same-fingerprint, removal, and shift tests in both runtimes.
- High risk: falsely reporting atomic rollback when hidden disabled values cannot be restored. Required mitigation is explicit sentinel-based disabled-state restoration and exact rollback diagnostics.
- High risk: tool advertisement drifting from bridge route support. Required mitigation is registry/route parity and malformed-handshake fail-closed fixtures.
- Medium risk: trimmed Orchestra context omitted six handoffs, seven reviews, and most raw evidence. This limits this PO agent's ability to independently attest current implementation readiness; exact downstream evidence must be checked at QA/release gates.
- Real-Live capability discovery and mutation are intentionally deferred. They are not required by AC9's offline gate and must not be silently treated as completed production validation.

## Consumed Context Files

- `.agent-workflow/runs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-runtime-codex-cli-spawn-prompt.md` — read completely; applied goal, AC1–AC9, ownership paths, command boundary, context policy, PO playbook, return contract, and lifecycle requirement.
- `.agent-workflow/playbooks/po.md` — consumed in full through the prompt bundle; applied refinement, assumptions, non-goals, ambiguity/tradeoff, sizing/split, dependencies, edge cases, and scope rules.
- `AGENTS.md` — consumed through the required prompt excerpt supplied by Orchestra; applied Orchestra-only workflow, evidence, gate, and no-publish restrictions. The excerpt was reduced after the runtime-bootstrap opening; deeper rules were not needed because this assignment only creates the prescribed handoff and lifecycle record.
- `.agent-workflow/reviews/ableton-session-scene-tempo-signature-20260820-qa-review.md` — read to understand current pinned-receiver remediation status; treated as supporting context, not replacement for raw evidence.
- `.agent-workflow/decisions/ableton-session-scene-tempo-signature-20260820-1787204648881-decision.md` — applied accepted pinned-receiver rule.
- `.agent-workflow/decisions/ableton-session-scene-tempo-signature-20260820-1787185688797-decision.md` — applied accepted no-split decision.
- `src`, `bridge`, `ableton_remote_scripts/AbletonMcpBridge`, `docs`, and `test` — directory references were present in the reduced context but raw contents were intentionally not loaded because the PO task required product refinement, not implementation inspection.
- Primary skill rules: `doc-sync` influenced the requirement that authoritative docs and copy remain part of AC8. Other listed skills were role-inapplicable or downstream (`agent-learning`, `collection-standards`, `source-of-truth`, `prompt-registry`, `pr-review`, `diagram-export`, `model-evaluation`, `playwright-evidence`, `static-analysis`, `release-readiness`) and were not invoked for this PO-only artifact.

## Touched Files

- `.agent-workflow/handoffs/ableton-session-scene-tempo-signature-20260820-wfrun-1787519127542-f884c8-po-product_owner-runtime-handoff.md` — created this PO result artifact.
- No implementation, test, documentation, bridge, or release files were modified.

## Commands Run

- Read the complete runtime child prompt with `sed`.
- Ran `orchestra context --task ableton-session-scene-tempo-signature-20260820` — pass; context loaded, dependencies satisfied, bundle reported trimmed evidence/reviews/handoffs.
- Ran `orchestra workflow render --task ableton-session-scene-tempo-signature-20260820 --phase po --target codex --json` — pass; official PO playbook and downstream templates rendered.
- Used read-only `rg`/`sed` inspection to locate and read the applicable QA review and accepted PO/architecture decisions — pass.
- No implementation or QA test command was executed by this Product Owner assignment.

## Final PO Recommendation

Approve the refined backlog item for architect review. Do not approve release from this artifact alone. Release requires exact, current evidence for all AC1–AC9, explicit human approval at the `qa→release` gate, and separate authorization for any tag, push, publish, or deployment action.
