# Evidence ableton-session-scene-tempo-signature-20260820: command

- Role: developer
- Summary: Second QA P0 remediation: pinned receiver prevents same-fingerprint replacement writes; complete offline gates pass
- Path: not applicable
- Command: node test/scene-tempo-signature.mjs; node test/scene-tempo-signature-mcp.mjs; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_scene_tempo_signature_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 test/live_capabilities_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py; node test/capability-aware-tools.mjs; node test/remote-script-static.mjs; node test/risk-policy.mjs; npm test; git diff --check; orchestra doc-sync audit --task ableton-session-scene-tempo-signature-20260820
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: integration
- Assertions: Request contract and request payload are asserted for same-name, same-property-shape, unchanged-count replacement after A.tempo. Response body, response acknowledgement, original readback error contract, journal schema, rollback verification, and no-success behavior are asserted. Deterministic Node and fake-Live Python receiver-side state proves the external side effect: every forward and compensation setter remains on pinned Scene A, replacement Scene B receives zero setters, and no configured active Ableton bridge or Set is contacted.
- External validation: Independent QA must rerun the same-fingerprint collision fixtures plus retained removal, shift, and missing-target fixtures in both runtimes.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
