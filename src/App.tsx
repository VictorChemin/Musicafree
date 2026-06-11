import { useEffect, useState } from 'react';
import { useProjectStore } from './store/projectStore';
import { initAudioEngine, loadSoundFontFromUrl } from './audio/engine';
import TransportBar from './components/Transport/TransportBar';
import Timeline from './components/Timeline/Timeline';
import PianoRoll from './components/PianoRoll/PianoRoll';
import Mixer from './components/Mixer/Mixer';
import InstrumentRack from './components/InstrumentRack/InstrumentRack';
import TopMenu from './components/Menu/TopMenu';

export default function App() {
  const [audioReady, setAudioReady] = useState(false);
  const [sfLoading, setSfLoading] = useState(false);
  const [sfError, setSfError] = useState<string | null>(null);
  const soundFontLoaded = useProjectStore((s) => s.soundFontLoaded);

  useEffect(() => {
    const init = async () => {
      try {
        await initAudioEngine();
        setAudioReady(true);
      } catch (e) {
        console.error('Failed to init audio:', e);
      }
    };
    init();
  }, []);

  const handleLoadSoundFont = async () => {
    setSfLoading(true);
    setSfError(null);
    try {
      await loadSoundFontFromUrl('/soundfonts/FluidR3_GM.sf2');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[App] SoundFont load error:', msg);
      setSfError(msg);
    } finally {
      setSfLoading(false);
    }
  };

  return (
    <div className="app">
      <TopMenu />
      {!audioReady && (
        <div className="loading-screen">
          <h1>Musicafree</h1>
          <p>Click anywhere to start...</p>
          <button onClick={() => initAudioEngine().then(() => setAudioReady(true))}>
            Initialize Audio
          </button>
        </div>
      )}
      {audioReady && !soundFontLoaded && (
        <div className="soundfont-overlay">
          <div className="soundfont-dialog">
            <h2>SoundFont Required</h2>
            <p>
              For realistic instrument sounds, download FluidR3_GM.sf2
              and place it in <code>public/soundfonts/FluidR3_GM.sf2</code>
            </p>
            <p className="sf-small">Without it, only synth sounds are available.</p>
            <button onClick={handleLoadSoundFont} disabled={sfLoading}>
              {sfLoading ? 'Loading...' : 'Try Loading SoundFont'}
            </button>
            <button onClick={() => useProjectStore.getState().setSoundFontLoaded(true)} className="sf-skip">
              Skip (use synths only)
            </button>
            {sfError && <p className="sf-error">{sfError}</p>}
          </div>
        </div>
      )}
      {audioReady && (
        <div className="app-layout">
          <TransportBar />
          <div className="app-main">
            <Timeline />
            <div className="app-center">
              <PianoRoll />
              <Mixer />
            </div>
            <InstrumentRack />
          </div>
        </div>
      )}
    </div>
  );
}
