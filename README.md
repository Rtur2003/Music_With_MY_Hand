# AuraSynth Pro v13.0 🎼✨

> **Hand-Tracking Music Synthesizer & Classical Orchestra Conductor for the Browser**

AuraSynth Pro is a web application that transforms your standard webcam into a full musical instrument and orchestra conducting interface. It runs entirely in your browser using **MediaPipe** AI hand tracking and the **Tone.js** Web Audio engine.

---

## 🌟 Features

### 1. 🎹 Gesture Synthesizer Mode
- **Two-Hand Control**:
  - **Left Hand (Harmony)**: Select scale degrees (I, ii, iii, IV, V, vi, vii°) with finger counts. Tilt wrist left for **Minor mode**, tilt right for **Major mode**.
  - **Right Hand (Expression)**: Control chord complexity (Triad, 1st Inversion, 7th, 9th) with finger counts. Raise/lower hand for **Volume**, tilt wrist for **Filter Tone Sweep**.
- **Tone.js PolySynth Engine**: Rich `fatsawtooth` synthesizers with customizable ADSR envelopes and lowpass filter sweeps (no clicks or audio popping).
- **Arpeggiator**: Harp-like sequential note sweeps with Slow, Normal, and Fast speeds.
- **Auto-Bass Generator**: Sub-bass root notes that follow your chord progressions automatically.
- **15-Second Social Clip Recorder**: Capture performances directly as WebM video/audio clips ready for TikTok, Instagram Reels, or YouTube Shorts.
- **MIDI Export**: Export your recorded performances as standard `.mid` files to load into any DAW (Ableton, Logic, FL Studio).

### 2. 🎼 Orchestra Conductor Mode
- **Conduct Classical Symphonies**:
  - **Right Hand**: Conduct the tempo (BPM) with vertical beat movements. Downbeats trigger measure steps.
  - **Left Hand Height**: Control dynamics from *pianissimo* ($pp$) to *fortissimo* ($ff$).
  - **Left Hand Position**: Focus sound on individual orchestra sections (**Strings**, **Woodwinds**, **Brass**, **Percussion**).
  - **Hand Spread**: Spread hands apart for **Crescendo**, bring together for **Diminuendo**.
- **Interactive Seating Visualizer**: Real-time orchestra seating arc that lights up and pulses on downbeats.
- **Pre-Loaded Classical Pieces**:
  - Ludwig van Beethoven — *Symphony No. 5 (Fate Motif)*
  - Antonio Vivaldi — *The Four Seasons (Spring)*
  - Antonín Dvořák — *Symphony No. 9 (New World)*

---

## 🚀 Quick Start (Local Development)

### Requirements
- Node.js 18+ and npm
- Computer with webcam
- Modern browser (Chrome or Edge recommended)

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 📦 Build & Deployment Kılavuzu

### Static Build Ulaşımı

Proje **%100 client-side** olduğu için backend gerektirmez. Herhangi bir statik sunucuda çalışır.

```bash
# Production build üretme
npm run build
```

Bu komut `dist/` klasörüne statik HTML, JS ve CSS dosyalarını çıkarır.

---

### 🌐 1. Cloudflare Pages'e Dağıtım

1. [Cloudflare Dashboard](https://dash.cloudflare.com)'a giriş yapın.
2. **Workers & Pages** bölümüne gidin → **Create application** → **Pages** → **Connect to Git**.
3. `Music_With_MY_Hand` reponuzu seçin.
4. **Build settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Save and Deploy** butonuna tıklayın. Siteniz saniyeler içinde yayına girecektir!

---

### 🤗 2. Hugging Face Spaces'e Dağıtım

1. [Hugging Face Spaces](https://huggingface.co/new-space)'e gidin.
2. Space adını girin (ör. `aurasynth-pro`).
3. **SDK**: Select **Static** (veya HTML).
4. Repo kurulduktan sonra:
   - `npm run build` komutunu bilgisayarınızda çalıştırın.
   - `dist/` klasörünün içindeki **tüm dosyaları ve klasörleri** Hugging Face Space repository'nizin kök dizinine yükleyin (git push veya web upload ile).
5. Space'iniz otomatik olarak açılacak ve webcam izni ile çalışacaktır!

---

## 🛠️ Teknoloji Yığını (Stack)

- **Frontend**: Vite + React 19 + TypeScript
- **Audio Engine**: Tone.js (PolySynth, Filter, Reverb, MonoSynth, Pattern)
- **Computer Vision**: Google MediaPipe Tasks-Vision (`@mediapipe/tasks-vision`)
- **Recording**: MediaRecorder WebM API
- **Styling**: Vanilla CSS + Glassmorphism UI tokens

---

## 📄 Lisans

MIT License © 2026 AuraSynth Pro Project.
