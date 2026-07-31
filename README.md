# AuraSynth Pro VST3 Ultimate Edition (v12.0)

[![System Status](https://img.shields.io/badge/Audio_Engine-Active_96kHz-00c3ff.svg)](#)
[![MediaPipe](https://img.shields.io/badge/Tracking-MediaPipe_60FPS-af52de.svg)](#)
[![WebMIDI](https://img.shields.io/badge/MIDI-WebMIDI_DAW_Out-ffcc00.svg)](#)

> **Professional Gestural Audio Synthesizer & Generative 3D Visual Environment Engine**  
> *Profesyonel El Takibi ile Kontrol Edilen Sentezör ve 3D Görsel Atmosfer Motoru*

---

## 🇹🇷 TÜRKÇE KULLANIM KILAVUZU & TEKNİK DOKÜMANTASYON

### 🎛️ Genel Bakış ve Donanım Mimarisi
AuraSynth Pro VST3, kamera tabanlı el takibini düşük gecikmeli Web Audio API sentezleme mimarisiyle birleştiren bağımsız bir dijital enstrümandır. Sinyal akışı stüdyo donanımlarındaki gibi modüler 5 ana sekmeden oluşur:

1. **🎛️ Sentez & Akor Pad Matrisi**: 12 Tonal Preset, Gam Filtreleri (Majör, Minör, Pentatonik, Hicaz, Dorian) ve Oktav Değiştirici.
2. **📈 Dynamic ADSR Zarf Modülatörü**: Attack, Decay, Sustain ve Release zaman şekillendiricileri.
3. **🎚️ Stüdyo EQ & Spatial FX**: 3-Band Parametrik EQ, Portamento Glide, Stereo Delay Time/Feedback, Chorus Detune ve Reverb Wet Mix.
4. **🔁 Canlı Looper & Arpeggiator**: 4-Kanal Jest Kaydedici, WAV Kaydedici ve **.MID Standard MIDI Dosyası Dışa Aktarıcı**.
5. **🌌 3D Görsel Mekan & WebMIDI Output/Input**: Sese duyarlı ortamlar, Ableton Live / FL Studio WebMIDI çıkışı ve USB MIDI klavye girdisi.
6. **🎹 25-Key Canlı Görsel Piyano Klavyesi**: Çalınan notaları ve akorları anlık olarak ışıklandıran stüdyo klavye visualizer'ı.

---

### 🖐️ Sol El & Klavye: Akor Jest Matrisi
| Parmak / Tuş | Akor Tipi | Frekans ve Tonal Yapı |
| :--- | :--- | :--- |
| **☝️ 1 / Tuş '1'** | Solo Lead / Root | Middle C4 Solo Lead |
| **✌️ 2 / Tuş '2'** | Majör Triad | Saf Majör Akor (C4 - E4 - G4) |
| **🤟 3 / Tuş '3'** | Minör Triad | Saf Minör Akor (C4 - Eb4 - G4) |
| **🖖 4 / Tuş '4'** | 7'li Akor | Caz / Pop 7th (C4 - E4 - G4 - Bb4) |
| **🖐️ 5 / Tuş '5'** | Ambient Pad 9th | Zengin Ambient Pad (C4 - G4 - C5 - D5) |
| **✊ Yumruk / '0'** | Mute | Sessiz Mod (Sustur) |

### 🎛️ Sağ El: 3D Expression Kontrolleri
* **Y-Aksı (Dikey)**: Cutoff Filtresi Frekansı ($800\text{ Hz} \rightarrow 12.000\text{ Hz}$) (MIDI CC #74).
* **X-Aksı (Yatay)**: Stereo Pan Oranı ($L \leftrightarrow R$) (MIDI CC #10).
* **Z-Aksı (Derinlik)**: 3D Delay ve Reverb Süresi.
* **Pinch (Cımbız Jest)**: Reverb Miktarı (MIDI CC #91).

---

### 🎹 12 Dahili Enstrüman Preseti
* 🎻 **Violin**: Stradivarius Yaylı Orkestra
* 🌌 **CS-80**: Blade Runner Vangelis Synth Brass
* 🎹 **Rhodes**: Fender Rhodes Elektrik Piyano
* 🎸 **Guitar**: Akustik & Overdrive Pluck
* 🎺 **Brass**: Moog Synth Üflemeli Katmanı
* 🔮 **Choir**: Formant Vokal Gregorian Koro
* 🎹 **Organ**: Hammond B3 Drawbar Stüdyo Organı
* 🪵 **Marimba**: Ahşap Vurmalı Tokmak
* 🪈 **Flute**: Orkestral Gümüş Yan Flüt
* 🌃 **Synthwave**: 80'ler Cyberpunk Sawtooth Lead
* 🝢 **Harp**: Göksel Konser Arpı
* 🔊 **808 Bass**: 50Hz Derin Sub Sentez

---

### ⌨️ Klavye Kısayolları & QWERTY Çalma
* **`1` - `5` / `0`**: Sol el akor jestlerini doğrudan klavyeden tetikle.
* **`A` - `K`**: C4'ten C5'e kromatik tekli piyano notaları çal (A:Do, W:Do#, S:Re, E:Re#, D:Mi, F:Fa, T:Fa#, G:Sol, Y:Sol#, H:La, U:La#, J:Si, K:Do).
* **`S`**: Sustain Pedal Modunu Aç / Kapat.
* **`H`**: Sinema Modu (Arayüzü Gizle / Göster).
* **`M`**: 3D Görsel Atmosfer Değiştir (Warp $\rightarrow$ Polygons $\rightarrow$ Aurora $\rightarrow$ Burst).
* **`C`**: Kaos Modu (Jeneratif Renk & Geometri Mutasyonu).

---

## 🇬🇧 ENGLISH USER MANUAL & TECHNICAL SPECIFICATIONS

### 🎛️ Architecture Overview
AuraSynth Pro VST3 is a standalone gestural digital synthesizer that bridges computer vision hand tracking with a low-latency Web Audio API synthesis engine. The signal flow is structured into 4 hardware-inspired modular rack tabs:

1. **🎛️ Synthesis & Chord Matrix**: 12 Tonal Presets, Scale Selectors (Major, Minor, Pentatonic, Oriental, Dorian), and Octave Transposition.
2. **🎚️ Studio 3-Band Parametric EQ**: Low-Shelf (100Hz), Peaking Mid (1kHz), and High-Shelf (8kHz) parametric equalizers.
3. **🔁 Live Looper & Arpeggiator**: 4-Channel Live Gesture Looper, Internal Metronome (BPM), and Directional Arpeggiator.
4. **🌌 3D Visual Environment & WebMIDI Out**: Audio-reactive procedural backgrounds and WebMIDI driver for external DAWs (Ableton Live, FL Studio, Logic Pro).

---

### 🖐️ Left Hand: Chord Gesture Matrix
| Finger Count | Chord Designation | Harmonic Pitch Mapping |
| :--- | :--- | :--- |
| **☝️ 1 Finger** | Solo Lead / Root | Middle C4 Solo Lead |
| **✌️ 2 Fingers** | Major Triad | Pure Major Triad (C4 - E4 - G4) |
| **🤟 3 Fingers** | Minor Triad | Pure Minor Triad (C4 - Eb4 - G4) |
| **🖖 4 Fingers** | 7th Chord | Jazz / Pop 7th (C4 - E4 - G4 - Bb4) |
| **🖐️ 5 Fingers** | Ambient Pad 9th | Rich Ambient Pad (C4 - G4 - C5 - D5) |
| **✊ Closed Fist** | Mute | Silent Output |

### 🎛️ Right Hand: 3D Expression Control
* **Y-Axis (Vertical)**: Cutoff Filter Frequency ($800\text{ Hz} \rightarrow 12,000\text{ Hz}$) (MIDI CC #74).
* **X-Axis (Horizontal)**: Stereo Panning ($L \leftrightarrow R$) (MIDI CC #10).
* **Z-Axis (Depth)**: 3D Delay & Reverb Time.
* **Pinch Gesture**: Reverb Wet Amount (MIDI CC #91).

---

### 🎹 12 Built-in Instrument Presets
* 🎻 **Violin**: Stradivarius Bowed String Ensemble
* 🌌 **CS-80**: Blade Runner Vangelis Synth Brass
* 🎹 **Rhodes**: Fender Rhodes Electric Piano
* 🎸 **Guitar**: Acoustic & Overdriven Pluck
* 🎺 **Brass**: Moog Synthesizer Brass Stack
* 🔮 **Choir**: Formant Vocal Gregorian Choir
* 🎹 **Organ**: Hammond B3 Drawbar Organ
* 🪵 **Marimba**: Wooden Percussive Mallet
* 🪈 **Flute**: Orchestral Silver Flute
* 🌃 **Synthwave**: 80s Cyberpunk Sawtooth Lead
* 🝢 **Harp**: Celestial Concert Harp
* 🔊 **808 Bass**: 50Hz Deep Sub Bass Synth

---

### ⌨️ Keyboard Shortcuts
* **`H`**: Cinema Mode (Toggle Interface Visibility)
* **`M`**: Cycle 3D Environments (Warp $\rightarrow$ Polygons $\rightarrow$ Aurora $\rightarrow$ Burst)
* **`C`**: Chaos Mode (Generative Palette & Geometry Mutation)

---

## 🚀 LOCAL SETUP / KURULUM

```bash
# Clone or navigate to the repository
cd c:\Users\MONSTER\Desktop\Music_With_MY_Hand

# Launch local HTTP server
python -m http.server 8080

# Open in tarayıcı / browser
# http://localhost:8080
```

---

## 📄 LICENSE & CREDITS

- **Development**: Advanced Agentic Coding Team
- **Core Engine**: Web Audio API, MediaPipe Vision, WebMIDI API.
- **Copyright**: © 2026 AuraSynth Audio Technologies. All rights reserved.
