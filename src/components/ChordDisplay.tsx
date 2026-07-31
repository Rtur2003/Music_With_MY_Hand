/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Chord Display Component
   Large centered HUD displaying active chord name, scale degree, notes
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';

interface ChordDisplayProps {
  chordName: string | null;
  notes: string[];
  scaleDegree: string;
  isMinor: boolean;
  leftHandActive: boolean;
  rightHandActive: boolean;
}

export const ChordDisplay: React.FC<ChordDisplayProps> = ({
  chordName,
  notes,
  scaleDegree,
  isMinor,
  leftHandActive,
  rightHandActive,
}) => {
  const isPlaying = leftHandActive && rightHandActive && chordName;

  return (
    <div className="chord-display">
      {isPlaying ? (
        <>
          <div className="chord-display__name">{chordName}</div>
          <div className="chord-display__notes">
            {notes.join(' • ')} {scaleDegree && `(${scaleDegree})`}
          </div>
          <div className="chord-display__status">
            {isMinor ? 'Minor Mode (Wrist Tilted Left)' : 'Major Mode (Wrist Tilted Right)'}
          </div>
        </>
      ) : (
        <>
          <div className="chord-display__name" style={{ opacity: 0.35 }}>
            {!leftHandActive && !rightHandActive
              ? 'Raise Both Hands'
              : !leftHandActive
              ? 'Show Left Hand (Harmony)'
              : 'Show Right Hand (Expression)'}
          </div>
          <div className="chord-display__notes">
            Left hand = Scale Degree (I–VII) • Right hand = Volume & Tone
          </div>
        </>
      )}
    </div>
  );
};
