export function createMixerContract(overrides = {}) {
  return {
    version: 2,
    safeForAutomatedMixing: true,
    readback: {
      volumeRaw: "Live raw mixer parameter value",
      volumeDb: "Parsed dB display value when available",
      volumeDisplay: "Live display string",
      sendsRaw: "Live raw send parameter values",
      sendsDb: "Parsed send dB display values when available",
      sendsDisplay: "Live send display strings, including -inf dB/off states"
    },
    writes: {
      volumeDb: "Real dB target; verify observed readback after writing",
      cueVolumeDb: "Real dB target; verify observed readback after writing",
      sends: "Real dB targets by send index or name",
      verifyToleranceDb: "Optional dB tolerance for writeVerification; defaults to 0.5"
    },
    ...overrides
  };
}
