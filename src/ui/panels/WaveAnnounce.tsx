import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getTotalWaves, isBossWave, getWaveMapName, getWaveEnemyPreview } from '../../game/waves/manager';
import { audio } from '../../engine/AudioManager';

const COUNTDOWN_SECONDS = 3;

export function WaveAnnounce() {
  const { phase, wave, setPhase, nextWave, mapId } = useGameStore();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'prep') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
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
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [phase]);

  if (phase !== 'prep') return null;

  const totalWaves = getTotalWaves();
  const nextWaveNum = wave + 1;
  const isBoss = isBossWave(nextWaveNum);
  const nextMapName = getWaveMapName(nextWaveNum);
  const preview = getWaveEnemyPreview(nextWaveNum);

  const handleStart = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
          <div style={styles.next}>Wave {nextWaveNum} / {totalWaves}</div>

          {/* Map name if changing */}
          {nextMapName && (
            <div style={styles.mapName}>{nextMapName}</div>
          )}

          {/* Enemy preview */}
          {preview && (
            <div style={styles.preview}>
              {preview.map((p, i) => (
                <span key={i} style={styles.previewItem}>
                  {p.count}x {p.type}{p.traits ? ` (${p.traits})` : ''}
                </span>
              ))}
            </div>
          )}

          {isBoss && (
            <div style={styles.bossWarning}>WARNING: BOSS INCOMING</div>
          )}
        </>
      )}

      {/* Countdown */}
      <div style={styles.countdown}>
        <div style={styles.countdownNumber}>{countdown}</div>
        <div style={styles.countdownBar}>
          <div style={{ ...styles.countdownFill, width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }} />
        </div>
      </div>

      <button style={styles.startBtn} onClick={handleStart}>
        START NOW
      </button>
      <div style={styles.hint}>[SPACE]</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center', fontFamily: 'monospace', zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    background: 'rgba(0,0,0,0.5)', padding: '20px 32px', borderRadius: 8,
  },
  text: {
    fontSize: 24, fontWeight: 'bold', color: '#00d4ff', letterSpacing: 4,
    textShadow: '0 0 20px rgba(0,212,255,0.5)',
  },
  next: { fontSize: 13, color: '#888' },
  mapName: { fontSize: 11, color: '#ffd700', letterSpacing: 2 },
  preview: {
    display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
    maxWidth: 300, marginTop: 2,
  },
  previewItem: {
    fontSize: 9, color: '#666', background: '#1a1a2e',
    padding: '2px 6px', borderRadius: 3, border: '1px solid #333',
  },
  bossWarning: {
    fontSize: 14, fontWeight: 'bold', color: '#ff00ff', letterSpacing: 3,
    textShadow: '0 0 15px rgba(255,0,255,0.5)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  countdown: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 2,
  },
  countdownNumber: {
    fontSize: 32, fontWeight: 'bold', color: '#e94560',
    textShadow: '0 0 15px rgba(233,69,96,0.5)',
  },
  countdownBar: {
    width: 100, height: 3, background: '#333', borderRadius: 2, overflow: 'hidden',
  },
  countdownFill: {
    height: '100%', background: '#e94560', borderRadius: 2, transition: 'width 1s linear',
  },
  startBtn: {
    padding: '8px 24px', border: '2px solid #e94560', borderRadius: 4,
    background: 'rgba(233,69,96,0.15)', color: '#e94560', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 3,
  },
  hint: { fontSize: 10, color: '#444' },
};
