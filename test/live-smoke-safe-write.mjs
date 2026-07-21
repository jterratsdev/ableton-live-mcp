#!/usr/bin/env node
import { runLiveSmokeSuite } from "./live-smoke-suite.mjs";

runLiveSmokeSuite("safe-write").catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
