import { useGameStore } from '../../stores/gameStore';
import { TOWER_CONFIG, TOWER_DESCRIPTIONS } from '../../config/towers';
import type { TowerType } from '../../types';

const NEON: Record<TowerType, string> = {
  cannon: '#00F5A0', laser: '#00E5FF', aoe: '#FF3D6E', sniper: '#FFD166', tesla: '#9B5CFF',
  flame: '#FF8C00', missile: '#FF4444', railgun: '#44DDFF', plasma: '#FF00FF',
};

export function TowerShop() {
  const { gold, selectedTowerType, selectTowerType, phase } = useGameStore();

  return (
    <div style={styles.container}>
      <div style={styles.title}>TOWERS</div>
      <div style={styles.list}>
        {(Object.keys(TOWER_CONFIG) as TowerType[]).map((type) => {
          const cfg = TOWER_CONFIG[type];
          const info = TOWER_DESCRIPTIONS[type];
          const neon = NEON[type];
          const afford = gold >= cfg.cost;
          const sel = selectedTowerType === type;

          return (
            <button
              key={type}
              onClick={() => selectTowerType(sel ? null : type)}
              disabled={!afford}
              style={{
                ...styles.card,
                borderColor: sel ? neon : afford ? '#1E2D42' : '#111825',
                opacity: afford ? 1 : 0.35,
                background: sel ? `${neon}10` : '#0D1220',
                boxShadow: sel ? `0 0 12px ${neon}30, inset 0 0 8px ${neon}10` : 'none',
              }}
            >
              <div style={styles.cardTop}>
                <div style={{ ...styles.dot, background: neon, boxShadow: `0 0 6px ${neon}` }} />
                <span style={{ ...styles.name, color: sel ? neon : '#8A9ABB' }}>{info.name}</span>
                <span style={styles.key}>[{info.key}]</span>
              </div>
              <div style={styles.desc}>{info.desc}</div>
              <div style={styles.statsRow}>
                <span style={styles.miniStat}>DMG:{cfg.damage}</span>
                <span style={styles.miniStat}>RNG:{cfg.range}</span>
                {cfg.statusOnHit && (
                  <span style={{ ...styles.miniStat, color: '#9B5CFF' }}>{cfg.statusOnHit.type}</span>
                )}
              </div>
              <div style={{ ...styles.cost, color: afford ? '#FFD166' : '#4A5A7A' }}>
                {cfg.cost}g
              </div>
            </button>
          );
        })}
      </div>

      <div style={styles.divider} />
      <div style={styles.help}>
        <div style={styles.helpTitle}>CONTROLS</div>
        <div style={styles.helpLine}>[1-9] Tower  [Q/W/E] Skill</div>
        <div style={styles.helpLine}>[Click] Place  [Right] Cancel</div>
        <div style={styles.helpLine}>[Space] {phase === 'wave' ? 'Pause' : 'Start'}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', flexDirection: 'column', gap: 4, padding: 10,
    background: '#0B0F1A', borderLeft: '1px solid #1E2D42',
    width: 200, fontFamily: "'Exo 2', monospace", userSelect: 'none',
    overflowY: 'auto',
  },
  title: {
    color: '#FF3D6E', fontSize: 11, letterSpacing: 4, textAlign: 'center',
    paddingBottom: 6, borderBottom: '1px solid #1E2D42', fontWeight: 700,
    textShadow: '0 0 8px #FF3D6E44',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 4 },
  card: {
    display: 'flex', flexDirection: 'column', gap: 3,
    padding: '7px 9px', border: '1px solid #1E2D42', borderRadius: 4,
    cursor: 'pointer', color: '#8A9ABB', textAlign: 'left',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  name: { fontSize: 12, fontWeight: 700, flex: 1 },
  key: { fontSize: 8, color: '#3A4A6A' },
  desc: { fontSize: 9, color: '#4A5A7A' },
  statsRow: { display: 'flex', gap: 6 },
  miniStat: { fontSize: 8, color: '#3A4A6A' },
  cost: { fontSize: 13, fontWeight: 800, textAlign: 'right' },
  divider: { height: 1, background: '#1E2D42', margin: '4px 0' },
  help: { display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 },
  helpTitle: { fontSize: 8, color: '#2A3A55', letterSpacing: 3, fontWeight: 600 },
  helpLine: { fontSize: 8, color: '#2A3A55' },
};
