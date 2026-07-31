/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Finger Count & Gesture Detection
   Robust finger counting from MediaPipe hand landmarks
   ═══════════════════════════════════════════════════════════════════ */

import { LANDMARKS } from '../utils/constants';

export interface HandLandmark {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  z: number; // depth
}

export interface GestureData {
  /** Number of fingers extended (0-5) */
  fingerCount: number;
  /** Individual finger states */
  fingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  /** Hand center position (normalized 0-1) */
  centerX: number;
  centerY: number;
  /** Wrist tilt angle in radians (-PI to PI) */
  wristTilt: number;
  /** Whether this is a "fist" gesture */
  isFist: boolean;
  /** Special combo: VI (index + pinky only) */
  isVI: boolean;
  /** Special combo: VII (index + pinky + thumb only) */
  isVII: boolean;
}

/**
 * Check if a finger is extended based on landmark positions
 */
function isFingerExtended(
  landmarks: HandLandmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];
  
  // A finger is extended if the tip is farther from the palm than the PIP joint
  // Using Y-coordinate (in image space, Y increases downward)
  // But we need to account for hand orientation, so we use distance from MCP
  const tipDist = Math.sqrt(
    (tip.x - mcp.x) ** 2 + (tip.y - mcp.y) ** 2
  );
  const pipDist = Math.sqrt(
    (pip.x - mcp.x) ** 2 + (pip.y - mcp.y) ** 2
  );
  
  return tipDist > pipDist * 1.1; // 10% threshold to avoid flickering
}

/**
 * Check if thumb is extended
 * Thumb is special — it moves laterally, not vertically
 */
function isThumbExtended(landmarks: HandLandmark[], isRightHand: boolean): boolean {
  const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
  const thumbIP = landmarks[LANDMARKS.THUMB_IP];
  const thumbMCP = landmarks[LANDMARKS.THUMB_MCP];
  const indexMCP = landmarks[LANDMARKS.INDEX_MCP];
  
  // Thumb is extended if tip is far from index MCP
  const tipToIndex = Math.sqrt(
    (thumbTip.x - indexMCP.x) ** 2 + (thumbTip.y - indexMCP.y) ** 2
  );
  const mcpToIndex = Math.sqrt(
    (thumbMCP.x - indexMCP.x) ** 2 + (thumbMCP.y - indexMCP.y) ** 2
  );
  
  // Also check if tip is farther from palm than IP joint
  const tipDist = Math.sqrt(
    (thumbTip.x - thumbMCP.x) ** 2 + (thumbTip.y - thumbMCP.y) ** 2
  );
  const ipDist = Math.sqrt(
    (thumbIP.x - thumbMCP.x) ** 2 + (thumbIP.y - thumbMCP.y) ** 2
  );
  
  return tipToIndex > mcpToIndex * 0.8 && tipDist > ipDist * 0.9;
}

/**
 * Calculate wrist tilt angle
 * Positive = tilted right, Negative = tilted left
 */
function calculateWristTilt(landmarks: HandLandmark[]): number {
  const wrist = landmarks[LANDMARKS.WRIST];
  const middleMCP = landmarks[LANDMARKS.MIDDLE_MCP];
  
  const dx = middleMCP.x - wrist.x;
  const dy = middleMCP.y - wrist.y;
  
  return Math.atan2(dx, -dy); // Angle from vertical
}

/**
 * Process hand landmarks into gesture data
 */
export function processHandGesture(
  landmarks: HandLandmark[],
  isRightHand: boolean,
): GestureData {
  if (landmarks.length < 21) {
    return {
      fingerCount: 0,
      fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      centerX: 0.5,
      centerY: 0.5,
      wristTilt: 0,
      isFist: true,
      isVI: false,
      isVII: false,
    };
  }

  const thumb = isThumbExtended(landmarks, isRightHand);
  const index = isFingerExtended(landmarks, LANDMARKS.INDEX_TIP, LANDMARKS.INDEX_PIP, LANDMARKS.INDEX_MCP);
  const middle = isFingerExtended(landmarks, LANDMARKS.MIDDLE_TIP, LANDMARKS.MIDDLE_PIP, LANDMARKS.MIDDLE_MCP);
  const ring = isFingerExtended(landmarks, LANDMARKS.RING_TIP, LANDMARKS.RING_PIP, LANDMARKS.RING_MCP);
  const pinky = isFingerExtended(landmarks, LANDMARKS.PINKY_TIP, LANDMARKS.PINKY_PIP, LANDMARKS.PINKY_MCP);

  const fingerCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;

  // Hand center = average of wrist and middle MCP
  const wrist = landmarks[LANDMARKS.WRIST];
  const middleMCP = landmarks[LANDMARKS.MIDDLE_MCP];
  const centerX = (wrist.x + middleMCP.x) / 2;
  const centerY = (wrist.y + middleMCP.y) / 2;

  const wristTilt = calculateWristTilt(landmarks);

  // Special combos (GestureSynth style)
  // VI: Index + Pinky ONLY (no thumb, middle, ring)
  const isVI = index && pinky && !thumb && !middle && !ring;
  // VII: Index + Pinky + Thumb ONLY (no middle, ring)
  const isVII = index && pinky && thumb && !middle && !ring;

  const isFist = fingerCount === 0;

  return {
    fingerCount,
    fingers: { thumb, index, middle, ring, pinky },
    centerX,
    centerY,
    wristTilt,
    isFist,
    isVI,
    isVII,
  };
}

/**
 * Debounced gesture state — prevents flickering
 */
export class GestureDebouncer {
  private history: number[] = [];
  private readonly windowSize: number;

  constructor(windowSize: number = 4) {
    this.windowSize = windowSize;
  }

  /**
   * Add a value and return the stable (mode) value
   */
  push(value: number): number {
    this.history.push(value);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // Return the mode (most frequent value)
    const counts = new Map<number, number>();
    for (const v of this.history) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }

    let maxCount = 0;
    let mode = value;
    for (const [v, c] of counts) {
      if (c > maxCount) {
        maxCount = c;
        mode = v;
      }
    }
    return mode;
  }

  reset(): void {
    this.history = [];
  }
}
