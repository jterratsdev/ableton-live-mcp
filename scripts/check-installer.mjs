import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = await mkdtemp(join(tmpdir(), "ableton-installer-"));
const appPath = join(root, "Ableton Live 12 Lite.app");
const targetPath = join(appPath, "Contents", "App-Resources", "MIDI Remote Scripts", "AbletonMcpBridge");
await mkdir(appPath, { recursive: true });

const help = await execFileText("node", ["src/cli.js", "install-remote-script", "--help"]);
assert.match(help, /--app-path/);

const output = await execFileText("node", ["src/cli.js", "install-remote-script", "--app-path", appPath]);
assert.match(output, /Installed AbletonMcpBridge/);
assert.match(output, /ableton-live-mcp doctor --app-path/);

const installedFiles = await readdir(targetPath);
assert.ok(installedFiles.includes("__init__.py"));
assert.ok(installedFiles.includes("AbletonMcpBridge.py"));
assert.equal((await stat(join(targetPath, "live_mixer.py"))).isFile(), true);

const installedInit = await readFile(join(targetPath, "__init__.py"), "utf8");
assert.match(installedInit, /create_instance/);

const installerSource = await readFile("scripts/install-ableton-remote-script.sh", "utf8");
assert.match(installerSource, /sudo -E npx -y @jterrats\/ableton-live-mcp install-remote-script --app-path/);
assert.match(installerSource, /App Management or Full Disk Access/);

console.log("installer ok");

function execFileText(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}\n${stdout}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}
