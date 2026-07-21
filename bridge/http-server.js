import http from "node:http";
import { BridgeRequestError } from "./errors.js";

const MAX_BODY_BYTES = 64 * 1024;

export function createBridgeServer(adapter) {
  return http.createServer(async (req, res) => {
    try {
      const result = await routeRequest(req, adapter);
      sendJson(res, 200, result);
    } catch (error) {
      sendError(res, error);
    }
  });
}

async function routeRequest(req, adapter) {
  const url = new URL(req.url, "http://127.0.0.1");
  const route = `${req.method} ${url.pathname}`;

  switch (route) {
    case "GET /status":
      return adapter.getStatus();
    case "GET /project":
      return adapter.getProject();
    case "GET /arrangement":
      return adapter.getArrangement();
    case "POST /project/snapshot":
      return adapter.createSnapshot(await readJsonBody(req));
    case "POST /project/rollback":
      return adapter.rollbackSnapshot(await readJsonBody(req));
    case "GET /plugins":
      return adapter.listPlugins(Object.fromEntries(url.searchParams));
    case "GET /browser/search":
      return adapter.searchBrowser(Object.fromEntries(url.searchParams));
    case "POST /analysis/audio":
      return adapter.analyzeAudio(await readJsonBody(req));
    case "GET /production/report":
      return adapter.getProductionReport();
    case "POST /tempo":
      return adapter.setTempo(await readJsonBody(req));
    case "POST /automation":
      return adapter.setAutomation(await readJsonBody(req));
    case "POST /project/save":
      return adapter.saveProject(await readJsonBody(req));
    case "POST /signature":
      return adapter.setSignature(await readJsonBody(req));
    case "POST /tracks/midi":
      return adapter.createMidiTrack(await readJsonBody(req));
    case "POST /tracks/duplicate":
      return adapter.duplicateTrack(await readJsonBody(req));
    case "POST /tracks/freeze":
      return adapter.freezeTrack(await readJsonBody(req));
    case "POST /tracks/flatten":
      return adapter.flattenTrack(await readJsonBody(req));
    case "POST /tracks/modify":
      return adapter.modifyTrack(await readJsonBody(req));
    case "GET /returns":
      return adapter.listReturns();
    case "POST /returns/create":
      return adapter.createReturn(await readJsonBody(req));
    case "POST /returns/modify":
      return adapter.modifyReturn(await readJsonBody(req));
    case "DELETE /returns":
      return adapter.deleteReturn(await readJsonBody(req));
    case "GET /routing/buses":
      return adapter.listBuses();
    case "GET /meters":
      return adapter.getMeters();
    case "POST /master/modify":
      return adapter.modifyMaster(await readJsonBody(req));
    case "POST /arrangement/insert":
      return adapter.insertArrangementClip(await readJsonBody(req));
    case "POST /arrangement/locators":
      return adapter.addLocator(await readJsonBody(req));
    case "POST /devices/load":
      return adapter.loadDevice(await readJsonBody(req));
    case "POST /devices/load-master":
      return adapter.loadMasterDevice(await readJsonBody(req));
    case "GET /devices/parameters":
      return adapter.getDeviceParameters(Object.fromEntries(url.searchParams));
    case "POST /devices/parameter":
      return adapter.setDeviceParameter(await readJsonBody(req));
    case "POST /devices/reorder":
      return adapter.reorderDevice(await readJsonBody(req));
    case "DELETE /devices":
      return adapter.deleteDevice(await readJsonBody(req));
    case "POST /mastering/apply":
      return adapter.applyMasteringChain(await readJsonBody(req));
    case "POST /render/export":
      return adapter.exportRender(await readJsonBody(req));
    case "POST /tracks/bounce":
      return adapter.bounceTracks(await readJsonBody(req));
    case "POST /mastering/analyze-and-apply":
      return adapter.analyzeAndApplyMastering(await readJsonBody(req));
    case "POST /clips/midi":
      return adapter.createMidiClip(await readJsonBody(req));
    case "POST /clips/consolidate":
      return adapter.consolidateClip(await readJsonBody(req));
    case "DELETE /clips/midi":
      return adapter.deleteClip(await readJsonBody(req));
    case "GET /clips/notes":
      return adapter.getClipNotes(Object.fromEntries(url.searchParams));
    case "POST /clips/humanize":
      return adapter.humanizeClip(await readJsonBody(req));
    case "POST /clips/quantize":
      return adapter.quantizeClip(await readJsonBody(req));
    case "POST /groove/apply":
      return adapter.applyGroove(await readJsonBody(req));
    case "POST /midi/import":
      return adapter.importMidi(await readJsonBody(req));
    case "POST /transport/start":
      return adapter.startTransport(await readJsonBody(req));
    case "POST /transport/stop":
      return adapter.stopTransport(await readJsonBody(req));
    default:
      throw new BridgeRequestError(`Unsupported endpoint: ${route}`, 404);
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        reject(new BridgeRequestError("Request body is too large", 413));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new BridgeRequestError("Request body must be valid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function sendError(res, error) {
  const statusCode = error.statusCode ?? 500;
  sendJson(res, statusCode, {
    ok: false,
    error: statusCode === 500 ? "Internal bridge error" : error.message
  });
}
