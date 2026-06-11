import { useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { previewNoteSoundFont, previewNoteSynth } from '../../audio/engine';
import type { Note } from '../../types';

const PIANO_ROLL_HEIGHT = 600;
const NOTE_HEIGHT = 18;
const PIANO_WIDTH = 72;
const BEAT_WIDTH_MIN = 20;
const BEAT_WIDTH_MAX = 80;
const TOTAL_PITCHES = 128;
const GRID_MIDI_FROM = 21;
const GRID_MIDI_TO = 108;
const GRID_PITCH_COUNT = GRID_MIDI_TO - GRID_MIDI_FROM + 1;

const BLACK_KEYS = new Set([0, 1, 3, 4, 5, 7, 8, 10, 12, 13, 15, 16, 17, 19, 20, 21, 23, 24, 25, 27, 28, 29, 31, 32, 33, 35, 36, 37, 39, 40, 41, 43, 44, 45, 47, 48, 49, 51, 52, 53, 55, 56, 57, 59, 60, 61, 63, 64, 65, 67, 68, 69, 71, 72, 73, 75, 76, 77, 79, 80, 81, 83, 84, 85, 87, 88, 89, 91, 92, 93, 95, 96, 97, 99, 100, 101, 103, 104, 105, 107, 108, 109, 111, 112, 113, 115, 116, 117, 119, 120, 121, 123, 124, 125, 127]);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

function isBlackKey(midi: number): boolean {
  return BLACK_KEYS.has(midi % 12);
}

function midiToY(midi: number, beatWidth: number): number {
  return (GRID_MIDI_TO - midi) * NOTE_HEIGHT;
}

function yToMidi(y: number): number {
  const pitch = GRID_MIDI_TO - Math.floor(y / NOTE_HEIGHT);
  return Math.max(GRID_MIDI_FROM, Math.min(GRID_MIDI_TO, pitch));
}

function beatToX(beat: number, beatWidth: number): number {
  return PIANO_WIDTH + beat * beatWidth;
}

function xToBeat(x: number, beatWidth: number): number {
  return (x - PIANO_WIDTH) / beatWidth;
}

export default function PianoRoll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId);
  const tracks = useProjectStore((s) => s.project.tracks);
  const selectedNoteIds = useProjectStore((s) => s.selectedNoteIds);
  const toolMode = useProjectStore((s) => s.toolMode);
  const bpm = useProjectStore((s) => s.project.bpm);
  const soundFontLoaded = useProjectStore((s) => s.soundFontLoaded);
  const addNote = useProjectStore((s) => s.addNote);
  const removeNote = useProjectStore((s) => s.removeNote);
  const updateNote = useProjectStore((s) => s.updateNote);
  const selectNote = useProjectStore((s) => s.selectNote);
  const clearNoteSelection = useProjectStore((s) => s.clearNoteSelection);

  const track = tracks.find((t) => t.id === selectedTrackId) ?? null;
  const notes = track?.notes ?? [];

  const beatWidthRef = useRef(40);
  const scrollXRef = useRef(0);
  const scrollYRef = useRef(0);
  const dragState = useRef<{ noteId: string; type: 'move' | 'resize'; startX: number; startY: number; origNote: Note } | null>(null);
  const isDragging = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bw = beatWidthRef.current;
    const sx = scrollXRef.current;
    const sy = scrollYRef.current;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    for (let beat = Math.floor(sx); beat < sx + (w - PIANO_WIDTH) / bw + 1; beat++) {
      const x = beatToX(beat - sx, bw);
      if (x > w) break;

      ctx.strokeStyle = beat % 4 === 0 ? '#3a3a5c' : '#252540';
      ctx.lineWidth = beat % 4 === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      if (beat % 4 === 0 && x > PIANO_WIDTH + 5) {
        ctx.fillStyle = '#555577';
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.floor(beat / 4) + 1}`, x + 2, 12);
      }
    }

    for (let pitch = GRID_MIDI_FROM; pitch <= GRID_MIDI_TO; pitch++) {
      const y = midiToY(pitch, bw) - sy;
      if (y < -NOTE_HEIGHT || y > h + NOTE_HEIGHT) continue;

      const bk = isBlackKey(pitch);
      ctx.fillStyle = bk ? '#1e1e35' : '#222240';
      ctx.fillRect(PIANO_WIDTH, y, w - PIANO_WIDTH, NOTE_HEIGHT);

      if (bk) {
        ctx.fillStyle = '#1a1a30';
        ctx.fillRect(PIANO_WIDTH, y, w - PIANO_WIDTH, NOTE_HEIGHT * 0.5);
      }

      ctx.strokeStyle = '#2a2a45';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(PIANO_WIDTH, y, w - PIANO_WIDTH, NOTE_HEIGHT);
    }

    ctx.fillStyle = '#12121d';
    ctx.fillRect(0, 0, PIANO_WIDTH, h);

    for (let pitch = GRID_MIDI_FROM; pitch <= GRID_MIDI_TO; pitch++) {
      const y = midiToY(pitch, bw) - sy;
      if (y < -NOTE_HEIGHT || y > h + NOTE_HEIGHT) continue;

      const bk = isBlackKey(pitch);
      ctx.fillStyle = bk ? '#2a2a3e' : '#3a3a50';
      ctx.fillRect(0, y, PIANO_WIDTH, NOTE_HEIGHT);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y, PIANO_WIDTH, NOTE_HEIGHT);

      const noteInOctave = pitch % 12;
      if (noteInOctave === 0 && y + NOTE_HEIGHT < h) {
        ctx.fillStyle = '#8888aa';
        ctx.font = '9px monospace';
        ctx.fillText(midiToNoteName(pitch), PIANO_WIDTH - 28, y + NOTE_HEIGHT - 3);
      }
    }

    const visibleNotes = notes.filter((n) => {
      const nx = beatToX(n.start - sx, bw);
      const ny = midiToY(n.pitch, bw) - sy;
      return nx + n.duration * bw > PIANO_WIDTH && nx < w && ny + NOTE_HEIGHT > 0 && ny < h;
    });

    for (const note of visibleNotes) {
      const nx = beatToX(note.start - sx, bw);
      const ny = midiToY(note.pitch, bw) - sy;
      const nw = note.duration * bw;

      const isSelected = selectedNoteIds.includes(note.id);
      const vel = note.velocity / 127;
      const hue = track ? (track.color ? parseInt(track.color.slice(1, 3), 16) / 360 * 360 : 200) : 200;
      ctx.fillStyle = isSelected
        ? `hsla(${hue}, 70%, 65%, 0.95)`
        : `hsla(${hue}, 60%, 55%, 0.85)`;

      const radius = 3;
      const rx = Math.max(PIANO_WIDTH, nx);
      const rw = nw - (nx < PIANO_WIDTH ? PIANO_WIDTH - nx : 0);
      const ry = ny + 1;
      const rh = NOTE_HEIGHT - 2;

      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(w - 12, 0, 12, h);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, h - 12, w, 12);
  }, [notes, selectedNoteIds, track, bpm]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteIds.length > 0 && selectedTrackId) {
          for (const id of selectedNoteIds) {
            removeNote(selectedTrackId, id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteIds, selectedTrackId, removeNote]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const findNoteAt = (x: number, y: number): Note | null => {
    const bw = beatWidthRef.current;
    const sx = scrollXRef.current;
    const sy = scrollYRef.current;

    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      const nx = beatToX(n.start - sx, bw);
      const ny = midiToY(n.pitch, bw) - sy;
      const nw = n.duration * bw;

      if (x >= nx && x <= nx + nw && y >= ny && y <= ny + NOTE_HEIGHT) {
        if (x - nx < 6 && nw > 12) return { ...n, _hitEdge: 'left' } as any;
        if (nx + nw - x < 6 && nw > 12) return { ...n, _hitEdge: 'right' } as any;
        return n;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!track) return;
    const { x, y } = getCanvasPos(e);
    const bw = beatWidthRef.current;

    if (x < PIANO_WIDTH) {
      const midi = yToMidi(y + scrollYRef.current);
      previewNoteSoundFont(track.channel, midi, 100, 0.3);
      return;
    }

    const hitNote = findNoteAt(x, y) as Note & { _hitEdge?: string };

    if (hitNote) {
      if (toolMode === 'erase') {
        removeNote(track.id, hitNote.id);
        return;
      }

      if (hitNote._hitEdge === 'right') {
        dragState.current = {
          noteId: hitNote.id,
          type: 'resize',
          startX: e.clientX,
          startY: e.clientY,
          origNote: { ...hitNote },
        };
      } else {
        selectNote(hitNote.id, e.shiftKey);
        dragState.current = {
          noteId: hitNote.id,
          type: 'move',
          startX: e.clientX,
          startY: e.clientY,
          origNote: { ...hitNote },
        };
      }
      isDragging.current = true;
      return;
    }

    if (toolMode === 'pencil') {
      const beat = Math.max(0, xToBeat(x, bw));
      const quantizedBeat = Math.round(beat * 4) / 4;
      const pitch = yToMidi(y + scrollYRef.current);
      const id = addNote(track.id, pitch, quantizedBeat, 0.5, 100);
      if (track.type === 'soundfont' && soundFontLoaded) {
        previewNoteSoundFont(track.channel, pitch, 100, 0.15);
      } else {
        previewNoteSynth(track.id, pitch, 100, 0.15);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !dragState.current || !track) return;
    const bw = beatWidthRef.current;
    const dx = (e.clientX - dragState.current.startX) / bw;
    const dy = (e.clientY - dragState.current.startY) / NOTE_HEIGHT;

    if (dragState.current.type === 'move') {
      const newStart = Math.max(0, dragState.current.origNote.start + dx);
      const quantizedStart = Math.round(newStart * 4) / 4;
      const newPitch = Math.round(dragState.current.origNote.pitch - dy);
      const clampedPitch = Math.max(0, Math.min(127, newPitch));
      updateNote(track.id, dragState.current.noteId, { start: quantizedStart, pitch: clampedPitch });
    } else if (dragState.current.type === 'resize') {
      const newDuration = Math.max(0.125, dragState.current.origNote.duration + dx);
      const quantizedDuration = Math.round(newDuration * 4) / 4;
      updateNote(track.id, dragState.current.noteId, { duration: quantizedDuration });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    dragState.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      beatWidthRef.current = Math.max(BEAT_WIDTH_MIN, Math.min(BEAT_WIDTH_MAX, beatWidthRef.current - e.deltaY * 0.1));
    } else if (e.shiftKey) {
      scrollXRef.current = Math.max(0, scrollXRef.current + e.deltaY * 0.05);
    } else {
      scrollXRef.current = Math.max(0, scrollXRef.current + e.deltaX * 0.03);
      scrollYRef.current = Math.max(0, scrollYRef.current + e.deltaY * 0.03);
    }
    draw();
  };

  if (!track) {
    return (
      <div className="piano-roll-empty">
        <p>Select or create a track to start composing</p>
      </div>
    );
  }

  return (
    <div className="piano-roll-container">
      <div className="piano-roll-toolbar">
        <span className="track-name" style={{ color: track.color }}>{track.name}</span>
        <div className="tool-mode">
          <button className={toolMode === 'pencil' ? 'active' : ''} onClick={() => useProjectStore.getState().setToolMode('pencil')} title="Draw (P)">&#9998;</button>
          <button className={toolMode === 'select' ? 'active' : ''} onClick={() => useProjectStore.getState().setToolMode('select')} title="Select (S)">&#9758;</button>
          <button className={toolMode === 'erase' ? 'active' : ''} onClick={() => useProjectStore.getState().setToolMode('erase')} title="Erase (E)">&#9003;</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="piano-roll-canvas"
        style={{ width: '100%', height: `${PIANO_ROLL_HEIGHT}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
