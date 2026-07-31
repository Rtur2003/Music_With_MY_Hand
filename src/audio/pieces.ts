/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Orchestral Pieces Data (Conductor Mode)
   Arrangements of classic public-domain pieces separated by sections:
   Strings, Woodwinds, Brass, Percussion
   ═══════════════════════════════════════════════════════════════════ */

export interface SectionNote {
  note: string | string[]; // Single note "C4" or chord ["C4", "E4", "G4"]
  duration: string;        // "4n", "8n", "2n", "1m"
}

export interface MeasureData {
  strings?: SectionNote;
  woodwinds?: SectionNote;
  brass?: SectionNote;
  percussion?: SectionNote;
}

export interface OrchestralPiece {
  id: string;
  title: string;
  composer: string;
  defaultBpm: number;
  timeSignature: [number, number]; // e.g. [4, 4] or [3, 4]
  measures: MeasureData[];
}

export const ORCHESTRAL_PIECES: OrchestralPiece[] = [
  {
    id: 'beethoven-5',
    title: 'Symphony No. 5 (Fate Motif)',
    composer: 'Ludwig van Beethoven',
    defaultBpm: 108,
    timeSignature: [2, 4],
    measures: [
      // Measure 1: G G G Eb
      { strings: { note: ['G4', 'G3'], duration: '8n' }, brass: { note: 'G3', duration: '8n' } },
      { strings: { note: ['G4', 'G3'], duration: '8n' }, brass: { note: 'G3', duration: '8n' } },
      { strings: { note: ['G4', 'G3'], duration: '8n' }, brass: { note: 'G3', duration: '8n' } },
      { strings: { note: ['Eb4', 'Eb3'], duration: '2n' }, brass: { note: 'Eb3', duration: '2n' }, percussion: { note: 'C2', duration: '4n' } },

      // Measure 2: F F F D
      { strings: { note: ['F4', 'F3'], duration: '8n' }, woodwinds: { note: 'F4', duration: '8n' } },
      { strings: { note: ['F4', 'F3'], duration: '8n' }, woodwinds: { note: 'F4', duration: '8n' } },
      { strings: { note: ['F4', 'F3'], duration: '8n' }, woodwinds: { note: 'F4', duration: '8n' } },
      { strings: { note: ['D4', 'D3'], duration: '2n' }, brass: { note: ['D3', 'F3'], duration: '2n' }, percussion: { note: 'G1', duration: '4n' } },

      // Measure 3: C minor crescendo motif
      { strings: { note: ['C4', 'Eb4', 'G4'], duration: '4n' }, woodwinds: { note: 'G4', duration: '4n' } },
      { strings: { note: ['D4', 'F4', 'G4'], duration: '4n' }, brass: { note: ['G3', 'B3'], duration: '4n' } },
      { strings: { note: ['Eb4', 'G4', 'C5'], duration: '2n' }, brass: { note: ['C3', 'G3', 'C4'], duration: '2n' }, percussion: { note: 'C2', duration: '2n' } },
    ],
  },
  {
    id: 'vivaldi-spring',
    title: 'The Four Seasons — Spring',
    composer: 'Antonio Vivaldi',
    defaultBpm: 120,
    timeSignature: [4, 4],
    measures: [
      // Allegro motif in E Major
      { strings: { note: ['E4', 'G#4', 'B4'], duration: '4n' }, woodwinds: { note: 'B4', duration: '4n' } },
      { strings: { note: ['G#4', 'B4', 'E5'], duration: '8n' } },
      { strings: { note: ['F#4', 'A4', 'D#5'], duration: '8n' } },
      { strings: { note: ['E4', 'G#4', 'B4'], duration: '4n' }, percussion: { note: 'E2', duration: '4n' } },

      { strings: { note: ['B4', 'E5'], duration: '4n' }, woodwinds: { note: 'E5', duration: '4n' } },
      { strings: { note: ['A4', 'C#5'], duration: '4n' }, brass: { note: ['A3', 'C#4'], duration: '4n' } },
      { strings: { note: ['G#4', 'B4'], duration: '2n' }, strings_bass: undefined, percussion: { note: 'E2', duration: '2n' } },
    ],
  },
  {
    id: 'dvorak-9',
    title: 'Symphony No. 9 (New World)',
    composer: 'Antonín Dvořák',
    defaultBpm: 92,
    timeSignature: [4, 4],
    measures: [
      // Largo motif (Largo horn / english horn)
      { woodwinds: { note: 'E4', duration: '2n' }, strings: { note: ['C4', 'G4'], duration: '1m' } },
      { woodwinds: { note: 'G4', duration: '4n' }, brass: { note: ['C3', 'E3'], duration: '2n' } },
      { woodwinds: { note: 'G4', duration: '2n' }, strings: { note: ['E4', 'G4', 'C5'], duration: '2n' } },
      { woodwinds: { note: 'E4', duration: '4n' }, brass: { note: 'C3', duration: '4n' }, percussion: { note: 'C2', duration: '4n' } },
      { woodwinds: { note: 'D4', duration: '2n' }, strings: { note: ['G3', 'B3', 'D4'], duration: '2n' } },
      { woodwinds: { note: 'C4', duration: '1m' }, strings: { note: ['C4', 'E4', 'G4'], duration: '1m' }, percussion: { note: 'C2', duration: '1m' } },
    ],
  },
];
