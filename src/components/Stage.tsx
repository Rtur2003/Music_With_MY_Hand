/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Stage Component
   High performance persistent camera video background + canvas layer
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { HandCanvas } from './HandCanvas';
import type { TrackedHands } from '../tracking/useHandTracking';

interface StageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stageContainerRef: React.RefObject<HTMLDivElement | null>;
  handsRef: React.RefObject<TrackedHands>;
  analyser?: any;
  chordColor?: string;
  showHandIndicators?: boolean;
  children?: React.ReactNode;
}

export const Stage: React.FC<StageProps> = ({
  videoRef,
  stageContainerRef,
  handsRef,
  analyser,
  chordColor,
  showHandIndicators = true,
  children,
}) => {
  const leftHand = handsRef.current?.left;
  const rightHand = handsRef.current?.right;

  return (
    <div ref={stageContainerRef} className="stage stage--active">
      <div className="stage__video-container">
        <video ref={videoRef} className="stage__video" autoPlay playsInline muted />
      </div>

      <HandCanvas
        handsRef={handsRef}
        analyser={analyser}
        chordColor={chordColor}
      />

      {/* Hand detection indicators (Only shown in Synth Mode to avoid overlap) */}
      {showHandIndicators && (
        <div className="hand-indicators">
          <div className={`hand-indicator hand-indicator--left ${leftHand ? 'hand-indicator--active' : ''}`}>
            <div className="hand-indicator__icon">🤚</div>
            <div className="hand-indicator__label">Left Hand (Harmony)</div>
          </div>
          <div className={`hand-indicator hand-indicator--right ${rightHand ? 'hand-indicator--active' : ''}`}>
            <div className="hand-indicator__icon">✋</div>
            <div className="hand-indicator__label">Right Hand (Expression)</div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
