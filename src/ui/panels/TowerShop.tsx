import { useGameStore } from '../../stores/gameStore';
import { TOWER_CONFIG, TOWER_DESCRIPTIONS } from '../../config/towers';
import type { TowerType } from '../../types';

export function TowerShop() {
  const { gold, selectedTowerType, selectTowerType, phase } = useGameStore();

  return (
    <div style={styles.container}>
      <div style={styles.title}>TOWERS</div>
      <div style={styles.list}>
        {(Object.keys(TOWER_CONFIG) as TowerType[]).map((type) => {
          const config = TOWER_CONFIG[type];
          const info = TOWER_DESCRIPTIONS[type];
          const canAfford = gold >= config.cost;
          const isSelected = selectedTowerType === type;

          return (
            <button
              key={type}
              onClick={() => selectTowerType(isSelected ? null : type)}
              disabled={!canAfford}
              style={{
                ...styles.towerBtn,
                borderColor: isSelected ? info.color : canAfford ? '#333' : '#222',
                opacity: canAfford ? 1 : 0.4,
                background: isSelected ? `${info.color}15` : '#111',
              }}
            >
              <div style={{ ...styles.colorDot, background: info.color }} />
              <div style={styles.info}>
                <div style={styles.nameRow}>
                  <span style={styles.name}>{info.name}</span>
                  <span style={styles.key}>[{info.key}]</span>
                </div>
                <span style={styles.desc}>{info.desc}</span>
                <div style={styles.statsRow}>
                  <span style={styles.miniStat}>D:{config.damage}</span>
                  <span style={styles.miniStat}>R:{config.range}</span>
                  {config.statusOnHit && (
                    <span style={{ ...styles.miniStat, color: '#7b68ee' }}>
                      {config.statusOnHit.type}
                    </span>
                  )}
                </div>
              </div>
              <span style={styles.cost}>{config.cost}g</span>
            </button>
          );
        })}
      </div>

      <div style={styles.divider} />
      <div style={styles.helpSection}>
        <div style={styles.helpTitle}>CONTROLS</div>
        <div style={styles.helpLine}>[1-5] Select tower</div>
        <div style={styles.helpLine}>[Q/W/E] Use skill</div>
        <div style={styles.helpLine}>[Click] Place / target</div>
        <div style={styles.helpLine}>[Right] Cancel</div>
        <div style={styles.helpLine}>[Space] {phase === 'wave' ? 'Pause' : 'Start wave'}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 10,
    background: '#0f0f23',
    borderLeft: '2px solid #333',
    width: 210,
    fontFamily: 'monospace',
    userSelect: 'none',
    overflowY: 'auto',
  },
  title: {
    color: '#e94560',
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
    paddingBottom: 6,
    borderBottom: '1px solid #333',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 4 },
  towerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    border: '1px solid #333',
    borderRadius: 4,
    cursor: 'pointer',
    color: '#eee',
    textAlign: 'left',
  },
  colorDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  info: { display: 'flex', flexDirection: 'column', flex: 1, gap: 1 },
  nameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 12, fontWeight: 'bold' },
  key: { fontSize: 8, color: '#555' },
  desc: { fontSize: 9, color: '#888' },
  statsRow: { display: 'flex', gap: 5 },
  miniStat: { fontSize: 8, color: '#666' },
  cost: { fontSize: 13, color: '#ffd700', fontWeight: 'bold', flexShrink: 0 },
  divider: { height: 1, background: '#333', margin: '2px 0' },
  helpSection: { display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 },
  helpTitle: { fontSize: 9, color: '#555', letterSpacing: 2 },
  helpLine: { fontSize: 9, color: '#444' },
};
