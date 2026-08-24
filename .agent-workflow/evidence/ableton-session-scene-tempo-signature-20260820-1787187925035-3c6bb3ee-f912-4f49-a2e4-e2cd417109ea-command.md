# Evidence ableton-session-scene-tempo-signature-20260820: command

- Role: developer
- Summary: Developer AC1-AC9 offline gate passed: focused Node transaction, MCP-to-direct-HTTP-handler, fake-Live Python, capability parity, isolated-cache py_compile, Remote Script static, full npm deterministic suite, doc-sync audit, and git diff check all passed.
- Path: not applicable
- Command: node test/scene-tempo-signature.mjs && node test/scene-tempo-signature-mcp.mjs && python3 test/live_scene_tempo_signature_test.py && python3 test/live_capabilities_test.py && PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py && node test/capability-aware-tools.mjs && node test/remote-script-static.mjs && npm test && git diff --check
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: scene-tempo-signature-contract
- Automation surface: api
- Assertions: Request contract: exact sceneIndex and tagged set/clear payloads plus malformed inputs are asserted. Response contract: exact target, requested, status, changedFields, normalized/raw observations, capabilities, journal, and rollback diagnostics are asserted. Schema contract: Node/Python route, tool, risk, action, capability, denominator, and JSON shapes are parity-checked. External side effect: fixture setter/state counters prove only the exact in-memory Scene changes and configured active bridge/Live Set calls equal zero. Sandbox validation: direct HTTP handler, deterministic development, and descriptor-backed fake-Live fixtures assert receiver-side state, idempotency, rollback, and failure recovery.
- External validation: Offline direct-handler and fake-Live contract validation; no real Live call is authorized or required for AC1-AC9.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
