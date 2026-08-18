import assert from "node:assert/strict";
import { PRESET_CATALOG, PRESET_CATALOG_SCHEMA } from "../bridge/presets/catalog.js";
import { matchPresetIntent, normalizePresetIntent, validatePresetCatalog } from "../bridge/presets/matcher.js";

const AVAILABLE_INVENTORY = PRESET_CATALOG.map((entry) => ({
  kind: entry.load.kind,
  name: entry.load.query,
  ref: `browser:${entry.id}`,
  loadable: true
}));

catalogDefinesRequiredClassicalPresetFields();
matchesRealisticViolinToSampledSoloViolin();
matchesConcertPianoToConcertGrandVst();
matchesClassicalGuitarToNylonPreset();
matchesFluteToOrchestralWoodwind();
matchesConcertHallMasteringToMasterBusEffect();
normalizesIntentAliasesDeterministically();
excludesUnavailableCatalogEntries();
doesNotRankPianoOrOrchestralEntriesForDrumKits();

console.log("preset intelligence ok");

function catalogDefinesRequiredClassicalPresetFields() {
  const validation = validatePresetCatalog(PRESET_CATALOG);

  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.equal(PRESET_CATALOG_SCHEMA.requiredFields.includes("realism"), true);
  assert.equal(PRESET_CATALOG_SCHEMA.requiredFields.includes("classicalIntent"), true);
  assert.ok(PRESET_CATALOG.some((entry) => entry.kind === "instrument"));
  assert.ok(PRESET_CATALOG.some((entry) => entry.kind === "effect"));
}

function matchesRealisticViolinToSampledSoloViolin() {
  const result = matchPresetIntent("realistic violin", { limit: 3, inventory: AVAILABLE_INVENTORY });

  assert.equal(result.matches[0].id, "vst:bbc-symphony:solo-violin-legato");
  assert.equal(result.matches[0].load.kind, "vst");
  assert.ok(result.matches[0].reasons.includes("intent:realistic_violin"));
}

function matchesConcertPianoToConcertGrandVst() {
  const result = matchPresetIntent("concert piano", { limit: 3, inventory: AVAILABLE_INVENTORY });

  assert.equal(result.matches[0].id, "vst:kontakt:concert-grand");
  assert.equal(result.matches[0].load.query, "Kontakt 8 Concert Grand");
  assert.ok(result.matches[0].score > result.matches[1].score);
}

function matchesClassicalGuitarToNylonPreset() {
  const result = matchPresetIntent("classical guitar", { limit: 3, inventory: AVAILABLE_INVENTORY });

  assert.equal(result.matches[0].id, "preset:ableton:nylon-classical-guitar");
  assert.equal(result.matches[0].deviceKind, "preset");
  assert.ok(result.matches[0].matchedTokens.includes("nylon"));
}

function matchesFluteToOrchestralWoodwind() {
  const result = matchPresetIntent("flute", { limit: 3, inventory: AVAILABLE_INVENTORY });

  assert.equal(result.matches[0].id, "vst:bbc-symphony:flute-legato");
  assert.equal(result.matches[0].classicalIntent.ensembleRole, "solo_woodwind");
}

function matchesConcertHallMasteringToMasterBusEffect() {
  const result = matchPresetIntent("concert hall mastering", { limit: 3, inventory: AVAILABLE_INVENTORY });

  assert.equal(result.matches[0].id, "rack:master:concert-hall");
  assert.equal(result.matches[0].kind, "effect");
  assert.equal(result.matches[0].load.kind, "rack");
  assert.ok(result.matches[0].reasons.includes("effect-fit"));
}

function excludesUnavailableCatalogEntries() {
  const result = matchPresetIntent("concert piano", {
    limit: 3,
    inventory: AVAILABLE_INVENTORY.filter((item) => item.name === "Concert Grand.adg")
  });

  assert.deepEqual(result.matches.map((match) => match.id), ["preset:ableton:concert-grand"]);
  assert.match(result.matches[0].inventory.ref, /^browser:/u);
}

function doesNotRankPianoOrOrchestralEntriesForDrumKits() {
  const result = matchPresetIntent("drum kit", { limit: 5, inventory: AVAILABLE_INVENTORY });

  assert.equal(result.count, 0);
  assert.equal(result.matches.some((match) => /piano|orchestra/u.test(match.name)), false);
}

function normalizesIntentAliasesDeterministically() {
  const normalized = normalizePresetIntent("Realistic classical guitar!");

  assert.deepEqual(normalized.tokens, [
    "acoustic",
    "classical",
    "classical_guitar",
    "concert",
    "guitar",
    "natural",
    "nylon",
    "plucked_strings",
    "realistic"
  ]);
  assert.equal(normalized.wantsRealism, true);
  assert.equal(normalized.wantsClassical, true);
}
