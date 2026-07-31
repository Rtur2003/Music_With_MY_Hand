"""
===============================================================================
GERÇEK ZAMANLI EL HAREKETİ İLE VOKAL PITCH VE HARMONİ KONTROL PROTOTİPİ
===============================================================================
Yazar / Mimari: AI Architect & Audio/Vision Systems Engineer
Açıklama:
  Bu script, web kamerasından alınan el hareketlerini (MediaPipe Hand Landmarker)
  işler, parmak konumlarına göre ses perdesi (Pitch) ve akör armonisini (Harmony)
  hesaplar. Düşük gecikmeli multiprocessing/threading yapısı ve One-Euro Filter
  yumuşatma algoritması içerir.
===============================================================================
"""

import sys
import time
import math
import threading
from dataclasses import dataclass
import numpy as np
import cv2

# Opsiyonel Ses ve Görü Kütüphaneleri Kontrolü
try:
    import mediapipe as mp
    from mediapipe.framework.formats import landmark_pb2
    HAS_MEDIAPIPE = True
except ImportError:
    HAS_MEDIAPIPE = False

try:
    import sounddevice as sd
    HAS_SOUNDDEVICE = True
except ImportError:
    HAS_SOUNDDEVICE = False


# =============================================================================
# 1. MATEMATİKSEL YUMUŞATMA (ONE-EURO FILTER)
# =============================================================================
class OneEuroFilter:
    """
    İnsan-Bilgisayar Etkileşimi (HCI) için düşük gecikmeli ve titremeyi (jitter)
    engelleyen adaptif alçak geçiren filtre (Low-Pass Filter).
    """
    def __init__(self, min_cutoff=1.0, beta=0.007, d_cutoff=1.0):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff
        self.x_prev = None
        self.dx_prev = None
        self.t_prev = None

    def _smoothing_factor(self, dt, cutoff):
        r = 2 * math.pi * cutoff * dt
        return r / (r + 1)

    def _exponential_smoothing(self, a, x, x_prev):
        return a * x + (1 - a) * x_prev

    def filter(self, x, t):
        if self.t_prev is None:
            self.x_prev = x
            self.dx_prev = 0.0
            self.t_prev = t
            return x

        dt = t - self.t_prev
        if dt <= 0.0:
            return self.x_prev

        # Türev (Hız) hesabı
        dx = (x - self.x_prev) / dt
        a_dx = self._smoothing_factor(dt, self.d_cutoff)
        dx_hat = self._exponential_smoothing(a_dx, dx, self.dx_prev)

        # Adaptif kesim frekansı (Cutoff frequency)
        cutoff = self.min_cutoff + self.beta * abs(dx_hat)
        a = self._smoothing_factor(dt, cutoff)
        x_hat = self._exponential_smoothing(a, x, self.x_prev)

        self.x_prev = x_hat
        self.dx_prev = dx_hat
        self.t_prev = t

        return x_hat


# =============================================================================
# 2. PAYLAŞILAN SİSTEM DURUMU (SHARED CONTROL STATE)
# =============================================================================
@dataclass
class SharedControlState:
    """
    Görü Ajanı ile Ses Ajanı arasında iplik güvenli (thread-safe) 
    veri aktarımı sağlayan kontrol veri yapısı.
    """
    pitch_factor: float = 1.0     # Pitch değiştirici katsayı (0.5x - 2.0x, ±1 Oktav)
    target_note: str = "C4"       # Quantized Hedef Nota
    chord_type: str = "Unison"    # Akor Türü: Unison, Major, Minor, Dom7, Octave
    chord_intervals: tuple = (0,) # Yarı ton cinsinden armoniler (örn: (0, 4, 7))
    hand_detected: bool = False   # El algılandı mı?
    normalized_y: float = 0.5     # Filtrelenmiş Y koordinatı (0.0 - 1.0)
    lock: threading.Lock = threading.Lock()

    def update(self, pitch_factor, target_note, chord_type, chord_intervals, hand_detected, norm_y):
        with self.lock:
            self.pitch_factor = pitch_factor
            self.target_note = target_note
            self.chord_type = chord_type
            self.chord_intervals = chord_intervals
            self.hand_detected = hand_detected
            self.normalized_y = norm_y

    def get_snapshot(self):
        with self.lock:
            return (self.pitch_factor, self.target_note, self.chord_type, 
                    self.chord_intervals, self.hand_detected, self.normalized_y)


# =============================================================================
# 3. GÖRÜ VE ALGILAMA AJANI (VISION AGENT)
# =============================================================================
class VisionAgent(threading.Thread):
    def __init__(self, state: SharedControlState, camera_idx=0):
        super().__init__(daemon=True)
        self.state = state
        self.camera_idx = camera_idx
        self.running = True
        self.filter_y = OneEuroFilter(min_cutoff=1.5, beta=0.05)

        # Akor Haritalama Mantığı (Açık Parmak Sayısına Göre)
        self.chord_map = {
            1: ("Root (Unison)", (0,)),
            2: ("Octave Harmony", (0, 12)),
            3: ("Major Triad", (0, 4, 7)),
            4: ("Minor Triad", (0, 3, 7)),
            5: ("Dominant 7th", (0, 4, 7, 10))
        }

        # Chromatic Scale Nota İsimleri
        self.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    def count_extended_fingers(self, landmarks):
        """
        Parmakların açık (extended) olup olmadığını eklem koordinatları ile hesaplar.
        """
        # Landmark indexleri: Baş parmak (4), İşaret (8), Orta (12), Yüzük (16), Serçe (20)
        # PIP eklemleri: Baş (2), İşaret (6), Orta (10), Yüzük (14), Serçe (18)
        extended_count = 0
        
        # Baş parmak kontrolü (X ekseni mesafesi)
        if abs(landmarks[4].x - landmarks[17].x) > abs(landmarks[2].x - landmarks[17].x):
            extended_count += 1

        # Diğer 4 parmak kontrolü (Y ekseni yüksekliği)
        finger_tips = [8, 12, 16, 20]
        finger_pips = [6, 10, 14, 18]

        for tip, pip in zip(finger_tips, finger_pips):
            if landmarks[tip].y < landmarks[pip].y:  # Y ekseninde yukarıda (küçük Y)
                extended_count += 1

        return max(1, min(5, extended_count))

    def map_y_to_pitch(self, norm_y):
        """
        Normalized Y (0.0 - 1.0) değerini MIDI Notaya ve Pitch Çarpanına dönüştürür.
        Y = 1.0 (Ekranın altı) -> C3 (130.81 Hz)
        Y = 0.0 (Ekranın üstü) -> C5 (523.25 Hz)
        """
        # MIDI Nota aralığı: 48 (C3) - 72 (C5)
        midi_note = int(np.interp(1.0 - norm_y, [0.0, 1.0], [48, 72]))
        
        note_name = self.notes[midi_note % 12] + str(midi_note // 12 - 1)
        freq = 440.0 * (2.0 ** ((midi_note - 69) / 12.0))
        
        # Referans frekans C4 (261.63 Hz) kabul edilerek pitch çarpanı hesaplanır
        ref_freq = 261.63
        pitch_factor = freq / ref_freq
        
        return pitch_factor, note_name

    def run(self):
        cap = cv2.VideoCapture(self.camera_idx)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        if HAS_MEDIAPIPE:
            mp_hands = mp.solutions.hands
            hands = mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=1,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.7
            )
            mp_draw = mp.solutions.drawing_utils

        print("[VISION AGENT] Kamera ve Görü Modülü Başlatıldı.")

        while self.running:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.01)
                continue

            frame = cv2.flip(frame, 1)  # Ayna efekti
            h, w, c = frame.shape
            now = time.time()

            pitch_factor = 1.0
            note_name = "C4"
            chord_type = "Unison"
            chord_intervals = (0,)
            hand_found = False
            norm_y_filtered = 0.5

            if HAS_MEDIAPIPE:
                img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(img_rgb)

                if results.multi_hand_landmarks:
                    hand_found = True
                    hand_landmarks = results.multi_hand_landmarks[0]
                    mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                    # 1. El Bileği (Wrist [0]) veya İşaret Parmak Kökü (MCP [5]) Y-koordinatı
                    raw_y = hand_landmarks[0].y
                    norm_y_filtered = self.filter_y.filter(raw_y, now)

                    # 2. Pitch ve Nota Hesaplama
                    pitch_factor, note_name = self.map_y_to_pitch(norm_y_filtered)

                    # 3. Akor Hesaplama (Açık Parmak Sayısı)
                    extended_fingers = self.count_extended_fingers(hand_landmarks.landmark)
                    chord_type, chord_intervals = self.chord_map.get(extended_fingers, ("Unison", (0,)))

                    # Visual Overlay (UI)
                    cv2.putText(frame, f"Nota / Pitch: {note_name} ({pitch_factor:.2f}x)", (20, 40),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                    cv2.putText(frame, f"Akor Modu: {chord_type}", (20, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 200, 0), 2)
                    cv2.putText(frame, f"Parmak Sayisi: {extended_fingers}", (20, 120),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)

            else:
                # MediaPipe yüklenememişse simülasyon modu
                cv2.putText(frame, "MediaPipe Bulunamadi! (Simulasyon Modu)", (20, 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            # Paylaşılan Durumu Güncelle
            self.state.update(pitch_factor, note_name, chord_type, chord_intervals, hand_found, norm_y_filtered)

            cv2.imshow("AI Vision Agent - Gesture Control", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.running = False
                break

        cap.release()
        cv2.destroyAllWindows()


# =============================================================================
# 4. SES VE AKOR SENTEZ AJANI (AUDIO AGENT)
# =============================================================================
class RealtimeAudioAgent(threading.Thread):
    def __init__(self, state: SharedControlState, sample_rate=44100, blocksize=512):
        super().__init__(daemon=True)
        self.state = state
        self.sample_rate = sample_rate
        self.blocksize = blocksize  # 512 sample @ 44.1kHz ~ 11.6 ms gecikme
        self.running = True
        self.phase = 0.0

    def audio_callback(self, outdata, frames, time_info, status):
        """
        Düşük gecikmeli ses işleme ve armonizasyon geri çağırım (callback) fonksiyonu.
        Gelen kontrol verilerine göre sentezlenen temel ses (Pitch) ve akor tonlarını üretir.
        """
        if status:
            print(f"[AUDIO WARN] {status}", file=sys.stderr)

        pitch_factor, note_name, chord_type, chord_intervals, hand_detected, norm_y = self.state.get_snapshot()

        if not hand_detected:
            outdata.fill(0)
            return

        # Temel Frekans (Base Frequency C4 = 261.63 Hz * pitch_factor)
        base_freq = 261.63 * pitch_factor
        t = (np.arange(frames) + self.phase) / self.sample_rate
        self.phase += frames

        # Çok Sesli Akor Sentezi (Multi-Voice Synthesis / Harmonizer Demo)
        signal = np.zeros(frames)
        num_voices = len(chord_intervals)

        for interval in chord_intervals:
            # Yarı ton frekans çarpanı: f = f0 * 2^(interval / 12)
            voice_freq = base_freq * (2.0 ** (interval / 12.0))
            
            # Harmonik Zenginliği olan Dalga Formu (Temel Ses + 2. Harmonik)
            voice_signal = 0.6 * np.sin(2 * np.pi * voice_freq * t) + \
                           0.25 * np.sin(4 * np.pi * voice_freq * t)
            
            signal += voice_signal / num_voices

        # Yumuşak Envelop & Kazanç Kontrolü
        signal = np.clip(signal * 0.3, -1.0, 1.0)
        
        # Stereo Çıkış
        outdata[:, 0] = signal
        outdata[:, 1] = signal

    def run(self):
        if not HAS_SOUNDDEVICE:
            print("[AUDIO AGENT] sounddevice kütüphanesi yüklenemedi. Ses sentezi devre dışı.")
            return

        print(f"[AUDIO AGENT] Ses Sürücüsü Başlatıldı. Gecikme Bloğu: {self.blocksize / self.sample_rate * 1000:.2f} ms")
        
        with sd.OutputStream(samplerate=self.sample_rate, blocksize=self.blocksize,
                             channels=2, callback=self.audio_callback):
            while self.running:
                time.sleep(0.1)


# =============================================================================
# 5. ANA UYGULAMA VE LOGLAMA
# =============================================================================
def main():
    print("=================================================================")
    print("  GERÇEK ZAMANLI EL HAREKETİ İLE VOKAL PITCH VE HARMONİ AJANI   ")
    print("=================================================================")
    print("Çıkmak için kamera penceresindeyken 'q' tuşuna basın.\n")

    state = SharedControlState()

    # Görü ve Ses Ajanlarını Başlat
    vision_agent = VisionAgent(state)
    audio_agent = RealtimeAudioAgent(state)

    vision_agent.start()
    audio_agent.start()

    # Konsol Monitor Loop
    try:
        while vision_agent.is_alive():
            pf, note, chord, intervals, detected, norm_y = state.get_snapshot()
            status_str = f"[MONITOR] El: {'ALGILANDI' if detected else 'BEKLENIYOR'} | Nota: {note:<4} | Pitch: {pf:.2f}x | Akor: {chord:<15} | Armoni: {intervals}"
            print(status_str, end="\r")
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n[SYSTEM] Kullanıcı tarafından durduruldu.")
    finally:
        vision_agent.running = False
        audio_agent.running = False
        print("\n[SYSTEM] Sistem kapatıldı.")

if __name__ == "__main__":
    main()
