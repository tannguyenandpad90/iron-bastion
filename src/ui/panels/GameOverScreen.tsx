import { useGameStore } from '../../stores/gameStore';

export function GameOverScreen({ onQuit }: { onQuit: () => void }) {
  const { phase, score, wave, lives, resetGame } = useGameStore();

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
          <StatRow label="WAVES SURVIVED" value={wave} />
          <StatRow label="LIVES REMAINING" value={lives} />
          <StatRow label="FINAL SCORE" value={score} />
        </div>
        <div style={styles.buttons}>
          <button style={styles.btn} onClick={() => resetGame()}>
            PLAY AGAIN
          </button>
          <button style={{ ...styles.btn, ...styles.quitBtn }} onClick={() => { resetGame(); onQuit(); }}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.val}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  menu: {
    display: 'flex', flexDirection: 'column', gap: 12, padding: 36,
    background: '#1a1a2e', border: '2px solid', borderRadius: 8,
    fontFamily: 'monospace', minWidth: 300, textAlign: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', letterSpacing: 6 },
  subtitle: { fontSize: 11, color: '#888', marginBottom: 8 },
  stats: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: 12, background: '#0f0f23', borderRadius: 4,
  },
  row: { display: 'flex', justifyContent: 'space-between' },
  label: { fontSize: 11, color: '#888' },
  val: { fontSize: 15, color: '#eee', fontWeight: 'bold' },
  buttons: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  btn: {
    padding: '10px 16px', border: '1px solid #00d4ff', borderRadius: 4,
    background: '#16213e', color: '#00d4ff', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 2,
  },
  quitBtn: { borderColor: '#888', color: '#888' },
};
