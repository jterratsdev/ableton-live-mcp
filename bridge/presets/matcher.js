import { PRESET_CATALOG, PRESET_CATALOG_SCHEMA, PRESET_ENTRY_KINDS } from "./catalog.js";

const TOKEN_ALIASES = new Map([
  ["real", ["realistic", "natural", "acoustic"]],
  ["realism", ["realistic", "natural", "acoustic"]],
  ["realistic", ["realistic", "natural", "acoustic"]],
  ["violin", ["violin", "strings", "solo_strings"]],
  ["strings", ["strings", "solo_strings", "orchestra"]],
  ["piano", ["piano", "concert_piano", "grand", "keys"]],
  ["grand", ["grand", "concert_piano", "piano"]],
  ["concert", ["concert", "classical", "hall"]],
  ["classical", ["classical", "concert"]],
  ["guitar", ["guitar", "classical_guitar", "nylon", "plucked_strings"]],
  ["nylon", ["nylon", "classical_guitar", "guitar"]],
  ["flute", ["flute", "woodwind"]],
  ["woodwind", ["woodwind", "flute"]],
  ["hall", ["hall", "concert_hall", "reverb", "space"]],
  ["master", ["mastering", "master_bus", "transparent_master"]],
  ["mastering", ["mastering", "master_bus", "transparent_master"]],
  ["reverb", ["reverb", "concert_hall", "space"]]
]);

const INTENT_PHRASES = [
  { pattern: /\bconcert\s+piano\b/u, tokens: ["concert_piano", "grand", "piano", "classical"] },
  { pattern: /\bclassical\s+guitar\b/u, tokens: ["classical_guitar", "nylon", "guitar", "acoustic"] },
  { pattern: /\bconcert\s+hall\s+mastering\b/u, tokens: ["concert_hall_mastering", "concert_hall", "mastering", "hall", "reverb"] },
  { pattern: /\brealistic\s+violin\b/u, tokens: ["realistic_violin", "realistic", "violin", "solo_strings"] },
  { pattern: /\bsolo\s+flute\b/u, tokens: ["realistic_flute", "flute", "woodwind"] }
];

const REALISM_TOKENS = new Set(["realistic", "real", "realism", "natural", "acoustic", "lifelike", "sampled"]);
const CLASSICAL_TOKENS = new Set(["classical", "concert", "orchestra", "orchestral", "chamber", "recital"]);
const EFFECT_TOKENS = new Set(["master", "mastering", "hall", "reverb", "space", "cleanup", "eq"]);

export function validatePresetCatalog(catalog = PRESET_CATALOG) {
  const seenIds = new Set();
  const errors = [];

  for (const [index, entry] of catalog.entries()) {
    const label = entry?.id ?? `entry[${index}]`;
    for (const field of PRESET_CATALOG_SCHEMA.requiredFields) {
      if (entry?.[field] === undefined) {
        errors.push(`${label} is missing ${field}`);
      }
    }
    if (seenIds.has(entry?.id)) {
      errors.push(`${label} has a duplicate id`);
    }
    seenIds.add(entry?.id);
    if (!PRESET_ENTRY_KINDS.includes(entry?.kind)) {
      errors.push(`${label} has unsupported kind`);
    }
    if (!entry?.load?.kind || !entry?.load?.query) {
      errors.push(`${label} must define load.kind and load.query`);
    }
    if (!Array.isArray(entry?.tags) || entry.tags.length === 0) {
      errors.push(`${label} must define tags`);
    }
    if (!Array.isArray(entry?.roles) || entry.roles.length === 0) {
      errors.push(`${label} must define roles`);
    }
    if (!Number.isFinite(entry?.realism?.score) || entry.realism.score < 0 || entry.realism.score > 1) {
      errors.push(`${label} realism.score must be between 0 and 1`);
    }
    if (!Array.isArray(entry?.realism?.hints) || entry.realism.hints.length === 0) {
      errors.push(`${label} must define realism.hints`);
    }
    if (!Array.isArray(entry?.classicalIntent?.productionIntent) || entry.classicalIntent.productionIntent.length === 0) {
      errors.push(`${label} must define classicalIntent.productionIntent`);
    }
    if (!Array.isArray(entry?.classicalIntent?.useCases) || entry.classicalIntent.useCases.length === 0) {
      errors.push(`${label} must define classicalIntent.useCases`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function matchPresetIntent(intent, options = {}) {
  const catalog = options.catalog ?? PRESET_CATALOG;
  const inventory = Array.isArray(options.inventory) ? options.inventory : [];
  const limit = normalizeLimit(options.limit);
  const normalizedIntent = normalizePresetIntent(intent);
  const matches = catalog
    .map((entry) => scoreCatalogEntry(entry, normalizedIntent))
    .filter((match) => match.score > 0)
    .map((match) => inventoryBackedMatch(match, inventory))
    .filter(Boolean)
    .sort(compareMatches)
    .slice(0, limit);

  return {
    ok: true,
    intent,
    normalizedIntent,
    count: matches.length,
    matches
  };
}

export function normalizePresetIntent(intent) {
  if (typeof intent !== "string" || intent.trim() === "") {
    throw new TypeError("intent must be a non-empty string");
  }

  const normalized = intent.toLowerCase().replace(/[^a-z0-9\s-]/gu, " ");
  const baseTokens = normalized.split(/[\s-]+/u).filter(Boolean);
  const expandedTokens = new Set(baseTokens);

  for (const token of baseTokens) {
    for (const alias of TOKEN_ALIASES.get(token) ?? []) {
      expandedTokens.add(alias);
    }
  }
  for (const phrase of INTENT_PHRASES) {
    if (phrase.pattern.test(normalized)) {
      for (const token of phrase.tokens) {
        expandedTokens.add(token);
      }
    }
  }

  return {
    text: normalized.trim(),
    tokens: Array.from(expandedTokens).sort(),
    wantsRealism: baseTokens.some((token) => REALISM_TOKENS.has(token)),
    wantsClassical: Array.from(expandedTokens).some((token) => CLASSICAL_TOKENS.has(token)),
    wantsEffect: Array.from(expandedTokens).some((token) => EFFECT_TOKENS.has(token))
  };
}

function scoreCatalogEntry(entry, normalizedIntent) {
  const searchable = searchableTokens(entry);
  const matchedTokens = normalizedIntent.tokens.filter((token) => searchable.has(token));
  let score = matchedTokens.length * 10 + (matchedTokens.length > 0 ? Math.round(entry.realism.score * 4) : 0);
  const reasons = matchedTokens.map((token) => `matched:${token}`);

  const roleMatches = normalizedIntent.tokens.filter((token) => entry.roles.includes(token));
  if (roleMatches.length > 0) {
    score += roleMatches.length * 16;
    reasons.push(...roleMatches.map((token) => `role:${token}`));
  }

  const productionMatches = normalizedIntent.tokens.filter((token) => entry.classicalIntent.productionIntent.includes(token));
  if (productionMatches.length > 0) {
    score += productionMatches.length * 18;
    reasons.push(...productionMatches.map((token) => `intent:${token}`));
  }

  if (matchedTokens.length > 0 && normalizedIntent.wantsRealism) {
    score += Math.round(entry.realism.score * 20);
    reasons.push(`realism:${entry.realism.score.toFixed(2)}`);
  }

  if (normalizedIntent.wantsClassical && searchable.has("classical")) {
    score += 8;
    reasons.push("classical-fit");
  }

  if (normalizedIntent.wantsEffect && entry.kind === "effect") {
    score += 14;
    reasons.push("effect-fit");
  }

  if (!normalizedIntent.wantsEffect && entry.kind === "effect") {
    score -= 12;
    reasons.push("instrument-intent-penalty");
  }

  return {
    score,
    id: entry.id,
    name: entry.name,
    kind: entry.kind,
    deviceKind: entry.deviceKind,
    source: entry.source,
    load: entry.load,
    realism: entry.realism,
    classicalIntent: entry.classicalIntent,
    matchedTokens,
    reasons
  };
}

function inventoryBackedMatch(match, inventory) {
  const available = inventory.find((item) => isCatalogEntryAvailable(match.load, item));
  if (!available) {
    return null;
  }
  return {
    ...match,
    inventory: {
      kind: available.kind,
      name: available.name,
      ref: available.ref ?? available.id ?? available.path ?? available.name,
      loadable: available.loadable !== false
    }
  };
}

function isCatalogEntryAvailable(load, item) {
  if (!item || item.loadable === false || !browserKindsMatch(load.kind, item.kind)) {
    return false;
  }
  const requested = normalizeInventoryText(load.query);
  const available = normalizeInventoryText(item.name ?? item.ref ?? item.path);
  return requested === available || requested.startsWith(`${available} `) || available.startsWith(`${requested} `);
}

function browserKindsMatch(requested, available) {
  return requested === "any" || requested === available || (requested === "plugin" && ["vst", "au"].includes(available));
}

function normalizeInventoryText(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function searchableTokens(entry) {
  return new Set([
    entry.id,
    entry.name,
    entry.kind,
    entry.deviceKind,
    entry.source,
    entry.classicalIntent.ensembleRole,
    ...entry.tags,
    ...entry.roles,
    ...entry.realism.hints,
    ...entry.classicalIntent.productionIntent,
    ...entry.classicalIntent.useCases.flatMap((useCase) => useCase.toLowerCase().split(/[\s-]+/u))
  ].filter(Boolean).flatMap((value) => String(value).toLowerCase().split(/[\s:.-]+/u).filter(Boolean)));
}

function compareMatches(left, right) {
  return right.score - left.score || right.realism.score - left.realism.score || left.name.localeCompare(right.name);
}

function normalizeLimit(limit) {
  if (limit === undefined) {
    return 5;
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError("limit must be a positive integer");
  }
  return limit;
}
