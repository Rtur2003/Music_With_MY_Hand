/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Piano Roll Component
   Visual 25-key piano keyboard highlighting active chord notes in real-time
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { NOTE_NAMES } from '../utils/constants';

interface PianoRollProps {
  activeNotes: string[]; // e.g. ["A4", "C#5", "E5"]
}

// 2-octave piano range C4 to C6
const START_OCTAVE = 4;
const OCTAVES_COUNT = 2;

export const PianoRoll: React.FC<PianoRollProps> = ({ activeNotes }) => {
  const keys: { note: string; isBlack: boolean }[] = [];

  for (let oct = START_OCTAVE; oct < START_OCTAVE + OCTAVES_COUNT; oct++) {
    for (const noteName of NOTE_NAMES) {
      const fullNote = `${noteName}${oct}`;
      const isBlack = noteName.includes('#');
      keys.push({ note: fullNote, isBlack });
    }
  }
  keys.push({ note: `C${START_OCTAVE + OCTAVES_COUNT}`, isBlack: false });

  return (
    <div className="piano-roll-container">
      <div className="piano-roll">
        {keys.map(({ note, isBlack }) => {
          const isActive = activeNotes.some(
            (n) => n.toUpperCase() === note.toUpperCase()
          );

          return (
            <div
              key={note}
              className={`piano-key ${isBlack ? 'piano-key--black' : 'piano-key--white'} ${
                isActive ? 'piano-key--active' : ''
              }`}
              title={note}
            >
              {isActive && <span className="piano-key__label">{note}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
