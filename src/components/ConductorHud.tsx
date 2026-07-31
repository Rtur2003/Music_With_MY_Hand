/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Conductor HUD Component
   Visual HUD for Orchestra Conductor Mode (BPM gauge, dynamics, beat, section)
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import type { ConductorState } from '../tracking/conductorGestures';
import type { OrchestralPiece } from '../audio/pieces';

interface ConductorHudProps {
  conductorState: ConductorState;
  currentPiece: OrchestralPiece;
  pieceOptions: OrchestralPiece[];
  onPieceSelect: (index: number) => void;
}

const DYNAMICS_LABELS = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
const SECTION_LABELS = ['Orchestra (Tutti)', 'Strings', 'Woodwinds', 'Brass', 'Percussion'];

export const ConductorHud: React.FC<ConductorHudProps> = ({
  conductorState,
  currentPiece,
  pieceOptions,
  onPieceSelect,
}) => {
  const dynamicsIndex = Math.min(
    DYNAMICS_LABELS.length - 1,
    Math.floor(conductorState.dynamics * DYNAMICS_LABELS.length)
  );

  return (
    <div className="conductor-hud">
      {/* Top Conductor Header */}
      <div className="control-bar">
        <div className="control-bar__left">
          <span className="control-bar__logo">🎼 Conductor Mode</span>

          <select
            className="glass-select"
            value={pieceOptions.findIndex((p) => p.id === currentPiece.id)}
            onChange={(e) => onPieceSelect(Number(e.target.value))}
          >
            {pieceOptions.map((p, idx) => (
              <option key={p.id} value={idx}>
                {p.title} ({p.composer})
              </option>
            ))}
          </select>
        </div>

        <div className="control-bar__right">
          {conductorState.crescendo && <span className="badge badge--crescendo">📈 CRESCENDO</span>}
          {conductorState.diminuendo && <span className="badge badge--diminuendo">📉 DIMINUENDO</span>}
        </div>
      </div>

      {/* Center Conducting Meter */}
      <div className="conductor-center-display">
        <div className="bpm-gauge">
          <div className="bpm-gauge__value">{conductorState.bpm}</div>
          <div className="bpm-gauge__label">BPM (TEMPO)</div>
        </div>

        <div className="dynamics-meter">
          <div className="dynamics-meter__value">{DYNAMICS_LABELS[dynamicsIndex]}</div>
          <div className="dynamics-meter__bar">
            <div
              className="dynamics-meter__fill"
              style={{ width: `${Math.round(conductorState.dynamics * 100)}%` }}
            />
          </div>
          <div className="dynamics-meter__label">DYNAMICS</div>
        </div>

        <div className="section-badge">
          Section Focus: <strong>{SECTION_LABELS[conductorState.sectionFocus]}</strong>
        </div>
      </div>
    </div>
  );
};
