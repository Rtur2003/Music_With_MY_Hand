/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Orchestral Pieces Data (Conductor Mode)
   Rich multi-section classical arrangements:
   Strings, Woodwinds, Brass, Percussion
   ═══════════════════════════════════════════════════════════════════ */

export interface SectionNote {
  note: string | string[]; // Single note "C4" or chord ["C4", "E4", "G4"]
  duration: string;        // "8n", "4n", "2n", "1m"
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
  timeSignature: [number, number];
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
      // Fate Motif opening
      { strings: { note: ['G4', 'G3'], duration: '8n' }, brass: { note: 'G3', duration: '8n' } },
      { strings: { note: ['G4', 'G3'], duration: '8n' }, brass: { note: 'G3', duration: '8n' } },
      { strings: { note: ['G4', 'G3'], duration: '8n' }, brass: { note: 'G3', duration: '8n' } },
      { strings: { note: ['Eb4', 'Eb3', 'G3'], duration: '2n' }, brass: { note: ['Eb3', 'G3'], duration: '2n' }, percussion: { note: 'C2', duration: '4n' } },

      { strings: { note: ['F4', 'F3'], duration: '8n' }, woodwinds: { note: 'F4', duration: '8n' } },
      { strings: { note: ['F4', 'F3'], duration: '8n' }, woodwinds: { note: 'F4', duration: '8n' } },
      { strings: { note: ['F4', 'F3'], duration: '8n' }, woodwinds: { note: 'F4', duration: '8n' } },
      { strings: { note: ['D4', 'D3', 'F3'], duration: '2n' }, brass: { note: ['D3', 'F3'], duration: '2n' }, percussion: { note: 'G1', duration: '4n' } },

      // Tutti buildup
      { strings: { note: ['C4', 'Eb4', 'G4'], duration: '4n' }, woodwinds: { note: ['G4', 'C5'], duration: '4n' } },
      { strings: { note: ['D4', 'F4', 'G4'], duration: '4n' }, brass: { note: ['G3', 'B3', 'D4'], duration: '4n' } },
      { strings: { note: ['Eb4', 'G4', 'C5'], duration: '2n' }, brass: { note: ['C3', 'G3', 'C4'], duration: '2n' }, percussion: { note: 'C2', duration: '2n' } },
    ],
  },
  {
    id: 'mozart-nachtmusik',
    title: 'Eine kleine Nachtmusik',
    composer: 'Wolfgang Amadeus Mozart',
    defaultBpm: 132,
    timeSignature: [4, 4],
    measures: [
      // Allegro G Major opening theme
      { strings: { note: ['G4', 'B4', 'D5', 'G5'], duration: '4n' }, woodwinds: { note: 'G4', duration: '4n' }, percussion: { note: 'G2', duration: '4n' } },
      { strings: { note: ['D4', 'G4', 'B4'], duration: '4n' } },
      { strings: { note: ['G4', 'B4', 'D5'], duration: '4n' }, brass: { note: ['G3', 'B3'], duration: '4n' } },
      { strings: { note: 'D4', duration: '4n' } },

      { strings: { note: ['G4', 'B4', 'D5', 'G5'], duration: '8n' }, woodwinds: { note: 'G5', duration: '8n' } },
      { strings: { note: ['F#4', 'A4', 'C5', 'D5'], duration: '8n' } },
      { strings: { note: ['G4', 'B4', 'D5', 'G5'], duration: '4n' }, brass: { note: ['G3', 'D4'], duration: '4n' }, percussion: { note: 'G2', duration: '4n' } },
      { strings: { note: ['D4', 'F#4', 'A4', 'C5'], duration: '2n' }, woodwinds: { note: 'D5', duration: '2n' } },
    ],
  },
  {
    id: 'vivaldi-spring',
    title: 'The Four Seasons — Spring',
    composer: 'Antonio Vivaldi',
    defaultBpm: 124,
    timeSignature: [4, 4],
    measures: [
      // Allegro motif in E Major
      { strings: { note: ['E4', 'G#4', 'B4', 'E5'], duration: '4n' }, woodwinds: { note: 'E5', duration: '4n' } },
      { strings: { note: ['G#4', 'B4', 'E5'], duration: '8n' } },
      { strings: { note: ['F#4', 'A4', 'D#5'], duration: '8n' } },
      { strings: { note: ['E4', 'G#4', 'B4'], duration: '4n' }, percussion: { note: 'E2', duration: '4n' } },

      { strings: { note: ['B4', 'E5', 'G#5'], duration: '4n' }, woodwinds: { note: 'G#5', duration: '4n' } },
      { strings: { note: ['A4', 'C#5', 'F#5'], duration: '4n' }, brass: { note: ['A3', 'C#4'], duration: '4n' } },
      { strings: { note: ['G#4', 'B4', 'E5'], duration: '2n' }, percussion: { note: 'E2', duration: '2n' } },
    ],
  },
  {
    id: 'rossini-william-tell',
    title: 'William Tell Overture (Finale)',
    composer: 'Gioachino Rossini',
    defaultBpm: 152,
    timeSignature: [2, 4],
    measures: [
      // Galop rhythm
      { brass: { note: ['E3', 'G#3', 'B3', 'E4'], duration: '8n' }, percussion: { note: 'E2', duration: '8n' } },
      { strings: { note: ['E4', 'G#4', 'B4'], duration: '8n' } },
      { strings: { note: ['E4', 'G#4', 'B4'], duration: '8n' } },
      { brass: { note: ['B3', 'D#4', 'F#4', 'B4'], duration: '8n' }, percussion: { note: 'B1', duration: '8n' } },

      { woodwinds: { note: ['E5', 'G#5', 'B5'], duration: '8n' } },
      { woodwinds: { note: ['E5', 'G#5', 'B5'], duration: '8n' } },
      { strings: { note: ['E4', 'G#4', 'B4', 'E5'], duration: '4n' }, brass: { note: ['E3', 'B3', 'E4'], duration: '4n' }, percussion: { note: 'E2', duration: '4n' } },
    ],
  },
  {
    id: 'dvorak-9',
    title: 'Symphony No. 9 (New World Largo)',
    composer: 'Antonín Dvořák',
    defaultBpm: 88,
    timeSignature: [4, 4],
    measures: [
      // Largo English Horn melody
      { woodwinds: { note: 'E4', duration: '2n' }, strings: { note: ['C4', 'E4', 'G4'], duration: '1m' } },
      { woodwinds: { note: 'G4', duration: '4n' }, brass: { note: ['C3', 'E3', 'G3'], duration: '2n' } },
      { woodwinds: { note: 'G4', duration: '2n' }, strings: { note: ['E4', 'G4', 'C5'], duration: '2n' } },
      { woodwinds: { note: 'E4', duration: '4n' }, brass: { note: 'C3', duration: '4n' }, percussion: { note: 'C2', duration: '4n' } },

      { woodwinds: { note: 'D4', duration: '2n' }, strings: { note: ['G3', 'B3', 'D4'], duration: '2n' } },
      { woodwinds: { note: 'C4', duration: '1m' }, strings: { note: ['C4', 'E4', 'G4', 'C5'], duration: '1m' }, percussion: { note: 'C2', duration: '1m' } },
    ],
  },
];
