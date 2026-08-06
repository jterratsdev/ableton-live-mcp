# Evidence ableton-push-site-migration-20260806: command

- Role: release_manager
- Summary: Pre-commit release validation passed for the scoped product-site and repository-migration delivery.
- Path: not applicable
- Command: git diff --cached --check; npm test; npm run check:site
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: cli
- Assertions: Exit code: all three commands exit 0; stdout: deterministic test suite and site contract report ok; stderr: empty for whitespace and validation failures; artifact references: staged diff containing site/, deploy-cloudflare-pages.yml, package metadata, validators, and task-specific Orchestra artifacts; final state: scoped index is ready for commit and unrelated pre-existing files remain unstaged.
- External validation: not provided
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
