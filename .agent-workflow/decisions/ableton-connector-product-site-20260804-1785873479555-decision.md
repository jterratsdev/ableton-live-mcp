# Decision ableton-connector-product-site-20260804: Hosting and DNS

- Status: accepted
- Owner: architect

## Context
The user explicitly approved DNS and identified a local credential file for Cloudflare MCP authentication.

## Decision
Deploy the isolated static site through Cloudflare Pages and route a dedicated jterrats.dev subdomain; use Cloudflare MCP for cloud mutations and keep credentials out of repository and logs.

## Consequences
Add DevOps and security review, verify public HTTPS after DNS activation, and do not fall back to direct API mutation without reporting MCP unavailability.
