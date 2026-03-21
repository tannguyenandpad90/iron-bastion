import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getTotalWaves, isBossWave } from '../../game/waves/manager';
import { audio } from '../../engine/AudioManager';

const COUNTDOWN_SECONDS = 10;

export function WaveAnnounce() {
  const { phase, wave, setPhase, nextWave } = useGameStore();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/reset countdown when entering prep phase
  useEffect(() => {
    if (phase !== 'prep') {
      // Clear timer when leaving prep
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Reset countdown
    setCountdown(COUNTDOWN_SECONDS);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-start wave
          clearInterval(timerRef.current!);
          timerRef.current = null;
          const store = useGameStore.getState();
          if (store.phase === 'prep') {
            store.nextWave();
            store.setPhase('wave');
            audio.play('wave_start');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  if (phase !== 'prep') return null;

  const totalWaves = getTotalWaves();
  const nextWaveNum = wave + 1;
  const isBoss = isBossWave(nextWaveNum);

  const handleStart = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    nextWave();
    setPhase('wave');
    audio.play('wave_start');
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

      {/* Countdown */}
      <div style={styles.countdown}>
        <div style={styles.countdownNumber}>{countdown}</div>
        <div style={styles.countdownLabel}>AUTO-START</div>
        <div style={styles.countdownBar}>
          <div
            style={{
              ...styles.countdownFill,
              width: `${(countdown / COUNTDOWN_SECONDS) * 100}%`,
            }}
          />
        </div>
      </div>

      <button style={styles.startBtn} onClick={handleStart}>
        START NOW
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
  countdown: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e94560',
    textShadow: '0 0 15px rgba(233,69,96,0.5)',
  },
  countdownLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 3,
  },
  countdownBar: {
    width: 120,
    height: 4,
    background: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    background: '#e94560',
    borderRadius: 2,
    transition: 'width 1s linear',
  },
  startBtn: {
    marginTop: 4,
    padding: '10px 28px',
    border: '2px solid #e94560',
    borderRadius: 4,
    background: 'rgba(233, 69, 96, 0.15)',
    color: '#e94560',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  hint: { fontSize: 11, color: '#555' },
};
