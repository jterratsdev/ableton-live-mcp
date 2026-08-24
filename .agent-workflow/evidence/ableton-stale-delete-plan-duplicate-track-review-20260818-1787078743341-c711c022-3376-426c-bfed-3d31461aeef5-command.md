# Evidence ableton-stale-delete-plan-duplicate-track-review-20260818: command

- Role: qa
- Summary: Deterministic recreated-proxy diagnostics reproduce both reported defects without contacting Live.
- Path: ableton_remote_scripts/AbletonMcpBridge/live_arrangement_delete.py
- Command: python3 -c '<recreated Live proxy diagnostics for deletion plans and duplicate-track resolver>'
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: two-bug-reproduction
- Automation surface: api
- Assertions: Request contract: three deletion plans use unchanged observable track/clip data, and duplicate resolution uses source index 1 with expected destination index 2. Response contract: all three planToken, trackIdentity, and clipIdentity values differ; duplicate resolution selects index 0 and renames it while destination index 2 keeps its old name. Schema contract: diagnostics inspect planToken/candidates trackIdentity/clipIdentity and duplicate resolver index/name outputs. External side effect: fake in-memory proxies only; active Ableton port 9789 is never called. Sandbox validation: both diagnostics exit 0 and print unstable proxy identity reproduced plus wrong track zero rename reproduced.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
