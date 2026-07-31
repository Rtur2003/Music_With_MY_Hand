/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — MIDI Export Utility
   Creates standard MIDI Type 0 files from played notes
   ═══════════════════════════════════════════════════════════════════ */

export interface RecordedNote {
  note: string;       // e.g. "C4", "G#5"
  startTime: number;  // seconds from start
  duration: number;   // seconds
}

/** Convert note string like "C4" to MIDI pitch number (60 for C4) */
export function noteToMidiPitch(note: string): number {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const name = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = notes.indexOf(name);
  return (octave + 1) * 12 + noteIndex;
}

/**
 * Generate a standard MIDI file (Type 0) binary blob
 */
export function generateMidiBlob(recordedNotes: RecordedNote[]): Blob {
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Chunk size (6 bytes)
    0x00, 0x00,             // Format Type 0
    0x00, 0x01,             // 1 track
    0x01, 0xe0,             // 480 ticks per quarter note
  ];

  const trackEvents: number[] = [];

  // Sort notes by start time
  const events: { time: number; type: 'on' | 'off'; pitch: number }[] = [];
  recordedNotes.forEach(n => {
    const pitch = noteToMidiPitch(n.note);
    events.push({ time: n.startTime, type: 'on', pitch });
    events.push({ time: n.startTime + n.duration, type: 'off', pitch });
  });

  events.sort((a, b) => a.time - b.time);

  let lastTicks = 0;
  const ticksPerSecond = 480 * 2; // 120 BPM assumed

  events.forEach(ev => {
    const currentTicks = Math.round(ev.time * ticksPerSecond);
    const deltaTicks = Math.max(0, currentTicks - lastTicks);
    lastTicks = currentTicks;

    // Write Variable Length Quantity (VLQ) for delta time
    writeVLQ(trackEvents, deltaTicks);

    if (ev.type === 'on') {
      trackEvents.push(0x90, ev.pitch, 0x64); // Note On channel 0, velocity 100
    } else {
      trackEvents.push(0x80, ev.pitch, 0x00); // Note Off channel 0, velocity 0
    }
  });

  // End of Track event
  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackEvents.length >> 24) & 0xff,
    (trackEvents.length >> 16) & 0xff,
    (trackEvents.length >> 8) & 0xff,
    trackEvents.length & 0xff,
  ];

  const midiBytes = new Uint8Array([...header, ...trackHeader, ...trackEvents]);
  return new Blob([midiBytes], { type: 'audio/midi' });
}

function writeVLQ(buffer: number[], value: number): void {
  let bufferVal = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7) > 0) {
    bufferVal <<= 8;
    bufferVal |= 0x80 | (value & 0x7f);
  }
  while (true) {
    bytes.push(bufferVal & 0xff);
    if (bufferVal & 0x80) {
      bufferVal >>= 8;
    } else {
      break;
    }
  }
  buffer.push(...bytes);
}

/** Helper to download blob as file */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
