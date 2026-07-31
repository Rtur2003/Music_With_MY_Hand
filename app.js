/**
 * ============================================================================
 * AURASYNTH PRO VST3 ULTIMATE - DISTINCT 12 PRESET SOUND ENGINES (v12.0)
 * ============================================================================
 * Features:
 *  1. 12 Unmistakable Preset Timbre Profiles (Unique Harmonics + ADSR + Filter Cutoffs)
 *  2. Instant Audio Engine Re-trigger on Preset Change
 *  3. Dynamic ADSR Envelope Generator (Attack, Decay, Sustain, Release)
 *  4. Dual-Oscillator Stereo Chorus Detune Layer
 *  5. Camera Out-Of-Frame Sustain Pedal Hold Mode
 * ============================================================================
 */

// Global Audio Architecture
let audioCtx = null;
let masterGain = null;
let peakLimiterNode = null;
let stereoPanner = null;
let filterNode = null;

// 3-Band Parametric EQ Nodes
let eqBassNode = null;
let eqMidNode = null;
let eqTrebleNode = null;

let delayNode = null;
let delayFeedback = null;
let delayGain = null;
let subOscGain = null;
let analyserNode = null;

// Dynamic ADSR Envelope Parameters
let adsrParams = {
    attack: 0.04,
    decay: 0.12,
    sustain: 0.75,
    release: 0.18
};

// Camera Out-Of-Frame Sustain Hold Pedal Mode
let isSustainPedalOn = false;

// Spectral Freeze State
let isSpectralFrozen = false;

// Scope Mode State
let scopeMode = "wave";

// GENERATIVE VISUAL SPECTACLE ENGINE STATE
let envTheme = "warp";
const ENV_THEMES_LIST = ["warp", "polygons", "aurora", "burst"];
let envThemeIndex = 0;

let isChaosArtMode = false;
let chaosHueOffset = 0;
let polygonRotationAngle = 0;

let bgStars = [];
let bgParticles = [];
let bgShockwaves = [];
const NUM_WARP_STARS = 150;
const NUM_BG_PARTICLES = 80;

// Immersion Cinema Mode State
let isImmersionMode = false;

// Non-blocking Camera Frame Guard
let isProcessingFrame = false;

// Metronome Engine State
let isMetronomeActive = false;
let metronomeTimerId = null;

// MediaRecorder WAV Exporter
let mediaRecorder = null;
let recordedAudioChunks = [];
let isWavRecording = false;

// Live Gesture Looper Engine State
let isLoopRecording = false;
let isLoopPlaying = false;
let loopEvents = [];
let loopStartTime = 0;
let loopDuration = 0;
let loopTimerId = null;

// WebMIDI State
let midiAccess = null;
let selectedMidiOutput = null;
let lastActiveMidiNotes = [];

// Visual Piano Keyboard & Chorus Detune State
let chorusDetuneMultiplier = 1.0023;
let activePianoMidiNotes = new Set();
const PIANO_START_MIDI = 48; // C3
const PIANO_END_MIDI = 72;   // C5

const QWERTY_NOTE_MAP = {
    'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65,
    't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72
};

const QWERTY_CHORD_MAP = {
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '0': 0
};

// Audio & Scale State
let isAudioRunning = false;
let currentChordIndex = -1;
let currentPreset = "violin";
let currentKey = "C";
let currentScaleMode = "major";
let currentOctaveShift = 0;
let portamentoTime = 0.08;
let filterResonance = 1.0;

// Arpeggiator State
let arpMode = "off";
let arpBpm = 120;
let arpStepIndex = 0;
let nextArpNoteTime = 0;
let arpTimerId = null;

// Debouncing State (Strict 5-Frame Stability Guard)
let rawFingerHistory = [];
const DEBOUNCE_FRAMES = 5;
let stableFingerCount = 0;

// PeriodicWave Cache
const periodicWavesCache = {};
let activeVoices = [];

// Telemetry State
let leftFingersCount = 0;
let rightMetrics = {
    cutoffHz: 8000,
    vibratoDepth: 0,
    reverbWet: 0.1,
    panVal: 0,
    zDepth: 0.5,
    prevX: 0.5,
    prevY: 0.5,
    lastTime: Date.now()
};

// FPS Counter
let lastFrameTime = Date.now();
let fpsCount = 0;

// Transposition Mapping Tables
const KEY_OFFSETS = { "C": 0, "G": 7, "D": 2, "F": 5, "A": 9, "Bb": 10 };

// PURE MAIN CHORDS (Middle C4 Basis = MIDI 60)
const CHORD_STRUCTURES_SCALES = {
    major: {
        0: { name: "Mute", notesLabel: "Sessiz", intervals: [] },
        1: { name: "Solo Lead / Root", notesLabel: "Middle C (Solo)", intervals: [0, 12] },
        2: { name: "Majör Akor", notesLabel: "Root - Maj3 - P5", intervals: [0, 4, 7, 12] },
        3: { name: "Minör Akor", notesLabel: "Root - Min3 - P5", intervals: [0, 3, 7, 12] },
        4: { name: "7'li Akor (7th)", notesLabel: "Root - Maj3 - P5 - Min7", intervals: [0, 4, 7, 10] },
        5: { name: "Ambient Pad (9th)", notesLabel: "Root - P5 - Oct - Maj9", intervals: [0, 7, 12, 14] }
    },
    pentatonic: {
        0: { name: "Mute", notesLabel: "Sessiz", intervals: [] },
        1: { name: "Pentatonik Solo", notesLabel: "Root - Octave", intervals: [0, 12] },
        2: { name: "Penta Triad", notesLabel: "Root - Maj2 - P5", intervals: [0, 2, 7, 12] },
        3: { name: "Penta Minor", notesLabel: "Root - Min3 - P5", intervals: [0, 3, 7, 12] },
        4: { name: "Penta 7th", notesLabel: "Root - Min3 - P5 - Min7", intervals: [0, 3, 7, 10] },
        5: { name: "Penta Harmony", notesLabel: "Root - Maj2 - P4 - P5 - Oct", intervals: [0, 2, 5, 7, 12] }
    },
    oriental: {
        0: { name: "Mute", notesLabel: "Sessiz", intervals: [] },
        1: { name: "Hicaz Solo", notesLabel: "Kök Nota (Hicaz)", intervals: [0, 12] },
        2: { name: "Hicaz Triad", notesLabel: "Root - Min2 - Maj3 - P5", intervals: [0, 1, 4, 7] },
        3: { name: "Hicaz Saz Pad", notesLabel: "Root - Maj3 - P5", intervals: [0, 4, 7, 12] },
        4: { name: "Hicaz 7'li", notesLabel: "Root - Min2 - Maj3 - Min7", intervals: [0, 1, 4, 10] },
        5: { name: "Makamsal Pad", notesLabel: "Root - Min2 - P5 - Oct", intervals: [0, 1, 7, 12, 13] }
    },
    dorian: {
        0: { name: "Mute", notesLabel: "Sessiz", intervals: [] },
        1: { name: "Dorian Lead", notesLabel: "Dorian Root", intervals: [0, 12] },
        2: { name: "Dorian Min6", notesLabel: "Root - Min3 - P5 - Maj6", intervals: [0, 3, 7, 9] },
        3: { name: "Dorian Triad", notesLabel: "Root - Min3 - P5", intervals: [0, 3, 7, 12] },
        4: { name: "Dorian 7th", notesLabel: "Root - Min3 - P5 - Min7", intervals: [0, 3, 7, 10] },
        5: { name: "Dorian Fusion Pad", notesLabel: "Root - P4 - Maj6 - Oct", intervals: [0, 5, 9, 12] }
    }
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 12 DISTINCT INSTRUMENT PROFILES (Harmonics + ADSR + Filter Cutoff Preset Default)
const PRESET_PROFILES = {
    violin: {
        harmonics: [0, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
        adsr: { attack: 0.12, decay: 0.25, sustain: 0.85, release: 0.25 },
        cutoffHz: 8000
    },
    cs80: {
        harmonics: [0, 1.0, 0.2, 0.8, 0.1, 0.6, 0.05, 0.4],
        adsr: { attack: 0.08, decay: 0.30, sustain: 0.75, release: 0.35 },
        cutoffHz: 5500
    },
    rhodes: {
        harmonics: [0, 1.0, 0.0, 0.4, 0.0, 0.1],
        adsr: { attack: 0.01, decay: 0.40, sustain: 0.40, release: 0.20 },
        cutoffHz: 3800
    },
    guitar: {
        harmonics: [0, 1.0, 0.8, 0.1, 0.4, 0.05, 0.2],
        adsr: { attack: 0.01, decay: 0.28, sustain: 0.30, release: 0.15 },
        cutoffHz: 6500
    },
    brass: {
        harmonics: [0, 1.0, 0.0, 0.9, 0.0, 0.7, 0.0, 0.5, 0.0, 0.3],
        adsr: { attack: 0.04, decay: 0.20, sustain: 0.80, release: 0.18 },
        cutoffHz: 4500
    },
    choir: {
        harmonics: [0, 0.2, 1.0, 0.1, 0.8, 0.05, 0.6],
        adsr: { attack: 0.25, decay: 0.40, sustain: 0.90, release: 0.45 },
        cutoffHz: 4800
    },
    organ: {
        harmonics: [0, 1.0, 1.0, 1.0, 1.0, 0.8, 0.8, 0.6, 0.6],
        adsr: { attack: 0.005, decay: 0.05, sustain: 1.0, release: 0.08 },
        cutoffHz: 11000
    },
    marimba: {
        harmonics: [0, 1.0, 0.05, 0.0, 0.3, 0.0, 0.0],
        adsr: { attack: 0.005, decay: 0.18, sustain: 0.10, release: 0.10 },
        cutoffHz: 3200
    },
    flute: {
        harmonics: [0, 1.0, 0.1, 0.02, 0.01],
        adsr: { attack: 0.14, decay: 0.20, sustain: 0.80, release: 0.20 },
        cutoffHz: 2800
    },
    synthwave: {
        harmonics: [0, 1.0, 1.0, 0.9, 0.9, 0.8, 0.8, 0.7, 0.7],
        adsr: { attack: 0.02, decay: 0.20, sustain: 0.75, release: 0.22 },
        cutoffHz: 12000
    },
    harp: {
        harmonics: [0, 1.0, 0.7, 0.0, 0.3, 0.0, 0.1],
        adsr: { attack: 0.008, decay: 0.35, sustain: 0.25, release: 0.25 },
        cutoffHz: 7500
    },
    subbass: {
        harmonics: [0, 1.0, 0.3],
        adsr: { attack: 0.02, decay: 0.30, sustain: 0.85, release: 0.20 },
        cutoffHz: 500
    }
};

// ============================================================================
// 1. WEBMIDI INTEGRATION
// ============================================================================
function initWebMIDI() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(access => {
            midiAccess = access;
            populateMidiOutputs();
            midiAccess.onstatechange = () => populateMidiOutputs();
        }, err => {
            console.log("[MIDI] WebMIDI Access Denied.");
        });
    }
}

function populateMidiOutputs() {
    const select = document.getElementById("midi-select");
    if (!select) return;
    select.innerHTML = '<option value="none" selected>Sanal Dahili Synthesizer</option>';
    if (!midiAccess) return;

    const outputs = Array.from(midiAccess.outputs.values());
    outputs.forEach((output) => {
        const opt = document.createElement("option");
        opt.value = output.id;
        opt.textContent = `🔌 ${output.name}`;
        select.appendChild(opt);
    });

    if (outputs.length > 0) {
        const bar = document.getElementById("midi-status-bar");
        if (bar) bar.textContent = `MIDI: ${outputs.length} Cihaz Bağlı (DAW Out Ready)`;
    }
}

function sendMidiCC(ccNumber, value7bit) {
    if (selectedMidiOutput) {
        selectedMidiOutput.send([0xB0, ccNumber, Math.max(0, Math.min(127, value7bit))]);
    }
}

function sendMidiChordNotes(midiMidiNotes) {
    if (!selectedMidiOutput) return;
    lastActiveMidiNotes.forEach(note => selectedMidiOutput.send([0x80, note, 0]));
    lastActiveMidiNotes = [];
    midiMidiNotes.forEach(note => {
        selectedMidiOutput.send([0x90, note, 96]);
        lastActiveMidiNotes.push(note);
    });
}

// ============================================================================
// 2. IMMERSION MODE & SUSTAIN PEDAL ENGINE
// ============================================================================
function toggleSustainPedal() {
    isSustainPedalOn = !isSustainPedalOn;
    const btn = document.getElementById("btn-sustain-pedal");
    if (isSustainPedalOn) {
        if (btn) {
            btn.classList.add("active");
            btn.textContent = "🦶 SUSTAIN (ON)";
        }
    } else {
        if (btn) {
            btn.classList.remove("active");
            btn.textContent = "🦶 SUSTAIN (OFF)";
        }
    }
}

function toggleImmersionMode() {
    isImmersionMode = !isImmersionMode;
    const rackContainer = document.getElementById("vst-rack-container");
    const immersionHud = document.getElementById("immersion-hud");

    if (isImmersionMode) {
        if (rackContainer) rackContainer.classList.add("hidden-ui");
        if (immersionHud) immersionHud.classList.remove("hidden");
    } else {
        if (rackContainer) rackContainer.classList.remove("hidden-ui");
        if (immersionHud) immersionHud.classList.add("hidden");
    }
}

function cycleNextEnvironment() {
    envThemeIndex = (envThemeIndex + 1) % ENV_THEMES_LIST.length;
    envTheme = ENV_THEMES_LIST[envThemeIndex];

    const envSelect = document.getElementById("env-theme-select");
    if (envSelect) envSelect.value = envTheme;

    const themeNames = {
        warp: "🌌 Quantum 3D Warp",
        polygons: "🔮 Crystalline Polygons",
        aurora: "⚡ Neon Laser Aurora",
        burst: "💥 Particle Fireworks"
    };

    const nextBtn = document.getElementById("btn-next-env-gesture");
    if (nextBtn) nextBtn.textContent = `🌌 MEKAN: ${themeNames[envTheme]}`;

    console.log(`[GENERATIVE VISUAL] Switched to: ${envTheme}`);
}

function toggleChaosArtMode() {
    isChaosArtMode = !isChaosArtMode;
    const btn = document.getElementById("btn-next-env-gesture");
    if (isChaosArtMode) {
        if (btn) btn.textContent = "🎲 CHAOS ART (ACTIVE)";
    } else {
        cycleNextEnvironment();
    }
}

// ============================================================================
// 3. PRISTINE AUDIO ENGINE & BRICKWALL PEAK LIMITER INIT
// ============================================================================
function getOrCreateWavetable(presetKey) {
    if (periodicWavesCache[presetKey]) return periodicWavesCache[presetKey];

    const profile = PRESET_PROFILES[presetKey] || PRESET_PROFILES.violin;
    const harmonics = profile.harmonics;
    const real = new Float32Array(harmonics.length);
    const imag = new Float32Array(harmonics.length);

    harmonics.forEach((amp, idx) => {
        real[idx] = 0;
        imag[idx] = amp;
    });

    const wave = audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
    periodicWavesCache[presetKey] = wave;
    return wave;
}

function switchInstrumentPreset(newPresetKey) {
    currentPreset = newPresetKey;
    const profile = PRESET_PROFILES[currentPreset] || PRESET_PROFILES.violin;

    // Apply preset ADSR & Filter Defaults
    adsrParams = { ...profile.adsr };
    if (filterNode && audioCtx) {
        filterNode.frequency.setTargetAtTime(profile.cutoffHz, audioCtx.currentTime, 0.05);
        rightMetrics.cutoffHz = profile.cutoffHz;
    }

    // Update UI Sliders
    if (document.getElementById("slider-adsr-attack")) {
        document.getElementById("slider-adsr-attack").value = adsrParams.attack;
        document.getElementById("val-adsr-attack").textContent = `${Math.round(adsrParams.attack * 1000)} ms`;
    }
    if (document.getElementById("slider-adsr-decay")) {
        document.getElementById("slider-adsr-decay").value = adsrParams.decay;
        document.getElementById("val-adsr-decay").textContent = `${Math.round(adsrParams.decay * 1000)} ms`;
    }
    if (document.getElementById("slider-adsr-sustain")) {
        document.getElementById("slider-adsr-sustain").value = adsrParams.sustain;
        document.getElementById("val-adsr-sustain").textContent = `${Math.round(adsrParams.sustain * 100)} %`;
    }
    if (document.getElementById("slider-adsr-release")) {
        document.getElementById("slider-adsr-release").value = adsrParams.release;
        document.getElementById("val-adsr-release").textContent = `${Math.round(adsrParams.release * 1000)} ms`;
    }

    console.log(`[PRESET SWITCH] Switched to ${currentPreset}: Cutoff=${profile.cutoffHz}Hz, ADSR=`, adsrParams);

    if (audioCtx && isAudioRunning) {
        const newWave = getOrCreateWavetable(currentPreset);
        activeVoices.forEach(voice => {
            if (voice.oscillators) {
                voice.oscillators.forEach(osc => {
                    try { osc.setPeriodicWave(newWave); } catch(e){}
                });
            }
        });

        // Instant Re-trigger of active chord with new preset sound
        if (currentChordIndex >= 0) {
            const idx = currentChordIndex;
            currentChordIndex = -1;
            triggerChordTransition(idx);
        }
    }
}

function initAudioEngine() {
    if (audioCtx) {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.75, audioCtx.currentTime);

    peakLimiterNode = audioCtx.createDynamicsCompressor();
    peakLimiterNode.threshold.setValueAtTime(-2.0, audioCtx.currentTime);
    peakLimiterNode.knee.setValueAtTime(0.0, audioCtx.currentTime);
    peakLimiterNode.ratio.setValueAtTime(20.0, audioCtx.currentTime);
    peakLimiterNode.attack.setValueAtTime(0.001, audioCtx.currentTime);
    peakLimiterNode.release.setValueAtTime(0.05, audioCtx.currentTime);

    stereoPanner = audioCtx.createStereoPanner
        ? audioCtx.createStereoPanner()
        : audioCtx.createPanner();

    if (stereoPanner.pan) {
        stereoPanner.pan.setValueAtTime(0, audioCtx.currentTime);
    }

    eqBassNode = audioCtx.createBiquadFilter();
    eqBassNode.type = "lowshelf";
    eqBassNode.frequency.setValueAtTime(100, audioCtx.currentTime);
    eqBassNode.gain.setValueAtTime(0, audioCtx.currentTime);

    eqMidNode = audioCtx.createBiquadFilter();
    eqMidNode.type = "peaking";
    eqMidNode.frequency.setValueAtTime(1000, audioCtx.currentTime);
    eqMidNode.Q.setValueAtTime(1.0, audioCtx.currentTime);
    eqMidNode.gain.setValueAtTime(0, audioCtx.currentTime);

    eqTrebleNode = audioCtx.createBiquadFilter();
    eqTrebleNode.type = "highshelf";
    eqTrebleNode.frequency.setValueAtTime(8000, audioCtx.currentTime);
    eqTrebleNode.gain.setValueAtTime(0, audioCtx.currentTime);

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(8000, audioCtx.currentTime);
    filterNode.Q.setValueAtTime(1.0, audioCtx.currentTime);

    subOscGain = audioCtx.createGain();
    subOscGain.gain.setValueAtTime(0.05, audioCtx.currentTime);

    delayNode = audioCtx.createDelay();
    delayNode.delayTime.setValueAtTime(0.20, audioCtx.currentTime);

    delayFeedback = audioCtx.createGain();
    delayFeedback.gain.setValueAtTime(0.2, audioCtx.currentTime);

    delayGain = audioCtx.createGain();
    delayGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 512;

    filterNode.connect(eqBassNode);
    eqBassNode.connect(eqMidNode);
    eqMidNode.connect(eqTrebleNode);
    eqTrebleNode.connect(stereoPanner);

    subOscGain.connect(stereoPanner);
    stereoPanner.connect(masterGain);
    masterGain.connect(peakLimiterNode);
    peakLimiterNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    filterNode.connect(delayNode);
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(masterGain);

    isAudioRunning = true;

    document.getElementById("vst-power-led").classList.add("active");
    const powerBtn = document.getElementById("btn-start-audio");
    if (powerBtn) {
        powerBtn.style.opacity = "0.85";
        powerBtn.innerHTML = "🟢 AKTİF (ONLINE)";
    }

    startArpeggiatorScheduler();
    startVisualizer();
    initBackgroundEnvironmentEngine();
    console.log("[AuraSynth PRO] Audio Engine Active.");
}

function midiToFreq(midi) {
    return 440.0 * Math.pow(2.0, (midi - 69) / 12.0);
}

function midiToNoteName(midi) {
    const name = NOTE_NAMES[midi % 12];
    const oct = Math.floor(midi / 12) - 1;
    return `${name}${oct}`;
}

function getTransposedChord(fingerCount) {
    const scaleDict = CHORD_STRUCTURES_SCALES[currentScaleMode] || CHORD_STRUCTURES_SCALES.major;
    const chordInfo = scaleDict[fingerCount] || scaleDict[0];

    if (!chordInfo.intervals || chordInfo.intervals.length === 0) {
        return { name: "Mute / Sessiz", notes: [], freqs: [], midiNotes: [] };
    }

    const keyOffset = KEY_OFFSETS[currentKey] || 0;
    const baseMidi = 60 + keyOffset + (currentOctaveShift * 12);

    const freqs = [];
    const notes = [];
    const midiNotes = [];

    chordInfo.intervals.forEach(interval => {
        const midi = baseMidi + interval;
        freqs.push(midiToFreq(midi));
        notes.push(midiToNoteName(midi));
        midiNotes.push(midi);
    });

    const rootNoteName = midiToNoteName(baseMidi);
    const fullName = `${rootNoteName} ${chordInfo.name}`;

    return { name: fullName, notes: notes, freqs: freqs, midiNotes: midiNotes };
}

// SPECTRAL FREEZE ENGINE
function toggleSpectralFreeze() {
    isSpectralFrozen = !isSpectralFrozen;
    const btn = document.getElementById("btn-freeze-toggle");
    if (isSpectralFrozen) {
        if (btn) {
            btn.classList.add("frozen");
            btn.textContent = "❄️ FROZEN (ACTIVE)";
        }
    } else {
        if (btn) {
            btn.classList.remove("frozen");
            btn.textContent = "❄️ FREEZE";
        }
    }
}

// PRESET SAVE / LOAD ENGINE
function savePresetToStorage() {
    const presetData = {
        preset: currentPreset,
        key: currentKey,
        scale: currentScaleMode,
        octave: currentOctaveShift,
        glide: portamentoTime,
        bpm: arpBpm,
        arpMode: arpMode,
        envTheme: envTheme,
        adsr: adsrParams,
        eqBass: document.getElementById("slider-eq-bass") ? document.getElementById("slider-eq-bass").value : 0,
        eqMid: document.getElementById("slider-eq-mid") ? document.getElementById("slider-eq-mid").value : 0,
        eqTreble: document.getElementById("slider-eq-treble") ? document.getElementById("slider-eq-treble").value : 0
    };
    localStorage.setItem("aurasynth_preset", JSON.stringify(presetData));
    
    const blob = new Blob([JSON.stringify(presetData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AuraSynth_Patch_${currentPreset}_${Date.now()}.json`;
    a.click();
}

function loadPresetFromStorage() {
    const saved = localStorage.getItem("aurasynth_preset");
    if (saved) {
        const data = JSON.parse(saved);
        switchInstrumentPreset(data.preset || "violin");
        currentKey = data.key || "C";
        currentScaleMode = data.scale || "major";
        currentOctaveShift = data.octave || 0;
        portamentoTime = data.glide || 0.08;
        arpBpm = data.bpm || 120;
        arpMode = data.arpMode || "off";
        envTheme = data.envTheme || "warp";
        if (data.adsr) adsrParams = data.adsr;

        const selDropdown = document.getElementById("preset-select-dropdown");
        if (selDropdown) selDropdown.value = currentPreset;

        if (document.getElementById("key-select")) document.getElementById("key-select").value = currentKey;
        if (document.getElementById("scale-mode-select")) document.getElementById("scale-mode-select").value = currentScaleMode;
        if (document.getElementById("octave-select")) document.getElementById("octave-select").value = currentOctaveShift;

        console.log("[PRESET STORAGE] Loaded.");
    }
}

// ============================================================================
// 4. MAIN CHORD TRANSITION ENGINE (DUAL-OSC CHORUS & ADSR)
// ============================================================================
function triggerChordTransition(fingerCount) {
    if (!audioCtx) return;

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    if (!isAudioRunning) return;

    if (isLoopRecording) {
        const timeOffset = audioCtx.currentTime - loopStartTime;
        loopEvents.push({ timeOffset: timeOffset, fingerCount: fingerCount });
    }

    if (isSpectralFrozen) return;

    if (currentChordIndex === fingerCount) return;

    currentChordIndex = fingerCount;
    const chordData = getTransposedChord(fingerCount);
    const now = audioCtx.currentTime;

    updateChordUI(fingerCount, chordData);
    sendMidiChordNotes(chordData.midiNotes);

    if (fingerCount > 0) {
        bgShockwaves.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: 10,
            maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.7,
            alpha: 1.0
        });

        if (isChaosArtMode) {
            chaosHueOffset = Math.random() * 360;
        }
    }

    if (chordData.freqs.length === 0) {
        activeVoices.forEach(voice => {
            voice.gain.gain.cancelScheduledValues(now);
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
            voice.gain.gain.linearRampToValueAtTime(0.0001, now + adsrParams.release);
            setTimeout(() => voice.stop(), adsrParams.release * 1000 + 40);
        });
        activeVoices = [];
        return;
    }

    if (arpMode !== "off") return;

    const targetFreqs = chordData.freqs;
    const numVoicesNeeded = targetFreqs.length;

    while (activeVoices.length > numVoicesNeeded) {
        const oldVoice = activeVoices.pop();
        oldVoice.gain.gain.cancelScheduledValues(now);
        oldVoice.gain.gain.setValueAtTime(oldVoice.gain.gain.value, now);
        oldVoice.gain.gain.linearRampToValueAtTime(0.0001, now + adsrParams.release);
        setTimeout(() => oldVoice.stop(), adsrParams.release * 1000 + 40);
    }

    const customWave = getOrCreateWavetable(currentPreset);

    targetFreqs.forEach((freq, idx) => {
        if (idx < activeVoices.length) {
            const voice = activeVoices[idx];
            voice.oscillators.forEach((osc, i) => {
                const detuneMult = i === 1 ? 1.0023 : 1.0;
                osc.frequency.setTargetAtTime(freq * detuneMult, now, portamentoTime);
            });
            voice.gain.gain.cancelScheduledValues(now);
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
            voice.gain.gain.linearRampToValueAtTime((0.25 * adsrParams.sustain) / numVoicesNeeded, now + adsrParams.attack);
        } else {
            const voiceGain = audioCtx.createGain();
            const peakGainVal = 0.25 / numVoicesNeeded;
            const sustainGainVal = (0.25 * adsrParams.sustain) / numVoicesNeeded;

            voiceGain.gain.setValueAtTime(0.0001, now);
            voiceGain.gain.linearRampToValueAtTime(peakGainVal, now + adsrParams.attack);
            voiceGain.gain.linearRampToValueAtTime(sustainGainVal, now + adsrParams.attack + adsrParams.decay);

            const osc1 = audioCtx.createOscillator();
            osc1.setPeriodicWave(customWave);
            osc1.frequency.setValueAtTime(freq, now);

            const osc2 = audioCtx.createOscillator();
            osc2.setPeriodicWave(customWave);
            osc2.frequency.setValueAtTime(freq * 1.0023, now);

            osc1.connect(voiceGain);
            osc2.connect(voiceGain);
            osc1.start(now);
            osc2.start(now);

            voiceGain.connect(filterNode);

            activeVoices.push({
                gain: voiceGain,
                oscillators: [osc1, osc2],
                stop: function() {
                    try {
                        osc1.stop(); osc1.disconnect();
                        osc2.stop(); osc2.disconnect();
                    } catch(e){}
                    voiceGain.disconnect();
                }
            });
        }
    });
}

function updateChordUI(fingerCount, chordData) {
    const nameEl = document.getElementById("ro-chord-name");
    if (nameEl) nameEl.textContent = chordData.name;
    const listEl = document.getElementById("ro-notes-list");
    if (listEl) listEl.textContent = chordData.notes.length > 0 ? chordData.notes.join(" - ") : "---";

    const immersionBadge = document.getElementById("immersion-chord-name");
    if (immersionBadge) immersionBadge.textContent = chordData.name;

    document.querySelectorAll(".chord-box").forEach(box => {
        const fingers = parseInt(box.getAttribute("data-fingers"));
        if (fingers === fingerCount) {
            box.classList.add("active");
        } else {
            box.classList.remove("active");
        }
    });
}

// METRONOME
function toggleMetronome() {
    if (!audioCtx || !isAudioRunning) return;
    const metroBtn = document.getElementById("btn-metro-toggle");

    isMetronomeActive = !isMetronomeActive;

    if (isMetronomeActive) {
        if (metroBtn) {
            metroBtn.classList.add("active");
            metroBtn.textContent = "🔔 ON";
        }
        startMetronomeLoop();
    } else {
        if (metroBtn) {
            metroBtn.classList.remove("active");
            metroBtn.textContent = "🔔 OFF";
        }
        if (metronomeTimerId) clearInterval(metronomeTimerId);
    }
}

function startMetronomeLoop() {
    if (metronomeTimerId) clearInterval(metronomeTimerId);
    const intervalMs = (60.0 / arpBpm) * 1000;
    metronomeTimerId = setInterval(() => {
        if (isMetronomeActive && audioCtx) {
            playClick(audioCtx.currentTime);
        }
    }, intervalMs);
}

function playClick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.setValueAtTime(1000, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.05);
}

// GESTURE LOOPER ENGINE
function toggleLoopRecording() {
    if (!audioCtx || !isAudioRunning) return;

    const recBtn = document.getElementById("btn-loop-rec");
    const statusText = document.getElementById("looper-status-text");

    if (!isLoopRecording) {
        isLoopRecording = true;
        isLoopPlaying = false;
        loopEvents = [];
        loopStartTime = audioCtx.currentTime;
        if (recBtn) {
            recBtn.classList.add("recording");
            recBtn.textContent = "⏺ KAYIT...";
        }
        if (statusText) statusText.textContent = "REC";
    } else {
        isLoopRecording = false;
        loopDuration = Math.max(0.5, audioCtx.currentTime - loopStartTime);
        if (recBtn) {
            recBtn.classList.remove("recording");
            recBtn.textContent = "⏺ KAYIT";
        }
        startLoopPlayback();
    }
}

function startLoopPlayback() {
    if (loopEvents.length === 0) return;

    isLoopPlaying = true;
    const playBtn = document.getElementById("btn-loop-play");
    const statusText = document.getElementById("looper-status-text");

    if (playBtn) playBtn.classList.add("playing");
    if (statusText) statusText.textContent = `PLAY (${loopDuration.toFixed(1)}s)`;

    if (loopTimerId) clearInterval(loopTimerId);

    function runLoopCycle() {
        if (!isLoopPlaying) return;
        loopEvents.forEach(evt => {
            setTimeout(() => {
                if (isLoopPlaying) {
                    triggerChordTransition(evt.fingerCount);
                }
            }, evt.timeOffset * 1000);
        });
    }

    runLoopCycle();
    loopTimerId = setInterval(() => {
        if (isLoopPlaying) runLoopCycle();
    }, loopDuration * 1000);
}

function clearLoop() {
    isLoopRecording = false;
    isLoopPlaying = false;
    loopEvents = [];
    if (loopTimerId) clearInterval(loopTimerId);

    const recBtn = document.getElementById("btn-loop-rec");
    const playBtn = document.getElementById("btn-loop-play");
    const statusText = document.getElementById("looper-status-text");

    if (recBtn) { recBtn.classList.remove("recording"); recBtn.textContent = "⏺ KAYIT"; }
    if (playBtn) playBtn.classList.remove("playing");
    if (statusText) statusText.textContent = "IDLE";
}

// LIVE WAV AUDIO RECORDING & EXPORT
function toggleWavRecording() {
    if (!audioCtx || !isAudioRunning) return;

    const wavBtn = document.getElementById("btn-rec-wav");

    if (!isWavRecording) {
        const streamDestination = audioCtx.createMediaStreamDestination();
        masterGain.connect(streamDestination);

        mediaRecorder = new MediaRecorder(streamDestination.stream);
        recordedAudioChunks = [];

        mediaRecorder.ondataavailable = (evt) => {
            if (evt.data.size > 0) recordedAudioChunks.push(evt.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedAudioChunks, { type: "audio/wav" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `AuraSynth_Performance_${Date.now()}.wav`;
            a.click();
        };

        mediaRecorder.start();
        isWavRecording = true;
        if (wavBtn) {
            wavBtn.textContent = "⏹️ BİTİR VE İNDİR";
            wavBtn.style.background = "var(--led-red)";
        }
    } else {
        if (mediaRecorder) mediaRecorder.stop();
        isWavRecording = false;
        if (wavBtn) {
            wavBtn.textContent = "🎙️ WAV KAYDET";
            wavBtn.style.background = "linear-gradient(180deg, #7928ca, #4a1380)";
        }
    }
}

// ARPEGGIATOR SCHEDULER
function startArpeggiatorScheduler() {
    if (arpTimerId) clearInterval(arpTimerId);

    arpTimerId = setInterval(() => {
        if (!audioCtx || !isAudioRunning || arpMode === "off" || currentChordIndex <= 0) return;

        const chordData = getTransposedChord(currentChordIndex);
        if (chordData.freqs.length === 0) return;

        const secondsPerBeat = 60.0 / arpBpm / 2.0;
        const now = audioCtx.currentTime;

        if (nextArpNoteTime < now + 0.1) {
            if (nextArpNoteTime < now) nextArpNoteTime = now;

            const freqs = chordData.freqs;
            let noteIdx = 0;

            if (arpMode === "up") {
                noteIdx = arpStepIndex % freqs.length;
            } else if (arpMode === "down") {
                noteIdx = (freqs.length - 1) - (arpStepIndex % freqs.length);
            } else if (arpMode === "updown") {
                const total = freqs.length * 2 - 2;
                const pos = arpStepIndex % Math.max(1, total);
                noteIdx = pos < freqs.length ? pos : total - pos;
            } else if (arpMode === "random") {
                noteIdx = Math.floor(Math.random() * freqs.length);
            }

            const targetFreq = freqs[noteIdx];
            playArpPluck(targetFreq, nextArpNoteTime, secondsPerBeat * 0.85);

            nextArpNoteTime += secondsPerBeat;
            arpStepIndex++;
        }
    }, 25);
}

function playArpPluck(freq, time, duration) {
    const customWave = getOrCreateWavetable(currentPreset);

    const pluckGain = audioCtx.createGain();
    pluckGain.gain.setValueAtTime(0.0001, time);
    pluckGain.gain.linearRampToValueAtTime(0.25, time + 0.01);
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    const osc = audioCtx.createOscillator();
    osc.setPeriodicWave(customWave);
    osc.frequency.setValueAtTime(freq, time);

    osc.connect(pluckGain);
    pluckGain.connect(filterNode);

    osc.start(time);
    osc.stop(time + duration + 0.05);
}

// ============================================================================
// 5. RIGHT HAND EXPRESSION
// ============================================================================
function processRightHandExpression(landmarks) {
    if (!audioCtx || !isAudioRunning) return;

    const nowTime = Date.now();
    const dt = Math.max(0.001, (nowTime - rightMetrics.lastTime) / 1000.0);
    rightMetrics.lastTime = nowTime;

    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    if (indexTip.y < 0.12 && nowTime - (rightMetrics.lastEnvSwitchTime || 0) > 2000) {
        rightMetrics.lastEnvSwitchTime = nowTime;
        cycleNextEnvironment();
    }

    const normY = Math.max(0, Math.min(1, 1.0 - indexTip.y));
    const targetCutoff = 800 + Math.pow(normY, 2.0) * 11200;
    filterNode.frequency.setTargetAtTime(targetCutoff, audioCtx.currentTime, 0.06);
    rightMetrics.cutoffHz = Math.round(targetCutoff);
    sendMidiCC(74, Math.round(normY * 127));

    const normX = (indexTip.x - 0.5) * 2.0;
    const panVal = Math.max(-1.0, Math.min(1.0, normX));
    if (stereoPanner.pan) {
        stereoPanner.pan.setTargetAtTime(panVal, audioCtx.currentTime, 0.08);
    }
    rightMetrics.panVal = panVal;
    sendMidiCC(10, Math.round(((panVal + 1.0) / 2.0) * 127));

    const rawZ = indexTip.z || 0.0;
    const zDepthNorm = Math.max(0.1, Math.min(1.0, 1.0 + rawZ * 4.0));
    rightMetrics.zDepth = zDepthNorm;
    delayNode.delayTime.setTargetAtTime(0.15 + zDepthNorm * 0.3, audioCtx.currentTime, 0.1);

    const pinchDist = Math.sqrt(
        Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2)
    );
    const reverbWet = Math.max(0, Math.min(1, 1.0 - pinchDist * 4.0));
    delayGain.gain.setTargetAtTime(reverbWet * 0.3, audioCtx.currentTime, 0.1);
    rightMetrics.reverbWet = Math.round(reverbWet * 100);
    sendMidiCC(91, Math.round(reverbWet * 127));

    rightMetrics.prevX = indexTip.x;
    rightMetrics.prevY = indexTip.y;

    if (document.getElementById("gauge-cutoff")) document.getElementById("gauge-cutoff").textContent = `${rightMetrics.cutoffHz} Hz`;
    if (document.getElementById("bar-cutoff")) document.getElementById("bar-cutoff").style.width = `${Math.min(100, (rightMetrics.cutoffHz / 12000) * 100)}%`;

    if (document.getElementById("gauge-depth")) document.getElementById("gauge-depth").textContent = zDepthNorm < 0.4 ? "NEAR" : zDepthNorm > 0.7 ? "FAR" : "MID";
    if (document.getElementById("bar-depth")) document.getElementById("bar-depth").style.width = `${Math.round(zDepthNorm * 100)}%`;

    if (document.getElementById("gauge-vibrato")) document.getElementById("gauge-vibrato").textContent = `STABLE (100%)`;
    if (document.getElementById("bar-vibrato")) document.getElementById("bar-vibrato").style.width = `100%`;

    const panText = panVal < -0.1 ? `L ${Math.abs(Math.round(panVal * 100))}%` :
                    panVal > 0.1 ? `R ${Math.round(panVal * 100)}%` : "CENTER";
    if (document.getElementById("gauge-pan")) document.getElementById("gauge-pan").textContent = panText;
    if (document.getElementById("bar-pan")) document.getElementById("bar-pan").style.width = `${((panVal + 1.0) / 2.0) * 100}%`;
}

// ============================================================================
// 6. GENERATIVE 3D AUDIO-REACTIVE VISUAL ENGINE
// ============================================================================
function initBackgroundEnvironmentEngine() {
    const bgCanvas = document.getElementById("reactive-bg-canvas");
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext("2d");

    function resizeBg() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }
    resizeBg();
    window.addEventListener("resize", resizeBg);

    bgStars = [];
    for (let i = 0; i < NUM_WARP_STARS; i++) {
        bgStars.push({
            x: (Math.random() - 0.5) * window.innerWidth * 2,
            y: (Math.random() - 0.5) * window.innerHeight * 2,
            z: Math.random() * window.innerWidth,
            pz: Math.random() * window.innerWidth
        });
    }

    bgParticles = [];
    for (let i = 0; i < NUM_BG_PARTICLES; i++) {
        bgParticles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
        });
    }

    const freqArray = new Uint8Array(256);

    function renderBg() {
        requestAnimationFrame(renderBg);

        const w = bgCanvas.width;
        const h = bgCanvas.height;
        const cx = w / 2;
        const cy = h / 2;

        let avgEnergy = 0;
        let bassEnergy = 0;
        if (analyserNode && isAudioRunning) {
            analyserNode.getByteFrequencyData(freqArray);
            let sum = 0;
            for (let i = 0; i < 64; i++) sum += freqArray[i];
            avgEnergy = sum / 64.0 / 255.0;

            let bSum = 0;
            for (let b = 0; b < 12; b++) bSum += freqArray[b];
            bassEnergy = bSum / 12.0 / 255.0;
        }

        ctx.fillStyle = "rgba(9, 10, 15, 0.22)";
        ctx.fillRect(0, 0, w, h);

        polygonRotationAngle += 0.008 + avgEnergy * 0.03;

        if (envTheme === "warp") {
            const speed = 3 + avgEnergy * 25;
            ctx.strokeStyle = `hsla(${190 + chaosHueOffset + avgEnergy * 80}, 100%, 65%, 0.7)`;
            ctx.lineWidth = 1.5;

            bgStars.forEach(star => {
                star.pz = star.z;
                star.z -= speed;

                if (star.z <= 0) {
                    star.z = w;
                    star.pz = w;
                    star.x = (Math.random() - 0.5) * w * 2;
                    star.y = (Math.random() - 0.5) * h * 2;
                }

                const k = 256 / star.z;
                const px = star.x * k + cx;
                const py = star.y * k + cy;

                const pk = 256 / star.pz;
                const prevX = star.x * pk + cx;
                const prevY = star.y * pk + cy;

                if (px >= 0 && px <= w && py >= 0 && py <= h) {
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(px, py);
                    ctx.stroke();
                }
            });
        } else if (envTheme === "polygons") {
            const numSides = isChaosArtMode ? 5 + Math.floor(avgEnergy * 4) : 6;
            const radius = 100 + bassEnergy * 180;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(polygonRotationAngle);

            for (let layer = 1; layer <= 3; layer++) {
                ctx.beginPath();
                const r = radius * (layer * 0.5);
                for (let i = 0; i < numSides; i++) {
                    const angle = (i * 2 * Math.PI) / numSides;
                    const x = r * Math.cos(angle);
                    const y = r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = `hsla(${(chaosHueOffset + layer * 60 + avgEnergy * 120) % 360}, 100%, 60%, ${0.8 - layer * 0.2})`;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
            ctx.restore();
        } else if (envTheme === "aurora") {
            ctx.lineWidth = 3;
            for (let wave = 0; wave < 3; wave++) {
                ctx.beginPath();
                ctx.strokeStyle = `hsla(${(chaosHueOffset + wave * 90 + avgEnergy * 140) % 360}, 100%, 65%, 0.7)`;
                for (let x = 0; x < w; x += 10) {
                    const y = cy + Math.sin(x * 0.008 + polygonRotationAngle * (wave + 1)) * (50 + bassEnergy * 150) + (wave - 1) * 60;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else {
            bgParticles.forEach(p => {
                p.x += p.vx * (1.0 + avgEnergy * 3.5);
                p.y += p.vy * (1.0 + avgEnergy * 3.5);

                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                const scale = p.radius * (1.0 + bassEnergy * 3.0);
                const colorStr = `hsla(${(chaosHueOffset + avgEnergy * 180) % 360}, 100%, 60%, 0.75)`;

                ctx.beginPath();
                ctx.arc(p.x, p.y, scale, 0, Math.PI * 2);
                ctx.fillStyle = colorStr;
                ctx.fill();
            });
        }

        for (let s = bgShockwaves.length - 1; s >= 0; s--) {
            const shock = bgShockwaves[s];
            ctx.beginPath();
            ctx.arc(shock.x, shock.y, shock.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${(chaosHueOffset + shock.radius) % 360}, 100%, 60%, ${shock.alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            shock.radius += 10 + avgEnergy * 15;
            shock.alpha -= 0.025;

            if (shock.alpha <= 0 || shock.radius >= shock.maxRadius) {
                bgShockwaves.splice(s, 1);
            }
        }
    }

    renderBg();
}

// ============================================================================
// 7. MEDIAPIPE TRACKING (SUSTAIN HOLD & 5-FRAME DEBOUNCER)
// ============================================================================
function countExtendedFingersRaw(landmarks) {
    let count = 0;
    if (Math.abs(landmarks[4].x - landmarks[17].x) > Math.abs(landmarks[2].x - landmarks[17].x)) {
        count++;
    }
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    tips.forEach((tip, i) => {
        if (landmarks[tip].y < landmarks[pips[i]].y) {
            count++;
        }
    });
    return Math.max(0, Math.min(5, count));
}

function getDebouncedFingerCount(rawCount) {
    rawFingerHistory.push(rawCount);
    if (rawFingerHistory.length > DEBOUNCE_FRAMES) {
        rawFingerHistory.shift();
    }
    if (rawFingerHistory.length === DEBOUNCE_FRAMES && rawFingerHistory.every(val => val === rawCount)) {
        stableFingerCount = rawCount;
    }
    return stableFingerCount;
}

function onResults(results) {
    const canvasElement = document.getElementById("output-canvas");
    if (!canvasElement) return;
    const canvasCtx = canvasElement.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    if (canvasElement.width !== canvasElement.clientWidth * dpr || canvasElement.height !== canvasElement.clientHeight * dpr) {
        canvasElement.width = canvasElement.clientWidth * dpr;
        canvasElement.height = canvasElement.clientHeight * dpr;
    }

    fpsCount++;
    const now = Date.now();
    if (now - lastFrameTime >= 1000) {
        const fpsEl = document.getElementById("camera-fps");
        if (fpsEl) fpsEl.textContent = `FPS: ${fpsCount}`;
        fpsCount = 0;
        lastFrameTime = now;
    }

    canvasCtx.save();
    canvasCtx.scale(dpr, dpr);
    const renderW = canvasElement.clientWidth;
    const renderH = canvasElement.clientHeight;

    canvasCtx.clearRect(0, 0, renderW, renderH);
    canvasCtx.drawImage(results.image, 0, 0, renderW, renderH);

    let leftFound = false;
    let rightFound = false;

    if (results.multiHandLandmarks && results.multiHandedness) {
        for (let idx = 0; idx < results.multiHandLandmarks.length; idx++) {
            const landmarks = results.multiHandLandmarks[idx];
            const classification = results.multiHandedness[idx];
            const isRightHand = classification.label === "Right";

            const strokeColor = isRightHand ? "#af52de" : "#00c3ff";
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: strokeColor, lineWidth: 2 });
            drawLandmarks(canvasCtx, landmarks, { color: "#ffffff", lineWidth: 1, radius: 3 });

            if (!isRightHand) {
                leftFound = true;
                const rawCount = countExtendedFingersRaw(landmarks);
                leftFingersCount = getDebouncedFingerCount(rawCount);
                triggerChordTransition(leftFingersCount);
            } else {
                rightFound = true;
                processRightHandExpression(landmarks);
            }
        }
    }

    const leftBadge = document.getElementById("left-hand-status");
    if (leftBadge) {
        if (leftFound) {
            leftBadge.textContent = "SOL EL: AKTİF";
            leftBadge.classList.add("active");
        } else {
            leftBadge.textContent = isSustainPedalOn ? "SUSTAIN (HOLDING)" : "BEKLENİYOR";
            leftBadge.classList.remove("active");
            if (!isSustainPedalOn) {
                triggerChordTransition(0);
            }
        }
    }

    const rightBadge = document.getElementById("right-hand-status");
    if (rightBadge) {
        if (rightFound) {
            rightBadge.textContent = "SAĞ EL: AKTİF";
            rightBadge.classList.add("active");
        } else {
            rightBadge.textContent = "SAĞ EL: --";
            rightBadge.classList.remove("active");
        }
    }

    canvasCtx.restore();
}

function startVisualizer() {
    const canvas = document.getElementById("audio-visualizer");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserNode.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);

        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== canvas.clientWidth * dpr || canvas.height !== canvas.clientHeight * dpr) {
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        analyserNode.getByteTimeDomainData(timeData);
        analyserNode.getByteFrequencyData(freqData);

        ctx.fillStyle = "#080a0e";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 35) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        if (scopeMode === "spectrum") {
            const barWidth = (w / bufferLength) * 2.5;
            let barX = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (freqData[i] / 255.0) * h * 0.85;
                ctx.fillStyle = `hsl(${(i / bufferLength) * 280}, 100%, 60%)`;
                ctx.fillRect(barX, h - barHeight, barWidth, barHeight);
                barX += barWidth + 1;
            }
        } else if (scopeMode === "lissajous") {
            const centerX = w / 2;
            const centerY = h / 2;
            const radius = Math.min(w, h) * 0.38;

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffcc00";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#ffcc00";
            ctx.beginPath();

            for (let i = 0; i < bufferLength; i++) {
                const sampleL = (timeData[i] - 128) / 128.0;
                const sampleR = (timeData[(i + 32) % bufferLength] - 128) / 128.0;

                const posX = centerX + sampleL * radius;
                const posY = centerY - sampleR * radius;

                if (i === 0) ctx.moveTo(posX, posY);
                else ctx.lineTo(posX, posY);
            }
            ctx.closePath();
            ctx.stroke();
        } else {
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#00c3ff";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#00c3ff";
            ctx.beginPath();

            const sliceWidth = w * 1.0 / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = timeData[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.lineTo(w, h / 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    draw();
}

// ============================================================================
// 8. EVENT LISTENERS & SHORTCUTS (H: Hide UI, M: Theme, C: Chaos, S: Sustain)
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
    initWebMIDI();

    window.addEventListener("keydown", (e) => {
        if (e.key === "h" || e.key === "H") {
            toggleImmersionMode();
        } else if (e.key === "m" || e.key === "M") {
            cycleNextEnvironment();
        } else if (e.key === "c" || e.key === "C") {
            toggleChaosArtMode();
        } else if (e.key === "s" || e.key === "S") {
            toggleSustainPedal();
        }
    });

    if (document.getElementById("btn-sustain-pedal")) {
        document.getElementById("btn-sustain-pedal").addEventListener("click", () => toggleSustainPedal());
    }

    if (document.getElementById("btn-toggle-immersion")) {
        document.getElementById("btn-toggle-immersion").addEventListener("click", () => toggleImmersionMode());
    }
    if (document.getElementById("btn-exit-immersion")) {
        document.getElementById("btn-exit-immersion").addEventListener("click", () => toggleImmersionMode());
    }
    if (document.getElementById("btn-next-env-gesture")) {
        document.getElementById("btn-next-env-gesture").addEventListener("click", () => cycleNextEnvironment());
    }

    // PRESET BROWSER DROPDOWN EVENT LISTENER
    const presetDropdown = document.getElementById("preset-select-dropdown");
    if (presetDropdown) {
        presetDropdown.addEventListener("change", (e) => {
            switchInstrumentPreset(e.target.value);
        });
    }

    // ADSR SLIDERS EVENT LISTENERS
    if (document.getElementById("slider-adsr-attack")) {
        document.getElementById("slider-adsr-attack").addEventListener("input", (e) => {
            adsrParams.attack = parseFloat(e.target.value);
            if (document.getElementById("val-adsr-attack")) document.getElementById("val-adsr-attack").textContent = `${Math.round(adsrParams.attack * 1000)} ms`;
        });
    }
    if (document.getElementById("slider-adsr-decay")) {
        document.getElementById("slider-adsr-decay").addEventListener("input", (e) => {
            adsrParams.decay = parseFloat(e.target.value);
            if (document.getElementById("val-adsr-decay")) document.getElementById("val-adsr-decay").textContent = `${Math.round(adsrParams.decay * 1000)} ms`;
        });
    }
    if (document.getElementById("slider-adsr-sustain")) {
        document.getElementById("slider-adsr-sustain").addEventListener("input", (e) => {
            adsrParams.sustain = parseFloat(e.target.value);
            if (document.getElementById("val-adsr-sustain")) document.getElementById("val-adsr-sustain").textContent = `${Math.round(adsrParams.sustain * 100)} %`;
        });
    }
    if (document.getElementById("slider-adsr-release")) {
        document.getElementById("slider-adsr-release").addEventListener("input", (e) => {
            adsrParams.release = parseFloat(e.target.value);
            if (document.getElementById("val-adsr-release")) document.getElementById("val-adsr-release").textContent = `${Math.round(adsrParams.release * 1000)} ms`;
        });
    }

    document.querySelectorAll(".rack-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".rack-tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const targetTab = btn.getAttribute("data-tab");
            const panel = document.getElementById(targetTab);
            if (panel) panel.classList.add("active");
        });
    });

    const videoElement = document.getElementById("input-video");

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            if (isProcessingFrame) return;
            isProcessingFrame = true;
            try {
                await hands.send({ image: videoElement });
            } catch(e) {
                console.error("[CAMERA FRAME ERROR]", e);
            } finally {
                isProcessingFrame = false;
            }
        },
        width: 640,
        height: 480
    });

    camera.start().catch(err => {
        console.error("[CAMERA ERROR]", err);
    });

    const helpDrawer = document.getElementById("help-drawer");
    if (document.getElementById("btn-toggle-guide")) {
        document.getElementById("btn-toggle-guide").addEventListener("click", () => {
            if (helpDrawer) helpDrawer.classList.toggle("hidden");
        });
    }
    if (document.getElementById("btn-close-guide")) {
        document.getElementById("btn-close-guide").addEventListener("click", () => {
            if (helpDrawer) helpDrawer.classList.add("hidden");
        });
    }

    ["click", "touchstart", "mousedown"].forEach(evt => {
        window.addEventListener(evt, () => {
            initAudioEngine();
        }, { passive: true });
    });

    if (document.getElementById("btn-start-audio")) {
        document.getElementById("btn-start-audio").addEventListener("click", (e) => {
            e.stopPropagation();
            initAudioEngine();
        });
    }

    if (document.getElementById("btn-freeze-toggle")) document.getElementById("btn-freeze-toggle").addEventListener("click", () => toggleSpectralFreeze());
    if (document.getElementById("btn-save-preset")) document.getElementById("btn-save-preset").addEventListener("click", () => savePresetToStorage());
    if (document.getElementById("btn-load-preset")) document.getElementById("btn-load-preset").addEventListener("click", () => loadPresetFromStorage());

    if (document.getElementById("scope-mode-select")) {
        document.getElementById("scope-mode-select").addEventListener("change", (e) => {
            scopeMode = e.target.value;
        });
    }

    if (document.getElementById("env-theme-select")) {
        document.getElementById("env-theme-select").addEventListener("change", (e) => {
            envTheme = e.target.value;
            const bar = document.getElementById("midi-status-bar");
            if (bar) bar.textContent = `Visual Master Rack Active (${e.target.options[e.target.selectedIndex].text})`;
        });
    }

    if (document.getElementById("slider-eq-bass")) {
        document.getElementById("slider-eq-bass").addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            if (document.getElementById("val-eq-bass")) document.getElementById("val-eq-bass").textContent = `${val > 0 ? '+' : ''}${val} dB`;
            if (eqBassNode && audioCtx) {
                eqBassNode.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
            }
        });
    }

    if (document.getElementById("slider-eq-mid")) {
        document.getElementById("slider-eq-mid").addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            if (document.getElementById("val-eq-mid")) document.getElementById("val-eq-mid").textContent = `${val > 0 ? '+' : ''}${val} dB`;
            if (eqMidNode && audioCtx) {
                eqMidNode.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
            }
        });
    }

    if (document.getElementById("slider-eq-treble")) {
        document.getElementById("slider-eq-treble").addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            if (document.getElementById("val-eq-treble")) document.getElementById("val-eq-treble").textContent = `${val > 0 ? '+' : ''}${val} dB`;
            if (eqTrebleNode && audioCtx) {
                eqTrebleNode.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
            }
        });
    }

    if (document.getElementById("btn-metro-toggle")) document.getElementById("btn-metro-toggle").addEventListener("click", () => toggleMetronome());
    if (document.getElementById("btn-loop-rec")) document.getElementById("btn-loop-rec").addEventListener("click", () => toggleLoopRecording());
    if (document.getElementById("btn-loop-play")) document.getElementById("btn-loop-play").addEventListener("click", () => startLoopPlayback());
    if (document.getElementById("btn-loop-clear")) document.getElementById("btn-loop-clear").addEventListener("click", () => clearLoop());
    if (document.getElementById("btn-rec-wav")) document.getElementById("btn-rec-wav").addEventListener("click", () => toggleWavRecording());

    if (document.getElementById("scale-mode-select")) {
        document.getElementById("scale-mode-select").addEventListener("change", (e) => {
            currentScaleMode = e.target.value;
            if (currentChordIndex >= 0) {
                const idx = currentChordIndex;
                currentChordIndex = -1;
                triggerChordTransition(idx);
            }
        });
    }

    if (document.getElementById("midi-select")) {
        document.getElementById("midi-select").addEventListener("change", (e) => {
            const val = e.target.value;
            if (val === "none" || !midiAccess) {
                selectedMidiOutput = null;
            } else {
                selectedMidiOutput = midiAccess.outputs.get(val);
            }
        });
    }

    if (document.getElementById("key-select")) {
        document.getElementById("key-select").addEventListener("change", (e) => {
            currentKey = e.target.value;
            if (currentChordIndex >= 0) {
                const idx = currentChordIndex;
                currentChordIndex = -1;
                triggerChordTransition(idx);
            }
        });
    }

    if (document.getElementById("octave-select")) {
        document.getElementById("octave-select").addEventListener("change", (e) => {
            currentOctaveShift = parseInt(e.target.value);
            if (currentChordIndex >= 0) {
                const idx = currentChordIndex;
                currentChordIndex = -1;
                triggerChordTransition(idx);
            }
        });
    }

    if (document.getElementById("arp-mode-select")) {
        document.getElementById("arp-mode-select").addEventListener("change", (e) => {
            arpMode = e.target.value;
            arpStepIndex = 0;
            if (currentChordIndex >= 0) {
                const idx = currentChordIndex;
                currentChordIndex = -1;
                triggerChordTransition(idx);
            }
        });
    }

    if (document.getElementById("slider-bpm")) {
        document.getElementById("slider-bpm").addEventListener("input", (e) => {
            arpBpm = parseInt(e.target.value);
            if (document.getElementById("val-bpm")) document.getElementById("val-bpm").textContent = `${arpBpm} BPM`;
            if (isMetronomeActive) startMetronomeLoop();
        });
    }

    if (document.getElementById("slider-glide")) {
        document.getElementById("slider-glide").addEventListener("input", (e) => {
            portamentoTime = parseFloat(e.target.value);
            if (document.getElementById("val-glide")) document.getElementById("val-glide").textContent = `${Math.round(portamentoTime * 1000)} ms`;
        });
    }

    if (document.getElementById("slider-volume")) {
        document.getElementById("slider-volume").addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            if (document.getElementById("val-volume").textContent) document.getElementById("val-volume").textContent = `${Math.round(val * 100)} %`;
            if (masterGain) {
                masterGain.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
            }
        });
    }
});
