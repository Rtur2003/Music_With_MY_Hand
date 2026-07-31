/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Constants & Music Theory Data
   ═══════════════════════════════════════════════════════════════════ */

/** All 12 chromatic note names */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = typeof NOTE_NAMES[number];

/** Major scale intervals (in semitones from root) */
export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
/** Minor scale intervals */
export const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

/** Chord quality patterns — intervals from root in semitones */
export const CHORD_TYPES = {
  major:       [0, 4, 7],
  minor:       [0, 3, 7],
  dim:         [0, 3, 6],
  maj1inv:     [4, 7, 12],       // 1st inversion
  min1inv:     [3, 7, 12],
  maj7:        [0, 4, 7, 11],
  min7:        [0, 3, 7, 10],
  dom7:        [0, 4, 7, 10],
  dim7:        [0, 3, 6, 9],
  maj9:        [0, 4, 7, 11, 14],
  min9:        [0, 3, 7, 10, 14],
  sus2:        [0, 2, 7],
  sus4:        [0, 5, 7],
} as const;

export type ChordType = keyof typeof CHORD_TYPES;

/** Diatonic chord quality for each scale degree in major scale */
export const MAJOR_DIATONIC_QUALITIES: ChordType[] = [
  'major',  // I
  'minor',  // ii
  'minor',  // iii
  'major',  // IV
  'major',  // V
  'minor',  // vi
  'dim',    // vii°
];

/** Diatonic chord quality for each scale degree in minor scale */
export const MINOR_DIATONIC_QUALITIES: ChordType[] = [
  'minor',  // i
  'dim',    // ii°
  'major',  // III
  'minor',  // iv
  'minor',  // v
  'major',  // VI
  'major',  // VII
];

/** Default base octave for synthesis */
export const BASE_OCTAVE = 4;

/** MediaPipe hand landmark indices */
export const LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;
