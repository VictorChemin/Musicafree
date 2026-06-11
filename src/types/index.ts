export interface Note {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

export type SynthType = 'oscillator' | 'fm' | 'am' | 'drum';

export type SynthOscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SynthConfig {
  type: SynthType;
  oscillatorType: SynthOscType;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filterEnvelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    amount: number;
  };
  filterCutoff: number;
  filterType: BiquadFilterType;
  volume: number;
  detune: number;
  modulationIndex: number;
  harmonicity: number;
  noiseAmount: number;
  drumType?: 'kick' | 'snare' | 'hihat' | 'tom' | 'clap';
}

export const GM_INSTRUMENT_NAMES: Record<number, string> = {
  0: 'Acoustic Grand Piano',
  1: 'Bright Acoustic Piano',
  2: 'Electric Grand Piano',
  3: 'Honky-tonk Piano',
  4: 'Electric Piano 1',
  5: 'Electric Piano 2',
  6: 'Harpsichord',
  7: 'Clavinet',
  8: 'Celesta',
  9: 'Glockenspiel',
  10: 'Music Box',
  11: 'Vibraphone',
  12: 'Marimba',
  13: 'Xylophone',
  14: 'Tubular Bells',
  15: 'Dulcimer',
  16: 'Drawbar Organ',
  17: 'Percussive Organ',
  18: 'Rock Organ',
  19: 'Church Organ',
  20: 'Reed Organ',
  21: 'Accordion',
  22: 'Harmonica',
  23: 'Tango Accordion',
  24: 'Nylon Guitar',
  25: 'Steel Acoustic Guitar',
  26: 'Jazz Electric Guitar',
  27: 'Clean Electric Guitar',
  28: 'Muted Electric Guitar',
  29: 'Overdriven Guitar',
  30: 'Distortion Guitar',
  31: 'Guitar Harmonics',
  32: 'Acoustic Bass',
  33: 'Finger Bass',
  34: 'Pick Bass',
  35: 'Fretless Bass',
  36: 'Slap Bass 1',
  37: 'Slap Bass 2',
  38: 'Synth Bass 1',
  39: 'Synth Bass 2',
  40: 'Violin',
  41: 'Viola',
  42: 'Cello',
  43: 'Contrabass',
  44: 'Tremolo Strings',
  45: 'Pizzicato Strings',
  46: 'Orchestral Harp',
  47: 'Timpani',
  48: 'String Ensemble 1',
  49: 'String Ensemble 2',
  50: 'Synth Strings 1',
  51: 'Synth Strings 2',
  52: 'Choir Aahs',
  53: 'Voice Oohs',
  54: 'Synth Voice',
  55: 'Orchestra Hit',
  56: 'Trumpet',
  57: 'Trombone',
  58: 'Tuba',
  59: 'Muted Trumpet',
  60: 'French Horn',
  61: 'Brass Section',
  62: 'Synth Brass 1',
  63: 'Synth Brass 2',
  64: 'Soprano Sax',
  65: 'Alto Sax',
  66: 'Tenor Sax',
  67: 'Baritone Sax',
  68: 'Oboe',
  69: 'English Horn',
  70: 'Bassoon',
  71: 'Clarinet',
  72: 'Piccolo',
  73: 'Flute',
  74: 'Recorder',
  75: 'Pan Flute',
  76: 'Blown Bottle',
  77: 'Shakuhachi',
  78: 'Whistle',
  79: 'Ocarina',
  80: 'Lead 1 (Square)',
  81: 'Lead 2 (Sawtooth)',
  82: 'Lead 3 (Calliope)',
  83: 'Lead 4 (Chiff)',
  84: 'Lead 5 (Charang)',
  85: 'Lead 6 (Voice)',
  86: 'Lead 7 (Fifths)',
  87: 'Lead 8 (Bass+Lead)',
  88: 'Pad 1 (New Age)',
  89: 'Pad 2 (Warm)',
  90: 'Pad 3 (Polysynth)',
  91: 'Pad 4 (Choir)',
  92: 'Pad 5 (Bowed)',
  93: 'Pad 6 (Metallic)',
  94: 'Pad 7 (Halo)',
  95: 'Pad 8 (Sweep)',
  96: 'FX 1 (Rain)',
  97: 'FX 2 (Soundtrack)',
  98: 'FX 3 (Crystal)',
  99: 'FX 4 (Atmosphere)',
  100: 'FX 5 (Brightness)',
  101: 'FX 6 (Goblins)',
  102: 'FX 7 (Echoes)',
  103: 'FX 8 (Sci-Fi)',
  104: 'Sitar',
  105: 'Banjo',
  106: 'Shamisen',
  107: 'Koto',
  108: 'Kalimba',
  109: 'Bagpipe',
  110: 'Fiddle',
  111: 'Shanai',
  112: 'Tinkle Bell',
  113: 'Agogo',
  114: 'Steel Drums',
  115: 'Woodblock',
  116: 'Taiko Drum',
  117: 'Melodic Tom',
  118: 'Synth Drum',
  119: 'Reverse Cymbal',
  120: 'Guitar Fret Noise',
  121: 'Breath Noise',
  122: 'Seashore',
  123: 'Bird Tweet',
  124: 'Telephone Ring',
  125: 'Helicopter',
  126: 'Applause',
  127: 'Gunshot',
};

export type EffectType = 'reverb' | 'delay' | 'distortion' | 'chorus' | 'eq' | 'compressor';

export interface Effect {
  id: string;
  type: EffectType;
  enabled: boolean;
  params: Record<string, number>;
}

export type TrackType = 'soundfont' | 'synth';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  channel: number;
  soundfontPreset: number;
  synthConfig: SynthConfig;
  notes: Note[];
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  effects: Effect[];
  color: string;
}

export interface Project {
  tracks: Track[];
  bpm: number;
  timeSignature: [number, number];
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
}

export const DEFAULT_SYNTH_CONFIG: SynthConfig = {
  type: 'oscillator',
  oscillatorType: 'sawtooth',
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
  filterEnvelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.5, amount: 0 },
  filterCutoff: 20000,
  filterType: 'lowpass',
  volume: -6,
  detune: 0,
  modulationIndex: 1,
  harmonicity: 1,
  noiseAmount: 0,
};

export const TRACK_COLORS = [
  '#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#27ae60', '#2980b9', '#8e44ad',
  '#d35400', '#16a085', '#c0392b', '#7f8c8d', '#2c3e50',
  '#f1c40f',
];

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export type ToolMode = 'pencil' | 'select' | 'erase';
