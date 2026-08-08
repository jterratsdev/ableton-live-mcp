# Evidence ableton-efficient-ci-auto-publish-20260808: command

- Role: qa
- Summary: QA verified workflow syntax, event guards, version gating, and deterministic release contract.
- Path: scripts/check-package-release.mjs
- Command: npm test && ruby YAML.parse_file .github/workflows/ci.yml .github/workflows/publish.yml && git diff --check
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: shell
- Assertions: Exit status was 0. Observable output reported deterministic test suite ok and YAML parsing succeeded for both workflows. Diff check produced no errors. Inspection confirms CI uses one Node 18 runner, ignores Dependabot and documentation/history-only changes, cancels stale runs, and publication reaches the npm environment only after a real version change.
- External validation: Static QA only; no version bump or npm publication was triggered.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
