import { useGameStore } from '../../stores/gameStore';

export function GameOverScreen() {
  const { phase, score, wave, resetGame } = useGameStore();

  if (phase !== 'gameover' && phase !== 'victory') return null;

  const isVictory = phase === 'victory';

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.menu, borderColor: isVictory ? '#00d4ff' : '#e94560' }}>
        <div style={{ ...styles.title, color: isVictory ? '#00d4ff' : '#e94560' }}>
          {isVictory ? 'VICTORY' : 'SYSTEM FAILURE'}
        </div>
        <div style={styles.subtitle}>
          {isVictory
            ? 'All threats neutralized. Core secured.'
            : 'Core compromised. Defense protocol failed.'}
        </div>
        <div style={styles.stats}>
          <div style={styles.row}>
            <span style={styles.label}>WAVES SURVIVED</span>
            <span style={styles.val}>{wave}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>FINAL SCORE</span>
            <span style={styles.val}>{score}</span>
          </div>
        </div>
        <button style={styles.btn} onClick={() => resetGame()}>
          RESTART PROTOCOL
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 40,
    background: '#1a1a2e',
    border: '2px solid',
    borderRadius: 8,
    fontFamily: 'monospace',
    minWidth: 280,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    background: '#0f0f23',
    borderRadius: 4,
  },
  row: { display: 'flex', justifyContent: 'space-between' },
  label: { fontSize: 11, color: '#888' },
  val: { fontSize: 16, color: '#eee', fontWeight: 'bold' },
  btn: {
    marginTop: 8,
    padding: '12px 16px',
    border: '1px solid #00d4ff',
    borderRadius: 4,
    background: '#16213e',
    color: '#00d4ff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
};
