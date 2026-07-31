/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Orchestra Visualizer Component
   Interactive seating chart layout showing orchestral sections glowing
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';

interface OrchestraVisualizerProps {
  sectionFocus: number; // 0=all, 1=strings, 2=woodwinds, 3=brass, 4=percussion
  beatDetected: boolean;
  rightHandVelocity: number;
}

export const OrchestraVisualizer: React.FC<OrchestraVisualizerProps> = ({
  sectionFocus,
  beatDetected,
  rightHandVelocity,
}) => {
  return (
    <div className="orchestra-stage-visualizer">
      {/* Seating Layout (Arc) */}
      <div className="orchestra-arc">
        {/* Percussion (Back Right) */}
        <div
          className={`orchestra-section section-percussion ${
            sectionFocus === 0 || sectionFocus === 4 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 4) ? 'pulse' : ''}`}
        >
          🥁 Percussion
        </div>

        {/* Brass (Back Left/Center) */}
        <div
          className={`orchestra-section section-brass ${
            sectionFocus === 0 || sectionFocus === 3 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 3) ? 'pulse' : ''}`}
        >
          🎺 Brass
        </div>

        {/* Woodwinds (Middle Center) */}
        <div
          className={`orchestra-section section-woodwinds ${
            sectionFocus === 0 || sectionFocus === 2 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 2) ? 'pulse' : ''}`}
        >
          🪈 Woodwinds
        </div>

        {/* Strings (Front Arc) */}
        <div
          className={`orchestra-section section-strings ${
            sectionFocus === 0 || sectionFocus === 1 ? 'active' : 'dimmed'
          } ${beatDetected && (sectionFocus === 0 || sectionFocus === 1) ? 'pulse' : ''}`}
        >
          🎻 Strings
        </div>
      </div>
    </div>
  );
};
