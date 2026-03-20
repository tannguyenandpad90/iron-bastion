import type { Tower, TowerType, GridPosition, Projectile, Enemy, TargetingMode } from '../../types';
import { TOWER_CONFIG, TOWER_UPGRADE_MULTIPLIER, MAX_TOWER_LEVEL } from '../../config/towers';

let nextTowerId = 0;
let nextProjectileId = 0;

export function createTower(
  towerType: TowerType,
  gridPos: GridPosition,
  cellSize: number,
): Tower {
  const stats = { ...TOWER_CONFIG[towerType] };

  return {
    id: `tower_${nextTowerId++}`,
    type: 'tower',
    towerType,
    level: 1,
    stats,
    target: null,
    cooldown: 0,
    gridPos,
    targetingMode: 'first' as TargetingMode,
    synergyBuffs: [],
    position: {
      x: gridPos.col * cellSize + cellSize / 2,
      y: gridPos.row * cellSize + cellSize / 2,
    },
    active: true,
  };
}

export function getUpgradeCost(tower: Tower): number {
  return Math.floor(tower.stats.upgradeCost * Math.pow(TOWER_UPGRADE_MULTIPLIER, tower.level - 1));
}

export function canUpgrade(tower: Tower): boolean {
  return tower.level < MAX_TOWER_LEVEL;
}

export function upgradeTower(tower: Tower): Tower {
  if (!canUpgrade(tower)) return tower;

  const m = TOWER_UPGRADE_MULTIPLIER;
  const baseStats = TOWER_CONFIG[tower.towerType];

  return {
    ...tower,
    level: tower.level + 1,
    stats: {
      ...tower.stats,
      damage: Math.floor(tower.stats.damage * m),
      range: tower.stats.range * 1.05,
      fireRate: tower.stats.fireRate * 1.08,
      // Preserve statusOnHit but scale intensity with level
      statusOnHit: baseStats.statusOnHit
        ? {
            ...baseStats.statusOnHit,
            intensity: baseStats.statusOnHit.intensity * (1 + (tower.level) * 0.15),
            duration: baseStats.statusOnHit.duration + tower.level * 200,
          }
        : undefined,
    },
  };
}

export function getSellValue(tower: Tower): number {
  let totalInvested = TOWER_CONFIG[tower.towerType].cost;
  for (let i = 1; i < tower.level; i++) {
    totalInvested += Math.floor(
      TOWER_CONFIG[tower.towerType].upgradeCost * Math.pow(TOWER_UPGRADE_MULTIPLIER, i - 1),
    );
  }
  return Math.floor(totalInvested * 0.6);
}

export function createProjectile(tower: Tower, target: Enemy): Projectile {
  // Calculate effective damage with synergy bonuses
  let damage = tower.stats.damage;
  let critApplied = false;

  for (const buff of tower.synergyBuffs) {
    if (buff.bonusType === 'damageBoost') {
      damage = Math.floor(damage * (1 + buff.value));
    }
    if (buff.bonusType === 'critChance') {
      if (Math.random() < buff.value) {
        damage = Math.floor(damage * 2);
        critApplied = true;
      }
    }
  }

  // AoE radius boosted by shrapnel synergy
  let aoeRadius: number | undefined;
  if (tower.towerType === 'aoe') {
    let splashMultiplier = 1;
    for (const buff of tower.synergyBuffs) {
      if (buff.bonusType === 'shrapnel') {
        splashMultiplier += buff.value;
      }
    }
    aoeRadius = tower.stats.range * 0.5 * 64 * splashMultiplier;
  }

  // Status effect on hit
  let statusOnHit = tower.stats.statusOnHit ? { ...tower.stats.statusOnHit } : undefined;

  // Burn DOT synergy bonus
  for (const buff of tower.synergyBuffs) {
    if (buff.bonusType === 'burnDot') {
      if (!statusOnHit) {
        statusOnHit = { type: 'burn', duration: 3000, intensity: buff.value };
      } else if (statusOnHit.type === 'burn') {
        statusOnHit.intensity += buff.value;
      }
    }
  }

  return {
    id: `proj_${nextProjectileId++}`,
    type: 'projectile',
    damage,
    speed: tower.stats.projectileSpeed || 400,
    targetId: target.id,
    sourceId: tower.id,
    position: { ...tower.position },
    active: true,
    aoeRadius,
    statusOnHit,
    critApplied,
  };
}

export function resetTowerIds() {
  nextTowerId = 0;
  nextProjectileId = 0;
}
