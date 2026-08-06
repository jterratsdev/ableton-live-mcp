# Decision ableton-connector-product-site-20260804: Align deployment with local portfolio repositories

- Status: accepted
- Owner: architect

## Context
Local inspection of jterrats_dev, open-orchestra, and setup-agents shows all three use Wrangler GitHub Actions and none uses Cloudflare MCP for Pages deployment or stores DNS records in code.

## Decision
Use cloudflare/wrangler-action@v3 with CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID; deploy site/ directly to a Pages project. Treat custom-domain attachment as one-time Cloudflare configuration outside repository source.

## Consequences
The connector follows the established release path. MCP OAuth is no longer a deployment dependency; DNS still requires a one-time external operation and public verification.
