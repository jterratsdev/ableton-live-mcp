# Handoff ableton-master-optional-mixer-properties-v2-20260723: developer to qa

## Task Context
- Title: Handle optional master mute and solo properties
- Goal: Make snapshot capture and rollback tolerate master mixer controls that are visible in Live but not exposed as Python API properties.
- Current owner: developer
- Current status: pending

## Acceptance Criteria
- A unit test asserts snapshot capture completes when master mute and solo are absent.
- A unit test asserts exception-raising master mute and solo descriptors produce supported=false and value=null.
- A unit test asserts rollback reports unsupported master mute and solo as skipped with zero failures and no property access exception.
- Command output shows targeted and full automated test suites pass without calling the running Ableton bridge.

## Scope And Paths
- ableton_remote_scripts/AbletonMcpBridge/live_snapshots.py
- test/live_snapshots_test.py

## Phase Handoff
- Status: ready_for_review
- Changed components: live_snapshots.py now guards optional proxy attributes with getattr/sentinel and omits unavailable Main mute/solo; tests add absent and RuntimeError-raising Main fixtures.
- Behavior changed: Snapshot no longer fails when Main lacks mute/solo. Rollback only accesses optional boolean fields captured as supported.
- Unit tests: Five Python snapshot tests, Node snapshot rollback, Python compile, full npm test, and diff check passed.
- Commands run: python3 test/live_snapshots_test.py; node test/snapshot-rollback.mjs; npm test; git diff --check
- Known gaps: none
- Risks: none
- Recommended Playwright coverage: not applicable
- Executor provenance: not recorded

## Transition Guard
- State transition: not recorded
- Required fields: none
- Contract result: not evaluated

## Flow-specific required context
- changed behavior
- commands run
- qa plan
- test evidence
