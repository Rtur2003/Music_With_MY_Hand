/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Recorder Component
   Record up to 15s WebM video clip (9:16 aspect ratio option) with audio
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect } from 'react';
import { downloadBlob } from '../utils/midiExport';

interface RecorderProps {
  stageContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const Recorder: React.FC<RecorderProps> = ({ stageContainerRef }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];
      setRecordingSeconds(0);

      // Capture stream from window/screen or canvas
      const videoElem = stageContainerRef.current?.querySelector('video');
      if (!videoElem || !videoElem.srcObject) {
        alert('Camera stream not ready for recording');
        return;
      }

      const stream = (videoElem.srcObject as MediaStream).clone();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        downloadBlob(blob, `aurasynth-clip-${Date.now()}.webm`);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Auto-stop after 15 seconds (TikTok style)
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setRecordingSeconds(seconds);
        if (seconds >= 15) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Recording error:', err);
      alert('Could not start recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="bottom-bar">
      <button
        className={`glass-btn glass-btn--record ${isRecording ? 'glass-btn--active' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? `🔴 Recording (${15 - recordingSeconds}s remaining)` : '🎥 Record 15s Clip'}
      </button>
    </div>
  );
};
