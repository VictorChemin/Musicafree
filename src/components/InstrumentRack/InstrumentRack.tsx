import { useProjectStore } from '../../store/projectStore';
import { GM_INSTRUMENT_NAMES, DEFAULT_SYNTH_CONFIG, type SynthType, type SynthOscType } from '../../types';

export default function InstrumentRack() {
  const tracks = useProjectStore((s) => s.project.tracks);
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId);
  const updateTrack = useProjectStore((s) => s.updateTrack);

  const track = tracks.find((t) => t.id === selectedTrackId) ?? null;

  if (!track) {
    return (
      <div className="instrument-rack">
        <div className="rack-header">Instrument</div>
        <div className="rack-empty">Select a track</div>
      </div>
    );
  }

  return (
    <div className="instrument-rack">
      <div className="rack-header">Instrument - {track.name}</div>
      <div className="rack-body">
        {track.type === 'soundfont' ? (
          <div className="sf-controls">
            <label className="control-group">
              <span>GM Preset</span>
              <select
                value={track.soundfontPreset}
                onChange={(e) => updateTrack(track.id, { soundfontPreset: parseInt(e.target.value) })}
              >
                {Object.entries(GM_INSTRUMENT_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>
                    {id} - {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="synth-controls">
            <label className="control-group">
              <span>Type</span>
              <select
                value={track.synthConfig.type}
                onChange={(e) =>
                  updateTrack(track.id, {
                    synthConfig: { ...track.synthConfig, type: e.target.value as SynthType },
                  })
                }
              >
                <option value="oscillator">Oscillator</option>
                <option value="fm">FM Synth</option>
                <option value="am">AM Synth</option>
                <option value="drum">Drum</option>
              </select>
            </label>

            <label className="control-group">
              <span>Waveform</span>
              <select
                value={track.synthConfig.oscillatorType}
                onChange={(e) =>
                  updateTrack(track.id, {
                    synthConfig: {
                      ...track.synthConfig,
                      oscillatorType: e.target.value as SynthOscType,
                    },
                  })
                }
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="triangle">Triangle</option>
              </select>
            </label>

            <div className="control-group">
              <span>ADSR Envelope</span>
              <div className="adsr-grid">
                <label>A <input type="range" min="0" max="2" step="0.001" value={track.synthConfig.envelope.attack}
                  onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, envelope: { ...track.synthConfig.envelope, attack: parseFloat(e.target.value) } } })} /></label>
                <label>D <input type="range" min="0" max="2" step="0.001" value={track.synthConfig.envelope.decay}
                  onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, envelope: { ...track.synthConfig.envelope, decay: parseFloat(e.target.value) } } })} /></label>
                <label>S <input type="range" min="0" max="1" step="0.01" value={track.synthConfig.envelope.sustain}
                  onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, envelope: { ...track.synthConfig.envelope, sustain: parseFloat(e.target.value) } } })} /></label>
                <label>R <input type="range" min="0" max="5" step="0.001" value={track.synthConfig.envelope.release}
                  onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, envelope: { ...track.synthConfig.envelope, release: parseFloat(e.target.value) } } })} /></label>
              </div>
            </div>

            <div className="control-group">
              <span>Filter Cutoff</span>
              <input type="range" min="20" max="20000" step="1" value={track.synthConfig.filterCutoff}
                onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, filterCutoff: parseFloat(e.target.value) } })} />
              <span className="param-value">{track.synthConfig.filterCutoff}Hz</span>
            </div>

            <div className="control-group">
              <span>Volume</span>
              <input type="range" min="-40" max="6" step="0.1" value={track.synthConfig.volume}
                onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, volume: parseFloat(e.target.value) } })} />
              <span className="param-value">{track.synthConfig.volume}dB</span>
            </div>

            {track.synthConfig.type === 'fm' && (
              <>
                <div className="control-group">
                  <span>Modulation Index</span>
                  <input type="range" min="0" max="40" step="0.1" value={track.synthConfig.modulationIndex}
                    onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, modulationIndex: parseFloat(e.target.value) } })} />
                  <span className="param-value">{track.synthConfig.modulationIndex}</span>
                </div>
                <div className="control-group">
                  <span>Harmonicity</span>
                  <input type="range" min="0.5" max="10" step="0.1" value={track.synthConfig.harmonicity}
                    onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, harmonicity: parseFloat(e.target.value) } })} />
                  <span className="param-value">{track.synthConfig.harmonicity}</span>
                </div>
              </>
            )}

            <div className="control-group">
              <span>Detune (cents)</span>
              <input type="range" min="-1200" max="1200" step="1" value={track.synthConfig.detune}
                onChange={(e) => updateTrack(track.id, { synthConfig: { ...track.synthConfig, detune: parseFloat(e.target.value) } })} />
              <span className="param-value">{track.synthConfig.detune}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
