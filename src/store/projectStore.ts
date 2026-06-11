import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Track, Note, PlaybackState, ToolMode, SynthConfig } from '../types';
import { DEFAULT_SYNTH_CONFIG, TRACK_COLORS } from '../types';

interface ProjectState {
  project: Project;
  selectedTrackId: string | null;
  selectedNoteIds: string[];
  playbackState: PlaybackState;
  playbackPosition: number;
  toolMode: ToolMode;
  soundFontLoaded: boolean;
  soundFontId: number;

  setProject: (project: Project) => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: [number, number]) => void;
  setLoop: (start: number, end: number, enabled: boolean) => void;

  addTrack: (type: 'soundfont' | 'synth', channel: number) => string;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;

  addNote: (trackId: string, pitch: number, start: number, duration: number, velocity: number) => string;
  removeNote: (trackId: string, noteId: string) => void;
  updateNote: (trackId: string, noteId: string, updates: Partial<Note>) => void;
  removeSelectedNotes: () => void;

  selectTrack: (trackId: string | null) => void;
  selectNote: (noteId: string, additive?: boolean) => void;
  clearNoteSelection: () => void;

  setPlaybackState: (state: PlaybackState) => void;
  setPlaybackPosition: (position: number) => void;
  setToolMode: (mode: ToolMode) => void;

  setSoundFontLoaded: (loaded: boolean) => void;
  setSoundFontId: (id: number) => void;
}

const createDefaultTrack = (type: 'soundfont' | 'synth', channel: number, index: number): Track => ({
  id: uuidv4(),
  name: type === 'soundfont' ? `SoundFont ${channel + 1}` : `Synth ${channel + 1}`,
  type,
  channel,
  soundfontPreset: type === 'soundfont' ? 0 : 0,
  synthConfig: { ...DEFAULT_SYNTH_CONFIG },
  notes: [],
  volume: 0.75,
  pan: 0,
  mute: false,
  solo: false,
  effects: [],
  color: TRACK_COLORS[index % TRACK_COLORS.length],
});

const defaultProject: Project = {
  tracks: [],
  bpm: 120,
  timeSignature: [4, 4],
  loopStart: 0,
  loopEnd: 16,
  loopEnabled: false,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: defaultProject,
  selectedTrackId: null,
  selectedNoteIds: [],
  playbackState: 'stopped',
  playbackPosition: 0,
  toolMode: 'pencil',
  soundFontLoaded: false,
  soundFontId: -1,

  setProject: (project) => set({ project }),

  setBpm: (bpm) => set((s) => ({ project: { ...s.project, bpm } })),

  setTimeSignature: (ts) => set((s) => ({ project: { ...s.project, timeSignature: ts } })),

  setLoop: (loopStart, loopEnd, loopEnabled) =>
    set((s) => ({ project: { ...s.project, loopStart, loopEnd, loopEnabled } })),

  addTrack: (type, channel) => {
    const id = uuidv4();
    const idx = get().project.tracks.length;
    set((s) => ({
      project: {
        ...s.project,
        tracks: [...s.project.tracks, createDefaultTrack(type, channel, idx)],
      },
      selectedTrackId: id,
    }));
    return id;
  },

  removeTrack: (trackId) =>
    set((s) => ({
      project: { ...s.project, tracks: s.project.tracks.filter((t) => t.id !== trackId) },
      selectedTrackId: s.selectedTrackId === trackId ? null : s.selectedTrackId,
    })),

  updateTrack: (trackId, updates) =>
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
      },
    })),

  setTrackVolume: (trackId, volume) =>
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === trackId ? { ...t, volume: Math.max(0, Math.min(1, volume)) } : t
        ),
      },
    })),

  setTrackPan: (trackId, pan) =>
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === trackId ? { ...t, pan: Math.max(-1, Math.min(1, pan)) } : t
        ),
      },
    })),

  toggleTrackMute: (trackId) =>
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === trackId ? { ...t, mute: !t.mute } : t
        ),
      },
    })),

  toggleTrackSolo: (trackId) =>
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === trackId ? { ...t, solo: !t.solo } : t
        ),
      },
    })),

  addNote: (trackId, pitch, start, duration, velocity) => {
    const id = uuidv4();
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === trackId
            ? { ...t, notes: [...t.notes, { id, pitch, start, duration, velocity }] }
            : t
        ),
      },
      selectedNoteIds: [id],
    }));
    return id;
  },

  removeNote: (trackId, noteId) =>
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === trackId
            ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) }
            : t
        ),
      },
      selectedNoteIds: s.selectedNoteIds.filter((id) => id !== noteId),
    })),

  updateNote: (trackId, noteId, updates) =>
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                notes: t.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
              }
            : t
        ),
      },
    })),

  removeSelectedNotes: () => {
    const { selectedTrackId, selectedNoteIds } = get();
    if (!selectedTrackId) return;
    set((s) => ({
      project: {
        ...s.project,
        tracks: s.project.tracks.map((t) =>
          t.id === selectedTrackId
            ? { ...t, notes: t.notes.filter((n) => !selectedNoteIds.includes(n.id)) }
            : t
        ),
      },
      selectedNoteIds: [],
    }));
  },

  selectTrack: (trackId) => set({ selectedTrackId: trackId }),

  selectNote: (noteId, additive = false) =>
    set((s) => ({
      selectedNoteIds: additive
        ? s.selectedNoteIds.includes(noteId)
          ? s.selectedNoteIds.filter((id) => id !== noteId)
          : [...s.selectedNoteIds, noteId]
        : [noteId],
    })),

  clearNoteSelection: () => set({ selectedNoteIds: [] }),

  setPlaybackState: (playbackState) => set({ playbackState }),
  setPlaybackPosition: (playbackPosition) => set({ playbackPosition }),
  setToolMode: (toolMode) => set({ toolMode }),

  setSoundFontLoaded: (soundFontLoaded) => set({ soundFontLoaded }),
  setSoundFontId: (soundFontId) => set({ soundFontId }),
}));
