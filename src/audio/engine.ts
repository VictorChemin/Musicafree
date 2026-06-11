import * as Tone from 'tone';
import { useProjectStore } from '../store/projectStore';
import { soundFontManager } from './SoundFontManager';
import { synthManager } from './SynthManager';

interface JSSynthGlobal {
  waitForReady: () => Promise<void>;
  Synthesizer: new () => {
    isInitialized(): boolean;
    init(sampleRate: number): void;
    close(): void;
    createAudioNode(ctx: AudioContext, frameSize?: number): AudioNode;
    loadSFont(bin: ArrayBuffer): Promise<number>;
    midiNoteOn(chan: number, key: number, vel: number): void;
    midiNoteOff(chan: number, key: number): void;
    midiAllNotesOff(chan?: number): void;
    midiProgramSelect(chan: number, sfontId: number, bank: number, presetNum: number): void;
    setGain(gain: number): void;
    setReverb(roomsize: number, damping: number, width: number, level: number): void;
    setReverbOn(on: boolean): void;
    setChorus(voiceCount: number, level: number, speed: number, depthMs: number, type: number): void;
    setChorusOn(on: boolean): void;
    waitForVoicesStopped(): Promise<void>;
    unloadSFont(id: number): void;
  };
  AudioWorkletNodeSynthesizer: new () => unknown;
}

declare const JSSynth: JSSynthGlobal;

let jsSynthInstance: ReturnType<JSSynthGlobal['Synthesizer']['prototype']> | null = null;
let audioContext: AudioContext | null = null;
let sfBuffer: ArrayBuffer | null = null;

export async function initAudioEngine(): Promise<void> {
  await Tone.start();
  audioContext = Tone.getContext().rawContext as AudioContext;
}

export async function loadSoundFont(buffer: ArrayBuffer): Promise<void> {
  sfBuffer = buffer;
  if (!audioContext) {
    audioContext = Tone.getContext().rawContext as AudioContext;
  }

  await JSSynth.waitForReady();

  const synth = new JSSynth.Synthesizer();
  synth.init(audioContext.sampleRate);
  const node = synth.createAudioNode(audioContext, 4096);
  node.connect(audioContext.destination);

  const sfontId = await synth.loadSFont(buffer);

  jsSynthInstance = synth;
  soundFontManager.setSynth(synth as unknown as import('js-synthesizer/dist/lib/ISynthesizer').default);

  useProjectStore.getState().setSoundFontLoaded(true);
  useProjectStore.getState().setSoundFontId(sfontId);
}

export async function loadSoundFontFromUrl(url: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await loadSoundFont(buffer);
}

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function startPlayback() {
  const state = useProjectStore.getState();
  const { project } = state;

  Tone.Transport.bpm.value = project.bpm;
  Tone.Transport.position = '0:0:0';

  const loopStart = `${Math.floor(project.loopStart / project.timeSignature[0])}:${project.loopStart % project.timeSignature[0]}:0`;
  const loopEnd = `${Math.floor(project.loopEnd / project.timeSignature[0])}:${project.loopEnd % project.timeSignature[0]}:0`;

  Tone.Transport.loopStart = loopStart;
  Tone.Transport.loopEnd = loopEnd;
  Tone.Transport.loop = project.loopEnabled;

  const totalBeats = Math.max(
    1,
    ...project.tracks.flatMap((t) => t.notes.map((n) => n.start + n.duration)),
    16
  );
  const secondsPerBeat = 60 / project.bpm;

  soundFontManager.unscheduleAll();
  synthManager.stopAll();

  for (const track of project.tracks) {
    if (track.mute) continue;
    if (track.type === 'soundfont' && state.soundFontLoaded) {
      soundFontManager.scheduleTrackNotes(track, 0, totalBeats, secondsPerBeat);
    } else if (track.type === 'synth') {
      synthManager.scheduleNotes(track, 0, totalBeats, secondsPerBeat);
    }
  }

  Tone.Transport.scheduleRepeat((time) => {
    const pos = Tone.Transport.position as string;
    const parts = pos.split(':');
    const bars = parseInt(parts[0]) || 0;
    const beats = parseInt(parts[1]) || 0;
    const sixteenths = parseInt(parts[2]) || 0;
    const totalBeatsPos = bars * project.timeSignature[0] + beats + sixteenths / 4;
    useProjectStore.getState().setPlaybackPosition(totalBeatsPos);
  }, '16n');

  Tone.Transport.start();
  state.setPlaybackState('playing');
}

export function stopPlayback() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  soundFontManager.stopAll();
  synthManager.stopAll();
  soundFontManager.unscheduleAll();
  useProjectStore.getState().setPlaybackState('stopped');
  useProjectStore.getState().setPlaybackPosition(0);
}

export function pausePlayback() {
  Tone.Transport.pause();
  soundFontManager.stopAll();
  synthManager.stopAll();
  useProjectStore.getState().setPlaybackState('paused');
}

export function setBpm(bpm: number) {
  Tone.Transport.bpm.value = bpm;
  useProjectStore.getState().setBpm(bpm);
}

export function scheduleRegion(startBeat: number, endBeat: number) {
  const state = useProjectStore.getState();
  const { project } = state;
  const secondsPerBeat = 60 / project.bpm;

  for (const track of project.tracks) {
    if (track.mute) continue;
    if (track.type === 'soundfont' && state.soundFontLoaded) {
      soundFontManager.scheduleTrackNotes(track, startBeat, endBeat, secondsPerBeat);
    } else if (track.type === 'synth') {
      synthManager.scheduleNotes(track, startBeat, endBeat, secondsPerBeat);
    }
  }
}

export function previewNoteSoundFont(channel: number, pitch: number, velocity: number, duration: number) {
  soundFontManager.noteOn(channel, pitch, velocity);
  setTimeout(() => {
    soundFontManager.noteOff(channel, pitch);
  }, duration * 1000);
}

export function previewNoteSynth(trackId: string, pitch: number, velocity: number, duration: number) {
  const track = useProjectStore.getState().project.tracks.find((t) => t.id === trackId);
  if (!track) return;

  const ts = synthManager.getOrCreateTrackSynth(track);
  if (!ts?.synth) return;

  const noteName = Tone.Frequency(pitch, 'midi').toNote();
  const vel = velocity / 127;
  const now = Tone.now();

  if (ts.synth instanceof Tone.PolySynth) {
    ts.synth.triggerAttackRelease(noteName, duration, now, vel);
  } else if (ts.synth instanceof Tone.MembraneSynth) {
    ts.synth.triggerAttackRelease(noteName, duration, now, vel);
  }
}

export function destroyEngine() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  synthManager.destroy();
  soundFontManager.destroy();
  if (jsSynthInstance) {
    jsSynthInstance.close();
    jsSynthInstance = null;
  }
}
