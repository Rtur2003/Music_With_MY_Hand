/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Chord Builder
   Converts scale degrees + mode → concrete note arrays
   ═══════════════════════════════════════════════════════════════════ */

import {
  NOTE_NAMES,
  MAJOR_SCALE,
  MINOR_SCALE,
  CHORD_TYPES,
  MAJOR_DIATONIC_QUALITIES,
  MINOR_DIATONIC_QUALITIES,
  BASE_OCTAVE,
  type NoteName,
  type ChordType,
} from '../utils/constants';

export interface ChordResult {
  /** Chord display name e.g. "Am7" */
  name: string;
  /** Array of Tone.js note strings e.g. ["A4","C5","E5","G5"] */
  notes: string[];
  /** Root note name */
  root: NoteName;
  /** Bass note (root, one octave lower) */
  bassNote: string;
  /** Chord quality */
  quality: ChordType;
}

/**
 * Get the MIDI note name from a root index + semitone offset
 */
function midiNoteName(rootIndex: number, semitoneOffset: number, octave: number): string {
  const noteIdx = (rootIndex + semitoneOffset) % 12;
  const octaveShift = Math.floor((rootIndex + semitoneOffset) / 12);
  return `${NOTE_NAMES[noteIdx]}${octave + octaveShift}`;
}

/**
 * Build a chord from scale degree, key, and mode
 * 
 * @param key - Root key index (0=C, 1=C#, ... 9=A, etc.)
 * @param scaleDegree - 0-indexed scale degree (0=I, 1=ii, ... 6=vii)
 * @param isMinor - Whether to use minor scale
 * @param chordComplexity - 0=triad, 1=1st inv, 2=7th, 3=9th
 * @param octaveShift - -1, 0, or +1
 */
export function buildChord(
  key: number,
  scaleDegree: number,
  isMinor: boolean,
  chordComplexity: number = 0,
  octaveShift: number = 0,
): ChordResult {
  const scale = isMinor ? MINOR_SCALE : MAJOR_SCALE;
  const qualities = isMinor ? MINOR_DIATONIC_QUALITIES : MAJOR_DIATONIC_QUALITIES;

  // Clamp scale degree
  const deg = Math.max(0, Math.min(6, scaleDegree));

  // Root note index in chromatic scale
  const rootIndex = (key + scale[deg]) % 12;
  const rootName = NOTE_NAMES[rootIndex];
  const quality = qualities[deg];
  const octave = BASE_OCTAVE + octaveShift;

  // Determine chord intervals based on complexity
  let chordType: ChordType;
  if (chordComplexity <= 0) {
    chordType = quality; // natural triad
  } else if (chordComplexity === 1) {
    // 1st inversion
    chordType = quality === 'minor' ? 'min1inv' : quality === 'major' ? 'maj1inv' : quality;
  } else if (chordComplexity === 2) {
    // 7th chord
    chordType = quality === 'minor' ? 'min7' : quality === 'major' ? 'maj7' : quality === 'dim' ? 'dim7' : 'dom7';
  } else {
    // 9th chord
    chordType = quality === 'minor' ? 'min9' : quality === 'major' ? 'maj9' : quality === 'dim' ? 'dim7' : 'dom7';
  }

  const intervals = CHORD_TYPES[chordType];
  const notes = intervals.map(interval => midiNoteName(rootIndex, interval, octave));

  // Build display name
  const qualityLabel = getQualityLabel(chordType);
  const name = `${rootName}${qualityLabel}`;

  // Bass note = root, one octave below
  const bassNote = `${rootName}${octave - 1}`;

  return { name, notes, root: rootName, bassNote, quality: chordType };
}

function getQualityLabel(quality: ChordType): string {
  switch (quality) {
    case 'major': return '';
    case 'minor': return 'm';
    case 'dim': return 'dim';
    case 'maj1inv': return '/1st';
    case 'min1inv': return 'm/1st';
    case 'maj7': return 'maj7';
    case 'min7': return 'm7';
    case 'dom7': return '7';
    case 'dim7': return 'dim7';
    case 'maj9': return 'maj9';
    case 'min9': return 'm9';
    case 'sus2': return 'sus2';
    case 'sus4': return 'sus4';
    default: return '';
  }
}

/**
 * Map finger count to scale degree
 * Follows GestureSynth convention:
 * 1→I, 2→ii, 3→iii, 4→IV, 5→V
 * Special combos handled by caller (VI, VII)
 */
export function fingerCountToScaleDegree(count: number): number {
  if (count <= 0) return -1; // fist = mute
  if (count >= 6) return 4;  // clamp to V
  return count - 1; // 1→0(I), 2→1(ii), 3→2(iii), 4→3(IV), 5→4(V)
}

/**
 * Map right-hand finger count to chord complexity
 * 1→triad, 2→1st inv, 3→7th, 4+→9th
 */
export function fingerCountToComplexity(count: number): number {
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count === 3) return 2;
  return 3;
}

/**
 * Get key index from note name
 */
export function keyNameToIndex(name: string): number {
  const idx = NOTE_NAMES.indexOf(name as NoteName);
  return idx >= 0 ? idx : 9; // default to A
}
