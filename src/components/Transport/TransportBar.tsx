import { useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { startPlayback, stopPlayback, pausePlayback, setBpm } from '../../audio/engine';

export default function TransportBar() {
  const bpm = useProjectStore((s) => s.project.bpm);
  const playbackState = useProjectStore((s) => s.playbackState);
  const playbackPosition = useProjectStore((s) => s.playbackPosition);
  const { timeSignature, loopEnabled: loopEnabled } = useProjectStore((s) => s.project);
  const setLoop = useProjectStore((s) => s.setLoop);

  const play = useCallback(() => {
    if (playbackState === 'playing') {
      pausePlayback();
    } else {
      startPlayback();
    }
  }, [playbackState]);

  const stop = useCallback(() => {
    stopPlayback();
  }, []);

  const handleBpmChange = useCallback((delta: number) => {
    const newBpm = Math.max(20, Math.min(300, bpm + delta));
    setBpm(newBpm);
  }, [bpm]);

  const formatTime = (beats: number) => {
    const ts = timeSignature[0];
    const bars = Math.floor(beats / ts) + 1;
    const b = Math.floor(beats % ts) + 1;
    const s = Math.floor((beats % 1) * 4) + 1;
    return `${bars}:${b}:${s}`;
  };

  return (
    <div className="transport-bar">
      <div className="transport-controls">
        <button className="transport-btn stop-btn" onClick={stop} title="Stop">
          &#9632;
        </button>
        <button className="transport-btn play-btn" onClick={play} title={playbackState === 'playing' ? 'Pause' : 'Play'}>
          {playbackState === 'playing' ? '❚❚' : '▶'}
        </button>
        <button
          className={`transport-btn loop-btn ${loopEnabled ? 'active' : ''}`}
          onClick={() => setLoop(0, 16, !loopEnabled)}
          title="Loop"
        >
          ↻
        </button>
      </div>

      <div className="transport-bpm">
        <button className="bpm-btn" onClick={() => handleBpmChange(-1)}>-</button>
        <span className="bpm-value">{bpm}</span>
        <button className="bpm-btn" onClick={() => handleBpmChange(1)}>+</button>
        <span className="bpm-label">BPM</span>
      </div>

      <div className="transport-time">
        <span className="time-display">{formatTime(playbackPosition)}</span>
        <span className="time-sig">{timeSignature[0]}/{timeSignature[1]}</span>
      </div>
    </div>
  );
}
