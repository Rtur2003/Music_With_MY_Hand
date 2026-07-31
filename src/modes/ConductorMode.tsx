/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Conductor Mode Component
   Orchestra Conducting mode (Fixes visual overlap with orchestra visualizer)
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

  // Piece change
  useEffect(() => {
    orchestraEngine.setPiece(selectedPieceIndex);
  }, [selectedPieceIndex]);

  // Clean cleanup on unmount when user switches away from Conductor tab
  useEffect(() => {
    return () => {
      orchestraEngine.pauseConducting();
    };
  }, []);

  // Frame processing loop for conductor gestures
  useEffect(() => {
    if (!leftHand && !rightHand) {
      orchestraEngine.pauseConducting();
      return;
    }

    // Hands in frame -> resume conducting
    orchestraEngine.startConducting();

    const timestamp = performance.now();
    const state = conductorProcessorRef.current.process(leftHand, rightHand, timestamp);

    // Apply audio controls to Tone.js engine directly
    orchestraEngine.setBpm(state.bpm);
    orchestraEngine.setDynamics(state.dynamics);
    orchestraEngine.setSectionFocus(state.sectionFocus);

    // ONLY trigger React re-render when UI state properties actually change!
    setConductorState((prev) => {
      const bpmChanged = prev.bpm !== state.bpm;
      const dynamicsChanged = Math.abs(prev.dynamics - state.dynamics) > 0.08;
      const focusChanged = prev.sectionFocus !== state.sectionFocus;
      const beatChanged = prev.beatDetected !== state.beatDetected;
      const crescChanged = prev.crescendo !== state.crescendo;
      const dimChanged = prev.diminuendo !== state.diminuendo;

      if (!bpmChanged && !dynamicsChanged && !focusChanged && !beatChanged && !crescChanged && !dimChanged) {
        return prev;
      }

      return state;
    });
  }, [leftHand, rightHand]);

  return (
    <Stage
      videoRef={videoRef}
      stageContainerRef={stageContainerRef}
      leftHand={leftHand}
      rightHand={rightHand}
      chordColor="#ffaa00"
      showHandIndicators={false}
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
