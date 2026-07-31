/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Main App Component
   Single unified top header, mode switcher, and clean layout
   ═══════════════════════════════════════════════════════════════════ */

import React, { useRef, useState } from 'react';
import { useHandTracking } from './tracking/useHandTracking';
import { SynthMode } from './modes/SynthMode';
import { ConductorMode } from './modes/ConductorMode';
import { Controls } from './components/Controls';
import { getSynthEngine } from './audio/SynthEngine';
import { getOrchestraEngine } from './audio/OrchestraEngine';
import { generateMidiBlob, downloadBlob, type RecordedNote } from './utils/midiExport';

export type AppMode = 'synth' | 'conductor';

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { status, error, handsState } = useHandTracking(videoRef);

  const [mode, setMode] = useState<AppMode>('synth');
  const [hasStarted, setHasStarted] = useState(false);

  // Synth state
  const [currentKey, setCurrentKey] = useState('A');
  const [isArpEnabled, setIsArpEnabled] = useState(false);
  const [arpSpeed, setArpSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isBassEnabled, setIsBassEnabled] = useState(false);
  const [isMinorLocked, setIsMinorLocked] = useState(false);
  const recordedNotesRef = useRef<RecordedNote[]>([]);

  const handleStart = async () => {
    try {
      await getSynthEngine().start();
      await getOrchestraEngine().start();
      setHasStarted(true);
    } catch (err) {
      console.error('Audio start error:', err);
      setHasStarted(true);
    }
  };

  const handleArpToggle = () => {
    const next = !isArpEnabled;
    setIsArpEnabled(next);
    getSynthEngine().setArpEnabled(next);
  };

  const handleArpSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    setArpSpeed(speed);
    getSynthEngine().setArpSpeed(speed);
  };

  const handleBassToggle = () => {
    const next = !isBassEnabled;
    setIsBassEnabled(next);
    getSynthEngine().setBassEnabled(next);
  };

  const handleExportMidi = () => {
    if (recordedNotesRef.current.length === 0) {
      alert('No notes recorded yet! Play some chords with your hands first.');
      return;
    }
    const blob = generateMidiBlob(recordedNotesRef.current);
    downloadBlob(blob, `aurasynth-performance-${Date.now()}.mid`);
  };

  const { left, right } = handsState;

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
          {/* Single Unified Glassmorphic Header Bar */}
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

          {/* Active Mode View */}
          {mode === 'synth' ? (
            <SynthMode
              videoRef={videoRef}
              leftHand={left}
              rightHand={right}
              currentKey={currentKey}
              isArpEnabled={isArpEnabled}
              isBassEnabled={isBassEnabled}
              isMinorLocked={isMinorLocked}
              recordedNotesRef={recordedNotesRef}
            />
          ) : (
            <ConductorMode videoRef={videoRef} leftHand={left} rightHand={right} />
          )}
        </>
      )}
    </div>
  );
}
