# Evidence ableton-adapter-modularization-20260720: command

- Role: developer
- Summary: Modularized adapters without changing public endpoint/tool contracts. Development adapter now imports domain modules under bridge/development for state, mixer, devices, plugins, and utilities. Remote Script live_api.py is now a facade over live_browser, live_clips, live_core, live_devices, live_mastering, live_mixer, live_snapshots, and live_summaries. Validation passed: npm test; python3 -m py_compile AbletonMcpBridge Python modules. Size evidence: live_api.py 10 lines; development-adapter.js 456 lines plus focused helper modules.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
