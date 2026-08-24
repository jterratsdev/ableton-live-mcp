# Decision ableton-session-scene-tempo-signature-20260820: Session scene tempo/signature business contract

- Status: accepted
- Owner: product_owner

## Context
Live exposes Session Scene tempo, tempo_enabled, time_signature_numerator, time_signature_denominator, and time_signature_enabled as distinct observable surfaces. Disabled value properties return -1, proxies may be recreated, and the public operation must be safe across partial capabilities without implying Arrangement automation.

## Decision
Use exact zero-based sceneIndex only; model tempo and timeSignature as independent tagged set or clear actions; treat signature value capability as the conjunction of numerator and denominator; probe read and write support per property without invoking setters in the read-only capability call; preflight the complete requested transaction; set value fields before enable, clear by enable=false only; reacquire by index for exact readback; and on any write or verification failure reverse every performed write and verify the complete observable pre-state. Preserve raw -1 sentinels while normalizing disabled public values to null. The operation neither launches the scene nor writes global Song or Arrangement state.

## Consequences
Architecture and implementation must retain per-property reasoned capability diagnostics, strict schemas and bounds, deterministic write order, transaction-wide fail-closed behavior, explicit rollback-failure reporting, and offline fake-proxy coverage. Index is authoritative and name is descriptive, so duplicate or empty names are valid. Real Live mutation remains separately approval-gated.
