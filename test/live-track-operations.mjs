import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const result = spawnSync("python3", ["test/live_track_operations_test.py"], { encoding: "utf8" });
assert.equal(result.status, 0, result.stderr || result.stdout);
assert.match(result.stdout, /fresh-proxy tests ok/u);

console.log("live track operations contracts ok");
