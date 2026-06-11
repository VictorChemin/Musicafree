# Musicafree

Free browser-based Digital Audio Workstation (DAW) with professional features.

## Features

- **Multi-track timeline** with SoundFont and synth instruments
- **Piano roll** editor with pencil, select, and erase tools
- **Mixer** per-track (volume, pan, mute, solo)
- **SoundFont support** via FluidSynth WASM (FluidR3_GM)
- **Synthesizers** (oscillator, FM, AM, drum)
- **Instrument rack** with ADSR envelope, filter, and waveform controls
- **Export** to WAV and MIDI
- **Save/Load** projects in IndexedDB or JSON files

## Setup

```bash
npm install
npm run dev
```

## SoundFont

For realistic instrument sounds, download FluidR3_GM.sf2 and place it in `public/soundfonts/FluidR3_GM.sf2`.

Download: https://github.com/musescore/FluidR3_GM

Synth sounds work without the SoundFont file.

## Build

```bash
npm run build
```

Outputs to `dist/` - ready for static hosting (Cloudflare Pages, Vercel, etc.).

## Tech Stack

- **React** + **TypeScript** (UI)
- **Vite** (build)
- **Tone.js** (audio synthesis, transport, effects)
- **js-synthesizer / FluidSynth WASM** (SoundFont playback)
- **Zustand** (state management)
- **midi-writer-js** (MIDI export)

## License

MIT
