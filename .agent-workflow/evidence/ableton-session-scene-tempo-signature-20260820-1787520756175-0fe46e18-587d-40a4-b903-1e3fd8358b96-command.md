# Evidence ableton-session-scene-tempo-signature-20260820: command

- Role: parent
- Summary: Fresh release-blocker verification at b47fa41344db5513e5a610c065a98ee1e0517273 passed AC1-AC9 offline. Node and Python same-fingerprint replacement fixtures prove the replacement Scene receives zero setters; all focused contracts, parity checks, py_compile, npm test, package 0.2.0 dry-run, and git diff check passed.
- Path: not applicable
- Command: node test/scene-tempo-signature.mjs; node test/scene-tempo-signature-mcp.mjs; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-parent-scene-p0 python3 test/live_scene_tempo_signature_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-parent-scene-p0 python3 test/live_capabilities_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-parent-scene-p0 python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py; node test/capability-aware-tools.mjs; node test/remote-script-static.mjs; npm test; npm run check:package; npm pack --dry-run --ignore-scripts; git diff --check
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: scene-tempo-signature-contract
- Automation surface: api
- Assertions: Request payload and schema contract are asserted for exact sceneIndex and tagged actions; response contract is asserted for success and rollback failures; contract and schema parity are asserted across MCP, development bridge, and Python Remote Script; receiver side effect and persisted setter logs prove a replacement Scene receives zero writes while the pinned original receives every forward and reverse compensation attempt; sandbox fake-Live and in-memory fixtures validate the external side effect without contacting Ableton.
- External validation: Executed by Developer, independent QA, and parent against deterministic Node and fake-Live Python receivers. Real Live mutation remains intentionally outside the offline AC9 scope.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
