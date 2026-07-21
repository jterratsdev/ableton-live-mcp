# Evidence verify-live-ableton-new-endpoints-20260718: command

- Role: qa
- Summary: Final live verification after reinstall and full Ableton restart: /project returned ok with tempo 140, timeSignature 3/4, and four slot 0 clips at 249 beats. GET /clips/notes?trackIndex=0&clipSlotIndex=0 returned HTTP 200 ok=true with noteCount 473 and first note pitch 33 start 245.0119999791875 duration 0.9679999687812187 velocity 87 muted=false. POST /signature returned HTTP 200 ok=true timeSignature 3/4. POST /project/save returned HTTP 501 ok=false error 'Save is not supported by this Ableton API', which matches the documented API limitation.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
