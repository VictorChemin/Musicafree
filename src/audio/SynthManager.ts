import * as Tone from 'tone';
import type { Track, SynthConfig, Note } from '../types';

interface TrackSynth {
  synth: Tone.PolySynth | Tone.MonoSynth | Tone.MembraneSynth | Tone.MetalSynth | null;
  volume: Tone.Volume;
  pan: Tone.Panner;
  reverb: Tone.Reverb | null;
  delay: Tone.FeedbackDelay | null;
  distortion: Tone.Distortion | null;
  chorus: Tone.Chorus | null;
  eq: Tone.EQ3 | null;
  compressor: Tone.Compressor | null;
}

export class SynthManager {
  private trackSynths: Map<string, TrackSynth> = new Map();
  private scheduledNotes: Map<string, Set<string>> = new Map();

  private createSynthForTrack(track: Track): TrackSynth | null {
    if (track.type !== 'synth') return null;

    const config = track.synthConfig;
    const pan = new Tone.Panner(track.pan).toDestination();
    const vol = new Tone.Volume(Tone.gainToDb(track.volume)).connect(pan);

    const reverb = new Tone.Reverb({ decay: 0.5, wet: 0 }).connect(vol);
    const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.2, wet: 0 }).connect(reverb);
    const distortion = new Tone.Distortion({ distortion: 0, wet: 0 }).connect(delay);
    const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0 }).connect(distortion);
    const eq = new Tone.EQ3({ low: 0, mid: 0, high: 0 }).connect(chorus);
    const compressor = new Tone.Compressor({ threshold: -24, ratio: 3, attack: 0.003, release: 0.25 }).connect(eq);

    let synth: TrackSynth['synth'] = null;

    switch (config.type) {
      case 'oscillator':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: config.oscillatorType },
          envelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          volume: config.volume,
          detune: config.detune,
        }).connect(compressor);
        break;

      case 'fm':
        synth = new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: config.harmonicity,
          modulationIndex: config.modulationIndex,
          oscillator: { type: config.oscillatorType },
          envelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          modulationEnvelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          volume: config.volume,
        }).connect(compressor);
        break;

      case 'am':
        synth = new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: config.harmonicity,
          oscillator: { type: config.oscillatorType },
          envelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          modulationEnvelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          volume: config.volume,
        }).connect(compressor);
        break;

      case 'drum':
        synth = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 5,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
          volume: config.volume,
        }).connect(compressor);
        break;
    }

    return { synth, volume: vol, pan, reverb, delay, distortion, chorus, eq, compressor };
  }

  getOrCreateTrackSynth(track: Track): TrackSynth | null {
    if (track.type !== 'synth') return null;

    let ts = this.trackSynths.get(track.id);
    if (ts) {
      ts.pan.pan.value = track.pan;
      ts.volume.volume.value = Tone.gainToDb(track.volume);
      return ts;
    }

    ts = this.createSynthForTrack(track);
    if (ts) {
      this.trackSynths.set(track.id, ts);
    }
    return ts;
  }

  scheduleNotes(track: Track, startBeat: number, endBeat: number, secondsPerBeat: number) {
    const ts = this.getOrCreateTrackSynth(track);
    if (!ts || !ts.synth) return;

    this.unscheduleNotes(track.id);

    const scheduledIds = new Set<string>();

    for (const note of track.notes) {
      if (note.start >= endBeat || note.start + note.duration <= startBeat) continue;

      const relStart = (note.start - startBeat) * secondsPerBeat;
      const noteDuration = note.duration * secondsPerBeat;

      const noteName = Tone.Frequency(note.pitch, 'midi').toNote();
      const vel = note.velocity / 127;

      if (ts.synth instanceof Tone.PolySynth) {
        ts.synth.triggerAttackRelease(noteName, noteDuration, relStart, vel);
      } else if (ts.synth instanceof Tone.MembraneSynth) {
        ts.synth.triggerAttackRelease(noteName, noteDuration, relStart, vel);
      }

      scheduledIds.add(note.id);
    }

    this.scheduledNotes.set(track.id, scheduledIds);
  }

  unscheduleNotes(trackId: string) {
    const ts = this.trackSynths.get(trackId);
    if (ts && ts.synth) {
      ts.synth.releaseAll();
    }
    this.scheduledNotes.delete(trackId);
  }

  stopAll() {
    for (const ts of this.trackSynths.values()) {
      if (ts.synth) {
        ts.synth.releaseAll();
      }
    }
  }

  updateEffect(trackId: string, effectIndex: number, wet: number) {
    const ts = this.trackSynths.get(trackId);
    if (!ts) return;

    const effects = [ts.reverb, ts.delay, ts.distortion, ts.chorus];
    const effect = effects[effectIndex];
    if (effect) {
      effect.wet.value = wet;
    }
  }

  removeTrack(trackId: string) {
    const ts = this.trackSynths.get(trackId);
    if (ts) {
      ts.synth?.dispose();
      ts.volume.dispose();
      ts.pan.dispose();
      ts.reverb?.dispose();
      ts.delay?.dispose();
      ts.distortion?.dispose();
      ts.chorus?.dispose();
      ts.eq?.dispose();
      ts.compressor?.dispose();
      this.trackSynths.delete(trackId);
    }
    this.scheduledNotes.delete(trackId);
  }

  destroy() {
    for (const id of this.trackSynths.keys()) {
      this.removeTrack(id);
    }
  }
}

export const synthManager = new SynthManager();
