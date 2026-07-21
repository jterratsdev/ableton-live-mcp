# Snapshot Rollback

Snapshots are guardrails for broad edits. They are useful before MIDI import,
device changes, mix moves, routing changes, mastering passes, and destructive
cleanup, but the rollback guarantee depends on which bridge is running.

## Deterministic Development Bridge

`bridge/development/snapshots.js` captures and restores the development
adapter's in-memory project model. A rollback restores:

| Area | Coverage |
| --- | --- |
| Tempo and signature | Full restore of `tempo`, `timeSignature`, and transport `playing` state. |
| Clips | Full restore of deterministic session clip fixtures and imported MIDI clip metadata. |
| Track mixer | Full restore of track name, volume, pan, mute, solo, arm, color, sends, and input/output routing fields present in state. |
| Track devices | Full restore of deterministic device chains and parameter fixtures. |
| Returns | Full restore of return track count, order, names, mixer state, and device chains. |
| Master chain | Full restore of master mixer fields, cue volume, devices, loaded device records, and mastering chain metadata. |
| Arrangement and automation | Full restore of locators, arrangement clips, sections, and automation entries in memory. |

Development snapshots are process-local. Restarting the bridge clears them, and
they are not `.als` backups.

## Python Remote Script Bridge

`ableton_remote_scripts/AbletonMcpBridge/live_snapshots.py` now records broader
snapshot metadata for decision support:

| Area | Recorded in snapshot | Restored by rollback |
| --- | --- | --- |
| Tempo and signature | Yes | Yes |
| MIDI session clips | Yes, when notes are readable | Yes, only on existing MIDI tracks and readable clip slots |
| Audio clips | Basic clip metadata only when exposed | No |
| Track mixer | Volume, pan, mute, solo, arm, sends | No |
| Routing | Current input/output routing names | No |
| Track devices | Device names, kinds, exposed parameters | No |
| Return tracks | Mixer state and device summaries | No |
| Master chain | Mixer state, cue volume, device summaries | No |
| Automation, undo history, saved `.als` state | No reliable Remote Script coverage | No |

Remote Script rollback intentionally returns warnings for the metadata it records
but cannot restore. It should be treated as a partial recovery tool for tempo,
time signature, and readable MIDI session clips, not as a complete project
safety mechanism.

## Operating Rule

Before guarded production edits, create both a bridge snapshot and a real Ableton
save or file copy when the edit could affect devices, routing, returns, sends,
audio clips, automation, or the master chain. If only a Remote Script snapshot is
available, rollback can recover a limited MIDI-oriented state and should not be
used as proof that plugin, routing, or mix changes are safe to automate.
