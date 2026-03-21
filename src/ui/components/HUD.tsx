import { useGameStore } from '../../stores/gameStore';
import { getTotalWaves } from '../../game/waves/manager';
import { audio } from '../../engine/AudioManager';
import type { GameSpeed } from '../../types';

const SPEEDS: GameSpeed[] = [1, 1.5, 2, 3];

export function HUD() {
  const { gold, lives, wave, energy, maxEnergy, score, phase, gameSpeed, setGameSpeed } = useGameStore();
  const totalWaves = getTotalWaves();

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <Stat label="LIVES" value={lives} color={lives <= 5 ? '#e94560' : '#00d4ff'} />
        <Stat label="GOLD" value={gold} color="#ffd700" />
        <Stat label="ENERGY" value={`${Math.floor(energy)}/${maxEnergy}`} color="#7b68ee" />
      </div>
      <div style={styles.center}>
        <span style={styles.phase}>
          {phase === 'wave' ? 'DEFENDING' : phase.toUpperCase()}
        </span>
        <span style={styles.wave}>Wave {wave} / {totalWaves}</span>
        <div style={styles.speedRow}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setGameSpeed(s)}
              style={{
                ...styles.speedBtn,
                background: gameSpeed === s ? '#e94560' : '#222',
                color: gameSpeed === s ? '#fff' : '#888',
              }}
            >
              {s}x
            </button>
          ))}
          <button
            onClick={() => audio.toggleMute()}
            style={{ ...styles.speedBtn, marginLeft: 8 }}
          >
            {audio.muted ? 'UNMUTE' : 'MUTE'}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    borderBottom: '2px solid #e94560',
    fontFamily: 'monospace',
    color: '#eee',
    minHeight: 48,
    userSelect: 'none',
  },
  left: { display: 'flex', gap: 24 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  right: { display: 'flex', gap: 24 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  label: { fontSize: 10, color: '#888', letterSpacing: 2 },
  value: { fontSize: 18, fontWeight: 'bold' },
  phase: { fontSize: 12, color: '#e94560', letterSpacing: 3, fontWeight: 'bold' },
  wave: { fontSize: 12, color: '#eee' },
  speedRow: { display: 'flex', gap: 4, marginTop: 2 },
  speedBtn: {
    padding: '2px 8px',
    border: '1px solid #444',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
};
