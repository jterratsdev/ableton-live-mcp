# Evidence ableton-release-0-2-0-scene-p0-remediation-20260823: command

- Role: parent
- Summary: Parent rerun of the complete Scene receiver-isolation verifier passed at candidate b47fa41344db5513e5a610c065a98ee1e0517273: focused Node/Python receiver tests, MCP/capability/static parity, isolated py_compile, full npm test, package check, npm pack dry-run, and git diff check all exited zero offline.
- Path: not applicable
- Command: node test/scene-tempo-signature.mjs; node test/scene-tempo-signature-mcp.mjs; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-parent-scene-p0 python3 test/live_scene_tempo_signature_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-parent-scene-p0 python3 test/live_capabilities_test.py; PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-parent-scene-p0 python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/live_scene_tempo_signature.py ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_api.py ableton_remote_scripts/AbletonMcpBridge/live_observability.py; node test/capability-aware-tools.mjs; node test/remote-script-static.mjs; npm test; npm run check:package; npm pack --dry-run --ignore-scripts; git diff --check
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: scene-receiver-isolation
- Automation surface: api
- Assertions: Request payload and schema contract are asserted; response contract is asserted; contract and schema parity are asserted; receiver side effect and persisted setter logs prove the replacement Scene receives zero writes while the pinned original receives forward and reverse compensation attempts; sandbox fake-Live and in-memory contract fixtures validate the external side effect.
- External validation: Executed by the parent against deterministic in-memory Node and fake-Live Python receivers without calling the active bridge or Ableton.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
