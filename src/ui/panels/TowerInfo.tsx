import { useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getUpgradeCost, canUpgrade, getSellValue } from '../../game/towers/factory';
import { tryUpgradeTower } from '../../game/upgrades/apply';
import { sellTower } from '../../game/economy/transactions';
import type { TargetingMode } from '../../types';
import { TOWER_DESCRIPTIONS } from '../../config/towers';
import { SYNERGY_CONFIG } from '../../config/synergies';
import { audio } from '../../engine/AudioManager';

const TARGETING_MODES: { mode: TargetingMode; label: string }[] = [
  { mode: 'first', label: 'FIRST' },
  { mode: 'strongest', label: 'STRONG' },
  { mode: 'closest', label: 'CLOSE' },
];

const SELL_HOLD_MS = 800;

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

      {tower.synergyBuffs.length > 0 && (
        <div style={styles.synergySection}>
          <div style={styles.synergyTitle}>ACTIVE SYNERGIES</div>
          {tower.synergyBuffs.map((buff, i) => (
            <div key={i} style={styles.synergyLine}>
              {buff.bonusType}: +{buff.value < 1 ? `${(buff.value * 100).toFixed(0)}%` : buff.value}
            </div>
          ))}
        </div>
      )}

      {/* Synergy hints — what towers pair with this one */}
      <div style={styles.synergyHintSection}>
        <div style={{ ...styles.synergyTitle, color: '#3A4A6A' }}>PAIRS WITH</div>
        {SYNERGY_CONFIG.filter((s) => s.pair.includes(tower.towerType)).map((s, i) => {
          const partner = s.pair[0] === tower.towerType ? s.pair[1] : s.pair[0];
          const partnerInfo = TOWER_DESCRIPTIONS[partner];
          return (
            <div key={i} style={styles.hintLine}>
              <span style={{ color: partnerInfo.color }}>{partnerInfo.name}</span>
              <span style={styles.hintDesc}>{s.description}</span>
            </div>
          );
        })}
      </div>

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

      {/* === ACTIONS === */}
      <div style={styles.actions}>
        {canUp && (
          <button
            style={{ ...styles.upgradeBtn, opacity: canAffordUpgrade ? 1 : 0.4 }}
            disabled={!canAffordUpgrade}
            onClick={() => {
              tryUpgradeTower(tower.id);
              audio.play('upgrade');
            }}
          >
            UPGRADE ({upgradeCost}g)
          </button>
        )}
        {!canUp && <div style={styles.maxLevel}>MAX LEVEL</div>}

        {/* Sell: hold to confirm */}
        <SellButton towerId={tower.id} sellValue={sellValue} />
      </div>
    </div>
  );
}

/** Hold-to-sell button — prevents accidental sells */
function SellButton({ towerId, sellValue }: { towerId: string; sellValue: number }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const startHold = useCallback(() => {
    setHolding(true);
    startTimeRef.current = Date.now();
    setHoldProgress(0);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / SELL_HOLD_MS);
      setHoldProgress(progress);

      if (progress >= 1) {
        // Sell!
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setHolding(false);
        setHoldProgress(0);
        sellTower(towerId);
        audio.play('sell');
      }
    }, 30);
  }, [towerId]);

  const cancelHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setHolding(false);
    setHoldProgress(0);
  }, []);

  return (
    <div style={styles.sellWrapper}>
      <button
        style={styles.sellBtn}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
      >
        <div style={styles.sellContent}>
          <span>{holding ? 'SELLING...' : 'HOLD TO SELL'}</span>
          <span style={styles.sellValue}>{sellValue}g</span>
        </div>
        {/* Progress fill */}
        <div
          style={{
            ...styles.sellProgress,
            width: `${holdProgress * 100}%`,
            background: holdProgress > 0.8 ? '#ff2244' : '#e94560',
          }}
        />
      </button>
      {!holding && (
        <div style={styles.sellHint}>hold 0.8s to confirm</div>
      )}
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
    padding: 12, background: '#0f0f23', borderLeft: '2px solid #333',
    width: 220, fontFamily: 'monospace', color: '#eee',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  title: {
    fontSize: 14, fontWeight: 'bold', textAlign: 'center',
    paddingBottom: 4, borderBottom: '1px solid #333',
  },
  desc: { fontSize: 10, color: '#777', textAlign: 'center' },
  stats: { display: 'flex', flexDirection: 'column', gap: 3 },
  row: { display: 'flex', justifyContent: 'space-between' },
  label: { fontSize: 11, color: '#888' },
  val: { fontSize: 12, fontWeight: 'bold' },
  synergySection: { padding: '6px 0', borderTop: '1px solid #333' },
  synergyTitle: { fontSize: 10, color: '#ffd700', letterSpacing: 2, marginBottom: 4 },
  synergyLine: { fontSize: 10, color: '#daa520' },
  targetingSection: { borderTop: '1px solid #333', paddingTop: 6 },
  targetingTitle: { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 4 },
  targetingButtons: { display: 'flex', gap: 4 },
  targetBtn: {
    flex: 1, padding: '4px 0', border: '1px solid #333', borderRadius: 3,
    cursor: 'pointer', fontFamily: 'monospace', fontSize: 9, fontWeight: 'bold',
    textAlign: 'center',
  },
  actions: {
    display: 'flex', flexDirection: 'column', gap: 8,
    borderTop: '1px solid #333', paddingTop: 8,
  },
  upgradeBtn: {
    padding: '8px 8px', border: '2px solid #00d4ff', borderRadius: 4,
    background: '#1a1a2e', color: '#00d4ff', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold',
    letterSpacing: 1,
  },
  maxLevel: { fontSize: 10, color: '#FFD166', textAlign: 'center', letterSpacing: 2 },
  synergyHintSection: { borderTop: '1px solid #1A2333', paddingTop: 4 },
  hintLine: { display: 'flex', justifyContent: 'space-between', fontSize: 9, gap: 4 },
  hintDesc: { color: '#3A4A6A', fontSize: 8 },

  // --- Sell button ---
  sellWrapper: {
    display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4,
  },
  sellBtn: {
    position: 'relative', overflow: 'hidden',
    padding: '5px 8px', border: '1px solid #552233', borderRadius: 3,
    background: '#1a1015', color: '#aa6677', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold',
  },
  sellContent: {
    position: 'relative', zIndex: 1,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  sellValue: { color: '#ffd700', fontSize: 10 },
  sellProgress: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    background: '#e94560', opacity: 0.25, transition: 'width 30ms linear',
  },
  sellHint: {
    fontSize: 8, color: '#443333', textAlign: 'center',
  },
};
