import { useGameStore } from '../../stores/gameStore';
import { getTotalWaves } from '../../game/waves/manager';

export function HUD() {
  const { gold, lives, wave, energy, maxEnergy, score, phase } = useGameStore();
  const totalWaves = getTotalWaves();

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <span style={styles.stat}>
          <span style={styles.label}>LIVES</span>
          <span style={{ ...styles.value, color: lives <= 5 ? '#e94560' : '#00d4ff' }}>
            {lives}
          </span>
        </span>
        <span style={styles.stat}>
          <span style={styles.label}>GOLD</span>
          <span style={{ ...styles.value, color: '#ffd700' }}>{gold}</span>
        </span>
        <span style={styles.stat}>
          <span style={styles.label}>ENERGY</span>
          <span style={{ ...styles.value, color: '#7b68ee' }}>
            {Math.floor(energy)}/{maxEnergy}
          </span>
        </span>
      </div>
      <div style={styles.center}>
        <span style={styles.phase}>
          {phase === 'wave' ? 'DEFENDING' : phase.toUpperCase()}
        </span>
        <span style={styles.wave}>
          Wave {wave} / {totalWaves}
        </span>
      </div>
      <div style={styles.right}>
        <span style={styles.stat}>
          <span style={styles.label}>SCORE</span>
          <span style={styles.value}>{score}</span>
        </span>
      </div>
    </div>
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
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  right: { display: 'flex', gap: 24 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  label: { fontSize: 10, color: '#888', letterSpacing: 2 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#00d4ff' },
  phase: { fontSize: 12, color: '#e94560', letterSpacing: 3, fontWeight: 'bold' },
  wave: { fontSize: 14, color: '#eee' },
};
