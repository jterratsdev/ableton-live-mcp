<!-- open-orchestra: prompt-registry-v1 -->
# Service and Domain Prompts

> Prompt register for domain models, service boundaries, API contracts, data flow, and backend behavior.
> Commit this file so generated artifacts can be traced back to their prompt intent.
> Keep one entry per artifact or component; store only the latest prompt. Git history keeps prior versions.

## Agent Protocol

### Before creating or substantially changing an artifact

1. Read the full relevant register file in `.generated-prompts/`.
2. Search for an existing `## <ArtifactName>` entry.
3. Use prior entries to preserve project conventions, constraints, decisions, and known risks.
4. If a related entry exists, adapt the new work to fit that established context unless an explicit decision changes it.

### After creating or substantially changing an artifact

1. Add or update the matching `## <ArtifactName>` entry.
2. Increment **Iterations** on substantial updates.
3. Replace **Prompt** with the final prompt or a concise summary when the prompt is long.
4. Record key decisions and evidence links that explain why the artifact changed.
5. Do not update the register for typos, formatting-only edits, or single-line mechanical fixes.

## Usage

- Read this file before changing domain logic, service contracts, or persistence integration.
- Preserve API conventions, failure-mode decisions, idempotency, retries, and data ownership.
- Update entries when contracts, business rules, or service responsibilities change.

## Entry Format

```markdown
## <ArtifactName>
- **Created:** YYYY-MM-DD
- **Updated:** YYYY-MM-DD
- **Iterations:** N
- **Task:** TASK-ID or backlog item
- **Role:** active role that generated or changed the artifact

### Key decisions
- <Pattern, constraint, trade-off, or risk that shaped the artifact>

### Evidence
- <Command, test, review, screenshot, trace, or decision link>

### Prompt
````
<final prompt, or summary of the prompt key instructions if over 500 words>
````
---
```

<!-- Entries below this line are maintained by agents -->

## SSD5 Plugin Output Routing Service
- **Created:** 2026-08-17
- **Updated:** 2026-08-17
- **Iterations:** 2
- **Task:** ableton-ssd-multi-output-workflow-20260817
- **Role:** developer

### Key decisions
- Expose `GET /routing/plugin-outputs/plan` as read-only and `POST /routing/plugin-outputs/apply` as safe-write.
- Resolve modern Live routing dictionaries and legacy routing fields through one adapter contract, with exact identifier/display matching and verified readback.
- Preflight all observable channels and existing receiver conflicts, then rollback only tracks created by the current request on failure.
- Give exact identifiers precedence over display labels and reject display labels that map to distinct identifiers; validate source availability before bootstrap diagnostics.

### Evidence
- Focused Node/Python routing tests and the full deterministic suite passed.
- Risk policy, observability, Remote Script static routes, and compatibility metadata remain synchronized.

### Prompt
````
Add a truthful two-step plugin output routing service that separates read-only discovery from explicit atomic application and handles modern and legacy Live routing contracts safely.
````
---

## Ableton Bridge Configuration And Requests
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** fix-code-pattern-findings-20260716
- **Role:** developer

### Key decisions
- Centralize bridge runtime configuration in `src/config.js`.
- Validate `ABLETON_BRIDGE_URL` as an HTTP(S) loopback URL and `ABLETON_BRIDGE_TIMEOUT_MS` as a positive integer before bridge use.
- Forward GET payload fields as query parameters so `ableton_list_plugins` filters work in real bridge mode.

### Evidence
- `npm test` passed, including the local HTTP regression that observes `/plugins?kind=instrument&query=piano`.

### Prompt
````
Implement the bridge-side service fixes from review: validate local bridge configuration at startup/use, preserve local-only safety, and make GET bridge actions encode optional filters as query parameters without changing POST payload behavior.
````
---

## Minimal Ableton Bridge Contract Implementation
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-bridge-minimal-20260716
- **Role:** developer

### Key decisions
- Implement the initial bridge contract as a local HTTP service backed by a deterministic in-memory development adapter.
- Support `/status`, `/project`, `/tempo`, `/transport/start`, `/transport/stop`, and `/plugins` first because they unblock non-dry-run MCP integration.
- Defer real Ableton Live API calls to a future adapter while preserving the same method surface.

### Evidence
- `npm test` passed, including MCP-to-bridge non-dry-run integration coverage in `test/bridge.mjs`.

### Prompt
````
Create the minimal local bridge service that satisfies the first Ableton connector milestone and can be exercised by the existing MCP server without dry-run mode.
````
---

## Ableton Live Remote Script Bridge Service
- **Created:** 2026-07-16
- **Updated:** 2026-07-16
- **Iterations:** 1
- **Task:** ableton-real-python-adapter-20260716
- **Role:** developer

### Key decisions
- Mirror the Node development bridge endpoint contract inside Ableton Live through a Remote Script HTTP server on `127.0.0.1:9789`.
- Implement real Live reads/mutations for status, project, tempo, transport, browser search, device loading, and best-effort mastering effect loading.
- Treat plugin browser search and mastering parameter mapping as Live-environment dependent; return warnings when devices cannot be found.

### Evidence
- Static endpoint checks and Python compilation pass in `test/remote-script-static.mjs`.

### Prompt
````
Create the service behavior for a real Ableton Live bridge that can be smoke-tested by the existing MCP client using ABLETON_BRIDGE_URL=http://127.0.0.1:9789.
````
---
