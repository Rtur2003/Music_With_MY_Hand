/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Orchestra Visualizer Component
   Interactive seating chart layout showing orchestral sections glowing
   plus glowing conductor baton indicator
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';

interface OrchestraVisualizerProps {
  sectionFocus: number; // 0=all, 1=strings, 2=woodwinds, 3=brass, 4=percussion
  beatDetected: boolean;
  rightHandVelocity: number;
}

const SECTION_DESCRIPTIONS = [
  'Full Orchestra (Tutti)',
  'First & Second Violins, Cellos',
  'Flutes, Oboes, Clarinets, Bassoons',
  'Horns, Trumpets, Trombones',
  'Timpani, Bass Drum, Cymbals',
];

export const OrchestraVisualizer: React.FC<OrchestraVisualizerProps> = ({
  sectionFocus,
  beatDetected,
  rightHandVelocity,
}) => {
  return (
    <div className="orchestra-stage-visualizer">
      {/* Description text */}
      <div className="orchestra-section-desc">
        {SECTION_DESCRIPTIONS[sectionFocus]}
      </div>

      {/* Seating Layout Arc */}
      <div className="orchestra-arc">
        {/* Strings (Front Arc) */}
        <div
          className={`orchestra-section section-strings ${
            sectionFocus === 0 || sectionFocus === 1 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 1) ? 'pulse' : ''}`}
        >
          <div className="orchestra-section__icon">🎻</div>
          <div className="orchestra-section__name">Strings</div>
        </div>

        {/* Woodwinds (Middle Stage) */}
        <div
          className={`orchestra-section section-woodwinds ${
            sectionFocus === 0 || sectionFocus === 2 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 2) ? 'pulse' : ''}`}
        >
          <div className="orchestra-section__icon">🪈</div>
          <div className="orchestra-section__name">Woodwinds</div>
        </div>

        {/* Brass (Back Center) */}
        <div
          className={`orchestra-section section-brass ${
            sectionFocus === 0 || sectionFocus === 3 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 3) ? 'pulse' : ''}`}
        >
          <div className="orchestra-section__icon">🎺</div>
          <div className="orchestra-section__name">Brass</div>
        </div>

        {/* Percussion (Back Right) */}
        <div
          className={`orchestra-section section-percussion ${
            sectionFocus === 0 || sectionFocus === 4 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 4) ? 'pulse' : ''}`}
        >
          <div className="orchestra-section__icon">🥁</div>
          <div className="orchestra-section__name">Percussion</div>
        </div>
      </div>
    </div>
  );
};
