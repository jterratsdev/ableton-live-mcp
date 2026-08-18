# Decision ableton-clip-delete-project-save-20260817: Story sizing

- Status: accepted
- Owner: architect

## Context
Two existing MCP operations need stronger observable contracts and fake-Live regression coverage; no new transport or external dependency.

## Decision
s [2 points]

## Consequences
Use a single-agent developer/QA workflow, preserve destructive risk classification, and defer active Live mutation.
