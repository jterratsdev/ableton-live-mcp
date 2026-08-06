# Decision ableton-connector-product-site-20260804: Implementation story points

- Status: accepted
- Owner: developer

## Context
developer completed developer

## Decision
3 points

## Consequences
Consumed context files recorded. Changed files recorded. Changed-file traceability recorded. Simplicity review recorded. Goal-to-verification map recorded. Architectural concerns recorded. Handoff summary ready. AC1 verification pending: Opening the deployed custom HTTPS hostname at desktop and mobile widths shows the Ableton Live MCP product name, open-source status, installation commands, architecture, verified capabilities, safety model, limitations, and GitHub call to action without overlap or horizontal overflow. -> requires an observable artifact, executed command, and explicit assertion. AC2 verification pending: Running the site validation command exits 0 after checking required content, internal anchors, external HTTPS links, image assets, accessible landmarks, and metadata. -> requires an observable artifact, executed command, and explicit assertion. AC3 verification pending: Running npm test and npm pack --dry-run exits 0 and confirms the product site does not alter the published MCP package contents. -> requires an observable artifact, executed command, and explicit assertion. AC4 verification pending: Playwright screenshots at desktop and mobile widths show a visual system consistent with jterrats.dev and no blank, clipped, or overlapping content. -> requires an observable artifact, executed command, and explicit assertion. AC5 verification pending: Cloudflare MCP responses and public HTTPS checks report a successful Pages deployment and active DNS for the selected jterrats.dev hostname. -> requires an observable artifact, executed command, and explicit assertion.
