#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDoctorReport, doctorHelp, formatDoctorReport, parseDoctorArgs } from "./doctor.js";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = dirname(dirname(__filename));

const command = process.argv[2];
const args = process.argv.slice(3);

try {
  await run(command, args);
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}

async function run(command, args) {
  if (!command || command === "mcp" || command === "serve") {
    await import("./server.js");
    return;
  }

  if (command === "doctor") {
    await runDoctor(args);
    return;
  }

  if (command === "install-remote-script") {
    await runInstallRemoteScript(args);
    return;
  }

  if (command === "bridge") {
    await runBridge(args);
    return;
  }

  if (command === "--help" || command === "-h" || command === "help") {
    printHelp();
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${helpText()}`);
}

async function runDoctor(args) {
  const options = parseDoctorArgs(args);
  if (options.help) {
    console.log(doctorHelp());
    return;
  }
  const report = await createDoctorReport(options);
  console.log(options.json ? JSON.stringify(report, null, 2) : formatDoctorReport(report));
  process.exitCode = report.ok ? 0 : 1;
}

async function runInstallRemoteScript(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: ableton-live-mcp install-remote-script [--app-path \"/Applications/Ableton Live 12 Lite.app\"]");
    return;
  }
  await runChild("bash", [join(REPO_ROOT, "scripts", "install-ableton-remote-script.sh"), ...args]);
}

async function runBridge(args) {
  const options = parseBridgeArgs(args);
  const { startDevelopmentBridge } = await import("../bridge/server.js");
  startDevelopmentBridge(options);
}

function parseBridgeArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: ableton-live-mcp bridge [--host 127.0.0.1] [--port 9789]");
      process.exit(0);
    }
    if (arg === "--host") {
      options.host = requiredValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--port") {
      options.port = requiredValue(args, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown bridge argument: ${arg}`);
  }
  return options;
}

function runChild(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} terminated by ${signal}`));
        return;
      }
      process.exitCode = code ?? 0;
      resolve();
    });
  });
}

function requiredValue(args, index, flag) {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log(helpText());
}

function helpText() {
  return `Usage: ableton-live-mcp [command]

Commands:
  mcp, serve                 Start the MCP stdio server (default)
  doctor                     Diagnose Ableton app, Remote Script, Live process, and bridge
  install-remote-script      Install the bundled Ableton Remote Script
  bridge                     Start the deterministic local development bridge
  help                       Show this help

Examples:
  ableton-live-mcp
  ableton-live-mcp doctor --app-path "/Applications/Ableton Live 12 Lite.app"
  ableton-live-mcp install-remote-script --app-path "/Applications/Ableton Live 12 Lite.app"
  ableton-live-mcp bridge --port 9789`;
}
