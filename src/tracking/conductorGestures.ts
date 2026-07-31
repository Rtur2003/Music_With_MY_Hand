/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Conductor Gesture Detection
   Beat detection, tempo tracking, dynamics from hand movements
   ═══════════════════════════════════════════════════════════════════ */

import type { Landmark } from './useHandTracking';

export interface ConductorState {
  /** Estimated BPM from right-hand beat pattern */
  bpm: number;
  /** Current dynamics level 0.0 (pp) to 1.0 (ff) */
  dynamics: number;
  /** Which section is focused: 0=all, 1=strings, 2=woodwinds, 3=brass, 4=percussion */
  sectionFocus: number;
  /** Whether a beat was just detected this frame */
  beatDetected: boolean;
  /** Whether crescendo gesture is active */
  crescendo: boolean;
  /** Whether diminuendo gesture is active */
  diminuendo: boolean;
  /** Right hand velocity (for visual feedback) */
  rightHandVelocity: number;
  /** Beat count within current measure */
  beatInMeasure: number;
}

const DEFAULT_STATE: ConductorState = {
  bpm: 120,
  dynamics: 0.5,
  sectionFocus: 0,
  beatDetected: false,
  crescendo: false,
  diminuendo: false,
  rightHandVelocity: 0,
  beatInMeasure: 0,
};

/**
 * Conductor gesture processor
 * Tracks hand movement patterns to extract conducting information
 */
export class ConductorProcessor {
  // Right hand beat tracking
  private rightYHistory: number[] = [];
  private beatTimestamps: number[] = [];
  private lastBeatTime = 0;
  private wasMovingDown = false;
  private beatCount = 0;

  // Left hand position tracking
  private leftYSmoothed = 0.5;

  // Both hands spread tracking
  private lastSpread = 0;
  private spreadHistory: number[] = [];

  // Smoothed BPM
  private smoothedBpm = 120;

  /**
   * Process hand landmarks and return conductor state
   */
  process(
    leftHand: Landmark[] | null,
    rightHand: Landmark[] | null,
    timestamp: number,
  ): ConductorState {
    const state = { ...DEFAULT_STATE };

    // ── Right hand: Beat detection & tempo ──────────────
    if (rightHand && rightHand.length >= 21) {
      const wristY = rightHand[0].y;  // 0=top, 1=bottom
      this.rightYHistory.push(wristY);
      if (this.rightYHistory.length > 10) this.rightYHistory.shift();

      // Calculate vertical velocity
      if (this.rightYHistory.length >= 2) {
        const prev = this.rightYHistory[this.rightYHistory.length - 2];
        const curr = this.rightYHistory[this.rightYHistory.length - 1];
        const velocity = curr - prev; // positive = moving down

        state.rightHandVelocity = Math.abs(velocity);

        // Beat detection: detect downbeat (rapid downward then direction change)
        const isMovingDown = velocity > 0.008; // threshold
        const justBouncedUp = this.wasMovingDown && !isMovingDown && velocity < -0.003;

        if (justBouncedUp && (timestamp - this.lastBeatTime) > 200) {
          // Beat detected!
          state.beatDetected = true;
          this.beatTimestamps.push(timestamp);
          if (this.beatTimestamps.length > 8) this.beatTimestamps.shift();
          this.lastBeatTime = timestamp;
          this.beatCount++;
          state.beatInMeasure = this.beatCount % 4;

          // Calculate BPM from beat intervals
          if (this.beatTimestamps.length >= 3) {
            const intervals: number[] = [];
            for (let i = 1; i < this.beatTimestamps.length; i++) {
              intervals.push(this.beatTimestamps[i] - this.beatTimestamps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const rawBpm = 60000 / avgInterval;
            // Clamp to reasonable range
            const clampedBpm = Math.max(40, Math.min(200, rawBpm));
            // Smooth the BPM
            this.smoothedBpm = this.smoothedBpm * 0.7 + clampedBpm * 0.3;
          }
        }

        this.wasMovingDown = isMovingDown;
      }
    }

    state.bpm = Math.round(this.smoothedBpm);

    // ── Left hand: Dynamics (volume) ────────────────────
    if (leftHand && leftHand.length >= 21) {
      const wristY = leftHand[0].y;
      // Invert: hand higher (small Y) = louder
      const rawDynamics = 1 - Math.max(0, Math.min(1, (wristY - 0.15) / 0.7));
      // Smooth
      this.leftYSmoothed = this.leftYSmoothed * 0.85 + rawDynamics * 0.15;
      state.dynamics = this.leftYSmoothed;

      // Section focus based on X position
      const wristX = leftHand[0].x;
      // Note: mirrored view, so left on screen = right in real life
      if (wristX < 0.25) {
        state.sectionFocus = 4; // Percussion (far right real)
      } else if (wristX < 0.4) {
        state.sectionFocus = 3; // Brass
      } else if (wristX < 0.6) {
        state.sectionFocus = 2; // Woodwinds
      } else if (wristX < 0.8) {
        state.sectionFocus = 1; // Strings
      } else {
        state.sectionFocus = 0; // All
      }
    }

    // ── Both hands: Crescendo / Diminuendo ──────────────
    if (leftHand && rightHand && leftHand.length >= 21 && rightHand.length >= 21) {
      const leftX = leftHand[0].x;
      const rightX = rightHand[0].x;
      const spread = Math.abs(leftX - rightX);

      this.spreadHistory.push(spread);
      if (this.spreadHistory.length > 8) this.spreadHistory.shift();

      if (this.spreadHistory.length >= 3) {
        const recentSpread = this.spreadHistory.slice(-3);
        const spreadDelta = recentSpread[recentSpread.length - 1] - recentSpread[0];

        if (spreadDelta > 0.05) {
          state.crescendo = true;
        } else if (spreadDelta < -0.05) {
          state.diminuendo = true;
        }
      }

      this.lastSpread = spread;
    }

    return state;
  }

  reset(): void {
    this.rightYHistory = [];
    this.beatTimestamps = [];
    this.lastBeatTime = 0;
    this.wasMovingDown = false;
    this.beatCount = 0;
    this.leftYSmoothed = 0.5;
    this.smoothedBpm = 120;
    this.spreadHistory = [];
  }
}
