# Decision ableton-connector-product-site-20260804: Separate Pages artifact deployment from Cloudflare provisioning

- Status: accepted
- Owner: architect

## Context
Local plugin metadata explicitly exposes the official Cloudflare API MCP. Portfolio workflows prove Wrangler deployment, while local Orchestra evidence confirms custom domains were active without repository DNS definitions. The plugin had become uninstalled and was restored during this task.

## Decision
Use the official cloudflare@openai-curated plugin MCP (cloudflare-api search/execute) for account inspection, Pages project/custom-domain provisioning, and DNS; use Wrangler/GitHub Actions only for repeatable static artifact deployment.

## Consequences
Restart Codex to load cloudflare-api tools. Then provision/verify ableton-mcp.jterrats.dev through MCP and keep deployment automation in the repository workflow.
