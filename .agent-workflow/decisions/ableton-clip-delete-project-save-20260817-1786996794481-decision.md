# Decision ableton-clip-delete-project-save-20260817: Implementation story points

- Status: accepted
- Owner: developer

## Context
Strengthened the existing MCP clip deletion and project save operations with observable success contracts and deterministic coverage.

## Decision
2 points

## Consequences
Consumed context files and all required task constraints. QA should rerun node test/project-lifecycle.mjs and npm test, inspect test/live_project_clip_test.py for error-path assertions, and preserve the explicit deferral of active-Live mutation.
