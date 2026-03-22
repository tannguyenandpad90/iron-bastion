import { useGameStore } from '../../stores/gameStore';

export function PauseMenu({ onQuit }: { onQuit: () => void }) {
  const { phase, setPhase, resetGame } = useGameStore();
  if (phase !== 'paused') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.menu}>
        <div style={styles.title}>PAUSED</div>
        <button style={{ ...styles.btn, borderColor: '#00F5A0', color: '#00F5A0' }} onClick={() => setPhase('wave')}>
          RESUME
        </button>
        <button style={{ ...styles.btn, borderColor: '#FFD166', color: '#FFD166' }} onClick={() => resetGame()}>
          RESTART
        </button>
        <button style={{ ...styles.btn, borderColor: '#FF3D6E', color: '#FF3D6E' }} onClick={() => { resetGame(); onQuit(); }}>
          QUIT
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(11,15,26,0.85)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  menu: {
    display: 'flex', flexDirection: 'column', gap: 10, padding: 28,
    background: '#0D1220', border: '1px solid #1E2D42', borderRadius: 8,
    fontFamily: "'Exo 2', monospace", minWidth: 200,
    boxShadow: '0 0 30px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 22, fontWeight: 800, color: '#FF3D6E', textAlign: 'center',
    letterSpacing: 6, marginBottom: 6, textShadow: '0 0 12px #FF3D6E44',
  },
  btn: {
    padding: '10px 16px', border: '1px solid', borderRadius: 4,
    background: 'rgba(13,18,32,0.9)', cursor: 'pointer',
    fontFamily: "'Exo 2', monospace", fontSize: 12, fontWeight: 700,
    letterSpacing: 3, textAlign: 'center',
  },
};
