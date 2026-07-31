/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Hand Tracking Processor
   MediaPipe Hands integration via CDN (vision_bundle)
   ═══════════════════════════════════════════════════════════════════ */

import { processHandGesture, GestureDebouncer, type GestureData, type HandLandmark } from './fingerCount';

export interface HandTrackingResult {
  /** Left hand gesture data (null if not detected) */
  leftHand: GestureData | null;
  /** Right hand gesture data (null if not detected) */
  rightHand: GestureData | null;
  /** Raw landmarks for visualization */
  rawLandmarks: {
    left: HandLandmark[] | null;
    right: HandLandmark[] | null;
  };
  /** Timestamp */
  timestamp: number;
}

type OnResultCallback = (result: HandTrackingResult) => void;

/**
 * Hand tracking processor using MediaPipe Hands via CDN
 * Uses the @mediapipe/hands package loaded from CDN for broad compatibility
 */
export class HandTrackingProcessor {
  private video: HTMLVideoElement | null = null;
  private hands: any = null; // MediaPipe Hands instance
  private camera: any = null; // Camera utility
  private isRunning = false;
  private onResultCallback: OnResultCallback | null = null;
  private animFrameId: number = 0;

  // Debouncers for stable gesture detection
  private leftDebouncer = new GestureDebouncer(5);
  private rightDebouncer = new GestureDebouncer(5);

  /**
   * Initialize the hand tracker
   */
  async initialize(
    videoElement: HTMLVideoElement,
    onResult: OnResultCallback,
  ): Promise<void> {
    this.video = videoElement;
    this.onResultCallback = onResult;

    // Wait for MediaPipe Hands to be available from CDN
    await this.waitForMediaPipe();

    const mpHands = (window as any).Hands;
    if (!mpHands) {
      throw new Error('MediaPipe Hands not loaded');
    }

    this.hands = new mpHands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((results: any) => this.handleResults(results));

    // Start camera
    await this.startCamera();
  }

  private async waitForMediaPipe(): Promise<void> {
    // Check if already loaded
    if ((window as any).Hands) return;

    // Load the scripts
    await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js');

    // Wait for it to be available
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        if ((window as any).Hands) {
          resolve();
        } else if (attempts++ > 50) {
          reject(new Error('MediaPipe Hands failed to load'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Don't load twice
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  private async startCamera(): Promise<void> {
    if (!this.video) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    });

    this.video.srcObject = stream;
    await this.video.play();
    this.isRunning = true;
    this.processFrame();
  }

  private async processFrame(): Promise<void> {
    if (!this.isRunning || !this.video || !this.hands) return;

    if (this.video.readyState >= 2) {
      await this.hands.send({ image: this.video });
    }

    this.animFrameId = requestAnimationFrame(() => this.processFrame());
  }

  private handleResults(results: any): void {
    if (!this.onResultCallback) return;

    let leftHand: GestureData | null = null;
    let rightHand: GestureData | null = null;
    let leftLandmarks: HandLandmark[] | null = null;
    let rightLandmarks: HandLandmark[] | null = null;

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks: HandLandmark[] = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i];

        // MediaPipe returns "Left"/"Right" but it's mirrored in selfie mode
        // "Right" label = user's left hand (camera mirror)
        const isRightLabel = handedness.label === 'Right';
        // In mirrored view: "Right" label = LEFT hand of the user
        const isUserRightHand = !isRightLabel;

        if (isUserRightHand) {
          const gesture = processHandGesture(landmarks, true);
          gesture.fingerCount = this.rightDebouncer.push(gesture.fingerCount);
          rightHand = gesture;
          rightLandmarks = landmarks;
        } else {
          const gesture = processHandGesture(landmarks, false);
          gesture.fingerCount = this.leftDebouncer.push(gesture.fingerCount);
          leftHand = gesture;
          leftLandmarks = landmarks;
        }
      }
    }

    this.onResultCallback({
      leftHand,
      rightHand,
      rawLandmarks: { left: leftLandmarks, right: rightLandmarks },
      timestamp: performance.now(),
    });
  }

  /**
   * Stop tracking and release camera
   */
  stop(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);

    if (this.video?.srcObject) {
      const tracks = (this.video.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      this.video.srcObject = null;
    }

    this.hands?.close();
    this.leftDebouncer.reset();
    this.rightDebouncer.reset();
  }
}

/** Singleton instance */
let trackerInstance: HandTrackingProcessor | null = null;

export function getHandTracker(): HandTrackingProcessor {
  if (!trackerInstance) {
    trackerInstance = new HandTrackingProcessor();
  }
  return trackerInstance;
}
