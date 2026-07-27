# Evidence ableton-transport-response-consistency-20260722: command

- Role: qa
- Summary: Final live validation after reinstall/restart: initial transport was stopped. POST /transport/start returned playing=true, requestedPlaying=true, observedPlaying=false, confirmed=false; immediate GET /status confirmed playing=true. POST /transport/stop returned playing=false, requestedPlaying=false, observedPlaying=true, confirmed=false; immediate GET /status confirmed playing=false. Initial stopped state was restored. No composition or mixer state changed.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
