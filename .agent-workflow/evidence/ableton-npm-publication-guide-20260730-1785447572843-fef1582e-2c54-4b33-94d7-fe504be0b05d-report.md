# Evidence ableton-npm-publication-guide-20260730: report

- Role: release_manager
- Summary: Read-only publication assessment: package.json is @jterrats/ableton-live-mcp@0.1.0 with public publishConfig and matching public GitHub repository; npm pack dry-run passes with 70 files; GitHub CI is green; npm whoami returns E401 (not authenticated); npm view returns E404 (package not yet published/name available); no Git tag exists; MCP Registry metadata is absent because package.json has no mcpName and repo has no server.json. Official npm docs require npm publish --access public plus 2FA or eligible token for direct initial publish. Official MCP Registry quickstart requires the npm artifact first, then server.json, GitHub login, and mcp-publisher publish; registry remains preview.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
