# Evidence ableton-live-readonly-safety-contract-validation-20260723: command

- Role: qa
- Summary: Read-only Live validation after reinstall/restart. GET /status and GET /project returned HTTP 200. Project reported 140 BPM, 3/4, and distinct volumeRaw/volumeDb/volumeDisplay values. Restored track displays remained Piano -7.372 dB, Strings -8.337 dB, Flute -10.161 dB, Guitar -5.68 dB. mixerContract.version=2 and safeForAutomatedMixing=true. SHA-1 hashes for installed live_core.py, live_mixer.py, live_snapshots.py, and AbletonMcpBridge.py exactly matched workspace copies. No POST/write/snapshot/rollback/transport/device endpoint was invoked.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
