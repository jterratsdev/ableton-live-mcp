# Evidence ableton-connector-product-site-20260804: command

- Role: security
- Summary: Public product and security outcome validated after DNS correction.
- Path: .github/workflows/deploy-cloudflare-pages.yml
- Command: curl -sS -I https://ableton-mcp.jterrats.dev/
- Exit code: 0
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: web
- Assertions: At desktop viewport 1440x1000 and mobile viewport 390x844, DOM selector h1 renders Ableton Live MCP, selector img[src*=ableton-mcp-workflow] is visible, GitHub and issues anchors are visible, and visual state has no clipping or horizontal overflow. HTTPS returns 200 with HSTS, nosniff, SAMEORIGIN and same-origin referrer headers.
- External validation: Cloudflare MCP reports the domain, verification, and validation active; public HTML and primary PNG each return HTTP 200.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
