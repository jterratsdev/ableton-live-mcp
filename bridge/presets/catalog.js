export const PRESET_CATALOG_VERSION = "2026-07-20";

export const PRESET_ENTRY_KINDS = ["instrument", "effect"];

export const PRESET_CATALOG_SCHEMA = {
  version: PRESET_CATALOG_VERSION,
  entryKinds: PRESET_ENTRY_KINDS,
  requiredFields: [
    "id",
    "name",
    "kind",
    "deviceKind",
    "source",
    "load",
    "tags",
    "roles",
    "realism",
    "classicalIntent"
  ],
  loadFields: ["kind", "query"],
  realismFields: ["score", "hints"],
  classicalIntentFields: ["ensembleRole", "productionIntent", "useCases"]
};

export const PRESET_CATALOG = [
  {
    id: "vst:bbc-symphony:solo-violin-legato",
    name: "BBC Symphony Orchestra - Solo Violin Legato",
    kind: "instrument",
    deviceKind: "vst",
    source: "vst3",
    load: { kind: "vst", query: "BBC Symphony Orchestra Solo Violin Legato" },
    tags: ["violin", "strings", "orchestra", "solo", "legato", "classical", "expressive"],
    roles: ["violin", "solo_strings", "melody", "orchestra"],
    realism: {
      score: 0.94,
      hints: ["sampled_section", "legato_transition", "dynamic_layers", "modwheel_expression"]
    },
    classicalIntent: {
      ensembleRole: "solo_string",
      productionIntent: ["realistic_violin", "classical_melody", "orchestral_mockup"],
      useCases: ["realistic violin lead", "string quartet first violin", "romantic melody"]
    }
  },
  {
    id: "vst:bbc-symphony:flute-legato",
    name: "BBC Symphony Orchestra - Flute Legato",
    kind: "instrument",
    deviceKind: "vst",
    source: "vst3",
    load: { kind: "vst", query: "BBC Symphony Orchestra Flute Legato" },
    tags: ["flute", "woodwind", "orchestra", "solo", "legato", "classical", "breath"],
    roles: ["flute", "woodwind", "melody", "orchestra"],
    realism: {
      score: 0.91,
      hints: ["sampled_woodwind", "breath_noise", "legato_transition", "dynamic_layers"]
    },
    classicalIntent: {
      ensembleRole: "solo_woodwind",
      productionIntent: ["realistic_flute", "classical_countermelody", "orchestral_mockup"],
      useCases: ["solo flute line", "woodwind countermelody", "pastoral classical texture"]
    }
  },
  {
    id: "vst:kontakt:concert-grand",
    name: "Kontakt 8 - Concert Grand",
    kind: "instrument",
    deviceKind: "vst",
    source: "vst3",
    load: { kind: "vst", query: "Kontakt 8 Concert Grand" },
    tags: ["piano", "grand", "concert", "acoustic", "classical", "solo", "realistic"],
    roles: ["piano", "concert_piano", "keys", "solo"],
    realism: {
      score: 0.93,
      hints: ["sampled_grand", "pedal_noise", "velocity_layers", "sympathetic_resonance"]
    },
    classicalIntent: {
      ensembleRole: "solo_keyboard",
      productionIntent: ["concert_piano", "classical_recital", "solo_accompaniment"],
      useCases: ["concert piano solo", "classical accompaniment", "chamber piano"]
    }
  },
  {
    id: "preset:ableton:concert-grand",
    name: "Concert Grand.adg",
    kind: "instrument",
    deviceKind: "preset",
    source: "user-library",
    load: { kind: "preset", query: "Concert Grand.adg" },
    tags: ["piano", "grand", "concert", "acoustic", "classical"],
    roles: ["piano", "concert_piano", "keys"],
    realism: {
      score: 0.79,
      hints: ["layered_preset", "velocity_sensitive", "good_fallback"]
    },
    classicalIntent: {
      ensembleRole: "solo_keyboard",
      productionIntent: ["concert_piano", "classical_sketch"],
      useCases: ["local fallback concert piano", "composition sketch"]
    }
  },
  {
    id: "preset:ableton:nylon-classical-guitar",
    name: "Nylon Guitar.adg",
    kind: "instrument",
    deviceKind: "preset",
    source: "user-library",
    load: { kind: "preset", query: "Nylon Guitar.adg" },
    tags: ["guitar", "classical", "nylon", "plucked", "acoustic", "fingerstyle"],
    roles: ["classical_guitar", "guitar", "plucked_strings", "accompaniment"],
    realism: {
      score: 0.84,
      hints: ["nylon_string_tone", "fingerstyle_transient", "velocity_sensitive"]
    },
    classicalIntent: {
      ensembleRole: "plucked_string",
      productionIntent: ["classical_guitar", "recital_guitar", "chamber_accompaniment"],
      useCases: ["classical guitar arpeggio", "nylon guitar accompaniment", "solo guitar sketch"]
    }
  },
  {
    id: "au:labs:soft-piano",
    name: "LABS - Soft Piano",
    kind: "instrument",
    deviceKind: "au",
    source: "audio-unit",
    load: { kind: "au", query: "LABS Soft Piano" },
    tags: ["piano", "soft", "felt", "cinematic", "intimate"],
    roles: ["piano", "felt_piano", "texture"],
    realism: {
      score: 0.74,
      hints: ["sampled_piano", "soft_dynamics", "intimate_close_mic"]
    },
    classicalIntent: {
      ensembleRole: "color_keyboard",
      productionIntent: ["intimate_piano", "soft_classical_texture"],
      useCases: ["quiet piano layer", "soft underscore"]
    }
  },
  {
    id: "rack:master:concert-hall",
    name: "Concert Hall Master Bus Rack",
    kind: "effect",
    deviceKind: "rack",
    source: "user-library",
    load: { kind: "rack", query: "Concert Hall Master Bus Rack" },
    tags: ["mastering", "concert", "hall", "reverb", "classical", "transparent", "space"],
    roles: ["mastering", "concert_hall", "reverb", "master_bus"],
    realism: {
      score: 0.88,
      hints: ["convolution_hall", "early_reflections", "low_cut_reverb_return", "transparent_limiter"]
    },
    classicalIntent: {
      ensembleRole: "master_bus",
      productionIntent: ["concert_hall_mastering", "classical_space", "transparent_master"],
      useCases: ["concert hall mastering", "orchestral glue", "recital ambience"]
    }
  },
  {
    id: "audio_effect:hybrid-reverb:concert-hall",
    name: "Hybrid Reverb - Concert Hall",
    kind: "effect",
    deviceKind: "audio_effect",
    source: "live",
    load: { kind: "audio_effect", query: "Hybrid Reverb Concert Hall" },
    tags: ["reverb", "hall", "concert", "classical", "space", "return"],
    roles: ["reverb", "concert_hall", "return_effect"],
    realism: {
      score: 0.76,
      hints: ["algorithmic_hall", "return_track_friendly", "decay_control"]
    },
    classicalIntent: {
      ensembleRole: "return_bus",
      productionIntent: ["concert_hall_reverb", "classical_depth"],
      useCases: ["shared orchestral hall return", "chamber reverb"]
    }
  },
  {
    id: "audio_effect:eq-eight:classical-cleanup",
    name: "EQ Eight - Classical Cleanup",
    kind: "effect",
    deviceKind: "audio_effect",
    source: "live",
    load: { kind: "audio_effect", query: "EQ Eight Classical Cleanup" },
    tags: ["eq", "cleanup", "classical", "mastering", "transparent", "low_cut"],
    roles: ["eq", "mastering", "mix_cleanup"],
    realism: {
      score: 0.64,
      hints: ["transparent_filtering", "rumble_control", "presence_shaping"]
    },
    classicalIntent: {
      ensembleRole: "master_bus",
      productionIntent: ["classical_cleanup", "transparent_master"],
      useCases: ["remove rumble before hall mastering", "gentle classical EQ"]
    }
  }
];
