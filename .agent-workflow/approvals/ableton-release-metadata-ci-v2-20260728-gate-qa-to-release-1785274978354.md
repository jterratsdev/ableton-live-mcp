# Gate Review: qa→release

- Run: wfrun-1785274978271-435533
- Task: ableton-release-metadata-ci-v2-20260728
- Transition: qa → release
- From role: qa
- To role: release_manager

## Task Context
- Title: Prepare npm release metadata and CI
- Goal: Prepare a reproducible and guarded public npm release process for @jterrats/ableton-live-mcp without creating remote state or publishing.

## Acceptance Criteria
- Running npm run check:package exits 0 and reports valid repository, homepage, bugs, author, keywords, and public publish configuration.
- Running npm ci, npm audit --omit=dev, npm test, Python compilation, and npm pack --dry-run exits 0 with the committed lockfile.
- Running npm run check:package exits 0 after verifying CI invokes deterministic install, tests, Python compilation, and package validation on supported Node versions.
- Running npm run check:package exits 0 after verifying publishing is workflow_dispatch-only, requests OIDC permission, and runs validation before npm publish.
- Running git remote -v and git status confirms no remote, push, tag, GitHub repository, npm authentication, or npm publication was created by this task.

## Checklist
- [ ] Verification against acceptance criteria and edge cases
- [ ] Acceptance criteria are specific and traceable to the task goal
- [ ] Required evidence is clear for the next phase
- [ ] No open blockers

## Approval
Approve: orchestra workflow run --task ableton-release-metadata-ci-v2-20260728 --resume wfrun-1785274978271-435533
