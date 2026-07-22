import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const result = spawnSync("python3", ["test/live_meter_cache_test.py"], {
  cwd: process.cwd(),
  encoding: "utf8"
});

assert.equal(result.status, 0, result.stderr || result.stdout);
console.log("live meter cache ok");
