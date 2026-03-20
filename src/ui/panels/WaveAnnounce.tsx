import { useGameStore } from '../../stores/gameStore';
import { getTotalWaves, isBossWave } from '../../game/waves/manager';

export function WaveAnnounce() {
  const { phase, wave, setPhase, nextWave } = useGameStore();

  if (phase !== 'prep') return null;

  const totalWaves = getTotalWaves();
  const nextWaveNum = wave + 1;
  const isBoss = isBossWave(nextWaveNum);

  const handleStart = () => {
    nextWave();
    setPhase('wave');
  };

  return (
    <div style={styles.container}>
      <div style={styles.text}>
        {wave === 0 ? 'IRON BASTION ONLINE' : `WAVE ${wave} CLEARED`}
      </div>
      {nextWaveNum <= totalWaves && (
        <>
          <div style={styles.next}>
            Next: Wave {nextWaveNum} / {totalWaves}
          </div>
          {isBoss && (
            <div style={styles.bossWarning}>
              WARNING: BOSS INCOMING
            </div>
          )}
        </>
      )}
      <button style={styles.startBtn} onClick={handleStart}>
        START WAVE
      </button>
      <div style={styles.hint}>or press [SPACE]</div>
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
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d4ff',
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(0,212,255,0.5)',
  },
  next: { fontSize: 14, color: '#888' },
  bossWarning: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff00ff',
    letterSpacing: 3,
    textShadow: '0 0 15px rgba(255,0,255,0.5)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  startBtn: {
    marginTop: 8,
    padding: '12px 32px',
    border: '2px solid #e94560',
    borderRadius: 4,
    background: 'rgba(233, 69, 96, 0.15)',
    color: '#e94560',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  hint: { fontSize: 11, color: '#555' },
};
