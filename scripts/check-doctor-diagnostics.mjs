import assert from "node:assert/strict";
import { mkdtemp, mkdir, cp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDoctorReport, formatDoctorReport, isAbletonLiveProcess } from "../src/doctor.js";

checksLiveProcessCommandShapes();
await reportsFreshInstallAndHealthyBridge();
await diagnosesStaleInstalledFiles();

console.log("doctor diagnostics ok");

function checksLiveProcessCommandShapes() {
  assert.equal(isAbletonLiveProcess("/Applications/Ableton Live 12 Lite.app/Contents/MacOS/Live"), true);
  assert.equal(isAbletonLiveProcess("/Applications/Ableton Live 12 Lite.app/Contents/MacOS/Ableton Live 12 Lite"), true);
  assert.equal(isAbletonLiveProcess("/Applications/Some Other App.app/Contents/MacOS/Live"), false);
}

async function reportsFreshInstallAndHealthyBridge() {
  const fixture = await createFixtureApp();
  const report = await createDoctorReport({
    appPath: fixture.appPath,
    sourceDir: fixture.sourceDir,
    env: {}
  }, {
    fetchBridgeStatus: async () => ({
      url: "http://127.0.0.1:9789/status",
      reachable: true,
      statusCode: 200,
      statusText: "OK",
      body: { ok: true, tempo: 124, tracks: [] }
    }),
    listLiveProcesses: async () => [{
      pid: 1234,
      startedAt: "2099-07-20T20:00:00.000Z",
      command: `${fixture.appPath}/Contents/MacOS/Live`
    }]
  });

  assert.equal(report.ok, true);
  assert.equal(report.abletonApp.path, fixture.appPath);
  assert.equal(report.remoteScript.installedPath, fixture.installedPath);
  assert.equal(report.remoteScript.freshness.status, "fresh");
  assert.equal(report.live.pid, 1234);
  assert.equal(report.bridge.reachable, true);
  assert.equal(report.bridge.body.tempo, 124);
  assert.equal(report.staleRuntime.status, "not_detected");
  assert.match(formatDoctorReport(report), /File freshness: fresh/);
}

async function diagnosesStaleInstalledFiles() {
  const fixture = await createFixtureApp();
  await writeFile(join(fixture.installedPath, "http_bridge.py"), "stale copy\n");

  const report = await createDoctorReport({
    appPath: fixture.appPath,
    sourceDir: fixture.sourceDir,
    env: {}
  }, {
    fetchBridgeStatus: async () => ({
      url: "http://127.0.0.1:9789/status",
      reachable: false,
      error: "connection refused"
    }),
    listLiveProcesses: async () => []
  });

  assert.equal(report.ok, false);
  assert.equal(report.remoteScript.freshness.status, "stale");
  assert.deepEqual(report.remoteScript.freshness.changed, ["http_bridge.py"]);
  assert.equal(report.staleRuntime.status, "installed_files_stale");
  assert.match(formatDoctorReport(report), /Installed Remote Script files differ/);
}

async function createFixtureApp() {
  const root = await mkdtemp(join(tmpdir(), "ableton-doctor-"));
  const sourceDir = join(root, "source", "AbletonMcpBridge");
  const appPath = join(root, "Ableton Live 12 Lite.app");
  const installedPath = join(appPath, "Contents", "App-Resources", "MIDI Remote Scripts", "AbletonMcpBridge");

  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, "__init__.py"), "def create_instance(c_instance):\n    pass\n");
  await writeFile(join(sourceDir, "http_bridge.py"), "STATUS = 'fresh'\n");
  await mkdir(installedPath, { recursive: true });
  await cp(sourceDir, installedPath, { recursive: true });

  return { appPath, sourceDir, installedPath };
}
