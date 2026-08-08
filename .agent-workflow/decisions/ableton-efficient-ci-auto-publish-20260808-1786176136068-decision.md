# Decision ableton-efficient-ci-auto-publish-20260808: Implementation story points

- Status: accepted
- Owner: developer

## Context
developer completed developer

## Decision
3 points

## Consequences
Consumed context files recorded. Changed files recorded. Changed-file traceability recorded. Simplicity review recorded. Goal-to-verification map recorded. Architectural concerns recorded. Handoff summary ready. AC1 verification pending: CI runs one Node 18 job for human pull requests and pushes to main, skips Dependabot, and cancels obsolete runs for the same ref. -> requires an observable artifact, executed command, and explicit assertion. AC2 verification pending: Publish workflow triggers only for package.json changes on main by non-Dependabot actors and verifies the previous and current version differ before expensive steps. -> requires an observable artifact, executed command, and explicit assertion. AC3 verification pending: Publication uses Node 24, validates package-lock version parity, runs deterministic tests and package checks, and publishes with OIDC provenance through the npm environment. -> requires an observable artifact, executed command, and explicit assertion. AC4 verification pending: Static release-contract checks and the deterministic suite pass. -> requires an observable artifact, executed command, and explicit assertion.
