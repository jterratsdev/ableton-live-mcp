const METER_FIELDS = [
  ["left", ["left", "outputMeterLeft", "output_meter_left"]],
  ["right", ["right", "outputMeterRight", "output_meter_right"]],
  ["level", ["level", "outputMeterLevel", "output_meter_level"]]
];

export function meterSnapshot(target, label) {
  const sources = [target?.meter, target?.meters, target].filter((source) => source && typeof source === "object");
  const meter = {};
  const warnings = [];

  for (const [field, aliases] of METER_FIELDS) {
    const value = firstFiniteNumber(sources, aliases);
    meter[field] = value;
    if (value === null) {
      warnings.push(`${label}.meter.${field} is not observable in development state`);
    }
  }

  return { meter, warnings };
}

export function projectMeterSnapshot(state) {
  const warnings = [];
  const tracks = state.tracks.map((track) => {
    const snapshot = meterSnapshot(track, `tracks[${track.index}]`);
    warnings.push(...snapshot.warnings);
    return {
      index: track.index,
      name: track.name,
      type: track.type,
      meter: snapshot.meter,
      warnings: snapshot.warnings
    };
  });
  const returns = state.returns.map((returnTrack) => {
    const snapshot = meterSnapshot(returnTrack, `returns[${returnTrack.index}]`);
    warnings.push(...snapshot.warnings);
    return {
      index: returnTrack.index,
      name: returnTrack.name,
      type: "return",
      meter: snapshot.meter,
      warnings: snapshot.warnings
    };
  });
  const masterSnapshot = meterSnapshot(state.master, "master");
  warnings.push(...masterSnapshot.warnings);

  return {
    ok: true,
    tracks,
    returns,
    master: {
      name: state.master.name ?? "Master",
      type: "master",
      meter: masterSnapshot.meter,
      warnings: masterSnapshot.warnings
    },
    warnings
  };
}

function firstFiniteNumber(sources, aliases) {
  for (const source of sources) {
    for (const alias of aliases) {
      if (Object.hasOwn(source, alias) && typeof source[alias] === "number" && Number.isFinite(source[alias])) {
        return source[alias];
      }
    }
  }
  return null;
}
