/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — useHandTracking React Hook
   Based on Ekmand/music-synth pattern with @mediapipe/tasks-vision
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';

export type Landmark = { x: number; y: number; z: number };
export type Handedness = 'Left' | 'Right';

export interface TrackedHands {
  left: Landmark[] | null;
  right: Landmark[] | null;
}

export type HandTrackingStatus = 'idle' | 'requesting' | 'loading' | 'ready' | 'error';

// CDN URLs for MediaPipe tasks-vision WASM runtime + model
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

/**
 * React hook that manages webcam + MediaPipe hand tracking
 * Returns status, error, and a ref to the latest hand data
 */
export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<HandTrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<TrackedHands>({ left: null, right: null });
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    let activeStream: MediaStream | null = null;

    async function start() {
      setStatus('requesting');
      setError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API unavailable in this browser');
        }

        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        activeStream = stream;

        const video = videoRef.current;
        if (!video) throw new Error('Video element not found');
        video.srcObject = stream;
        await video.play();

        setStatus('loading');

        // Dynamically import MediaPipe tasks-vision
        const vision = await import(
          /* @vite-ignore */
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs'
        );

        if (cancelled) return;

        const { FilesetResolver, HandLandmarker } = vision;
        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);

        const landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) { landmarker.close(); return; }
        landmarkerRef.current = landmarker;
        setStatus('ready');

        // Start detection loop
        function detect() {
          if (cancelled) return;
          const v = videoRef.current;
          const lm = landmarkerRef.current;
          if (!v || !lm || v.readyState < 2) {
            rafRef.current = requestAnimationFrame(detect);
            return;
          }

          if (v.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = v.currentTime;
            const result = lm.detectForVideo(v, performance.now());

            let left: Landmark[] | null = null;
            let right: Landmark[] | null = null;

            if (result.landmarks && result.handedness) {
              for (let i = 0; i < result.landmarks.length; i++) {
                const landmarks = result.landmarks[i] as Landmark[];
                const label = result.handedness[i]?.[0]?.categoryName;

                // MediaPipe labels are mirrored in selfie view:
                // "Right" label = user's LEFT hand
                if (label === 'Right') {
                  left = landmarks;
                } else if (label === 'Left') {
                  right = landmarks;
                }
              }
            }

            handsRef.current = { left, right };
          }

          rafRef.current = requestAnimationFrame(detect);
        }

        detect();
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setError(err.message || 'Unknown error');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoRef]);

  return { status, error, handsRef };
}
