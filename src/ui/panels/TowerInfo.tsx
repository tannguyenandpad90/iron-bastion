import { useGameStore } from '../../stores/gameStore';
import { getUpgradeCost, canUpgrade, getSellValue } from '../../game/towers/factory';
import { tryUpgradeTower } from '../../game/upgrades/apply';
import { sellTower } from '../../game/economy/transactions';
import type { TargetingMode } from '../../types';
import { TOWER_DESCRIPTIONS } from '../../config/towers';

const TARGETING_MODES: { mode: TargetingMode; label: string }[] = [
  { mode: 'first', label: 'FIRST' },
  { mode: 'strongest', label: 'STRONG' },
  { mode: 'closest', label: 'CLOSE' },
];

export function TowerInfo() {
  const { selectedTowerId, towers, gold, updateTower } = useGameStore();

  const tower = towers.find((t) => t.id === selectedTowerId);
  if (!tower) return null;

  const upgradeCost = getUpgradeCost(tower);
  const canUp = canUpgrade(tower);
  const canAffordUpgrade = gold >= upgradeCost && canUp;
  const sellValue = getSellValue(tower);
  const desc = TOWER_DESCRIPTIONS[tower.towerType];

  return (
    <div style={styles.container}>
      <div style={{ ...styles.title, color: desc.color }}>
        {desc.name} LV.{tower.level}
      </div>
      <div style={styles.desc}>{desc.desc}</div>

      <div style={styles.stats}>
        <StatRow label="DMG" value={tower.stats.damage} />
        <StatRow label="RANGE" value={tower.stats.range.toFixed(1)} />
        <StatRow label="RATE" value={`${tower.stats.fireRate.toFixed(1)}/s`} />
        {tower.stats.statusOnHit && (
          <StatRow
            label="EFFECT"
            value={`${tower.stats.statusOnHit.type} ${tower.stats.statusOnHit.intensity.toFixed(1)}`}
            color="#7b68ee"
          />
        )}
      </div>

      {/* Synergy bonuses */}
      {tower.synergyBuffs.length > 0 && (
        <div style={styles.synergySection}>
          <div style={styles.synergyTitle}>SYNERGIES</div>
          {tower.synergyBuffs.map((buff, i) => (
            <div key={i} style={styles.synergyLine}>
              {buff.bonusType}: +{typeof buff.value === 'number' && buff.value < 1
                ? `${(buff.value * 100).toFixed(0)}%`
                : buff.value}
            </div>
          ))}
        </div>
      )}

      {/* Targeting mode */}
      <div style={styles.targetingSection}>
        <div style={styles.targetingTitle}>TARGET</div>
        <div style={styles.targetingButtons}>
          {TARGETING_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => updateTower(tower.id, { targetingMode: mode })}
              style={{
                ...styles.targetBtn,
                background: tower.targetingMode === mode ? '#2a1a3e' : '#111',
                borderColor: tower.targetingMode === mode ? '#7b68ee' : '#333',
                color: tower.targetingMode === mode ? '#7b68ee' : '#666',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.actions}>
        {canUp && (
          <button
            style={{ ...styles.btn, opacity: canAffordUpgrade ? 1 : 0.4 }}
            disabled={!canAffordUpgrade}
            onClick={() => tryUpgradeTower(tower.id)}
          >
            UPGRADE ({upgradeCost}g)
          </button>
        )}
        {!canUp && <div style={styles.maxLevel}>MAX LEVEL</div>}
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

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.val, color: color ?? '#eee' }}>{value}</span>
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
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 4,
    borderBottom: '1px solid #333',
  },
  desc: { fontSize: 10, color: '#777', textAlign: 'center' },
  stats: { display: 'flex', flexDirection: 'column', gap: 3 },
  row: { display: 'flex', justifyContent: 'space-between' },
  label: { fontSize: 11, color: '#888' },
  val: { fontSize: 12, fontWeight: 'bold' },
  synergySection: {
    padding: '6px 0',
    borderTop: '1px solid #333',
  },
  synergyTitle: { fontSize: 10, color: '#ffd700', letterSpacing: 2, marginBottom: 4 },
  synergyLine: { fontSize: 10, color: '#daa520' },
  targetingSection: { borderTop: '1px solid #333', paddingTop: 6 },
  targetingTitle: { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 4 },
  targetingButtons: { display: 'flex', gap: 4 },
  targetBtn: {
    flex: 1,
    padding: '4px 0',
    border: '1px solid #333',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actions: { display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #333', paddingTop: 8 },
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
  sellBtn: { borderColor: '#e94560', color: '#e94560' },
  maxLevel: { fontSize: 10, color: '#ffd700', textAlign: 'center', letterSpacing: 2 },
};
