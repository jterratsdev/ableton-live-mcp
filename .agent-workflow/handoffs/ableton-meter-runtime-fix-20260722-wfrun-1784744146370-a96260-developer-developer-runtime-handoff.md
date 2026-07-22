# Developer Handoff: Live Meter Runtime Fix

## Status

Implementation complete locally; live runtime validation is pending Remote Script installation and Ableton restart.

## Acceptance Criteria

- Poll Live output meters from the Control Surface display cycle rather than relying only on listener callbacks or request-time reads.
- Poll only targets where Live reports `has_audio_output=true`.
- Preserve listener observations as a secondary source and identify the selected source in the response.
- Expose poll activity, skipped targets, errors, observed targets, and non-zero signal targets in `/meters` diagnostics.
- Do not infer or fabricate audio levels from clip, transport, or mixer state.
- Validate against the user's running Ableton instance with audible playback before accepting QA.

## Changed Components

- `ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py`: polls the meter cache from `update_display`.
- `ableton_remote_scripts/AbletonMcpBridge/live_meter_cache.py`: adds display-cycle polling, audio-output eligibility, source metadata, and diagnostics.
- `test/remote-script-static.mjs`: asserts the polling integration and diagnostics contract.
- `docs/ableton-bridge-contract.md`, `docs/ableton-python-remote-script.md`, `docs/ableton-compatibility.md`: document the runtime behavior and limits.

## Verification

- `python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/AbletonMcpBridge.py ableton_remote_scripts/AbletonMcpBridge/live_meter_cache.py ableton_remote_scripts/AbletonMcpBridge/live_mixer.py` passed.
- `node test/remote-script-static.mjs` passed with `remote script static ok`.
- `npm test` passed the complete deterministic suite.
- Pre-change live evidence: four Session clips reported `isPlaying=true`, 21 listeners were registered with zero listener errors, but `observedTargetCount=0` and every meter remained zero.

## Goal-To-Verification Map

- Display-cycle polling: static source assertion and Python compilation complete; live validation pending.
- Audio-output eligibility: static source assertion complete; live `pollTargetCount`/`pollSkippedTargetCount` pending.
- Non-zero real signal: pending live `/meters` sampling after installation and restart.
- No fabricated values: implementation continues to read only Live meter properties.

## Simplicity Review

The change extends the existing meter cache and Control Surface lifecycle. It adds no new endpoint and no parallel metering abstraction.

## Architectural Concerns (inherited)

- Live exposes meter properties as observable, but the active Live 12.4.2 runtime registered listeners without emitting callbacks.

## Architectural Concerns (self-imposed)

- Polling left, right, and level meters adds recurring Live GUI/API work. The implementation gates polling with `has_audio_output` and uses the existing Control Surface display cadence.

## Known Gaps

- The local code has not yet been copied into the root-owned Ableton application bundle.
- QA must sample the actual running bridge after Ableton reloads the updated Remote Script.
