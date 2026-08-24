# Gate Review: qa→release

- Run: wfrun-1787352193742-f5e862
- Task: ableton-release-0-2-0-finalize-20260821
- Transition: qa → release
- From role: qa
- To role: release_manager

## Task Context
- Title: Finalize npm and Remote Script release 0.2.0
- Goal: Prepare a clean 0.2.0 release candidate for the npm MCP package and bundled Ableton Remote Script, validate package contents and runtime artifacts, document unsupported surfaces, and stop before push/tag/publish unless separately authorized.

## Acceptance Criteria
- The release candidate contains only intended npm files and excludes Orchestra state, tests, user projects, and generated artifacts.
- package.json and package-lock.json are synchronized at the selected release version and package checks pass.
- Deterministic tests, Python compilation, package dry-run, and release checklist evidence are recorded from the exact candidate commit.
- Remote Script installation/restart and real-Live checks are either completed with evidence or explicitly deferred with owner and reason; no unsupported SDK behavior is advertised.

## Checklist
- [ ] Verification against acceptance criteria and edge cases
- [ ] Acceptance criteria are specific and traceable to the task goal
- [ ] Required evidence is clear for the next phase
- [ ] No open blockers

## Approval
Approve: orchestra workflow run --task ableton-release-0-2-0-finalize-20260821 --resume wfrun-1787352193742-f5e862
