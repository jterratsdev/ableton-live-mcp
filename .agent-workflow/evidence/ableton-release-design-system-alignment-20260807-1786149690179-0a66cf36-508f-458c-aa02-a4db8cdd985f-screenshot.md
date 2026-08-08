# Evidence ableton-release-design-system-alignment-20260807: screenshot

- Role: qa
- Summary: Production screenshot records visible app state at desktop viewport 1440x1000 after deployment and is stored as a local evidence file.
- Path: .agent-workflow/evidence/assets/ableton-site-live-desktop-cachefix.png
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: desktop
- Assertions: Visible app state assertion: at 1440x1000 the page displays the monospace brand, centered desktop navigation, purple Install 0.1.0 CTA, shared typography, responsive product image, and no stale details marker. Local file assertion: .agent-workflow/evidence/assets/ableton-site-live-desktop-cachefix.png exists and records this browser event.
- External validation: Chromium loaded https://ableton-mcp.jterrats.dev after CI 31230644307 and deploy 31230644273 succeeded.
- Deferred owner: not applicable
- Deferred rationale: not applicable
- Deferred environment: not applicable
- Deferred next command: not applicable
- Observable outcome: yes
- Gaps: none
