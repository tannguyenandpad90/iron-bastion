import { useGameStore } from '../../stores/gameStore';

export function BossHealthBar() {
  const enemies = useGameStore((s) => s.enemies);
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'wave') return null;

  const boss = enemies.find((e) => e.isBoss);
  if (!boss) return null;

  const ratio = Math.max(0, boss.hp / boss.stats.maxHp);
  const hpColor = ratio > 0.5 ? '#FF3D6E' : ratio > 0.25 ? '#FFB800' : '#FF5C5C';

  // Active phase indicator
  const activePhase = boss.bossPhases?.find((p) => p.active);
  const phaseLabel = activePhase
    ? activePhase.type === 'shield' ? 'SHIELD ACTIVE'
    : activePhase.type === 'enrage' ? 'ENRAGED'
    : activePhase.type === 'spawn' ? 'SPAWNING'
    : ''
    : '';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.name}>BOSS</span>
        <span style={styles.hp}>{Math.ceil(boss.hp)} / {boss.stats.maxHp}</span>
      </div>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${ratio * 100}%`, background: hpColor, boxShadow: `0 0 8px ${hpColor}44` }} />
        {/* Phase threshold markers */}
        {boss.bossPhases?.map((p, i) => (
          <div key={i} style={{ ...styles.phaseMarker, left: `${p.hpThreshold * 100}%`, background: p.active ? '#fff' : '#4A5A7A' }} />
        ))}
      </div>
      {phaseLabel && (
        <div style={styles.phaseLabel}>{phaseLabel}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '4px 16px 6px', background: 'rgba(11,15,26,0.85)',
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
    border: '1px solid #1E2D42', borderTop: 'none',
    fontFamily: "'Exo 2', monospace", zIndex: 20, minWidth: 250,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', width: '100%', gap: 16,
  },
  name: { fontSize: 10, fontWeight: 800, color: '#FF3D6E', letterSpacing: 3 },
  hp: { fontSize: 10, color: '#8A9ABB', fontWeight: 600 },
  barBg: {
    position: 'relative', width: '100%', height: 6,
    background: '#0D1220', borderRadius: 3, overflow: 'visible',
  },
  barFill: {
    height: '100%', borderRadius: 3, transition: 'width 0.15s ease',
  },
  phaseMarker: {
    position: 'absolute', top: -1, width: 2, height: 8,
    borderRadius: 1, transform: 'translateX(-50%)',
  },
  phaseLabel: {
    fontSize: 9, fontWeight: 700, color: '#FFB800', letterSpacing: 2,
    animation: 'pulse 1s ease-in-out infinite',
  },
};
