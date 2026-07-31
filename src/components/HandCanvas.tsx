/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Hand Canvas Component
   Reads handsRef directly in a 60 FPS rAF loop for zero React re-render overhead
   ═══════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react';
import type { Landmark, TrackedHands } from '../tracking/useHandTracking';

interface HandCanvasProps {
  handsRef: React.RefObject<TrackedHands>;
  analyser?: any; // Tone.Analyser waveform
  chordColor?: string; // e.g. "#00ffcc" or "#ffaa00"
}

// MediaPipe hand connection pairs
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17],              // Palm
];

export const HandCanvas: React.FC<HandCanvasProps> = ({
  handsRef,
  analyser,
  chordColor = '#00ffcc',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const batonTrailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      // Read current hands directly from Ref (0% React re-render overhead!)
      const { left: leftHand, right: rightHand } = handsRef.current || { left: null, right: null };

      // ── 1. Audio Waveform (Bottom) ──────────────────
      if (analyser) {
        try {
          const values = analyser.getValue() as Float32Array;
          if (values && values.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = chordColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = chordColor;

            const sliceWidth = w / values.length;
            let x = 0;
            const centerY = h - 60;

            for (let i = 0; i < values.length; i++) {
              const v = values[i];
              const y = centerY + v * 40;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              x += sliceWidth;
            }

            ctx.stroke();
            ctx.restore();
          }
        } catch {
          // Analyser might not be ready
        }
      }

      // ── 2. Conductor Baton Ribbon Trail (Right Hand Index Tip) ──
      if (rightHand && rightHand[8]) {
        const tipX = (1 - rightHand[8].x) * w;
        const tipY = rightHand[8].y * h;

        batonTrailRef.current.push({ x: tipX, y: tipY, alpha: 1.0 });
        if (batonTrailRef.current.length > 25) {
          batonTrailRef.current.shift();
        }
      }

      if (batonTrailRef.current.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffaa00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffaa00';

        for (let i = 0; i < batonTrailRef.current.length - 1; i++) {
          const p1 = batonTrailRef.current[i];
          const p2 = batonTrailRef.current[i + 1];
          p1.alpha *= 0.92;

          ctx.strokeStyle = `rgba(255, 170, 0, ${p1.alpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── 3. Hand Skeleton Landmarks ───────────────────
      const drawSkeleton = (hand: Landmark[], color: string, glowColor: string) => {
        ctx.save();

        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;

        for (const [p1, p2] of CONNECTIONS) {
          const pt1 = hand[p1];
          const pt2 = hand[p2];
          if (!pt1 || !pt2) continue;

          const x1 = (1 - pt1.x) * w;
          const y1 = pt1.y * h;
          const x2 = (1 - pt2.x) * w;
          const y2 = pt2.y * h;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        for (let i = 0; i < hand.length; i++) {
          const pt = hand[i];
          if (!pt) continue;

          const x = (1 - pt.x) * w;
          const y = pt.y * h;
          const isTip = [4, 8, 12, 16, 20].includes(i);
          const radius = isTip ? 7 : 4;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isTip ? '#ffffff' : color;
          ctx.fill();

          if (isTip) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        ctx.restore();
      };

      if (leftHand && leftHand.length >= 21) {
        drawSkeleton(leftHand, '#00ffcc', 'rgba(0, 255, 204, 0.6)');
      }

      if (rightHand && rightHand.length >= 21) {
        drawSkeleton(rightHand, '#ff00ff', 'rgba(255, 0, 255, 0.6)');
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [handsRef, analyser, chordColor]);

  return <canvas ref={canvasRef} className="visualizer-canvas" />;
};
