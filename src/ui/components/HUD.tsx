import { useGameStore } from '../../stores/gameStore';
import { CAMPAIGN } from '../../config/campaign';
import { audio } from '../../engine/AudioManager';
import type { GameSpeed } from '../../types';

const SPEEDS: GameSpeed[] = [1, 1.5, 2, 3];

export function HUD() {
  const {
    gold, lives, wave, energy, maxEnergy, score, phase, gameSpeed,
    setGameSpeed, setPhase, mapIndex, stage, stagesPerMap,
  } = useGameStore();
  const campaign = CAMPAIGN[mapIndex];
  const mapName = campaign?.name ?? '';

  const handlePause = () => {
    if (phase === 'wave') setPhase('paused');
    else if (phase === 'paused') setPhase('wave');
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <Stat label="LIVES" value={lives} color={lives <= 5 ? '#FF3D6E' : '#00F5A0'} />
        <Stat label="GOLD" value={gold} color="#FFD166" />
        <Stat label="ENERGY" value={`${Math.floor(energy)}/${maxEnergy}`} color="#9B5CFF" />
      </div>

      <div style={styles.center}>
        <div style={styles.phaseRow}>
          <span style={styles.phase}>
            {phase === 'wave' ? 'DEFENDING' : phase.toUpperCase()}
          </span>
        </div>
        <span style={styles.mapName}>{mapName}</span>
        <span style={styles.stageText}>
          MAP {mapIndex + 1}/{CAMPAIGN.length} — STAGE {stage}/{stagesPerMap}
        </span>
        <div style={styles.controls}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setGameSpeed(s)}
              style={{
                ...styles.ctrlBtn,
                background: gameSpeed === s ? '#FF3D6E' : 'rgba(26,35,51,0.8)',
                color: gameSpeed === s ? '#fff' : '#4A5A7A',
                borderColor: gameSpeed === s ? '#FF3D6E' : '#1E2D42',
              }}
            >
              {s}x
            </button>
          ))}
          <button onClick={handlePause} style={{
            ...styles.ctrlBtn, marginLeft: 6,
            borderColor: phase === 'paused' ? '#00F5A0' : '#1E2D42',
            color: phase === 'paused' ? '#00F5A0' : '#4A5A7A',
          }}>
            {phase === 'paused' ? '>' : '||'}
          </button>
          <button
            onClick={() => audio.toggleMute()}
            style={{
              ...styles.ctrlBtn,
              borderColor: audio.muted ? '#FF3D6E' : '#1E2D42',
              color: audio.muted ? '#FF3D6E' : '#4A5A7A',
            }}
          >
            {audio.muted ? 'X' : 'S'}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <Stat label="SCORE" value={score} color="#00E5FF" />
        <Stat label="WAVE" value={wave} color="#4A5A7A" />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color, textShadow: `0 0 8px ${color}44` }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 20px',
    background: 'linear-gradient(180deg, #0D1220 0%, #0B0F1A 100%)',
    borderBottom: '1px solid #1E2D42',
    fontFamily: "'Exo 2', monospace",
    color: '#8A9ABB', minHeight: 44, userSelect: 'none',
  },
  section: { display: 'flex', gap: 22, alignItems: 'center' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  phaseRow: { display: 'flex', alignItems: 'center', gap: 6 },
  phase: {
    fontSize: 11, color: '#FF3D6E', letterSpacing: 4, fontWeight: 700,
    textShadow: '0 0 10px #FF3D6E44',
  },
  mapName: { fontSize: 10, color: '#FFD166', letterSpacing: 2, fontWeight: 600 },
  stageText: { fontSize: 9, color: '#4A5A7A', letterSpacing: 1 },
  controls: { display: 'flex', gap: 3, marginTop: 2 },
  ctrlBtn: {
    padding: '2px 7px', border: '1px solid #1E2D42', borderRadius: 3,
    cursor: 'pointer', fontSize: 9, fontWeight: 700,
    background: 'rgba(26,35,51,0.8)', color: '#4A5A7A',
    fontFamily: "'Exo 2', monospace",
  },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  statLabel: { fontSize: 8, color: '#3A4A6A', letterSpacing: 2, fontWeight: 600 },
  statValue: { fontSize: 16, fontWeight: 800 },
};
