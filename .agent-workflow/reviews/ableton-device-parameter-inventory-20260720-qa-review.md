# Review ableton-device-parameter-inventory-20260720: qa

- Result: approve
- Severity: info
- Findings: GET /devices/parameters is covered in MCP smoke, bridge integration tests, Remote Script static route/import checks, and Python compilation. Device indices in the Remote Script are now returned from explicit track enumeration instead of canonical_parent inference.
- Recommendation: Accept. Reinstall or recopy AbletonMcpBridge into Ableton Live before live use so the new endpoint is available in the selected Control Surface.
