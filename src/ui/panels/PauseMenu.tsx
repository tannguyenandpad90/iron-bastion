import { useGameStore } from '../../stores/gameStore';

export function PauseMenu({ onQuit }: { onQuit: () => void }) {
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
        <button style={{ ...styles.btn, ...styles.quitBtn }} onClick={() => { resetGame(); onQuit(); }}>
          QUIT TO MENU
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  menu: {
    display: 'flex', flexDirection: 'column', gap: 10, padding: 32,
    background: '#1a1a2e', border: '2px solid #e94560', borderRadius: 8,
    fontFamily: 'monospace', minWidth: 220,
  },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#e94560',
    textAlign: 'center', letterSpacing: 4, marginBottom: 8,
  },
  btn: {
    padding: '10px 16px', border: '1px solid #00d4ff', borderRadius: 4,
    background: '#16213e', color: '#00d4ff', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 2,
    textAlign: 'center',
  },
  restartBtn: { borderColor: '#ffd700', color: '#ffd700' },
  quitBtn: { borderColor: '#e94560', color: '#e94560' },
};
