import { useGameStore } from '../../stores/gameStore';
import { TOWER_CONFIG } from '../../config/towers';
import type { TowerType } from '../../types';

const TOWER_INFO: Record<TowerType, { name: string; desc: string; icon: string }> = {
  cannon: { name: 'Cannon', desc: 'Single target, high damage', icon: '🔫' },
  laser: { name: 'Laser', desc: 'Continuous beam, long range', icon: '⚡' },
  aoe: { name: 'AoE Splash', desc: 'Area damage, slow fire', icon: '💥' },
};

export function TowerShop() {
  const { gold, selectedTowerType, selectTowerType } = useGameStore();

  return (
    <div style={styles.container}>
      <div style={styles.title}>TOWERS</div>
      {(Object.keys(TOWER_CONFIG) as TowerType[]).map((type) => {
        const config = TOWER_CONFIG[type];
        const info = TOWER_INFO[type];
        const canAfford = gold >= config.cost;
        const isSelected = selectedTowerType === type;

        return (
          <button
            key={type}
            onClick={() => selectTowerType(isSelected ? null : type)}
            disabled={!canAfford}
            style={{
              ...styles.towerBtn,
              borderColor: isSelected ? '#e94560' : canAfford ? '#333' : '#222',
              opacity: canAfford ? 1 : 0.4,
              background: isSelected ? '#2a1a2e' : '#111',
            }}
          >
            <span style={styles.icon}>{info.icon}</span>
            <div style={styles.info}>
              <span style={styles.name}>{info.name}</span>
              <span style={styles.desc}>{info.desc}</span>
            </div>
            <span style={styles.cost}>{config.cost}g</span>
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    background: '#0f0f23',
    borderLeft: '2px solid #333',
    width: 220,
    fontFamily: 'monospace',
  },
  title: {
    color: '#e94560',
    fontSize: 12,
    letterSpacing: 3,
    textAlign: 'center',
    paddingBottom: 8,
    borderBottom: '1px solid #333',
  },
  towerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    border: '1px solid #333',
    borderRadius: 4,
    cursor: 'pointer',
    color: '#eee',
    textAlign: 'left',
  },
  icon: { fontSize: 24 },
  info: { display: 'flex', flexDirection: 'column', flex: 1 },
  name: { fontSize: 13, fontWeight: 'bold' },
  desc: { fontSize: 10, color: '#888' },
  cost: { fontSize: 14, color: '#ffd700', fontWeight: 'bold' },
};
