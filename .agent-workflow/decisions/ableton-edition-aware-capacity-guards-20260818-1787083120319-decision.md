# Decision ableton-edition-aware-capacity-guards-20260818: Edition detection and finite capacity policy

- Status: accepted
- Owner: architect

## Context
Ableton's official current edition table lists 8, 16, Unlimited, Unlimited. The documented Live Object Model Application exposes version functions but no edition property, so LOM-only detection is impossible.

## Decision
Detect Lite, Intro, Standard, or Suite only from an exact edition token in the installed Remote Script path; report installation-path provenance. Enforce official audio/MIDI limits only for Lite=8 and Intro=16. Standard/Suite are unlimited and unknown never inherits a finite cap.

## Consequences
Status exposes provenance and capacity. Renamed/nonstandard installations become unknown and fall through to host behavior instead of being falsely blocked. Source links and verification date live in one profile module/doc.
