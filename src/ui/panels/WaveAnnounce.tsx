import { useGameStore } from '../../stores/gameStore';
import { getTotalWaves } from '../../game/waves/manager';

export function WaveAnnounce() {
  const { phase, wave } = useGameStore();

  if (phase !== 'prep') return null;

  const totalWaves = getTotalWaves();
  const nextWave = wave + 1;

  return (
    <div style={styles.container}>
      <div style={styles.text}>
        {wave === 0 ? 'READY TO DEFEND' : `WAVE ${wave} CLEARED`}
      </div>
      {nextWave <= totalWaves && (
        <div style={styles.next}>
          Wave {nextWave} / {totalWaves}
        </div>
      )}
      <div style={styles.hint}>Press [SPACE] to start</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    fontFamily: 'monospace',
    pointerEvents: 'none',
    zIndex: 10,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d4ff',
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(0,212,255,0.5)',
  },
  next: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  hint: {
    fontSize: 12,
    color: '#e94560',
    marginTop: 16,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};
