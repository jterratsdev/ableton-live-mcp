# Evidence ableton-isolate-pending-changes-commits-20260820: command

- Role: release_manager
- Summary: Observable verifier evidence for isolated-local-commits: committed integration, deterministic tests, clean product tree, package manifest, and exact installed-source equality.
- Path: test/deterministic.mjs
- Command: npm test
- Exit code: 0
- Diff excerpt: stdout: all registered suites ended deterministic test suite ok; stderr: empty; artifacts: test/deterministic.mjs and commit b47fa41; resulting state: committed product paths clean and installed Remote Script diff empty
- Verifier contract: isolated-local-commits
- Automation surface: cli
- Assertions: Assert exit code equals 0. Assert stdout contains deterministic test suite ok and every focused suite marker. Assert stderr is empty. Assert artifact file test/deterministic.mjs is the suite registry. Assert final state has no product diff from HEAD. Assert final state has no recursive difference between committed source and installed Remote Script.
- External validation: Exact committed Remote Script recursively equals installed Ableton Live Suite directory; backup exists; Live remained running without restart and no bridge or Set call occurred.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
