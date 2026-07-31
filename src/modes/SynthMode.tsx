/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Synth Mode Component
   Gesture-controlled synthesizer mode (GestureSynth style)
   ═══════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react';
import { Stage } from '../components/Stage';
import { ChordDisplay } from '../components/ChordDisplay';
import { Controls } from '../components/Controls';
import { Recorder } from '../components/Recorder';
import { getSynthEngine } from '../audio/SynthEngine';
import { buildChord, fingerCountToScaleDegree, fingerCountToComplexity, keyNameToIndex } from '../audio/chords';
import { processHandGesture } from '../tracking/fingerCount';
import { generateMidiBlob, downloadBlob, type RecordedNote } from '../utils/midiExport';
import type { Landmark } from '../tracking/useHandTracking';

interface SynthModeProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  leftHand: Landmark[] | null;
  rightHand: Landmark[] | null;
}

export const SynthMode: React.FC<SynthModeProps> = ({ videoRef, leftHand, rightHand }) => {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const synthEngine = getSynthEngine();

  // Settings
  const [currentKey, setCurrentKey] = useState('A');
  const [isArpEnabled, setIsArpEnabled] = useState(false);
  const [arpSpeed, setArpSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isBassEnabled, setIsBassEnabled] = useState(false);
  const [isMinorLocked, setIsMinorLocked] = useState(false);

  // Active state
  const [currentChordName, setCurrentChordName] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState<string[]>([]);
  const [scaleDegreeLabel, setScaleDegreeLabel] = useState<string>('');
  const [isMinor, setIsMinor] = useState(false);

  // Performance recording for MIDI export
  const recordedNotesRef = useRef<RecordedNote[]>([]);
  const lastChordRef = useRef<string | null>(null);
  const chordStartTimeRef = useRef<number>(0);

  // Frame processing for gestures → synth engine
  useEffect(() => {
    if (!leftHand && !rightHand) {
      synthEngine.releaseAll();
      setCurrentChordName(null);
      setCurrentNotes([]);
      return;
    }

    const keyIndex = keyNameToIndex(currentKey);

    // Left hand gesture
    const leftGesture = leftHand ? processHandGesture(leftHand as any, false) : null;
    // Right hand gesture
    const rightGesture = rightHand ? processHandGesture(rightHand as any, true) : null;

    // Both hands required for sound
    if (leftGesture && rightGesture && !leftGesture.isFist) {
      // Sol el: Scale degree (I to VII)
      let scaleDegree = fingerCountToScaleDegree(leftGesture.fingerCount);
      if (leftGesture.isVI) scaleDegree = 5;  // vi
      if (leftGesture.isVII) scaleDegree = 6; // vii°

      if (scaleDegree >= 0) {
        // Sol bilek: Major/Minor toggle (unless locked)
        const minorMode = isMinorLocked ? true : leftGesture.wristTilt < -0.15;
        setIsMinor(minorMode);

        // Sağ el: Chord complexity (triad, 1st inv, 7th, 9th)
        const complexity = fingerCountToComplexity(rightGesture.fingerCount);

        // Build chord
        const chord = buildChord(keyIndex, scaleDegree, minorMode, complexity, 0);

        setCurrentChordName(chord.name);
        setCurrentNotes(chord.notes);
        setScaleDegreeLabel(getRomanNumeral(scaleDegree, minorMode));

        // Play chord in Tone.js engine
        synthEngine.playChord(chord.notes);
        if (isBassEnabled) {
          synthEngine.playBass(chord.bassNote);
        }

        // Sağ el: Y-axis → Master Volume (higher hand = louder)
        const volumeNorm = 1 - Math.max(0, Math.min(1, (rightGesture.centerY - 0.15) / 0.7));
        synthEngine.setVolume(volumeNorm);

        // Sağ el: Wrist Tilt → Filter frequency sweep (brighter / darker)
        const tiltNorm = Math.max(0, Math.min(1, (rightGesture.wristTilt + 0.5) / 1.0));
        synthEngine.setFilterFrequency(tiltNorm);

        // MIDI recording tracker
        const now = performance.now() / 1000;
        if (chord.name !== lastChordRef.current) {
          if (lastChordRef.current && chordStartTimeRef.current > 0) {
            const duration = now - chordStartTimeRef.current;
            currentNotes.forEach((n) => {
              recordedNotesRef.current.push({ note: n, startTime: chordStartTimeRef.current, duration });
            });
          }
          lastChordRef.current = chord.name;
          chordStartTimeRef.current = now;
        }
      } else {
        synthEngine.releaseAll();
        setCurrentChordName(null);
      }
    } else {
      synthEngine.releaseAll();
      setCurrentChordName(null);
    }
  }, [leftHand, rightHand, currentKey, isMinorLocked, isBassEnabled]);

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
      alert('No notes recorded yet! Play some chords first.');
      return;
    }
    const blob = generateMidiBlob(recordedNotesRef.current);
    downloadBlob(blob, `aurasynth-performance-${Date.now()}.mid`);
  };

  return (
    <Stage
      videoRef={videoRef}
      stageContainerRef={stageContainerRef}
      leftHand={leftHand}
      rightHand={rightHand}
      analyser={synthEngine.getAnalyser()}
    >
      <Controls
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
        hasRecordings={true}
      />

      <ChordDisplay
        chordName={currentChordName}
        notes={currentNotes}
        scaleDegree={scaleDegreeLabel}
        isMinor={isMinor}
        leftHandActive={!!leftHand}
        rightHandActive={!!rightHand}
      />

      <Recorder stageContainerRef={stageContainerRef} />
    </Stage>
  );
};

function getRomanNumeral(deg: number, isMinor: boolean): string {
  const romansMajor = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const romansMinor = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
  const list = isMinor ? romansMinor : romansMajor;
  return list[deg] || 'I';
}
