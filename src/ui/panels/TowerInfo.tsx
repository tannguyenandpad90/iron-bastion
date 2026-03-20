import { useGameStore } from '../../stores/gameStore';
import { getUpgradeCost, canUpgrade, getSellValue } from '../../game/towers/factory';
import { tryUpgradeTower } from '../../game/upgrades/apply';
import { sellTower } from '../../game/economy/transactions';

export function TowerInfo() {
  const { selectedTowerId, towers, gold } = useGameStore();

  const tower = towers.find((t) => t.id === selectedTowerId);
  if (!tower) return null;

  const upgradeCost = getUpgradeCost(tower);
  const canUp = canUpgrade(tower);
  const canAffordUpgrade = gold >= upgradeCost && canUp;
  const sellValue = getSellValue(tower);

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        {tower.towerType.toUpperCase()} LV.{tower.level}
      </div>

      <div style={styles.stats}>
        <div style={styles.row}>
          <span style={styles.label}>DMG</span>
          <span style={styles.val}>{tower.stats.damage}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>RANGE</span>
          <span style={styles.val}>{tower.stats.range.toFixed(1)}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>RATE</span>
          <span style={styles.val}>{tower.stats.fireRate.toFixed(1)}/s</span>
        </div>
      </div>

      <div style={styles.actions}>
        {canUp && (
          <button
            style={{
              ...styles.btn,
              opacity: canAffordUpgrade ? 1 : 0.4,
            }}
            disabled={!canAffordUpgrade}
            onClick={() => tryUpgradeTower(tower.id)}
          >
            UPGRADE ({upgradeCost}g)
          </button>
        )}
        <button
          style={{ ...styles.btn, ...styles.sellBtn }}
          onClick={() => sellTower(tower.id)}
        >
          SELL ({sellValue}g)
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 12,
    background: '#0f0f23',
    borderLeft: '2px solid #333',
    width: 220,
    fontFamily: 'monospace',
    color: '#eee',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00d4ff',
    textAlign: 'center',
    paddingBottom: 8,
    borderBottom: '1px solid #333',
    marginBottom: 8,
  },
  stats: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  row: { display: 'flex', justifyContent: 'space-between' },
  label: { fontSize: 11, color: '#888' },
  val: { fontSize: 13, color: '#eee', fontWeight: 'bold' },
  actions: { display: 'flex', flexDirection: 'column', gap: 6 },
  btn: {
    padding: '6px 8px',
    border: '1px solid #00d4ff',
    borderRadius: 4,
    background: '#1a1a2e',
    color: '#00d4ff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sellBtn: {
    borderColor: '#e94560',
    color: '#e94560',
  },
};
