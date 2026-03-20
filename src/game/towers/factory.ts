import type { Tower, TowerType, GridPosition, Projectile, Enemy } from '../../types';
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

  const multiplier = TOWER_UPGRADE_MULTIPLIER;
  return {
    ...tower,
    level: tower.level + 1,
    stats: {
      ...tower.stats,
      damage: Math.floor(tower.stats.damage * multiplier),
      range: tower.stats.range * 1.05,
      fireRate: tower.stats.fireRate * 1.1,
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
  return {
    id: `proj_${nextProjectileId++}`,
    type: 'projectile',
    damage: tower.stats.damage,
    speed: 400, // pixels per second
    targetId: target.id,
    sourceId: tower.id,
    position: { ...tower.position },
    active: true,
    aoeRadius: tower.towerType === 'aoe' ? tower.stats.range * 0.5 * 64 : undefined,
  };
}
