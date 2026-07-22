#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadBridgeConfig } from "./config.js";

const SCRIPT_NAME = "AbletonMcpBridge";
const STATUS_PATH = "/status";
const COMMON_APP_NAMES = [
  "Ableton Live 12 Suite.app",
  "Ableton Live 12 Standard.app",
  "Ableton Live 12 Lite.app",
  "Ableton Live 11 Suite.app",
  "Ableton Live 11 Standard.app",
  "Ableton Live 11 Lite.app"
];

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = dirname(dirname(__filename));

export async function createDoctorReport(options = {}, adapters = {}) {
  const env = options.env ?? process.env;
  const sourceDir = options.sourceDir ?? join(REPO_ROOT, "ableton_remote_scripts", SCRIPT_NAME);
  const appPath = resolveAbletonAppPath(options, env);
  const appFound = Boolean(appPath && existsSync(appPath));
  const installedPath = appPath ? remoteScriptPath(appPath) : null;
  const bridgeConfig = loadBridgeConfig({
    baseUrl: options.bridgeUrl,
    timeoutMs: options.timeoutMs,
    dryRun: false
  }, env);
  const [freshness, liveProcesses, bridge] = await Promise.all([
    compareRemoteScriptFiles(sourceDir, appFound ? installedPath : null, installedPath),
    (adapters.listLiveProcesses ?? listLiveProcesses)(),
    (adapters.fetchBridgeStatus ?? fetchBridgeStatus)(bridgeConfig)
  ]);
  const liveProcess = selectLiveProcess(liveProcesses, appPath);
  const staleRuntime = diagnoseStaleRuntime({ freshness, liveProcess, bridge });

  return {
    ok: freshness.status === "fresh" && bridge.reachable && staleRuntime.status === "not_detected",
    abletonApp: {
      path: appPath,
      found: appFound
    },
    remoteScript: {
      name: SCRIPT_NAME,
      sourcePath: sourceDir,
      installedPath,
      freshness
    },
    live: {
      pid: liveProcess?.pid ?? null,
      startedAt: liveProcess?.startedAt ?? null,
      command: liveProcess?.command ?? null,
      running: Boolean(liveProcess)
    },
    bridge,
    staleRuntime
  };
}

export function formatDoctorReport(report) {
  return [
    "Ableton MCP Doctor",
    `Ableton app: ${formatFoundPath(report.abletonApp)}`,
    `Remote Script: ${formatInstalledPath(report.remoteScript)}`,
    `File freshness: ${formatFreshness(report.remoteScript.freshness)}`,
    `Live process: ${formatLiveProcess(report.live)}`,
    `Bridge status: ${formatBridgeStatus(report.bridge)}`,
    `Stale-runtime diagnosis: ${report.staleRuntime.message}`,
    "",
    "Next steps:",
    ...report.staleRuntime.actions.map((action) => `- ${action}`)
  ].join("\n");
}

export function parseDoctorArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--app-path") {
      options.appPath = requiredValue(argv, index, arg);
      index += 1;
    } else if (arg === "--bridge-url") {
      options.bridgeUrl = requiredValue(argv, index, arg);
      index += 1;
    } else if (arg === "--timeout-ms") {
      options.timeoutMs = requiredValue(argv, index, arg);
      index += 1;
    } else if (!arg.startsWith("-") && !options.appPath) {
      options.appPath = arg;
    } else {
      throw new Error(`Unknown doctor argument: ${arg}`);
    }
  }
  return options;
}

export function doctorHelp() {
  return `Usage: ableton-live-mcp doctor [--app-path "/Applications/Ableton Live 12 Lite.app"] [--json]

Reports Ableton app path, installed Remote Script path, file freshness, Live PID,
bridge /status health, and stale-runtime restart guidance.`;
}

async function compareRemoteScriptFiles(sourceDir, installedPath, reportedInstalledPath = installedPath) {
  if (!installedPath) {
    return { status: "app_not_found", sourceDir, installedPath: reportedInstalledPath, changed: [], missing: [], extra: [] };
  }
  if (!existsSync(installedPath)) {
    return { status: "not_installed", sourceDir, installedPath, changed: [], missing: [], extra: [] };
  }

  const [sourceFiles, installedFiles] = await Promise.all([
    snapshotDirectory(sourceDir),
    snapshotDirectory(installedPath)
  ]);
  const changed = [];
  const missing = [];

  for (const [path, source] of sourceFiles) {
    const installed = installedFiles.get(path);
    if (!installed) {
      missing.push(path);
    } else if (installed.hash !== source.hash) {
      changed.push(path);
    }
  }

  const extra = [...installedFiles.keys()].filter((path) => !sourceFiles.has(path));
  return {
    status: missing.length || changed.length ? "stale" : "fresh",
    sourceDir,
    installedPath,
    sourceNewestAt: newestModifiedAt(sourceFiles),
    installedNewestAt: newestModifiedAt(installedFiles),
    checkedFiles: sourceFiles.size,
    changed,
    missing,
    extra
  };
}

async function snapshotDirectory(root) {
  const files = new Map();
  await collectFiles(root, root, files);
  return files;
}

async function collectFiles(root, current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(root, path, files);
      return;
    }
    if (!entry.isFile()) {
      return;
    }
    const [fileStat, contents] = await Promise.all([stat(path), readFile(path)]);
    files.set(relative(root, path), {
      modifiedAt: fileStat.mtime.toISOString(),
      hash: createHash("sha256").update(contents).digest("hex")
    });
  }));
}

function newestModifiedAt(files) {
  return [...files.values()]
    .map((file) => file.modifiedAt)
    .sort()
    .at(-1) ?? null;
}

async function fetchBridgeStatus(config) {
  const url = new URL(STATUS_PATH, config.baseUrl);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(config.timeoutMs) });
    const text = await response.text();
    const body = parseBridgeBody(text);
    return {
      url: url.toString(),
      reachable: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      body
    };
  } catch (error) {
    return {
      url: url.toString(),
      reachable: false,
      error: error.message
    };
  }
}

async function listLiveProcesses() {
  const pids = await execFileLines("pgrep", ["-f", "Ableton Live"]);
  const processes = await Promise.all(pids.map(async (pid) => {
    const lines = await execFileLines("ps", ["-p", pid, "-o", "pid=", "-o", "lstart=", "-o", "command="]);
    return parsePsLine(lines[0]);
  }));
  const liveProcesses = processes.filter((process) => process && isAbletonLiveProcess(process.command));
  if (liveProcesses.length) {
    return liveProcesses;
  }

  const psLines = await execFileLines("ps", ["-ef"]);
  return psLines.map(parsePsEfLine).filter((process) => process && isAbletonLiveProcess(process.command));
}

function parsePsLine(line) {
  const match = line?.trim().match(/^(\d+)\s+([A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d+\s+\d\d:\d\d:\d\d\s+\d{4})\s+(.+)$/);
  if (!match) {
    return null;
  }
  return {
    pid: Number(match[1]),
    startedAt: new Date(match[2]).toISOString(),
    command: match[3]
  };
}

function parsePsEfLine(line) {
  const match = line?.trim().match(/^\S+\s+(\d+)\s+\d+\s+\S+\s+\S+\s+\S+\s+\S+\s+(.+)$/);
  if (!match) {
    return null;
  }
  return {
    pid: Number(match[1]),
    startedAt: null,
    command: match[2]
  };
}

function execFileLines(command, args) {
  return new Promise((resolve) => {
    try {
      execFile(command, args, { encoding: "utf8" }, (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }
        resolve(stdout.split("\n").map((line) => line.trim()).filter(Boolean));
      });
    } catch {
      resolve([]);
    }
  });
}

export function isAbletonLiveProcess(command = "") {
  return /Ableton Live \d+ .*\.app\/Contents\/MacOS\/(?:Live|Ableton Live[^/]*)$/.test(command);
}

function diagnoseStaleRuntime({ freshness, liveProcess, bridge }) {
  if (freshness.status === "app_not_found") {
    return diagnosis("app_not_found", "Ableton app was not found.", [
      "Pass the app path with ableton-live-mcp doctor --app-path \"/Applications/Ableton Live 12 Lite.app\"."
    ]);
  }
  if (freshness.status === "not_installed") {
    return diagnosis("not_installed", "Remote Script is not installed in the selected Ableton app.", [
      "Run ableton-live-mcp install-remote-script \"<Ableton app path>\"."
    ]);
  }
  if (freshness.status === "stale") {
    return diagnosis("installed_files_stale", "Installed Remote Script files differ from the bundled copy.", [
      "Run ableton-live-mcp install-remote-script \"<Ableton app path>\".",
      "Restart Ableton Live after reinstalling so the Python runtime reloads the script."
    ]);
  }
  if (!liveProcess) {
    return diagnosis("live_not_running", "Remote Script files are fresh, but Ableton Live is not running.", [
      "Start Ableton Live, select AbletonMcpBridge as a Control Surface, then rerun ableton-live-mcp doctor."
    ]);
  }
  if (freshness.installedNewestAt && liveProcess.startedAt && freshness.installedNewestAt > liveProcess.startedAt) {
    return diagnosis("live_started_before_install", "Ableton Live started before the installed Remote Script was updated.", [
      "Restart Ableton Live so it reloads the installed Remote Script."
    ]);
  }
  if (!bridge.reachable) {
    return diagnosis("bridge_unreachable_live_running", "Ableton Live is running, but the bridge /status endpoint is not reachable.", [
      "In Preferences -> Link, Tempo & MIDI, select AbletonMcpBridge as a Control Surface.",
      "Restart Ableton Live if the Control Surface is already selected."
    ]);
  }
  return diagnosis("not_detected", "No stale Remote Script runtime was detected.", [
    "Use npm run smoke:bridge for a deeper local MCP-to-bridge verification."
  ]);
}

function diagnosis(status, message, actions) {
  return { status, message, actions };
}

function resolveAbletonAppPath(options, env) {
  if (options.appPath) {
    return options.appPath;
  }
  if (env.ABLETON_APP_PATH) {
    return env.ABLETON_APP_PATH;
  }
  return COMMON_APP_NAMES.map((name) => join("/Applications", name)).find((path) => existsSync(path)) ?? null;
}

function remoteScriptPath(appPath) {
  return join(appPath, "Contents", "App-Resources", "MIDI Remote Scripts", SCRIPT_NAME);
}

function selectLiveProcess(processes, appPath) {
  if (!appPath) {
    return processes[0] ?? null;
  }
  const appName = basename(appPath, ".app");
  return processes.find((process) => process.command.includes(appName)) ?? processes[0] ?? null;
}

function formatFoundPath(app) {
  return app.found ? app.path : `not found${app.path ? ` (${app.path})` : ""}`;
}

function formatInstalledPath(remoteScript) {
  return remoteScript.installedPath ?? "unknown because Ableton app was not found";
}

function formatFreshness(freshness) {
  if (freshness.status === "fresh") {
    return `fresh (${freshness.checkedFiles} files match)`;
  }
  if (freshness.status === "stale") {
    return `stale (${freshness.changed.length} changed, ${freshness.missing.length} missing)`;
  }
  return freshness.status.replaceAll("_", " ");
}

function formatLiveProcess(live) {
  return live.running ? `running pid ${live.pid} since ${live.startedAt}` : "not running";
}

function formatBridgeStatus(bridge) {
  if (bridge.reachable) {
    return `reachable ${bridge.url} (${bridge.statusCode})`;
  }
  return `unreachable ${bridge.url}${bridge.error ? ` (${bridge.error})` : ""}`;
}

function parseBridgeBody(text) {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function requiredValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

async function main() {
  try {
    const options = parseDoctorArgs(process.argv.slice(2));
    if (options.help) {
      console.log(doctorHelp());
      return;
    }
    const report = await createDoctorReport(options);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatDoctorReport(report));
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

if (process.argv[1] === __filename) {
  await main();
}
