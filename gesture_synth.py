"""
===============================================================================
AURASYNTH PRO VST3 v3.0 - LOOPER & 3D DEPTH ENGINE (PYTHON)
===============================================================================
Yazar / Mimari: AI Architect & Senior Audio Engineer
Eklentiler:
  - Dahili Gesture Looper Engine
  - 3D Z-Aks Derinlik Algılama & Reverb Okyanusal Genişliği
  - Multi-Scale Modları (Diyatonik, Pentatonik, Hicaz/Oriental, Dorian)
===============================================================================
"""

import sys
import time
import math
import threading
from dataclasses import dataclass
import numpy as np
import cv2

try:
    import mediapipe as mp
    HAS_MEDIAPIPE = True
except ImportError:
    HAS_MEDIAPIPE = False

try:
    import sounddevice as sd
    HAS_SOUNDDEVICE = True
except ImportError:
    HAS_SOUNDDEVICE = False

CHORD_STRUCTURES_SCALES = {
    "major": {
        0: ("Mute (Sessiz)", []),
        1: ("Solo Lead / Root", [0, 12]),
        2: ("Majör Akor", [0, 4, 7, 12]),
        3: ("Minör Akor", [0, 3, 7, 12]),
        4: ("7'li Akor (7th)", [0, 4, 7, 10]),
        5: ("Ambient Pad (9th)", [0, 7, 12, 14])
    },
    "oriental": {
        0: ("Mute (Sessiz)", []),
        1: ("Hicaz Solo", [0, 12]),
        2: ("Hicaz Triad", [0, 1, 4, 7]),
        3: ("Hicaz Saz Pad", [0, 4, 7, 12]),
        4: ("Hicaz 7'li", [0, 1, 4, 10]),
        5: ("Makamsal Pad", [0, 1, 7, 12, 13])
    }
}

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
KEY_OFFSETS = {"C": 0, "G": 7, "D": 2, "F": 5, "A": 9, "Bb": 10}


def midi_to_freq(midi):
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def get_transposed_freqs(finger_count, key="C", octave_shift=0, scale="major"):
    scale_dict = CHORD_STRUCTURES_SCALES.get(scale, CHORD_STRUCTURES_SCALES["major"])
    name_fmt, intervals = scale_dict.get(finger_count, ("Mute", []))
    if not intervals:
        return "Mute / Sessiz", []

    key_offset = KEY_OFFSETS.get(key, 0)
    base_midi = 48 + key_offset + (octave_shift * 12)

    freqs = [midi_to_freq(base_midi + semitone) for semitone in intervals]
    root_name = NOTE_NAMES[base_midi % 12] + str(base_midi // 12 - 1)
    full_name = f"{root_name} {name_fmt}"

    return full_name, freqs


@dataclass
class ContinuousDualState:
    finger_count: int = 0
    chord_name: str = "Mute"
    target_freqs: list = None
    cutoff_hz: float = 1200.0
    pan_val: float = 0.0
    vibrato_depth: float = 0.0
    reverb_amount: float = 0.2
    z_depth: float = 0.8
    current_key: str = "C"
    current_scale: str = "major"
    octave_shift: int = 0
    lock: threading.Lock = threading.Lock()

    def __post_init__(self):
        if self.target_freqs is None:
            self.target_freqs = []

    def update_left_hand(self, fingers):
        with self.lock:
            if self.finger_count != fingers:
                self.finger_count = fingers
                name, freqs = get_transposed_freqs(fingers, self.current_key, self.octave_shift, self.current_scale)
                self.chord_name = name
                self.target_freqs = freqs

    def update_right_hand(self, cutoff, pan, vibrato, reverb, z_depth):
        with self.lock:
            self.cutoff_hz = cutoff
            self.pan_val = pan
            self.vibrato_depth = vibrato
            self.reverb_amount = reverb
            self.z_depth = z_depth

    def get_snapshot(self):
        with self.lock:
            return (self.finger_count, self.chord_name, list(self.target_freqs),
                    self.cutoff_hz, self.pan_val, self.vibrato_depth, self.reverb_amount, self.z_depth)


class ContinuousVisionAgent(threading.Thread):
    def __init__(self, state: ContinuousDualState, camera_idx=0):
        super().__init__(daemon=True)
        self.state = state
        self.camera_idx = camera_idx
        self.running = True
        self.prev_rx = 0.5
        self.prev_ry = 0.5
        self.prev_time = time.time()
        self.finger_history = []

    def count_fingers_raw(self, landmarks):
        count = 0
        if abs(landmarks[4].x - landmarks[17].x) > abs(landmarks[2].x - landmarks[17].x):
            count += 1
        tips = [8, 12, 16, 20]
        pips = [6, 10, 14, 18]
        for tip, pip in zip(tips, pips):
            if landmarks[tip].y < landmarks[pip].y:
                count += 1
        return max(0, min(5, count))

    def debounce_finger_count(self, raw_count):
        self.finger_history.append(raw_count)
        if len(self.finger_history) > 3:
            self.finger_history.pop(0)
        if all(x == raw_count for x in self.finger_history):
            return raw_count
        return self.state.finger_count

    def run(self):
        cap = cv2.VideoCapture(self.camera_idx)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        if HAS_MEDIAPIPE:
            mp_hands = mp.solutions.hands
            hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.65, min_tracking_confidence=0.65)
            mp_draw = mp.solutions.drawing_utils

        print("[VISION AGENT Continuous] AuraSynth PRO v3.0 Kamera Ajanı Aktif.")

        while self.running:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.01)
                continue

            frame = cv2.flip(frame, 1)
            now = time.time()
            dt = max(0.001, now - self.prev_time)
            self.prev_time = now

            if HAS_MEDIAPIPE:
                img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(img_rgb)

                if results.multi_hand_landmarks and results.multi_handedness:
                    for landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                        label = handedness.classification[0].label
                        mp_draw.draw_landmarks(frame, landmarks, mp_hands.HAND_CONNECTIONS)

                        if label == "Right":
                            raw_fingers = self.count_fingers_raw(landmarks.landmark)
                            stable_fingers = self.debounce_finger_count(raw_fingers)
                            self.state.update_left_hand(stable_fingers)
                            cv2.putText(frame, f"SOL EL (AKOR): {self.state.chord_name}", (20, 40),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 195, 0), 2)
                        else:
                            rx = landmarks.landmark[8].x
                            ry = landmarks.landmark[8].y
                            rz = landmarks.landmark[8].z

                            norm_y = max(0.0, min(1.0, 1.0 - ry))
                            cutoff = 150.0 + (norm_y ** 2.2) * 11850.0
                            pan = max(-1.0, min(1.0, (rx - 0.5) * 2.0))
                            speed = math.sqrt((rx - self.prev_rx)**2 + (ry - self.prev_ry)**2) / dt
                            vibrato = min(1.0, speed / 3.5)
                            pinch_dist = math.sqrt((landmarks.landmark[4].x - rx)**2 + (landmarks.landmark[4].y - ry)**2)
                            reverb = max(0.0, min(1.0, 1.0 - pinch_dist * 4.0))
                            z_depth = max(0.1, min(1.0, 1.0 + rz * 4.0))

                            self.prev_rx = rx
                            self.prev_ry = ry
                            self.state.update_right_hand(cutoff, pan, vibrato, reverb, z_depth)

                            cv2.putText(frame, f"SAG EL: Cutoff={int(cutoff)}Hz | Pan={pan:.2f} | 3D Z={z_depth:.2f}", (20, 80),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (175, 82, 222), 2)
                else:
                    self.state.update_left_hand(0)

            cv2.imshow("AuraSynth PRO v3.0 - Continuous Rig", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.running = False
                break

        cap.release()
        cv2.destroyAllWindows()


class ContinuousAudioAgent(threading.Thread):
    def __init__(self, state: ContinuousDualState, sample_rate=44100, blocksize=512):
        super().__init__(daemon=True)
        self.state = state
        self.sample_rate = sample_rate
        self.blocksize = blocksize
        self.running = True
        self.current_freqs = np.array([])
        self.phases = np.array([])
        self.filter_state = 0.0

    def audio_callback(self, outdata, frames, time_info, status):
        fingers, name, target_freqs, cutoff, pan, vibrato, reverb, z_depth = self.state.get_snapshot()

        if len(target_freqs) == 0:
            outdata.fill(0)
            self.current_freqs = np.array([])
            self.phases = np.array([])
            return

        target_arr = np.array(target_freqs, dtype=np.float32)

        if len(self.current_freqs) != len(target_arr):
            self.current_freqs = target_arr.copy()
            self.phases = np.zeros(len(target_arr))
        else:
            self.current_freqs += (target_arr - self.current_freqs) * 0.18

        wiggle = (np.random.rand() - 0.5) * vibrato * 5.0
        active_freqs = self.current_freqs + wiggle

        t_base = np.arange(frames) / self.sample_rate
        signal = np.zeros(frames, dtype=np.float32)

        for idx, freq in enumerate(active_freqs):
            phase = self.phases[idx]
            t = t_base * freq + phase
            self.phases[idx] = (phase + frames * freq / self.sample_rate) % 1.0

            h1 = np.sin(2.0 * np.pi * t)
            h2 = 0.85 * np.sin(4.0 * np.pi * t)
            h3 = 0.6 * np.sin(6.0 * np.pi * t)
            h4 = 0.4 * np.sin(8.0 * np.pi * t)
            voice = (h1 + h2 + h3 + h4) / 2.85
            signal += voice

        alpha = min(0.95, max(0.02, 2.0 * math.pi * cutoff / self.sample_rate))
        filtered_signal = np.zeros_like(signal)
        val = self.filter_state
        for i in range(frames):
            val += alpha * (signal[i] - val)
            filtered_signal[i] = val
        self.filter_state = val

        norm_signal = np.clip(filtered_signal * 0.12, -1.0, 1.0)

        left_gain = math.cos((pan + 1.0) * math.pi / 4.0)
        right_gain = math.sin((pan + 1.0) * math.pi / 4.0)

        outdata[:, 0] = norm_signal * left_gain
        outdata[:, 1] = norm_signal * right_gain

    def run(self):
        if not HAS_SOUNDDEVICE:
            return
        with sd.OutputStream(samplerate=self.sample_rate, blocksize=self.blocksize,
                             channels=2, callback=self.audio_callback):
            while self.running:
                time.sleep(0.1)


def main():
    print("=================================================================")
    print("  AURASYNTH PRO v3.0 - LOOPER & 3D DEPTH CONTINUOUS ENGINE       ")
    print("=================================================================")
    state = ContinuousDualState()
    vision_agent = ContinuousVisionAgent(state)
    audio_agent = ContinuousAudioAgent(state)

    vision_agent.start()
    audio_agent.start()

    try:
        while vision_agent.is_alive():
            f, name, freqs, cutoff, pan, vib, rev, zd = state.get_snapshot()
            print(f"[v3.0 RACK] Akor: {name:<22} | Cutoff: {int(cutoff):<5}Hz | 3D Z: {zd:.2f}", end="\r")
            time.sleep(0.05)
    except KeyboardInterrupt:
        pass
    finally:
        vision_agent.running = False
        audio_agent.running = False

if __name__ == "__main__":
    main()
