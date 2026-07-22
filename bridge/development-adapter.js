import { BridgeRequestError } from "./errors.js";
import { analyzeAudioFile } from "./development/audio-analysis.js";
import { exportDevelopmentRender } from "./development/render.js";
import { analyzeAndApplyMastering, applyMasteringChain, bounceTracks, productionSessionReport } from "./development/production-workflows.js";
import { addOrUpdateLocator, arrangementSnapshot, insertArrangementClip } from "./development/arrangement.js";
import { setAutomation } from "./development/automation.js";
import { applyGrooveToClipNotes, humanizeClipNotes, quantizeClipNotes } from "./development/clip-notes.js";
import { createMidiClip, deleteClip, getClipNotes, importMidiFile, launchClip, launchScene } from "./development/clips.js";
import { createDevelopmentState } from "./development/default-state.js";
import { createDevelopmentSnapshot, rollbackDevelopmentSnapshot } from "./development/snapshots.js";
import {
  deleteDeviceFromChain,
  getDeviceParameters,
  loadMasterDevice,
  loadTrackDevice,
  reorderDeviceInChain,
  setDeviceParameter
} from "./development/devices.js";
import { getTrack, applyMasterPatch, applyTrackPatch, mixerWriteVerification, mixerWriteWarnings } from "./development/mixer.js";
import { projectMeterSnapshot } from "./development/metering.js";
import { consolidateClip, createMidiTrack, duplicateTrack, flattenTrack, freezeTrack } from "./development/track-operations.js";
import { listPlugins, searchBrowser } from "./development/plugins.js";
import { createReturn, deleteReturn, listBuses, listReturns, modifyReturn } from "./development/returns.js";
import { createMixerContract } from "./mixer-contract.js";
import {
  clone,
  isValidTempo,
  requireNonNegativeInteger,
  validateSignature
} from "./development/utils.js";

export class DevelopmentAbletonAdapter {
  constructor(state = {}) {
    this.state = createDevelopmentState(state);
  }

  async getStatus() {
    return {
      ok: true,
      tempo: this.state.tempo,
      playing: this.state.playing,
      tracks: this.state.tracks.map(({ index, name, type }) => ({ index, name, type }))
    };
  }

  async getProject() {
    return {
      ok: true,
      mixerContract: createMixerContract(),
      tempo: this.state.tempo,
      timeSignature: this.state.timeSignature,
      tracks: this.state.tracks.map(projectTrack),
      returns: clone(this.state.returns),
      master: clone(this.state.master),
      locators: clone(this.state.locators),
      automation: clone(this.state.automation)
    };
  }

  async getArrangement() {
    return arrangementSnapshot(this.state);
  }

  async setTempo(payload) {
    if (!isValidTempo(payload.bpm)) {
      throw new BridgeRequestError("bpm must be a number between 20 and 999");
    }
    this.state.tempo = payload.bpm;
    return { ok: true, tempo: this.state.tempo };
  }

  async setAutomation(payload) {
    return setAutomation(this.state, payload);
  }

  async createSnapshot(payload) {
    return createDevelopmentSnapshot(this.state, payload);
  }

  async rollbackSnapshot(payload) {
    return rollbackDevelopmentSnapshot(this.state, payload);
  }

  async saveProject(payload = {}) {
    return {
      ok: true,
      saved: true,
      path: typeof payload.path === "string" && payload.path.trim() ? payload.path : null,
      label: typeof payload.label === "string" && payload.label.trim() ? payload.label : null,
      mode: "deterministic-development-save"
    };
  }

  async setSignature(payload) {
    const signature = validateSignature(payload);
    this.state.timeSignature = `${signature.numerator}/${signature.denominator}`;
    return { ok: true, timeSignature: this.state.timeSignature, ...signature };
  }

  async startTransport() {
    this.state.playing = true;
    return { ok: true, playing: this.state.playing };
  }

  async stopTransport() {
    this.state.playing = false;
    return { ok: true, playing: this.state.playing };
  }

  async analyzeAudio(payload) {
    return analyzeAudioFile(payload);
  }

  async exportRender(payload) {
    return exportDevelopmentRender(this.state, payload);
  }

  async bounceTracks(payload) {
    return bounceTracks(this.state, payload);
  }

  async getProductionReport() {
    return productionSessionReport(this.state);
  }

  async analyzeAndApplyMastering(payload) {
    return analyzeAndApplyMastering(this.state, payload);
  }

  async listPlugins(filters = {}) {
    return listPlugins(this.state, filters);
  }

  async searchBrowser(filters = {}) {
    return searchBrowser(this.state, filters);
  }

  async createMidiTrack(payload = {}) {
    return createMidiTrack(this.state, payload);
  }

  async duplicateTrack(payload) {
    return duplicateTrack(this.state, payload);
  }

  async freezeTrack(payload) {
    return freezeTrack(this.state, payload);
  }

  async flattenTrack(payload) {
    return flattenTrack(this.state, payload);
  }

  async modifyTrack(payload) {
    const track = getTrack(this.state, requireNonNegativeInteger(payload.trackIndex, "trackIndex"));
    const applied = applyTrackPatch(track, payload, this.state.returns);
    const writeVerification = mixerWriteVerification(track, payload, applied);
    return { ok: true, track: clone(track), applied, writeVerification, warnings: mixerWriteWarnings(writeVerification) };
  }

  async listReturns() {
    return listReturns(this.state);
  }

  async createReturn(payload = {}) {
    return createReturn(this.state, payload);
  }

  async modifyReturn(payload) {
    return modifyReturn(this.state, payload);
  }

  async deleteReturn(payload = {}) {
    return deleteReturn(this.state, payload);
  }

  async listBuses() {
    return listBuses(this.state);
  }

  async getMeters() {
    return projectMeterSnapshot(this.state);
  }

  async modifyMaster(payload) {
    const { applied, warnings } = applyMasterPatch(this.state.master, payload);
    const writeVerification = mixerWriteVerification(this.state.master, payload, applied);
    return { ok: true, master: clone(this.state.master), applied, writeVerification, warnings: [...warnings, ...mixerWriteWarnings(writeVerification)] };
  }

  async insertArrangementClip(payload) {
    return insertArrangementClip(this.state, payload);
  }

  async addLocator(payload) {
    return addOrUpdateLocator(this.state, payload);
  }

  async loadDevice(payload) {
    return loadTrackDevice(this.state, payload);
  }

  async loadMasterDevice(payload) {
    return loadMasterDevice(this.state, payload);
  }

  async setDeviceParameter(payload) {
    return setDeviceParameter(this.state, payload);
  }

  async getDeviceParameters(payload) {
    return getDeviceParameters(this.state, payload);
  }

  async deleteDevice(payload) {
    return deleteDeviceFromChain(this.state, payload);
  }

  async reorderDevice(payload) {
    return reorderDeviceInChain(this.state, payload);
  }

  async createMidiClip(payload) {
    return createMidiClip(this.state, payload);
  }

  async consolidateClip(payload) {
    return consolidateClip(this.state, payload);
  }

  async deleteClip(payload) {
    return deleteClip(this.state, payload);
  }

  async getClipNotes(payload) {
    return getClipNotes(this.state, payload);
  }

  async launchClip(payload) {
    return launchClip(this.state, payload);
  }

  async launchScene(payload) {
    return launchScene(this.state, payload);
  }

  async humanizeClip(payload) {
    return humanizeClipNotes(this.state, payload);
  }

  async quantizeClip(payload) {
    return quantizeClipNotes(this.state, payload);
  }

  async applyGroove(payload) {
    return applyGrooveToClipNotes(this.state, payload);
  }

  async importMidi(payload) {
    return importMidiFile(this.state, payload);
  }

  async applyMasteringChain(payload) {
    return applyMasteringChain(this.state, payload);
  }
}

function projectTrack(track) {
  return {
    ...clone(track),
    sendsDb: clone(track.sends ?? {}),
    sendsDisplay: Object.fromEntries(Object.entries(track.sends ?? {}).map(([name, value]) => [name, dbDisplay(value)]))
  };
}

function dbDisplay(value) {
  if (value === null || value === undefined || value === -Infinity) {
    return "-inf dB";
  }
  return `${Number(value).toFixed(1)} dB`;
}
