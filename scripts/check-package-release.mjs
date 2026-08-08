import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const packageLock = JSON.parse(
  await readFile(new URL("../package-lock.json", import.meta.url), "utf8")
);
const npmignore = await readFile(new URL("../.npmignore", import.meta.url), "utf8");
const ciWorkflow = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const publishWorkflow = await readFile(
  new URL("../.github/workflows/publish.yml", import.meta.url),
  "utf8"
);

assert.equal(packageJson.name, "@jterrats/ableton-live-mcp");
assert.equal(packageJson.private, false);
assert.match(packageJson.version, /^\d+\.\d+\.\d+$/);
assert.equal(packageJson.bin["ableton-live-mcp"], "./src/cli.js");
assert.equal(packageJson.license, "MIT");
assert.equal(packageJson.author, "Jaime Terrats");
assert.deepEqual(packageJson.repository, {
  type: "git",
  url: "git+https://github.com/jterratsdev/ableton-live-mcp.git"
});
assert.equal(packageJson.homepage, "https://ableton-mcp.jterrats.dev");
assert.equal(packageJson.bugs.url, "https://github.com/jterratsdev/ableton-live-mcp/issues");
assert.equal(packageJson.publishConfig.access, "public");
assert.ok(packageJson.keywords.includes("ableton-live"));
assert.ok(packageJson.keywords.includes("mcp"));
assert.ok(packageJson.keywords.includes("model-context-protocol"));
assert.equal(packageLock.name, packageJson.name);
assert.equal(packageLock.version, packageJson.version);
assert.equal(packageLock.packages[""].name, packageJson.name);
assert.equal(packageLock.packages[""].version, packageJson.version);
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

assert.match(ciWorkflow, /^\s+pull_request:$/m);
assert.match(ciWorkflow, /^\s+push:$/m);
assert.match(ciWorkflow, /branches:\s*\n\s+- main/);
assert.match(ciWorkflow, /paths-ignore:/);
assert.match(ciWorkflow, /\.agent-workflow\/\*\*/);
assert.match(ciWorkflow, /"\*\*\/\*\.md"/);
assert.match(ciWorkflow, /cancel-in-progress:\s*true/);
assert.match(ciWorkflow, /github\.actor != 'dependabot\[bot\]'/);
assert.match(ciWorkflow, /node-version:\s*18/);
assert.doesNotMatch(ciWorkflow, /matrix:/);
assert.match(ciWorkflow, /apt-get install --yes ffmpeg/);
assert.match(ciWorkflow, /run:\s*npm ci/);
assert.match(ciWorkflow, /run:\s*npm test/);
assert.match(ciWorkflow, /python3 -m py_compile/);
assert.match(ciWorkflow, /npm pack --dry-run --ignore-scripts/);

assert.match(publishWorkflow, /^\s+push:$/m);
assert.match(publishWorkflow, /branches:\s*\n\s+- main/);
assert.match(publishWorkflow, /paths:\s*\n\s+- package\.json/);
assert.doesNotMatch(publishWorkflow, /^\s+workflow_dispatch:$/m);
assert.match(publishWorkflow, /github\.actor != 'dependabot\[bot\]'/);
assert.match(publishWorkflow, /fetch-depth:\s*0/);
assert.match(publishWorkflow, /BEFORE_SHA:/);
assert.match(publishWorkflow, /git cat-file -e "\$\{BEFORE_SHA\}:package\.json"/);
assert.match(publishWorkflow, /package-lock\.json/);
assert.match(publishWorkflow, /if \[ "\$current" = "\$previous" \]; then/);
assert.match(publishWorkflow, /changed=false/);
assert.match(publishWorkflow, /exit 0/);
assert.match(publishWorkflow, /needs:\s*detect-version/);
assert.match(publishWorkflow, /needs\.detect-version\.outputs\.changed == 'true'/);
assert.match(publishWorkflow, /^\s+id-token:\s*write$/m);
assert.doesNotMatch(publishWorkflow, /^\s+environment:\s*npm$/m);
assert.match(publishWorkflow, /node-version:\s*24/);
assert.match(publishWorkflow, /apt-get install --yes ffmpeg/);
assert.match(publishWorkflow, /NODE_AUTH_TOKEN:\s*\$\{\{ secrets\.NPM_TOKEN \}\}/);
assert.match(publishWorkflow, /npm whoami --registry=https:\/\/registry\.npmjs\.org/);
assert.match(publishWorkflow, /npm ci/);
assert.match(publishWorkflow, /npm test/);
assert.match(publishWorkflow, /python3 -m py_compile/);
assert.match(publishWorkflow, /npm pack --dry-run --ignore-scripts/);
assert.match(publishWorkflow, /npm publish --ignore-scripts --access public --provenance/);
assert.ok(
  publishWorkflow.indexOf("npm test") <
    publishWorkflow.indexOf("npm publish --ignore-scripts --access public --provenance")
);

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
