# Evidence ableton-project-save-live-diagnosis-20260817: report

- Role: qa
- Summary: SDK surface research: the current Live 12.3.5 Live Object Model reference lists Song.file_path as read-only plus Song functions, but no save/save-as function; Application likewise exposes no save function. Max for Live documentation states it accesses Live through that same LOM, so it cannot add project save. Ableton documents Control Surface Remote Scripts as controller integrations, not a supported general save SDK. Read-only scan of all installed Live 12 Lite MIDI Remote Script source/bytecode found save_live_set/save_as/save_document strings only in AbletonMcpBridge itself, never in Ableton's bundled scripts. Conclusion: no supported Ableton SDK surface for programmatic Set save was found.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
