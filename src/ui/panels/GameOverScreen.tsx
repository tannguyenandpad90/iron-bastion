import { useGameStore } from '../../stores/gameStore';
import { CAMPAIGN } from '../../config/campaign';

export function GameOverScreen({ onQuit }: { onQuit: () => void }) {
  const { phase, score, wave, lives, mapIndex, stage, resetGame } = useGameStore();
  if (phase !== 'gameover' && phase !== 'victory') return null;

  const isVictory = phase === 'victory';
  const accent = isVictory ? '#00F5A0' : '#FF3D6E';
  const mapName = CAMPAIGN[mapIndex]?.name ?? '';

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.menu, borderColor: `${accent}44` }}>
        <div style={{ ...styles.title, color: accent, textShadow: `0 0 20px ${accent}44` }}>
          {isVictory ? 'VICTORY' : 'SYSTEM FAILURE'}
        </div>
        <div style={styles.subtitle}>
          {isVictory ? 'All sectors cleared.' : 'Core compromised.'}
        </div>
        <div style={styles.stats}>
          <Row label="MAP" value={`${mapName} (${mapIndex + 1}/${CAMPAIGN.length})`} />
          <Row label="STAGE" value={`${stage}`} />
          <Row label="WAVES" value={`${wave}`} />
          <Row label="LIVES" value={`${lives}`} />
          <Row label="SCORE" value={`${score}`} color="#00E5FF" />
        </div>
        <div style={styles.buttons}>
          <button style={{ ...styles.btn, borderColor: '#00F5A0', color: '#00F5A0' }} onClick={() => resetGame()}>
            PLAY AGAIN
          </button>
          <button style={{ ...styles.btn, borderColor: '#4A5A7A', color: '#4A5A7A' }} onClick={() => { resetGame(); onQuit(); }}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.val, color: color ?? '#8A9ABB' }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(11,15,26,0.9)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  menu: {
    display: 'flex', flexDirection: 'column', gap: 10, padding: 32,
    background: '#0D1220', border: '1px solid', borderRadius: 8,
    fontFamily: "'Exo 2', monospace", minWidth: 300, textAlign: 'center',
    boxShadow: '0 0 40px rgba(0,0,0,0.5)',
  },
  title: { fontSize: 26, fontWeight: 800, letterSpacing: 6 },
  subtitle: { fontSize: 11, color: '#4A5A7A', marginBottom: 4 },
  stats: {
    display: 'flex', flexDirection: 'column', gap: 5,
    padding: 12, background: '#0B0F1A', borderRadius: 4, border: '1px solid #1E2D42',
  },
  row: { display: 'flex', justifyContent: 'space-between' },
  label: { fontSize: 10, color: '#3A4A6A', fontWeight: 600 },
  val: { fontSize: 12, fontWeight: 700 },
  buttons: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  btn: {
    padding: '10px 16px', border: '1px solid', borderRadius: 4,
    background: 'rgba(13,18,32,0.9)', cursor: 'pointer',
    fontFamily: "'Exo 2', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 2,
  },
};
