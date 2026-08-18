# Evidence ableton-meter-sdk-update-research-20260811: command

- Role: architect
- Summary: Local inspection confirms /Applications/Ableton Live 12 Lite.app is version 12.4.2. package.json has no Ableton SDK dependency. The meter bridge directly reads Track.output_meter_left, output_meter_right, and output_meter_level in ableton_remote_scripts/AbletonMcpBridge/live_meter_cache.py and live_mixer.py, with polling/listener caching.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
