import { useGameStore } from '../../stores/gameStore';

export function PauseMenu() {
  const { phase, setPhase, resetGame } = useGameStore();

  if (phase !== 'paused') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.menu}>
        <div style={styles.title}>PAUSED</div>
        <button style={styles.btn} onClick={() => setPhase('wave')}>
          RESUME
        </button>
        <button style={{ ...styles.btn, ...styles.restartBtn }} onClick={() => resetGame()}>
          RESTART
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 32,
    background: '#1a1a2e',
    border: '2px solid #e94560',
    borderRadius: 8,
    fontFamily: 'monospace',
    minWidth: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 8,
  },
  btn: {
    padding: '10px 16px',
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
  restartBtn: {
    borderColor: '#e94560',
    color: '#e94560',
  },
};
