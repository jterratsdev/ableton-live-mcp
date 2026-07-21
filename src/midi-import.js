import { parseMidiFileToClip } from "./midi.js";

export async function importMidi(bridge, args) {
  const parsed = await parseMidiFileToClip(args.path);
  if (parsed.notes.length === 0) {
    throw new Error("MIDI file does not contain note events");
  }

  const target = {
    trackIndex: args.trackIndex ?? 0,
    clipSlotIndex: args.clipSlotIndex ?? 0,
    lengthBeats: parsed.lengthBeats,
    notes: parsed.notes
  };
  const clip = await bridge.invoke("create_midi_clip", target);

  return {
    ok: true,
    imported: {
      path: args.path,
      trackIndex: target.trackIndex,
      clipSlotIndex: target.clipSlotIndex,
      createTracks: args.createTracks ?? false,
      quantize: args.quantize,
      format: parsed.format,
      ppq: parsed.ppq,
      sourceTrackCount: parsed.trackCount,
      noteCount: parsed.notes.length,
      mode: "mcp-midi-parser-to-clip"
    },
    clip
  };
}
