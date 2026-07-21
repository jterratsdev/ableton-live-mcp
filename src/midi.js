import { readFile } from "node:fs/promises";

export async function parseMidiFileToClip(filePath) {
  const buffer = await readFile(filePath);
  const reader = new MidiReader(buffer);
  const header = reader.chunk("MThd");
  if (header.length < 6) {
    throw new Error("Invalid MIDI header");
  }

  const headerReader = new MidiReader(header);
  const format = headerReader.u16();
  const trackCount = headerReader.u16();
  const division = headerReader.u16();
  if (division & 0x8000) {
    throw new Error("SMPTE MIDI timing is not supported");
  }

  const ppq = division;
  const notes = [];
  for (let index = 0; index < trackCount; index += 1) {
    const track = reader.chunk("MTrk");
    notes.push(...parseTrack(track, ppq));
  }

  notes.sort((a, b) => a.start - b.start || a.pitch - b.pitch);
  const lengthBeats = Math.max(0.25, ...notes.map((note) => note.start + note.duration));

  return {
    format,
    ppq,
    trackCount,
    lengthBeats,
    notes
  };
}

function parseTrack(buffer, ppq) {
  const reader = new MidiReader(buffer);
  const openNotes = new Map();
  const notes = [];
  let tick = 0;
  let runningStatus = null;

  while (!reader.done()) {
    tick += reader.varlen();
    let status = reader.u8();
    if (status < 0x80) {
      if (runningStatus === null) {
        throw new Error("MIDI running status appeared before a status byte");
      }
      reader.back();
      status = runningStatus;
    } else if (status < 0xf0) {
      runningStatus = status;
    }

    if (status === 0xff) {
      reader.u8();
      reader.skip(reader.varlen());
      continue;
    }
    if (status === 0xf0 || status === 0xf7) {
      reader.skip(reader.varlen());
      continue;
    }

    const type = status & 0xf0;
    const channel = status & 0x0f;
    if (type === 0x80 || type === 0x90) {
      const pitch = reader.u8();
      const velocity = reader.u8();
      const key = `${channel}:${pitch}`;
      if (type === 0x90 && velocity > 0) {
        if (!openNotes.has(key)) {
          openNotes.set(key, []);
        }
        openNotes.get(key).push({ tick, velocity });
      } else {
        closeNote(openNotes, notes, key, pitch, tick, ppq);
      }
      continue;
    }

    reader.skip(channelEventDataLength(type));
  }

  return notes;
}

function closeNote(openNotes, notes, key, pitch, endTick, ppq) {
  const starts = openNotes.get(key);
  if (!starts || starts.length === 0) {
    return;
  }
  const started = starts.shift();
  const durationTicks = endTick - started.tick;
  if (durationTicks <= 0) {
    return;
  }
  notes.push({
    pitch,
    start: roundBeats(started.tick / ppq),
    duration: roundBeats(durationTicks / ppq),
    velocity: started.velocity
  });
}

function channelEventDataLength(type) {
  if (type === 0xc0 || type === 0xd0) {
    return 1;
  }
  if (type >= 0x80 && type <= 0xe0) {
    return 2;
  }
  throw new Error(`Unsupported MIDI event status 0x${type.toString(16)}`);
}

function roundBeats(value) {
  return Number(value.toFixed(6));
}

class MidiReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  done() {
    return this.offset >= this.buffer.length;
  }

  back() {
    this.offset -= 1;
  }

  skip(length) {
    this.offset += length;
    if (this.offset > this.buffer.length) {
      throw new Error("Unexpected end of MIDI data");
    }
  }

  u8() {
    if (this.offset >= this.buffer.length) {
      throw new Error("Unexpected end of MIDI data");
    }
    const value = this.buffer[this.offset];
    this.offset += 1;
    return value;
  }

  u16() {
    const value = this.buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  u32() {
    const value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  varlen() {
    let value = 0;
    for (let index = 0; index < 4; index += 1) {
      const byte = this.u8();
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) {
        return value;
      }
    }
    throw new Error("Invalid MIDI variable-length value");
  }

  chunk(expectedType) {
    const type = this.buffer.toString("ascii", this.offset, this.offset + 4);
    this.offset += 4;
    const length = this.u32();
    if (type !== expectedType) {
      throw new Error(`Expected ${expectedType} chunk, got ${type}`);
    }
    const start = this.offset;
    this.skip(length);
    return this.buffer.subarray(start, start + length);
  }
}
