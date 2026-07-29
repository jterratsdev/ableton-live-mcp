# Evidence ableton-release-metadata-ci-v2-20260728: command

- Role: qa
- Summary: Real local validation passed: npm install --package-lock-only --ignore-scripts; npm run check:package; npm ci; npm audit --omit=dev (0 vulnerabilities); npm test (all deterministic suites pass); PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/*.py; npm pack --dry-run --json (70 files, 126679 bytes compressed, 551992 unpacked); git diff --check; secret-pattern scan found no matches; doctor reports 16 fresh installed files, running Live, reachable bridge, and no stale runtime. git remote -v remains empty. No push, tag, authentication, npm publish, or Ableton set write occurred.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
