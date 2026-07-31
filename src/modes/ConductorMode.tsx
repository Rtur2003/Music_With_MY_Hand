/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Conductor Mode Component
   Orchestra Conducting mode (Conduct famous classical symphonies with hands!)
   ═══════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react';
import { Stage } from '../components/Stage';
import { ConductorHud } from '../components/ConductorHud';
import { OrchestraVisualizer } from '../components/OrchestraVisualizer';
import { getOrchestraEngine } from '../audio/OrchestraEngine';
import { ConductorProcessor } from '../tracking/conductorGestures';
import { ORCHESTRAL_PIECES } from '../audio/pieces';
import type { Landmark } from '../tracking/useHandTracking';

interface ConductorModeProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  leftHand: Landmark[] | null;
  rightHand: Landmark[] | null;
}

export const ConductorMode: React.FC<ConductorModeProps> = ({ videoRef, leftHand, rightHand }) => {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const orchestraEngine = getOrchestraEngine();
  const conductorProcessorRef = useRef(new ConductorProcessor());

  const [conductorState, setConductorState] = useState({
    bpm: 120,
    dynamics: 0.5,
    sectionFocus: 0,
    beatDetected: false,
    crescendo: false,
    diminuendo: false,
    rightHandVelocity: 0,
    beatInMeasure: 0,
  });

  const [selectedPieceIndex, setSelectedPieceIndex] = useState(0);

  useEffect(() => {
    orchestraEngine.setPiece(selectedPieceIndex);
  }, [selectedPieceIndex]);

  // Frame processing loop for conductor gestures
  useEffect(() => {
    if (!leftHand && !rightHand) {
      orchestraEngine.pauseConducting();
      return;
    }

    // Hands are in frame -> start/resume conducting
    orchestraEngine.startConducting();

    const timestamp = performance.now();
    const state = conductorProcessorRef.current.process(leftHand, rightHand, timestamp);
    setConductorState(state);

    // Apply conductor controls continuously
    orchestraEngine.setBpm(state.bpm);
    orchestraEngine.setDynamics(state.dynamics);
    orchestraEngine.setSectionFocus(state.sectionFocus);
  }, [leftHand, rightHand]);

  return (
    <Stage
      videoRef={videoRef}
      stageContainerRef={stageContainerRef}
      leftHand={leftHand}
      rightHand={rightHand}
      chordColor="#ffaa00"
    >
      <ConductorHud
        conductorState={conductorState}
        currentPiece={ORCHESTRAL_PIECES[selectedPieceIndex]}
        pieceOptions={ORCHESTRAL_PIECES}
        onPieceSelect={setSelectedPieceIndex}
      />

      <OrchestraVisualizer
        sectionFocus={conductorState.sectionFocus}
        beatDetected={conductorState.beatDetected}
        rightHandVelocity={conductorState.rightHandVelocity}
      />
    </Stage>
  );
};
