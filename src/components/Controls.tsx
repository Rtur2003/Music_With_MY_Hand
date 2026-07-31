/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Controls Component
   Glassmorphic control bar for key selection, arpeggiator, bass, etc.
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { NOTE_NAMES } from '../utils/constants';

interface ControlsProps {
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
  hasRecordings: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
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
  hasRecordings,
}) => {
  return (
    <div className="control-bar">
      <div className="control-bar__left">
        <span className="control-bar__logo">✨ AuraSynth Pro</span>

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
          {isMinorLocked ? '🌙 Minor Lock' : '☀️ Major Lock'}
        </button>
      </div>

      <div className="control-bar__right">
        {/* Arpeggiator Toggle */}
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

        {/* Auto Bass Toggle */}
        <button
          className={`glass-btn ${isBassEnabled ? 'glass-btn--active' : ''}`}
          onClick={onBassToggle}
          title="Toggle Auto-Bass"
        >
          ∿ Auto-Bass {isBassEnabled ? 'On' : 'Off'}
        </button>

        {/* Export MIDI */}
        {hasRecordings && (
          <button className="glass-btn" onClick={onExportMidi} title="Export Performance as MIDI">
            💾 Export MIDI
          </button>
        )}
      </div>
    </div>
  );
};
