# Release Checklist

This checklist defines the expected bar for publishing `@jterrats/ableton-live-mcp@0.1.0`.

## Required Local Checks

- `npm test`
- `python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/*.py`
- `npm pack --dry-run`
- `ableton-live-mcp doctor --app-path "/Applications/Ableton Live 12 Lite.app"`

## Required Live Checks

- Install the Remote Script with `ableton-live-mcp install-remote-script --app-path "<Ableton app path>"`.
- Restart Ableton Live after installation.
- Select `AbletonMcpBridge` in Preferences -> Link, Tempo & MIDI.
- Run `doctor` and confirm file freshness is `fresh`, the bridge is reachable, and stale runtime status is `not_detected`.
- Run read-only smoke before write smoke on user projects.
- Create a snapshot before safe-write, mastering, export, or destructive workflows.

## 0.1.0 Scope

- Local MCP stdio server.
- Bundled Ableton Python Remote Script bridge.
- Deterministic development bridge and tests.
- Track, return, master, device, routing, MIDI clip, snapshot, observability, risk, and workflow tools.
- Closed-loop mixer write verification through `writeVerification`.

## Known Constraints

- Some Remote Script endpoints remain conditional because Live Python APIs vary by edition/version.
- Render and bounce are supported by the deterministic development bridge; the Python Remote Script returns explicit unsupported responses where Live does not expose reliable render APIs.
- macOS may require sudo plus App Management or Full Disk Access before copying into `/Applications`.
