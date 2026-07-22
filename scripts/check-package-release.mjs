import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const npmignore = await readFile(new URL("../.npmignore", import.meta.url), "utf8");

assert.equal(packageJson.name, "@jterrats/ableton-live-mcp");
assert.equal(packageJson.private, false);
assert.equal(packageJson.version, "0.1.0");
assert.match(packageJson.version, /^\d+\.\d+\.\d+$/);
assert.equal(packageJson.bin["ableton-live-mcp"], "./src/cli.js");
assert.equal(packageJson.license, "MIT");
assert.ok(packageJson.files.includes("src/"));
assert.ok(packageJson.files.includes("bridge/"));
assert.ok(packageJson.files.includes("ableton_remote_scripts/"));
assert.ok(packageJson.files.includes("scripts/install-ableton-remote-script.sh"));
assert.ok(!packageJson.files.includes(".agent-workflow/"));
assert.ok(!packageJson.files.includes("rules/"));
assert.ok(!packageJson.files.includes("skills/"));

assert.match(npmignore, /^\.agent-workflow\/$/m);
assert.match(npmignore, /^\.generated-prompts\/$/m);
assert.match(npmignore, /^rules\/$/m);
assert.match(npmignore, /^skills\/$/m);
assert.match(npmignore, /^test\/$/m);

const help = await execFileText(process.execPath, ["src/cli.js", "--help"]);
assert.match(help, /ableton-live-mcp doctor/);
assert.match(help, /ableton-live-mcp install-remote-script/);
assert.match(help, /ableton-live-mcp bridge/);

console.log("package release ok");

function execFileText(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}
