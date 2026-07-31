/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Stage Component
   Full-screen camera video container + canvas visualizer layer
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { HandCanvas } from './HandCanvas';
import type { Landmark } from '../tracking/useHandTracking';

interface StageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stageContainerRef: React.RefObject<HTMLDivElement | null>;
  leftHand: Landmark[] | null;
  rightHand: Landmark[] | null;
  analyser?: any;
  chordColor?: string;
  children?: React.ReactNode;
}

export const Stage: React.FC<StageProps> = ({
  videoRef,
  stageContainerRef,
  leftHand,
  rightHand,
  analyser,
  chordColor,
  children,
}) => {
  return (
    <div ref={stageContainerRef} className="stage stage--active">
      <div className="stage__video-container">
        <video ref={videoRef} className="stage__video" playsInline muted />
      </div>

      <HandCanvas
        leftHand={leftHand}
        rightHand={rightHand}
        analyser={analyser}
        chordColor={chordColor}
      />

      {/* Hand detection indicators at bottom */}
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

      {children}
    </div>
  );
};
