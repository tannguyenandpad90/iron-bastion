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
          clearInterval(timerRef.current!); timerRef.current = null;
          const s = useGameStore.getState();
          if (s.phase === 'prep') { s.nextStage(); s.setPhase('wave'); audio.play('wave_start'); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [phase]);

  if (phase !== 'prep') return null;

  const campaign = CAMPAIGN[mapIndex];
  const next = stage + 1;
  const isBoss = next <= stagesPerMap && isBossStage(mapIndex, next);
  const isFinal = next <= stagesPerMap && isFinalBoss(mapIndex, next);
  const isNew = stage === 0;
  const preview = getNextStagePreview(mapIndex, next, wave + 1);

  const handleStart = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    nextStage(); setPhase('wave'); audio.play('wave_start');
  };

  return (
    <div style={styles.container}>
      {isNew ? (
        <div style={styles.newMap}>
          <div style={styles.newLabel}>ENTERING</div>
          <div style={styles.newName}>{campaign?.name}</div>
          <div style={styles.newStages}>{stagesPerMap} STAGES</div>
        </div>
      ) : (
        <div style={styles.cleared}>STAGE {stage} CLEARED</div>
      )}

      {next <= stagesPerMap && (
        <>
          <div style={styles.stageInfo}>Stage {next} / {stagesPerMap}</div>
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
            <div style={isFinal ? styles.finalBoss : styles.boss}>
              {isFinal ? 'FINAL BOSS' : 'BOSS STAGE'}
            </div>
          )}
        </>
      )}

      <div style={styles.cd}>
        <div style={styles.cdNum}>{countdown}</div>
        <div style={styles.cdBar}>
          <div style={{ ...styles.cdFill, width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }} />
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
    textAlign: 'center', fontFamily: "'Exo 2', monospace", zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    background: 'rgba(11,15,26,0.85)', padding: '18px 28px', borderRadius: 8,
    border: '1px solid #1E2D42', boxShadow: '0 0 30px rgba(0,0,0,0.4)',
  },
  newMap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginBottom: 4 },
  newLabel: { fontSize: 9, color: '#4A5A7A', letterSpacing: 5, fontWeight: 600 },
  newName: {
    fontSize: 20, fontWeight: 800, color: '#FFD166', letterSpacing: 3,
    textShadow: '0 0 15px #FFD16644',
  },
  newStages: { fontSize: 10, color: '#8A6A33', letterSpacing: 2 },
  cleared: {
    fontSize: 18, fontWeight: 800, color: '#00F5A0', letterSpacing: 4,
    textShadow: '0 0 12px #00F5A044',
  },
  stageInfo: { fontSize: 12, color: '#6A7A9A', fontWeight: 600 },
  preview: { display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: 280 },
  previewItem: {
    fontSize: 8, color: '#4A5A7A', background: '#0D1220',
    padding: '2px 5px', borderRadius: 3, border: '1px solid #1A2333',
  },
  boss: {
    fontSize: 12, fontWeight: 800, color: '#FFB800', letterSpacing: 3,
    textShadow: '0 0 8px #FFB80044',
  },
  finalBoss: {
    fontSize: 14, fontWeight: 800, color: '#FF3D6E', letterSpacing: 3,
    textShadow: '0 0 12px #FF3D6E55',
    animation: 'pulse 1s ease-in-out infinite',
  },
  cd: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginTop: 2 },
  cdNum: { fontSize: 26, fontWeight: 800, color: '#FF3D6E', textShadow: '0 0 10px #FF3D6E44' },
  cdBar: { width: 80, height: 2, background: '#1A2333', borderRadius: 1, overflow: 'hidden' },
  cdFill: { height: '100%', background: '#FF3D6E', borderRadius: 1, transition: 'width 1s linear' },
  startBtn: {
    padding: '7px 22px', border: '1px solid #FF3D6E', borderRadius: 4,
    background: 'rgba(255,61,110,0.08)', color: '#FF3D6E', cursor: 'pointer',
    fontFamily: "'Exo 2', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 4,
  },
  hint: { fontSize: 8, color: '#2A3A55' },
};
