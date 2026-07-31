/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Main App Component
   Tab navigation switching between Gesture Synth and Orchestra Conductor
   ═══════════════════════════════════════════════════════════════════ */

import React, { useRef, useState } from 'react';
import { useHandTracking } from './tracking/useHandTracking';
import { SynthMode } from './modes/SynthMode';
import { ConductorMode } from './modes/ConductorMode';
import { getSynthEngine } from './audio/SynthEngine';
import { getOrchestraEngine } from './audio/OrchestraEngine';

export type AppMode = 'synth' | 'conductor';

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { status, error, handsState } = useHandTracking(videoRef);

  const [mode, setMode] = useState<AppMode>('synth');
  const [hasStarted, setHasStarted] = useState(false);

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
          {/* Global Mode Switcher Tab Bar in Top Header */}
          <div className="control-bar" style={{ zIndex: 30 }}>
            <div className="control-bar__left">
              <div className="mode-tabs">
                <button
                  className={`mode-tab ${mode === 'synth' ? 'mode-tab--active' : ''}`}
                  onClick={() => setMode('synth')}
                >
                  🎹 Gesture Synth
                </button>
                <button
                  className={`mode-tab ${mode === 'conductor' ? 'mode-tab--active' : ''}`}
                  onClick={() => setMode('conductor')}
                >
                  🎼 Orchestra Conductor
                </button>
              </div>
            </div>

            {status === 'loading' && <span className="loading-text">Loading MediaPipe AI Model...</span>}
            {error && <span className="loading-text" style={{ color: '#ff3b3b' }}>Camera error: {error}</span>}
          </div>

          {/* Active Mode */}
          {mode === 'synth' ? (
            <SynthMode videoRef={videoRef} leftHand={left} rightHand={right} />
          ) : (
            <ConductorMode videoRef={videoRef} leftHand={left} rightHand={right} />
          )}
        </>
      )}
    </div>
  );
}
