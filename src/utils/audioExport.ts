import * as Tone from 'tone';
import type { Project, Note } from '../types';

export async function exportWav(
  project: Project,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const totalBeats = Math.max(
    1,
    ...project.tracks.flatMap((t) => t.notes.map((n) => n.start + n.duration))
  );

  const duration = (totalBeats * 60) / project.bpm;
  const sampleRate = 44100;
  const totalSamples = Math.ceil(duration * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  const masterVol = offlineCtx.createGain();
  masterVol.gain.value = 0.8;
  masterVol.connect(offlineCtx.destination);

  for (const track of project.tracks) {
    if (track.mute || track.type !== 'synth') continue;

    const volNode = offlineCtx.createGain();
    volNode.gain.value = track.volume;

    const panNode = offlineCtx.createStereoPanner();
    panNode.pan.value = track.pan;

    volNode.connect(panNode);
    panNode.connect(masterVol);

    const config = track.synthConfig;
    const now = offlineCtx.currentTime;

    for (const note of track.notes) {
      const startTime = (note.start * 60) / project.bpm;
      const noteDuration = (note.duration * 60) / project.bpm;
      const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);
      const vel = note.velocity / 127;

      switch (config.type) {
        case 'oscillator': {
          const osc = offlineCtx.createOscillator();
          osc.type = config.oscillatorType;
          osc.frequency.value = freq;
          osc.detune.value = config.detune;

          const env = offlineCtx.createGain();
          env.gain.setValueAtTime(0, now + startTime);
          env.gain.linearRampToValueAtTime(vel, now + startTime + config.envelope.attack);
          env.gain.linearRampToValueAtTime(vel * config.envelope.sustain, now + startTime + config.envelope.attack + config.envelope.decay);
          env.gain.setValueAtTime(vel * config.envelope.sustain, now + startTime + noteDuration);
          env.gain.linearRampToValueAtTime(0, now + startTime + noteDuration + config.envelope.release);

          osc.connect(env);
          env.connect(volNode);
          osc.start(now + startTime);
          osc.stop(now + startTime + noteDuration + config.envelope.release + 0.1);
          break;
        }
        case 'drum': {
          const osc = offlineCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + startTime);
          osc.frequency.exponentialRampToValueAtTime(20, now + startTime + 0.1);

          const env = offlineCtx.createGain();
          env.gain.setValueAtTime(vel, now + startTime);
          env.gain.exponentialRampToValueAtTime(0.01, now + startTime + noteDuration);

          const noise = offlineCtx.createOscillator();
          noise.type = 'sawtooth';
          noise.frequency.value = 100;

          const noiseEnv = offlineCtx.createGain();
          noiseEnv.gain.setValueAtTime(vel * 0.2, now + startTime);
          noiseEnv.gain.exponentialRampToValueAtTime(0.01, now + startTime + 0.05);

          osc.connect(env);
          noise.connect(noiseEnv);
          env.connect(volNode);
          noiseEnv.connect(volNode);
          osc.start(now + startTime);
          osc.stop(now + startTime + noteDuration + 0.1);
          noise.start(now + startTime);
          noise.stop(now + startTime + 0.1);
          break;
        }
      }
    }
  }

  if (onProgress) onProgress(10);

  const renderedBuffer = await offlineCtx.startRendering();

  if (onProgress) onProgress(90);

  const numChannels = renderedBuffer.numberOfChannels;
  const length = renderedBuffer.length;
  const sampleRateOut = renderedBuffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;

  const dataLength = length * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRateOut, true);
  view.setUint32(28, sampleRateOut * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(renderedBuffer.getChannelData(ch));
  }

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function downloadWav(project: Project) {
  const blob = await exportWav(project);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'musicafree.wav';
  a.click();
  URL.revokeObjectURL(url);
}
