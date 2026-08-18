# Decision ableton-arrangement-clip-delete-20260817: Compensate partial Arrangement deletion with Song.undo

- Status: accepted
- Owner: architect

## Context
The official Live Object Model exposes Song.undo and Track.delete_clip. Track deletion calls are not documented as a transaction, so a later runtime exception can leave earlier deletions applied. User approved integrating undo before release.

## Decision
Before mutation require callable Song.undo. If Track.delete_clip fails after N successful deletions, call Song.undo exactly N times, then reread Arrangement clips and compare observable pre-delete fingerprints for the full requested selection. Return the original deletion error only when restoration is verified; otherwise return an explicit rollback-failed error with restoration details.

## Consequences
Adds fake-Live undo-stack tests and explicit rollback telemetry. Ephemeral object identities may change after undo, so restoration verification must compare stable observable fingerprints rather than old process-local clip identities. No active-Set validation occurs during automated QA.
