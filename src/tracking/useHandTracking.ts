/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — useHandTracking React Hook
   Fixes MediaPipe WebGL WASM freeze by checking video dimensions (videoWidth/videoHeight)
   and providing strictly monotonic timestamps to detectForVideo
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

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean = false
) {
  const [status, setStatus] = useState<HandTrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<TrackedHands>({ left: null, right: null });
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef(0);
  const lastTimestampRef = useRef(-1);

  const [handsState, setHandsState] = useState<TrackedHands>({ left: null, right: null });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let activeStream: MediaStream | null = null;

    async function start() {
      setStatus('requesting');
      setError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API unavailable in this browser');
        }

        const video = videoRef.current;
        if (!video) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        const targetVideo = videoRef.current;
        if (!targetVideo) {
          throw new Error('Video element not found in DOM');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        activeStream = stream;

        targetVideo.srcObject = stream;
        await targetVideo.play();

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

          // Crucial fix: Ensure video has valid readyState and non-zero dimensions
          // Prevents MediaPipe NORM_RECT without IMAGE_DIMENSIONS WASM WebGL freeze
          if (!v || !lm || v.readyState < 2 || v.videoWidth === 0 || v.videoHeight === 0) {
            rafRef.current = requestAnimationFrame(detect);
            return;
          }

          // Use video.currentTime in milliseconds as strictly monotonic timestamp
          const nowMs = Math.round(v.currentTime * 1000);
          if (nowMs > lastTimestampRef.current && nowMs > 0) {
            lastTimestampRef.current = nowMs;

            try {
              const result = lm.detectForVideo(v, nowMs);

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
            } catch (err) {
              console.warn('[HandTracker] Detection skipped frame:', err);
            }
          }

          rafRef.current = requestAnimationFrame(detect);
        }

        detect();
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setError(err.message || 'Unknown camera error');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [enabled, videoRef]);

  return { status, error, handsRef, handsState };
}
