import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { extname, isAbsolute } from "node:path";
import { promisify } from "node:util";
import { BridgeRequestError } from "../errors.js";

const execFileAsync = promisify(execFile);
const SUPPORTED_EXTENSIONS = new Set([".wav", ".aif", ".aiff", ".flac", ".mp3", ".m4a", ".aac"]);

export async function analyzeAudioFile(payload = {}) {
  const filePath = validateAudioPath(payload.path);
  await requireReadableFile(filePath);

  const durationSeconds = await probeDuration(filePath);
  const loudness = await measureLoudness(filePath);
  const volume = await measureVolume(filePath);
  const peakDb = loudness.truePeakDb ?? volume.maxVolumeDb;
  const rmsDb = volume.rmsDb;
  const crestFactorDb = Number.isFinite(peakDb) && Number.isFinite(rmsDb) ? round(peakDb - rmsDb) : null;
  const clipping = Number.isFinite(peakDb)
    ? { detected: peakDb >= -0.1, thresholdDb: -0.1, peakDb }
    : { detected: null, thresholdDb: -0.1, peakDb: null };

  return {
    ok: true,
    path: filePath,
    format: extname(filePath).slice(1).toLowerCase(),
    durationSeconds,
    lufs: loudness.integratedLufs,
    truePeakDb: loudness.truePeakDb,
    rmsDb,
    crestFactorDb,
    clipping,
    analysis: {
      integratedLufs: loudness.integratedLufs,
      truePeakDb: loudness.truePeakDb,
      rmsDb,
      maxVolumeDb: volume.maxVolumeDb,
      crestFactorDb,
      clipping
    },
    tool: {
      ffprobe: "ffprobe",
      ffmpeg: "ffmpeg",
      filters: ["ebur128=peak=true", "volumedetect"]
    }
  };
}

function validateAudioPath(filePath) {
  if (typeof filePath !== "string" || filePath.trim() === "") {
    throw new BridgeRequestError("path must be a non-empty absolute local file path");
  }
  const trimmed = filePath.trim();
  if (!isAbsolute(trimmed)) {
    throw new BridgeRequestError("path must be an absolute local file path");
  }
  const extension = extname(trimmed).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new BridgeRequestError(`path must use one of these audio extensions: ${Array.from(SUPPORTED_EXTENSIONS).join(", ")}`);
  }
  return trimmed;
}

async function requireReadableFile(filePath) {
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      throw new BridgeRequestError("path must point to a file");
    }
  } catch (error) {
    if (error instanceof BridgeRequestError) {
      throw error;
    }
    throw new BridgeRequestError(`audio file does not exist or is not readable: ${filePath}`, 404);
  }
}

async function probeDuration(filePath) {
  const { stdout } = await runTool("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath
  ]);
  const duration = Number.parseFloat(stdout.trim());
  return Number.isFinite(duration) ? round(duration) : null;
}

async function measureLoudness(filePath) {
  const { stderr } = await runTool("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i", filePath,
    "-filter_complex", "ebur128=peak=true",
    "-f", "null",
    "-"
  ]);
  return {
    integratedLufs: parseMetric(stderr, /I:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*LUFS/gi),
    truePeakDb: parseMetric(stderr, /Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dBFS/gi)
  };
}

async function measureVolume(filePath) {
  const { stderr } = await runTool("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i", filePath,
    "-af", "volumedetect",
    "-f", "null",
    "-"
  ]);
  return {
    rmsDb: parseMetric(stderr, /mean_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/gi),
    maxVolumeDb: parseMetric(stderr, /max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/gi)
  };
}

async function runTool(command, args) {
  try {
    return await execFileAsync(command, args, { maxBuffer: 4 * 1024 * 1024 });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new BridgeRequestError(`${command} is required for audio analysis but was not found on PATH`, 501);
    }
    throw new BridgeRequestError(`${command} failed during audio analysis: ${error.stderr || error.message}`, 422);
  }
}

function parseMetric(text, pattern) {
  let match;
  let value = null;
  while ((match = pattern.exec(text)) !== null) {
    value = parseAudioNumber(match[1]);
  }
  return value;
}

function parseAudioNumber(value) {
  if (String(value).toLowerCase() === "-inf") {
    return Number.NEGATIVE_INFINITY;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? round(parsed) : null;
}

function round(value) {
  if (!Number.isFinite(value)) {
    return value;
  }
  return Math.round(value * 1000) / 1000;
}
