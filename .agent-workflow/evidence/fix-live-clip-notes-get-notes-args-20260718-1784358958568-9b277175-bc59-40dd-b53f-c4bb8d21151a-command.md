# Evidence fix-live-clip-notes-get-notes-args-20260718: command

- Role: developer
- Summary: Live verification showed GET /clips/notes reached the new endpoint but failed with Live 12 signature mismatch: Clip.get_notes expected get_notes(self, double from_time, int from_pitch, double time_span, int pitch_span). Fixed repo Remote Script live_api.py to call clip.get_notes(0, 0, length_beats, 128). Validation passed: python3 -m py_compile for Remote Script files and npm test. Installed AbletonMcpBridge is root-owned, so user must rerun sudo install script and reselect/restart before live retest.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
