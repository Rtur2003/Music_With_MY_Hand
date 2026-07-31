/* ═══════════════════════════════════════════════════════════════════
   AuraSynth Pro — Orchestra Engine (Tone.js)
   Multi-section orchestral synthesizer for Conductor Mode
   (Strings, Woodwinds, Brass, Percussion)
   ═══════════════════════════════════════════════════════════════════ */

import * as Tone from 'tone';
import { ORCHESTRAL_PIECES, type OrchestralPiece, type MeasureData } from './pieces';

export class OrchestraEngine {
  private stringsSynth!: Tone.PolySynth;
  private woodwindsSynth!: Tone.PolySynth;
  private brassSynth!: Tone.PolySynth;
  private percussionSynth!: Tone.MembraneSynth;

  private stringsGain!: Tone.Gain;
  private woodwindsGain!: Tone.Gain;
  private brassGain!: Tone.Gain;
  private percussionGain!: Tone.Gain;
  private masterGain!: Tone.Gain;
  private reverb!: Tone.Reverb;

  private isStarted = false;
  private currentPieceIndex = 0;
  private currentBeat = 0;
  private currentBpm = 120;
  private dynamics = 0.6; // 0 to 1
  private sectionFocus = 0; // 0=all, 1=strings, 2=woodwinds, 3=brass, 4=percussion

  async start(): Promise<void> {
    if (this.isStarted) return;
    await Tone.start();

    this.masterGain = new Tone.Gain(0.7).toDestination();

    this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.35 });
    await this.reverb.ready;
    this.reverb.connect(this.masterGain);

    // Section gains
    this.stringsGain = new Tone.Gain(0.7).connect(this.reverb);
    this.woodwindsGain = new Tone.Gain(0.6).connect(this.reverb);
    this.brassGain = new Tone.Gain(0.65).connect(this.reverb);
    this.percussionGain = new Tone.Gain(0.8).connect(this.masterGain);

    // Strings Synth (Warm PolySynth)
    this.stringsSynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 8,
      options: {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 25 },
        envelope: { attack: 0.15, decay: 0.5, sustain: 0.8, release: 1.2 },
        volume: -4,
      },
    }).connect(this.stringsGain);

    // Woodwinds Synth (Flute/Oboe sound)
    this.woodwindsSynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6,
      options: {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.08, decay: 0.3, sustain: 0.7, release: 0.5 },
        volume: -2,
      },
    }).connect(this.woodwindsGain);

    // Brass Synth (Bright saw/square)
    this.brassSynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6,
      options: {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.4, sustain: 0.7, release: 0.6 },
        volume: -3,
      },
    }).connect(this.brassGain);

    // Percussion Synth (Timpani)
    this.percussionSynth = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.8, sustain: 0.01, release: 1.2 },
      volume: 0,
    }).connect(this.percussionGain);

    this.isStarted = true;
  }

  /**
   * Set current piece
   */
  setPiece(index: number): void {
    if (index >= 0 && index < ORCHESTRAL_PIECES.length) {
      this.currentPieceIndex = index;
      this.currentBeat = 0;
      this.setBpm(ORCHESTRAL_PIECES[index].defaultBpm);
    }
  }

  getCurrentPiece(): OrchestralPiece {
    return ORCHESTRAL_PIECES[this.currentPieceIndex] || ORCHESTRAL_PIECES[0];
  }

  /**
   * Set BPM from conductor gesture
   */
  setBpm(bpm: number): void {
    this.currentBpm = Math.max(40, Math.min(240, bpm));
  }

  getBpm(): number {
    return this.currentBpm;
  }

  /**
   * Set dynamics (volume) from conductor left hand height
   * 0.0 (pp) to 1.0 (ff)
   */
  setDynamics(dynamics: number): void {
    this.dynamics = Math.max(0.1, Math.min(1.0, dynamics));
    if (!this.isStarted) return;
    this.masterGain.gain.rampTo(this.dynamics * 0.9, 0.05);
  }

  /**
   * Set section focus
   * 0=all, 1=strings, 2=woodwinds, 3=brass, 4=percussion
   */
  setSectionFocus(focus: number): void {
    this.sectionFocus = focus;
    if (!this.isStarted) return;

    const fullGain = 0.8;
    const dimmedGain = 0.2;

    this.stringsGain.gain.rampTo(focus === 0 || focus === 1 ? fullGain : dimmedGain, 0.1);
    this.woodwindsGain.gain.rampTo(focus === 0 || focus === 2 ? fullGain : dimmedGain, 0.1);
    this.brassGain.gain.rampTo(focus === 0 || focus === 3 ? fullGain : dimmedGain, 0.1);
    this.percussionGain.gain.rampTo(focus === 0 || focus === 4 ? fullGain : dimmedGain, 0.1);
  }

  /**
   * Trigger beat — plays the next measure step in the current piece
   */
  triggerBeat(): void {
    if (!this.isStarted) return;

    const piece = this.getCurrentPiece();
    if (!piece.measures || piece.measures.length === 0) return;

    const measure: MeasureData = piece.measures[this.currentBeat % piece.measures.length];
    const now = Tone.now();

    // Trigger strings
    if (measure.strings) {
      const notes = Array.isArray(measure.strings.note) ? measure.strings.note : [measure.strings.note];
      this.stringsSynth.triggerAttackRelease(notes, measure.strings.duration, now);
    }

    // Trigger woodwinds
    if (measure.woodwinds) {
      const notes = Array.isArray(measure.woodwinds.note) ? measure.woodwinds.note : [measure.woodwinds.note];
      this.woodwindsSynth.triggerAttackRelease(notes, measure.woodwinds.duration, now);
    }

    // Trigger brass
    if (measure.brass) {
      const notes = Array.isArray(measure.brass.note) ? measure.brass.note : [measure.brass.note];
      this.brassSynth.triggerAttackRelease(notes, measure.brass.duration, now);
    }

    // Trigger percussion
    if (measure.percussion) {
      const note = Array.isArray(measure.percussion.note) ? measure.percussion.note[0] : measure.percussion.note;
      this.percussionSynth.triggerAttackRelease(note, measure.percussion.duration, now);
    }

    this.currentBeat++;
  }

  dispose(): void {
    this.stringsSynth?.dispose();
    this.woodwindsSynth?.dispose();
    this.brassSynth?.dispose();
    this.percussionSynth?.dispose();
    this.stringsGain?.dispose();
    this.woodwindsGain?.dispose();
    this.brassGain?.dispose();
    this.percussionGain?.dispose();
    this.masterGain?.dispose();
    this.reverb?.dispose();
    this.isStarted = false;
  }
}

/** Singleton instance */
let orchestraInstance: OrchestraEngine | null = null;

export function getOrchestraEngine(): OrchestraEngine {
  if (!orchestraInstance) {
    orchestraInstance = new OrchestraEngine();
  }
  return orchestraInstance;
}
