/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Unified Header Controls Component
   Single-row glassmorphic navigation bar for both Synth and Conductor modes
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { NOTE_NAMES } from '../utils/constants';
import type { AppMode } from '../App';

interface ControlsProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  // Synth props
  currentKey: string;
  onKeyChange: (key: string) => void;
  isArpEnabled: boolean;
  onArpToggle: () => void;
  arpSpeed: 'slow' | 'normal' | 'fast';
  onArpSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  isBassEnabled: boolean;
  onBassToggle: () => void;
  isMinorLocked: boolean;
  onMinorLockToggle: () => void;
  onExportMidi: () => void;
  // Status
  status: string;
  error: string | null;
}

export const Controls: React.FC<ControlsProps> = ({
  mode,
  onModeChange,
  currentKey,
  onKeyChange,
  isArpEnabled,
  onArpToggle,
  arpSpeed,
  onArpSpeedChange,
  isBassEnabled,
  onBassToggle,
  isMinorLocked,
  onMinorLockToggle,
  onExportMidi,
  status,
  error,
}) => {
  return (
    <header className="control-bar">
      {/* Left: Brand + Mode Switcher */}
      <div className="control-bar__left">
        <span className="control-bar__logo">✨ AuraSynth</span>

        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'synth' ? 'mode-tab--active' : ''}`}
            onClick={() => onModeChange('synth')}
          >
            🎹 Synth
          </button>
          <button
            className={`mode-tab ${mode === 'conductor' ? 'mode-tab--active' : ''}`}
            onClick={() => onModeChange('conductor')}
          >
            🎼 Conductor
          </button>
        </div>
      </div>

      {/* Center: Status indicators */}
      <div className="control-bar__center">
        {status === 'loading' && <span className="loading-text">Loading AI Model...</span>}
        {error && <span className="loading-text" style={{ color: '#ff3b3b' }}>Camera error: {error}</span>}
      </div>

      {/* Right: Mode Controls */}
      <div className="control-bar__right">
        {mode === 'synth' && (
          <>
            {/* Key Picker */}
            <select
              className="glass-select"
              value={currentKey}
              onChange={(e) => onKeyChange(e.target.value)}
              title="Select Key"
            >
              {NOTE_NAMES.map((k) => (
                <option key={k} value={k}>
                  Key: {k}
                </option>
              ))}
            </select>

            {/* Mode Lock */}
            <button
              className={`glass-btn ${isMinorLocked ? 'glass-btn--active' : ''}`}
              onClick={onMinorLockToggle}
              title="Toggle Minor/Major Mode Lock"
            >
              {isMinorLocked ? '🌙 Minor' : '☀️ Major'}
            </button>

            {/* Arpeggiator */}
            <button
              className={`glass-btn ${isArpEnabled ? 'glass-btn--active' : ''}`}
              onClick={onArpToggle}
              title="Toggle Arpeggiator"
            >
              ⟿ Arp {isArpEnabled ? `(${arpSpeed})` : 'Off'}
            </button>

            {isArpEnabled && (
              <select
                className="glass-select"
                value={arpSpeed}
                onChange={(e) => onArpSpeedChange(e.target.value as any)}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            )}

            {/* Auto Bass */}
            <button
              className={`glass-btn ${isBassEnabled ? 'glass-btn--active' : ''}`}
              onClick={onBassToggle}
              title="Toggle Auto-Bass"
            >
              ∿ Bass {isBassEnabled ? 'On' : 'Off'}
            </button>

            {/* MIDI Export */}
            <button className="glass-btn" onClick={onExportMidi} title="Export MIDI">
              💾 MIDI
            </button>
          </>
        )}
      </div>
    </header>
  );
};
