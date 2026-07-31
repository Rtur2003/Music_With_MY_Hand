/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Hand Canvas Component
   Draws glowing hand skeleton landmarks & audio waveform overlay
   ═══════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react';
import type { Landmark } from '../tracking/useHandTracking';

interface HandCanvasProps {
  leftHand: Landmark[] | null;
  rightHand: Landmark[] | null;
  analyser?: any; // Tone.Analyser waveform
  chordColor?: string; // e.g. "#00ffcc"
}

// MediaPipe hand connection pairs for skeleton rendering
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17],              // Palm
];

export const HandCanvas: React.FC<HandCanvasProps> = ({
  leftHand,
  rightHand,
  analyser,
  chordColor = '#00ffcc',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const render = () => {
      // Resize to match container
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      // ── 1. Draw Audio Waveform (Bottom) ──────────────────
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

      // ── 2. Draw Hand Skeleton Landmarks ───────────────────
      const drawSkeleton = (hand: Landmark[], color: string, glowColor: string) => {
        ctx.save();

        // Draw bone connections
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;

        for (const [p1, p2] of CONNECTIONS) {
          const pt1 = hand[p1];
          const pt2 = hand[p2];
          if (!pt1 || !pt2) continue;

          // Note: hand coordinates are normalized 0-1 (X is mirrored for selfie view)
          const x1 = (1 - pt1.x) * w;
          const y1 = pt1.y * h;
          const x2 = (1 - pt2.x) * w;
          const y2 = pt2.y * h;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Draw joint nodes
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
  }, [leftHand, rightHand, analyser, chordColor]);

  return <canvas ref={canvasRef} className="visualizer-canvas" />;
};
