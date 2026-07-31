/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Main App Component
   High performance architecture: rAF gesture loop with Ref-based hand landmarks
   (0% React re-render thrashing -> 0% CPU freeze!)
   ═══════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react';
import { useHandTracking } from './tracking/useHandTracking';
import { Stage } from './components/Stage';
import { Controls } from './components/Controls';
import { ChordDisplay } from './components/ChordDisplay';
import { PianoRoll } from './components/PianoRoll';
import { Recorder } from './components/Recorder';
import { ConductorHud } from './components/ConductorHud';
import { OrchestraVisualizer } from './components/OrchestraVisualizer';

import { getSynthEngine } from './audio/SynthEngine';
import { getOrchestraEngine } from './audio/OrchestraEngine';
import { buildChord, fingerCountToScaleDegree, fingerCountToComplexity, keyNameToIndex } from './audio/chords';
import { processHandGesture } from './tracking/fingerCount';
import { ConductorProcessor } from './tracking/conductorGestures';
import { ORCHESTRAL_PIECES } from './audio/pieces';
import { generateMidiBlob, downloadBlob, type RecordedNote } from './utils/midiExport';

export type AppMode = 'synth' | 'conductor';

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Persistent hand tracking hook (Ref-based, zero React re-renders)
  const { status, error, handsRef } = useHandTracking(videoRef, hasStarted);

  const [mode, setMode] = useState<AppMode>('synth');

  // Synth state
  const [currentKey, setCurrentKey] = useState('A');
  const [isArpEnabled, setIsArpEnabled] = useState(false);
  const [arpSpeed, setArpSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isBassEnabled, setIsBassEnabled] = useState(false);
  const [isMinorLocked, setIsMinorLocked] = useState(false);
  const recordedNotesRef = useRef<RecordedNote[]>([]);

  // Active synth chord state
  const [currentChordName, setCurrentChordName] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState<string[]>([]);
  const [scaleDegreeLabel, setScaleDegreeLabel] = useState<string>('');
  const [isMinor, setIsMinor] = useState(false);
  const lastChordRef = useRef<string | null>(null);
  const chordStartTimeRef = useRef<number>(0);

  // Conductor state
  const conductorProcessorRef = useRef(new ConductorProcessor());
  const [selectedPieceIndex, setSelectedPieceIndex] = useState(0);
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

  const synthEngine = getSynthEngine();
  const orchestraEngine = getOrchestraEngine();

  const handleStart = () => {
    setHasStarted(true);
    setTimeout(async () => {
      try {
        await synthEngine.start();
        await orchestraEngine.start();
      } catch (err) {
        console.warn('[AudioStart] Non-critical init warning:', err);
      }
    }, 50);
  };

  const handleArpToggle = () => {
    const next = !isArpEnabled;
    setIsArpEnabled(next);
    synthEngine.setArpEnabled(next);
  };

  const handleArpSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    setArpSpeed(speed);
    synthEngine.setArpSpeed(speed);
  };

  const handleBassToggle = () => {
    const next = !isBassEnabled;
    setIsBassEnabled(next);
    synthEngine.setBassEnabled(next);
  };

  const handleExportMidi = () => {
    if (recordedNotesRef.current.length === 0) {
      alert('No notes recorded yet! Play some chords with your hands first.');
      return;
    }
    const blob = generateMidiBlob(recordedNotesRef.current);
    downloadBlob(blob, `aurasynth-performance-${Date.now()}.mid`);
  };

  // Conductor piece change
  useEffect(() => {
    if (hasStarted) {
      orchestraEngine.setPiece(selectedPieceIndex);
    }
  }, [selectedPieceIndex, hasStarted]);

  // High-performance rAF Gesture Loop (0% React re-render thrashing -> 0% CPU freeze!)
  useEffect(() => {
    if (!hasStarted) return;

    let animId = 0;

    const loop = () => {
      const { left, right } = handsRef.current;

      if (mode === 'synth') {
        orchestraEngine.pauseConducting();

        if (!left && !right) {
          synthEngine.releaseAll();
          if (currentChordName !== null) {
            setCurrentChordName(null);
            setCurrentNotes([]);
          }
        } else {
          const keyIndex = keyNameToIndex(currentKey);
          const leftGesture = left ? processHandGesture(left as any, false) : null;
          const rightGesture = right ? processHandGesture(right as any, true) : null;

          if (leftGesture && rightGesture && !leftGesture.isFist) {
            let scaleDegree = fingerCountToScaleDegree(leftGesture.fingerCount);
            if (leftGesture.isVI) scaleDegree = 5;
            if (leftGesture.isVII) scaleDegree = 6;

            if (scaleDegree >= 0) {
              const minorMode = isMinorLocked ? true : leftGesture.wristTilt < -0.15;
              setIsMinor(minorMode);

              const complexity = fingerCountToComplexity(rightGesture.fingerCount);
              const chord = buildChord(keyIndex, scaleDegree, minorMode, complexity, 0);

              // Update Tone.js sound engine directly (0 React re-renders)
              synthEngine.playChord(chord.notes);
              if (isBassEnabled) synthEngine.playBass(chord.bassNote);

              const volumeNorm = 1 - Math.max(0, Math.min(1, (rightGesture.centerY - 0.15) / 0.7));
              synthEngine.setVolume(volumeNorm);

              const tiltNorm = Math.max(0, Math.min(1, (rightGesture.wristTilt + 0.5) / 1.0));
              synthEngine.setFilterFrequency(tiltNorm);

              // Update React UI state ONLY when chord name actually changes
              if (chord.name !== currentChordName) {
                setCurrentChordName(chord.name);
                setCurrentNotes(chord.notes);
                setScaleDegreeLabel(getRomanNumeral(scaleDegree, minorMode));
              }

              // MIDI recording tracker
              const now = performance.now() / 1000;
              if (chord.name !== lastChordRef.current) {
                if (lastChordRef.current && chordStartTimeRef.current > 0) {
                  const duration = now - chordStartTimeRef.current;
                  chord.notes.forEach((n) => {
                    recordedNotesRef.current.push({ note: n, startTime: chordStartTimeRef.current, duration });
                  });
                }
                lastChordRef.current = chord.name;
                chordStartTimeRef.current = now;
              }
            } else {
              synthEngine.releaseAll();
              if (currentChordName !== null) {
                setCurrentChordName(null);
                setCurrentNotes([]);
              }
            }
          } else {
            synthEngine.releaseAll();
            if (currentChordName !== null) {
              setCurrentChordName(null);
              setCurrentNotes([]);
            }
          }
        }
      } else if (mode === 'conductor') {
        synthEngine.releaseAll();

        if (!left && !right) {
          orchestraEngine.pauseConducting();
        } else {
          orchestraEngine.startConducting();
          const timestamp = performance.now();
          const state = conductorProcessorRef.current.process(left, right, timestamp);

          // Update Tone.js orchestra engine directly (0 React re-renders)
          orchestraEngine.setBpm(state.bpm);
          orchestraEngine.setDynamics(state.dynamics);
          orchestraEngine.setSectionFocus(state.sectionFocus);

          // Update React UI state ONLY when state values actually change
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
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, currentKey, isMinorLocked, isBassEnabled, hasStarted]);

  return (
    <div className="app-root">
      {!hasStarted ? (
        <div className="splash">
          <div className="splash__title">AuraSynth Pro</div>
          <div className="splash__subtitle">
            Play music with your hand gestures in real-time.
            <br />
            Choose between <strong>Gesture Synthesizer</strong> and <strong>Orchestra Conductor</strong>.
          </div>
          <button className="splash__start-btn" onClick={handleStart}>
            🚀 Enable Audio & Camera
          </button>
        </div>
      ) : (
        <>
          {/* Header Controls */}
          <Controls
            mode={mode}
            onModeChange={setMode}
            currentKey={currentKey}
            onKeyChange={setCurrentKey}
            isArpEnabled={isArpEnabled}
            onArpToggle={handleArpToggle}
            arpSpeed={arpSpeed}
            onArpSpeedChange={handleArpSpeedChange}
            isBassEnabled={isBassEnabled}
            onBassToggle={handleBassToggle}
            isMinorLocked={isMinorLocked}
            onMinorLockToggle={() => setIsMinorLocked(!isMinorLocked)}
            onExportMidi={handleExportMidi}
            status={status}
            error={error}
          />

          {/* SINGLE PERSISTENT STAGE */}
          <Stage
            videoRef={videoRef}
            stageContainerRef={stageContainerRef}
            handsRef={handsRef}
            analyser={mode === 'synth' ? synthEngine.getAnalyser() : undefined}
            chordColor={mode === 'synth' ? '#00ffcc' : '#ffaa00'}
            showHandIndicators={mode === 'synth'}
          >
            {mode === 'synth' ? (
              <>
                <ChordDisplay
                  chordName={currentChordName}
                  notes={currentNotes}
                  scaleDegree={scaleDegreeLabel}
                  isMinor={isMinor}
                  leftHandActive={!!handsRef.current?.left}
                  rightHandActive={!!handsRef.current?.right}
                />
                <PianoRoll activeNotes={currentNotes} />
                <Recorder stageContainerRef={stageContainerRef} />
              </>
            ) : (
              <>
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
              </>
            )}
          </Stage>
        </>
      )}
    </div>
  );
}

function getRomanNumeral(deg: number, isMinor: boolean): string {
  const romansMajor = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const romansMinor = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
  const list = isMinor ? romansMinor : romansMajor;
  return list[deg] || 'I';
}
