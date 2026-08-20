import { clone } from "./utils.js";

const DEFAULT_TRACKS = [
  {
    index: 0,
    name: "Piano",
    type: "midi",
    volumeDb: -6,
    pan: 0,
    muted: false,
    solo: false,
    armed: false,
    sends: { Reverb: -12 },
    inputRouting: "All Ins",
    outputRouting: "Master",
    devices: [{ index: 0, name: "Wavetable", kind: "instrument", parameters: { "Filter Frequency": 0.5 } }],
    clips: [{ slot: 0, name: "Verse", lengthBeats: 16 }]
  },
  {
    index: 1,
    name: "Drums",
    type: "midi",
    volumeDb: -3,
    pan: 0,
    muted: false,
    solo: false,
    armed: false,
    sends: { Reverb: -9 },
    inputRouting: "All Ins",
    outputRouting: "Master",
    devices: [{ index: 0, name: "Drum Rack", kind: "rack", parameters: { Chain: 0 } }],
    clips: []
  }
];

const DEFAULT_RETURNS = [
  {
    index: 0,
    name: "Reverb",
    type: "return",
    volumeDb: -10,
    pan: 0,
    muted: false,
    solo: false,
    devices: [
      { index: 0, name: "Hybrid Reverb", kind: "audio_effect", parameters: { DryWet: 0.18 } },
      { index: 1, name: "EQ Eight", kind: "audio_effect", parameters: { "Low Cut": 0.1 } }
    ]
  },
  {
    index: 1,
    name: "Delay",
    type: "return",
    volumeDb: -12,
    pan: 0,
    muted: false,
    solo: false,
    devices: []
  }
];

const DEFAULT_PLUGINS = [
  { id: "instrument:wavetable", name: "Wavetable", kind: "instrument", type: "instrument", source: "live", tags: ["synth", "polyphonic"] },
  { id: "instrument:grand-piano", name: "Grand Piano", kind: "instrument", type: "instrument", source: "live-pack", tags: ["piano", "keys", "acoustic"] },
  { id: "midi_effect:chord", name: "Chord", kind: "midi_effect", type: "effect", source: "live", tags: ["harmony", "midi"] },
  { id: "rack:drum-rack", name: "Drum Rack", kind: "rack", type: "instrument", source: "live", tags: ["drums", "rack"] },
  { id: "rack:classical-room", name: "Classical Room Rack", kind: "rack", type: "effect", source: "user-library", tags: ["room", "mix", "classical"] },
  { id: "audio_effect:eq-eight", name: "EQ Eight", kind: "audio_effect", type: "effect", source: "live", tags: ["eq", "mix"] },
  { id: "audio_effect:hybrid-reverb", name: "Hybrid Reverb", kind: "audio_effect", type: "effect", source: "live", tags: ["reverb", "hall", "room"] },
  { id: "preset:concert-piano", name: "Concert Grand.adg", kind: "preset", type: "instrument", source: "user-library", tags: ["piano", "concert", "classical"] },
  { id: "preset:nylon-guitar", name: "Nylon Guitar.adg", kind: "preset", type: "instrument", source: "user-library", tags: ["guitar", "classical", "nylon"] },
  { id: "vst:kontakt-8", name: "Kontakt 8", kind: "vst", type: "instrument", source: "vst3", tags: ["sampler", "piano", "orchestral"] },
  { id: "vst:bbc-symphony", name: "BBC Symphony Orchestra", kind: "vst", type: "instrument", source: "vst3", tags: ["strings", "flute", "orchestra"] },
  { id: "au:labs", name: "LABS", kind: "au", type: "instrument", source: "audio-unit", tags: ["soft", "strings", "piano"] }
];

const DEFAULT_BROWSER_ITEMS = [
  {
    ref: "sample:tight-clap",
    name: "Tight Clap.wav",
    kind: "sample",
    type: "sample",
    source: "core-library",
    path: "Samples/Drums/Claps/Tight Clap.wav",
    tags: ["drums", "clap"],
    loadable: true
  },
  {
    ref: "sample:deep-kick",
    name: "Deep Kick.wav",
    kind: "sample",
    type: "sample",
    source: "core-library",
    path: "Samples/Drums/Kicks/Deep Kick.wav",
    tags: ["drums", "kick"],
    loadable: true
  },
  {
    ref: "groove:mpc-16-swing-57",
    name: "MPC 16 Swing-57.agr",
    kind: "groove",
    type: "groove",
    source: "core-library",
    path: "Grooves/MPC/MPC 16 Swing-57.agr",
    tags: ["swing", "mpc"],
    loadable: true
  },
  {
    ref: "max_device:buffer-shuffler",
    name: "Buffer Shuffler.amxd",
    kind: "max_device",
    type: "audio_effect",
    source: "max-for-live",
    path: "Max for Live/Max Audio Effect/Buffer Shuffler.amxd",
    tags: ["m4l", "glitch"],
    loadable: true
  }
];

const DEFAULT_ARRANGEMENT = {
  lengthBeats: 16,
  sections: [],
  clips: []
};

const DEFAULT_SCENES = [
  { name: "Intro", retainedTempo: 124, tempoEnabled: false, retainedNumerator: 4, retainedDenominator: 4, timeSignatureEnabled: false },
  { name: "Verse", retainedTempo: 128, tempoEnabled: true, retainedNumerator: 7, retainedDenominator: 8, timeSignatureEnabled: true }
];

export function createDevelopmentState(state = {}) {
  return {
    tempo: state.tempo ?? 124,
    timeSignature: state.timeSignature ?? "4/4",
    scenes: clone(state.scenes ?? DEFAULT_SCENES),
    playing: state.playing ?? false,
    liveEdition: state.liveEdition ?? "unknown",
    tracks: clone(state.tracks ?? DEFAULT_TRACKS),
    returns: clone(state.returns ?? DEFAULT_RETURNS),
    master: clone(state.master ?? { name: "Master", volumeDb: 0, pan: 0, cueVolumeDb: -12, devices: [] }),
    locators: clone(state.locators ?? [{ beat: 0, name: "Intro" }]),
    arrangement: clone(state.arrangement ?? DEFAULT_ARRANGEMENT),
    automation: clone(state.automation ?? []),
    plugins: clone(state.plugins ?? DEFAULT_PLUGINS),
    browserItems: clone(state.browserItems ?? DEFAULT_BROWSER_ITEMS),
    loadedDevices: clone(state.loadedDevices ?? []),
    importedMidi: clone(state.importedMidi ?? []),
    masteringChain: clone(state.masteringChain ?? null),
    snapshots: clone(state.snapshots ?? [])
  };
}
