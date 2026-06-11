import { useProjectStore } from '../../store/projectStore';
import type { Track, TrackType } from '../../types';

export default function Timeline() {
  const tracks = useProjectStore((s) => s.project.tracks);
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId);
  const selectTrack = useProjectStore((s) => s.selectTrack);
  const addTrack = useProjectStore((s) => s.addTrack);
  const removeTrack = useProjectStore((s) => s.removeTrack);
  const toggleTrackMute = useProjectStore((s) => s.toggleTrackMute);
  const toggleTrackSolo = useProjectStore((s) => s.toggleTrackSolo);

  const handleAddTrack = (type: TrackType) => {
    const nextChannel = tracks.length;
    addTrack(type, nextChannel % 16);
  };

  return (
    <div className="timeline">
      <div className="timeline-header">
        <span className="timeline-title">Tracks</span>
        <div className="timeline-actions">
          <button onClick={() => handleAddTrack('soundfont')} title="Add SoundFont track">+ SF</button>
          <button onClick={() => handleAddTrack('synth')} title="Add Synth track">+ Synth</button>
        </div>
      </div>
      <div className="timeline-tracks">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`timeline-track ${selectedTrackId === track.id ? 'selected' : ''}`}
            onClick={() => selectTrack(track.id)}
          >
            <div className="track-color" style={{ backgroundColor: track.color }} />
            <span className="track-name-label">{track.name}</span>
            <span className="track-type">{track.type === 'soundfont' ? 'SF' : 'Synth'}</span>
            <button
              className={`track-btn mute-btn ${track.mute ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleTrackMute(track.id); }}
              title="Mute"
            >M</button>
            <button
              className={`track-btn solo-btn ${track.solo ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleTrackSolo(track.id); }}
              title="Solo"
            >S</button>
            <button
              className="track-btn remove-btn"
              onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
              title="Remove"
            >&#10005;</button>
          </div>
        ))}
        {tracks.length === 0 && (
          <div className="timeline-empty">
            Add a SoundFont or Synth track to begin
          </div>
        )}
      </div>
    </div>
  );
}
