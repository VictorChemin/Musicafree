import MidiWriter from 'midi-writer-js';
import type { Project } from '../types';

export function exportMidi(project: Project): Uint8Array {
  const tracks = [];

  for (const projTrack of project.tracks) {
    const track = new MidiWriter.Track();
    track.setTempo(project.bpm);
    track.addTrackName(projTrack.name);

    if (projTrack.type === 'soundfont') {
      track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: projTrack.soundfontPreset }));
    }

    for (const note of projTrack.notes) {
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: [MidiWriter.Utils.toPitch(note.pitch + 21)],
        duration: `T${Math.round(note.duration * 480)}`,
        startTick: Math.round(note.start * 480),
        velocity: Math.round(note.velocity * 0.9),
        channel: projTrack.channel,
      }));
    }

    tracks.push(track);
  }

  const writer = new MidiWriter.Writer(tracks);
  return writer.buildFile();
}

export function downloadMidi(project: Project, filename: string = 'musicafree.mid') {
  const data = exportMidi(project);
  const blob = new Blob([data], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
