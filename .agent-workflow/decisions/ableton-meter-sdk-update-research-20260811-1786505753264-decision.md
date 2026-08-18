# Decision ableton-meter-sdk-update-research-20260811: Meter SDK upgrade recommendation

- Status: accepted
- Owner: architect

## Context
The repository has no SDK dependency and uses Live Track meter properties directly. Real runtime evidence on 12.4.2 Lite showed all 21 meter properties returning zero during audible playback. Official current documentation preserves the same property semantics; 12.4.3 notes contain no fix, and Extensions SDK is 12.4.5 Suite beta only.

## Decision
Do not migrate or add an SDK solely to improve live meters. Updating Live Lite 12.4.2 to stable 12.4.3 is reasonable maintenance but has no documented meter/API improvement. Keep Remote Script meters classified as unreliable when zero-only; use the existing rendered-audio analyzer for trustworthy LUFS, true peak, and RMS. Re-evaluate Extensions SDK only after stable non-beta Lite/Standard availability or official documentation exposes a continuous meter/audio-analysis API.

## Consequences
No repository changes or Live mutations. A future real-time metering implementation needs a separate audio-analysis transport or a proven new API, not a dependency bump.
