# Evidence ableton-release-0-2-0-finalize-20260821: command

- Role: qa
- Summary: Package candidate verification passed with observable CLI output.
- Path: .agent-workflow/evidence/ableton-release-0-2-0-finalize-20260821-1787352393405-1187e966-60e5-4d94-a2f0-8974b2d9b90b-command.md
- Command: npm ci; npm audit --omit=dev; npm test; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache-20260821 python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/*.py; npm run check:package; npm run check:site; npm pack --dry-run --ignore-scripts; git diff --check
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: release-package-candidate
- Automation surface: cli
- Assertions: Exit code: 0. Stdout: zero vulnerabilities, deterministic test suite ok, package release ok, site contract ok, npm notice for 0.2.0 with 95 files. Stderr: empty. Final state: synchronized 0.2.0 package candidate, clean product diff check, and no workflow/test/project artifacts in the tarball.
- External validation: Package checker and tarball allowlist independently confirm metadata and contents.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
