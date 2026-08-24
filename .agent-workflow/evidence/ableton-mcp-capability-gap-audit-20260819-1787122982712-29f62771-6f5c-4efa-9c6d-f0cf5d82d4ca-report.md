# Evidence ableton-mcp-capability-gap-audit-20260819: report

- Role: qa
- Summary: Read-only capability audit compared 55 advertised MCP tools plus two plugin-routing and two Arrangement-insertion tools against the Remote Script route registry, dispatch code, compatibility metadata, README, product workflows, and current Live evidence. Hard unsupported Live actions: device reorder, automation writing, render export, track/stem bounce, render-backed analyze-and-apply mastering; clip consolidation is also explicitly unsupported in the Remote Script. Direct /midi/import is unsupported but the MCP import tool works by parsing locally and writing Session MIDI. Save/Save As is not registered, snapshots are partial/in-memory, plugin parameters are limited to exposed automatable parameters, and several operations are host-conditional.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
