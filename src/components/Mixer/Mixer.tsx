import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { Track } from '../../types';

function ChannelStrip({ track }: { track: Track }) {
  const setVolume = useProjectStore((s) => s.setTrackVolume);
  const setPan = useProjectStore((s) => s.setTrackPan);
  const toggleMute = useProjectStore((s) => s.toggleTrackMute);
  const toggleSolo = useProjectStore((s) => s.toggleTrackSolo);

  return (
    <div className={`mixer-channel ${track.mute ? 'muted' : ''}`}>
      <div className="channel-header">
        <div className="channel-color" style={{ backgroundColor: track.color }} />
        <span className="channel-name" title={track.name}>{track.name.slice(0, 8)}</span>
      </div>

      <div className="channel-type-label">
        {track.type === 'soundfont' ? 'SF' : 'Synth'}
      </div>

      <div className="channel-fader">
        <input
          type="range"
          className="fader"
          min="0"
          max="1"
          step="0.01"
          value={track.volume}
          onChange={(e) => setVolume(track.id, parseFloat(e.target.value))}
          orient="vertical"
        />
        <span className="fader-value">{Math.round(track.volume * 100)}</span>
      </div>

      <div className="channel-pan">
        <input
          type="range"
          className="pan-knob"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={(e) => setPan(track.id, parseFloat(e.target.value))}
        />
        <span className="pan-value">{track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}</span>
      </div>

      <div className="channel-buttons">
        <button
          className={`ch-btn mute ${track.mute ? 'active' : ''}`}
          onClick={() => toggleMute(track.id)}
        >M</button>
        <button
          className={`ch-btn solo ${track.solo ? 'active' : ''}`}
          onClick={() => toggleSolo(track.id)}
        >S</button>
      </div>

      <div className="vu-meter">
        <div className="vu-fill" style={{ height: `${track.volume * 100}%` }} />
      </div>
    </div>
  );
}

export default function Mixer() {
  const tracks = useProjectStore((s) => s.project.tracks);
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="mixer collapsed">
        <button className="mixer-toggle" onClick={() => setCollapsed(false)}>
          Show Mixer
        </button>
      </div>
    );
  }

  return (
    <div className="mixer">
      <div className="mixer-header">
        <span>Mixer</span>
        <button className="mixer-toggle" onClick={() => setCollapsed(true)}>
          Hide
        </button>
      </div>
      <div className="mixer-channels">
        {tracks.map((track) => (
          <ChannelStrip key={track.id} track={track} />
        ))}
        {tracks.length === 0 && (
          <div className="mixer-empty">No tracks</div>
        )}
      </div>
    </div>
  );
}
