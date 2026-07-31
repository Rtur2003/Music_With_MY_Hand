/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — useHandTracking React Hook
   Uses @mediapipe/tasks-vision npm package directly
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export type Landmark = { x: number; y: number; z: number };
export type Handedness = 'Left' | 'Right';

export interface TrackedHands {
  left: Landmark[] | null;
  right: Landmark[] | null;
}

export type HandTrackingStatus = 'idle' | 'requesting' | 'loading' | 'ready' | 'error';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<HandTrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<TrackedHands>({ left: null, right: null });
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);

  // State to trigger React re-renders for components that need active hand data
  const [handsState, setHandsState] = useState<TrackedHands>({ left: null, right: null });

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

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        activeStream = stream;

        const video = videoRef.current;
        if (!video) throw new Error('Video element not found');
        video.srcObject = stream;
        await video.play();

        setStatus('loading');

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

        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setStatus('ready');

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

                // MediaPipe labels mirrored in selfie view:
                // "Right" label = user's LEFT hand
                if (label === 'Right') {
                  left = landmarks;
                } else if (label === 'Left') {
                  right = landmarks;
                }
              }
            }

            const nextHands = { left, right };
            handsRef.current = nextHands;
            setHandsState(nextHands);
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

  return { status, error, handsRef, handsState };
}
