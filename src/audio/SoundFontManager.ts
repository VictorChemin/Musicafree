import type ISynthesizer from 'js-synthesizer/dist/lib/ISynthesizer';
import { useProjectStore } from '../store/projectStore';
import type { Track, Note } from '../types';

export interface SoundFontNoteEvent {
  noteId: string;
  trackId: string;
  channel: number;
  pitch: number;
  velocity: number;
  startTime: number;
  duration: number;
}

export class SoundFontManager {
  private synth: ISynthesizer | null = null;
  private scheduledEvents: Map<string, number[]> = new Map();
  private initialized = false;

  setSynth(synth: ISynthesizer) {
    this.synth = synth;
    this.initialized = true;
  }

  getSynth(): ISynthesizer | null {
    return this.synth;
  }

  isReady(): boolean {
    return this.initialized && this.synth !== null;
  }

  scheduleTrackNotes(track: Track, startBeat: number, endBeat: number, secondsPerBeat: number) {
    if (!this.synth) return;

    this.unscheduleTrack(track.id);

    const eventIds: number[] = [];
    const channel = track.channel;

    if (track.type === 'soundfont') {
      const { soundFontId } = useProjectStore.getState();
      if (soundFontId >= 0) {
        this.synth.midiProgramSelect(channel, soundFontId, 0, track.soundfontPreset);
      }
    }

    for (const note of track.notes) {
      if (note.start >= endBeat || note.start + note.duration <= startBeat) continue;

      const relStart = (note.start - startBeat) * secondsPerBeat;
      const relEnd = relStart + note.duration * secondsPerBeat;
      const now = this.synth.midiNoteOn as unknown;

      const noteOnId = setTimeout(() => {
        if (this.synth && track.type === 'soundfont') {
          this.synth.midiNoteOn(channel, note.pitch, note.velocity);
        }
      }, relStart * 1000);

      const noteOffId = setTimeout(() => {
        if (this.synth) {
          this.synth.midiNoteOff(channel, note.pitch);
        }
      }, relEnd * 1000);

      eventIds.push(noteOnId as unknown as number, noteOffId as unknown as number);
    }

    this.scheduledEvents.set(track.id, eventIds);
  }

  unscheduleTrack(trackId: string) {
    const ids = this.scheduledEvents.get(trackId);
    if (ids) {
      for (const id of ids) {
        clearTimeout(id);
      }
      this.scheduledEvents.delete(trackId);
    }
  }

  unscheduleAll() {
    for (const id of this.scheduledEvents.keys()) {
      this.unscheduleTrack(id);
    }
  }

  noteOn(channel: number, pitch: number, velocity: number) {
    if (this.synth) {
      this.synth.midiNoteOn(channel, pitch, velocity);
    }
  }

  noteOff(channel: number, pitch: number) {
    if (this.synth) {
      this.synth.midiNoteOff(channel, pitch);
    }
  }

  stopAll() {
    if (this.synth) {
      this.synth.midiAllNotesOff();
    }
  }

  setVolume(volume: number) {
    if (this.synth) {
      this.synth.setGain(volume);
    }
  }

  destroy() {
    this.unscheduleAll();
    if (this.synth) {
      this.synth.close();
      this.synth = null;
    }
    this.initialized = false;
  }
}

export const soundFontManager = new SoundFontManager();
