import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CAMPAIGN } from '../../config/campaign';
import { isBossStage, isFinalBoss, getNextStagePreview } from '../../game/waves/manager';
import { audio } from '../../engine/AudioManager';

const COUNTDOWN_SECONDS = 3;

export function WaveAnnounce() {
  const { phase, mapIndex, stage, wave, stagesPerMap, setPhase, nextStage } = useGameStore();
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
          const s = useGameStore.getState();
          if (s.phase === 'prep') {
            s.nextStage();
            s.setPhase('wave');
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

  const campaign = CAMPAIGN[mapIndex];
  const nextStageNum = stage + 1;
  const isBoss = nextStageNum <= stagesPerMap && isBossStage(mapIndex, nextStageNum);
  const isFinal = nextStageNum <= stagesPerMap && isFinalBoss(mapIndex, nextStageNum);
  const isNewMap = stage === 0;
  const preview = getNextStagePreview(mapIndex, nextStageNum, wave + 1);

  const handleStart = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    nextStage();
    setPhase('wave');
    audio.play('wave_start');
  };

  return (
    <div style={styles.container}>
      {/* New map announcement */}
      {isNewMap && (
        <div style={styles.newMap}>
          <div style={styles.newMapLabel}>ENTERING</div>
          <div style={styles.newMapName}>{campaign?.name ?? ''}</div>
          <div style={styles.newMapStages}>{stagesPerMap} STAGES</div>
        </div>
      )}

      {/* Stage cleared message */}
      {!isNewMap && (
        <div style={styles.text}>STAGE {stage} CLEARED</div>
      )}

      {/* Next stage info */}
      {nextStageNum <= stagesPerMap && (
        <>
          <div style={styles.stageInfo}>
            Stage {nextStageNum} / {stagesPerMap}
            <span style={styles.mapLabel}> — {campaign?.name}</span>
          </div>

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
            <div style={isFinal ? styles.finalBossWarning : styles.bossWarning}>
              {isFinal ? 'FINAL BOSS' : 'BOSS STAGE'}
            </div>
          )}
        </>
      )}

      <div style={styles.countdown}>
        <div style={styles.countdownNumber}>{countdown}</div>
        <div style={styles.countdownBar}>
          <div style={{ ...styles.countdownFill, width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }} />
        </div>
      </div>

      <button style={styles.startBtn} onClick={handleStart}>START</button>
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
    background: 'rgba(0,0,0,0.6)', padding: '16px 28px', borderRadius: 8,
    border: '1px solid #333',
  },
  newMap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    marginBottom: 4,
  },
  newMapLabel: { fontSize: 10, color: '#888', letterSpacing: 4 },
  newMapName: {
    fontSize: 22, fontWeight: 'bold', color: '#ffd700', letterSpacing: 3,
    textShadow: '0 0 15px rgba(255,215,0,0.4)',
  },
  newMapStages: { fontSize: 11, color: '#aa8800', letterSpacing: 2 },
  text: {
    fontSize: 20, fontWeight: 'bold', color: '#00d4ff', letterSpacing: 3,
    textShadow: '0 0 15px rgba(0,212,255,0.4)',
  },
  stageInfo: { fontSize: 13, color: '#aaa' },
  mapLabel: { fontSize: 10, color: '#666' },
  preview: {
    display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center',
    maxWidth: 300,
  },
  previewItem: {
    fontSize: 8, color: '#666', background: '#1a1a2e',
    padding: '2px 5px', borderRadius: 3, border: '1px solid #2a2a3e',
  },
  bossWarning: {
    fontSize: 13, fontWeight: 'bold', color: '#ff8800', letterSpacing: 3,
    textShadow: '0 0 10px rgba(255,136,0,0.4)',
  },
  finalBossWarning: {
    fontSize: 15, fontWeight: 'bold', color: '#ff00ff', letterSpacing: 3,
    textShadow: '0 0 15px rgba(255,0,255,0.5)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  countdown: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginTop: 2,
  },
  countdownNumber: {
    fontSize: 28, fontWeight: 'bold', color: '#e94560',
    textShadow: '0 0 10px rgba(233,69,96,0.4)',
  },
  countdownBar: {
    width: 80, height: 3, background: '#333', borderRadius: 2, overflow: 'hidden',
  },
  countdownFill: {
    height: '100%', background: '#e94560', borderRadius: 2, transition: 'width 1s linear',
  },
  startBtn: {
    padding: '7px 22px', border: '2px solid #e94560', borderRadius: 4,
    background: 'rgba(233,69,96,0.12)', color: '#e94560', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', letterSpacing: 3,
  },
  hint: { fontSize: 9, color: '#444' },
};
