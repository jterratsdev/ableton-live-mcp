# Review ableton-mcp-capability-gap-audit-20260819: qa

- Result: approve
- Severity: info
- Findings: Audit complete. High product-contract gaps: five unqualified tools (device reorder, automation, render export, bounce, render-backed mastering) are advertised although real Live always returns 501; README/workflow plans actively recommend some of them. Medium gaps: snapshot wording can imply .als safety though rollback is partial/in-memory; plugin parameter wording omits automatable-only exposure; plugin inventory is browser-indexed rather than exhaustive. Conditional tools are documented but tool descriptions often omit capability gating. Save/Save As is absent rather than falsely advertised.
- Recommendation: Keep the tools only if their descriptions and workflow plans are capability-aware; otherwise hide hard-unsupported tools in Remote Script mode. Add a single machine-readable capability handshake to gate tool exposure. Rename snapshot copy to bridge snapshot and surface rollback coverage. Preserve local MIDI import/audio analysis as MCP-owned capabilities.
