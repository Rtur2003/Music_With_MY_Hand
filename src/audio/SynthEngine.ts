/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Synth Engine (Tone.js)
   Non-blocking initialization with PolySynth, Filter, Reverb, Auto-Bass
   ═══════════════════════════════════════════════════════════════════ */

import * as Tone from 'tone';

export interface SynthEngineOptions {
  volume?: number;
}

export class SynthEngine {
  private synth!: Tone.PolySynth;
  private filter!: Tone.Filter;
  private reverb!: Tone.Reverb;
  private chorus!: Tone.Chorus;
  private masterGain!: Tone.Gain;

  // Bass
  private bassSynth!: Tone.MonoSynth;
  private bassGain!: Tone.Gain;
  private bassEnabled = false;

  // Arpeggiator
  private arpPattern: Tone.Pattern<string> | null = null;
  private arpSynth!: Tone.MonoSynth;
  private arpEnabled = false;
  private arpSpeed: 'slow' | 'normal' | 'fast' = 'normal';

  // State tracking
  private currentNotes: string[] = [];
  private isPlaying = false;
  private isStarted = false;

  // Analyser for visualization
  private analyser!: Tone.Analyser;

  async start(): Promise<void> {
    if (this.isStarted) return;
    this.isStarted = true;

    try {
      await Tone.start();
    } catch {
      // Non-critical audio start warning
    }

    // ── Master chain ─────────────────────────────────
    this.masterGain = new Tone.Gain(0.7).toDestination();

    // Analyser for visualizations
    this.analyser = new Tone.Analyser('waveform', 256);
    this.masterGain.connect(this.analyser);

    // ── Effects (Non-blocking Reverb) ─────────────────
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 });
    this.reverb.ready.catch(() => {}); // non-blocking

    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.4,
      wet: 0.15,
    }).start();

    this.filter = new Tone.Filter({
      frequency: 3000,
      type: 'lowpass',
      rolloff: -24,
      Q: 1.5,
    });

    // ── Main polyphonic synth ────────────────────────
    this.synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 12,
      voice: Tone.Synth,
      options: {
        oscillator: {
          type: 'fatsawtooth',
          count: 3,
          spread: 20,
        },
        envelope: {
          attack: 0.08,
          decay: 0.3,
          sustain: 0.6,
          release: 0.8,
        },
        volume: -6,
      },
    });

    // Chain: synth → filter → chorus → reverb → master
    this.synth.connect(this.filter);
    this.filter.connect(this.chorus);
    this.chorus.connect(this.reverb);
    this.reverb.connect(this.masterGain);

    // ── Bass synth ───────────────────────────────────
    this.bassGain = new Tone.Gain(0).connect(this.masterGain);
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.05,
        decay: 0.4,
        sustain: 0.5,
        release: 1.0,
      },
      filterEnvelope: {
        attack: 0.06,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8,
        baseFrequency: 100,
        octaves: 2,
      },
      volume: -8,
    }).connect(this.bassGain);

    // ── Arp synth ────────────────────────────────────
    this.arpSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.3,
        release: 0.3,
      },
      volume: -10,
    });
    this.arpSynth.connect(this.filter);
  }

  getAnalyser(): Tone.Analyser | null {
    return this.analyser ?? null;
  }

  playChord(notes: string[]): void {
    if (!this.isStarted || notes.length === 0) return;

    const now = Tone.now();

    if (this.currentNotes.length > 0) {
      this.synth.releaseAll(now);
    }

    const attackTime = now + 0.02;
    this.synth.triggerAttack(notes, attackTime);
    this.currentNotes = [...notes];
    this.isPlaying = true;

    if (this.arpEnabled) {
      this.updateArpPattern(notes);
    }
  }

  playBass(bassNote: string): void {
    if (!this.isStarted || !this.bassEnabled) return;
    const now = Tone.now();
    this.bassSynth.triggerAttackRelease(bassNote, '2n', now + 0.02);
  }

  releaseAll(): void {
    if (!this.isStarted) return;
    const now = Tone.now();
    this.synth.releaseAll(now);
    this.currentNotes = [];
    this.isPlaying = false;

    if (this.arpPattern) {
      this.arpPattern.stop();
      this.arpPattern.dispose();
      this.arpPattern = null;
    }
  }

  setFilterFrequency(normalized: number): void {
    if (!this.isStarted) return;
    const minFreq = 200;
    const maxFreq = 8000;
    const freq = minFreq * Math.pow(maxFreq / minFreq, normalized);
    this.filter.frequency.rampTo(freq, 0.05);
  }

  setVolume(normalized: number): void {
    if (!this.isStarted) return;
    const vol = Math.max(0, Math.min(1, normalized));
    this.masterGain.gain.rampTo(vol * 0.8, 0.05);
  }

  setReverbWet(wet: number): void {
    if (!this.isStarted) return;
    this.reverb.wet.rampTo(Math.max(0, Math.min(1, wet)), 0.1);
  }

  setBassEnabled(enabled: boolean): void {
    this.bassEnabled = enabled;
    if (this.isStarted) {
      this.bassGain.gain.rampTo(enabled ? 0.6 : 0, 0.1);
    }
  }

  getBassEnabled(): boolean {
    return this.bassEnabled;
  }

  setArpEnabled(enabled: boolean): void {
    this.arpEnabled = enabled;
    if (!enabled && this.arpPattern) {
      this.arpPattern.stop();
      this.arpPattern.dispose();
      this.arpPattern = null;
    } else if (enabled && this.currentNotes.length > 0) {
      this.updateArpPattern(this.currentNotes);
    }
  }

  getArpEnabled(): boolean {
    return this.arpEnabled;
  }

  setArpSpeed(speed: 'slow' | 'normal' | 'fast'): void {
    this.arpSpeed = speed;
    if (this.arpPattern) {
      this.arpPattern.interval = this.getArpInterval();
    }
  }

  private getArpInterval(): Tone.Unit.Time {
    switch (this.arpSpeed) {
      case 'slow': return '4n';
      case 'normal': return '8n';
      case 'fast': return '16n';
    }
  }

  private updateArpPattern(notes: string[]): void {
    if (this.arpPattern) {
      this.arpPattern.stop();
      this.arpPattern.dispose();
    }

    this.arpPattern = new Tone.Pattern(
      (time, note) => {
        this.arpSynth.triggerAttackRelease(note, '16n', time);
      },
      notes,
      'up',
    );
    this.arpPattern.interval = this.getArpInterval();
    this.arpPattern.start();

    if (Tone.getTransport().state !== 'started') {
      Tone.getTransport().start();
    }
  }

  dispose(): void {
    this.releaseAll();
    if (this.arpPattern) {
      this.arpPattern.dispose();
    }
    this.synth?.dispose();
    this.bassSynth?.dispose();
    this.arpSynth?.dispose();
    this.filter?.dispose();
    this.reverb?.dispose();
    this.chorus?.dispose();
    this.masterGain?.dispose();
    this.bassGain?.dispose();
    this.analyser?.dispose();
    this.isStarted = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getIsStarted(): boolean {
    return this.isStarted;
  }
}

let engineInstance: SynthEngine | null = null;

export function getSynthEngine(): SynthEngine {
  if (!engineInstance) {
    engineInstance = new SynthEngine();
  }
  return engineInstance;
}
