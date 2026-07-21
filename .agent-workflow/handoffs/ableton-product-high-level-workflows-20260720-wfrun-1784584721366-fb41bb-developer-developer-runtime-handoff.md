# Developer Runtime Handoff: high-level workflows

Task: ableton-product-high-level-workflows-20260720
Run: wfrun-1784584721366-fb41bb
Agent: 019f8189-fa95-7602-a593-4947c933dd36

This handoff was reconstructed by the parent runtime from the subagent completion notification, lifecycle record, evidence artifacts, and review state. It is not independent QA evidence.

## Summary

Added deterministic plan-only high-level workflows for classical setup, instrument assignment, mix balancing, reverb cleanup, mastering prep, and render validation.

## Changed files

- docs/high-level-workflows.md
- src/workflow-plans.js
- test/workflow-plans.mjs

## Validation reported

- node test/workflow-plans.mjs passed.
- npm test passed.
- src/workflow-plans.js stayed below 300 lines after final trim.

## Known gaps

- test/workflow-plans.mjs was not wired into npm test during the child task.
