# Evidence ableton-session-scene-tempo-signature-20260820: command

- Role: developer
- Summary: QA P0 remediation: target-isolation regressions and complete offline gates pass
- Path: not applicable
- Command: node test/scene-tempo-signature.mjs; node test/scene-tempo-signature-mcp.mjs; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_scene_tempo_signature_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_capabilities_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py; node test/capability-aware-tools.mjs; node test/remote-script-static.mjs; node test/risk-policy.mjs; npm test; git diff --check; orchestra doc-sync audit --task ableton-session-scene-tempo-signature-20260820
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: integration
- Assertions: Request contract and request payload are asserted for removal and shift between setters. Response body, response acknowledgement, error contract, journal schema, and rollback diagnostics are asserted. Node and fake-Live Python receiver-side state proves the external side effect: Scene A receives only the first tempo setter, shifted replacement Scene B receives zero forward or rollback setters, and no configured active Ableton bridge or Set is contacted.
- External validation: Independent QA must rerun the deterministic receiver-state fixtures; exact original and replacement write logs plus serialized diagnostic shapes are asserted in both runtimes.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
