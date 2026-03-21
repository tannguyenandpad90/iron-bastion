import { useGameStore } from '../../stores/gameStore';
import { getTotalWaves } from '../../game/waves/manager';
import { MAPS } from '../../config/maps';
import { audio } from '../../engine/AudioManager';
import type { GameSpeed } from '../../types';

const SPEEDS: GameSpeed[] = [1, 1.5, 2, 3];

export function HUD() {
  const {
    gold, lives, wave, energy, maxEnergy, score, phase, gameSpeed,
    setGameSpeed, setPhase, mapId,
  } = useGameStore();
  const totalWaves = getTotalWaves();
  const mapName = MAPS[mapId]?.name ?? '';

  const handlePause = () => {
    if (phase === 'wave') setPhase('paused');
    else if (phase === 'paused') setPhase('wave');
  };

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <Stat label="LIVES" value={lives} color={lives <= 5 ? '#e94560' : '#00d4ff'} />
        <Stat label="GOLD" value={gold} color="#ffd700" />
        <Stat label="ENERGY" value={`${Math.floor(energy)}/${maxEnergy}`} color="#7b68ee" />
      </div>
      <div style={styles.center}>
        <div style={styles.topRow}>
          <span style={styles.phase}>
            {phase === 'wave' ? 'DEFENDING' : phase.toUpperCase()}
          </span>
        </div>
        <span style={styles.wave}>Wave {wave}/{totalWaves}</span>
        <span style={styles.mapLabel}>{mapName}</span>
        <div style={styles.controlRow}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setGameSpeed(s)}
              style={{
                ...styles.speedBtn,
                background: gameSpeed === s ? '#e94560' : '#222',
                color: gameSpeed === s ? '#fff' : '#666',
              }}
            >
              {s}x
            </button>
          ))}
          <button onClick={handlePause} style={{ ...styles.speedBtn, marginLeft: 6 }}>
            {phase === 'paused' ? 'PLAY' : 'PAUSE'}
          </button>
          <button
            onClick={() => audio.toggleMute()}
            style={{ ...styles.speedBtn, color: audio.muted ? '#e94560' : '#666' }}
          >
            {audio.muted ? 'OFF' : 'SND'}
          </button>
        </div>
      </div>
      <div style={styles.right}>
        <Stat label="SCORE" value={score} color="#00d4ff" />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <span style={styles.stat}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.value, color }}>{value}</span>
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 16px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    borderBottom: '2px solid #e94560', fontFamily: 'monospace',
    color: '#eee', minHeight: 44, userSelect: 'none',
  },
  left: { display: 'flex', gap: 20 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  right: { display: 'flex', gap: 20 },
  topRow: { display: 'flex', alignItems: 'center', gap: 8 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  label: { fontSize: 9, color: '#666', letterSpacing: 2 },
  value: { fontSize: 16, fontWeight: 'bold' },
  phase: { fontSize: 11, color: '#e94560', letterSpacing: 3, fontWeight: 'bold' },
  wave: { fontSize: 11, color: '#ccc' },
  mapLabel: { fontSize: 9, color: '#555', letterSpacing: 1 },
  controlRow: { display: 'flex', gap: 3, marginTop: 1 },
  speedBtn: {
    padding: '1px 6px', border: '1px solid #333', borderRadius: 3,
    cursor: 'pointer', fontFamily: 'monospace', fontSize: 9, fontWeight: 'bold',
    background: '#222', color: '#666',
  },
};
