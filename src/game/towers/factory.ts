import type { Tower, TowerType, GridPosition, Projectile, Enemy, TargetingMode } from '../../types';
import { TOWER_CONFIG, TOWER_UPGRADE_MULTIPLIER, MAX_TOWER_LEVEL, TOWER_MILESTONES } from '../../config/towers';

let nextTowerId = 0;
let nextProjectileId = 0;

export function createTower(
  towerType: TowerType,
  gridPos: GridPosition,
  cellSize: number,
): Tower {
  const stats = { ...TOWER_CONFIG[towerType] };
  const defaultMode: TargetingMode = towerType === 'sniper' || towerType === 'railgun' ? 'strongest' : 'first';

  return {
    id: `tower_${nextTowerId++}`,
    type: 'tower',
    towerType,
    level: 1,
    stats,
    target: null,
    cooldown: 0,
    gridPos,
    targetingMode: defaultMode,
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

/** Get milestone bonuses achieved at this level */
export function getActiveMilestones(towerType: TowerType, level: number) {
  return (TOWER_MILESTONES[towerType] ?? []).filter((m) => level >= m.level);
}

/** Get next upcoming milestone */
export function getNextMilestone(towerType: TowerType, level: number) {
  return (TOWER_MILESTONES[towerType] ?? []).find((m) => m.level > level) ?? null;
}

export function upgradeTower(tower: Tower): Tower {
  if (!canUpgrade(tower)) return tower;

  const m = TOWER_UPGRADE_MULTIPLIER;
  const baseStats = TOWER_CONFIG[tower.towerType];
  const newLevel = tower.level + 1;
  const milestones = getActiveMilestones(tower.towerType, newLevel);

  let damage = Math.floor(tower.stats.damage * m);
  let range = tower.stats.range * 1.04;
  let fireRate = tower.stats.fireRate * 1.06;
  let statusOnHit = baseStats.statusOnHit
    ? {
        ...baseStats.statusOnHit,
        intensity: baseStats.statusOnHit.intensity * (1 + newLevel * 0.12),
        duration: baseStats.statusOnHit.duration + newLevel * 150,
      }
    : undefined;

  // Apply milestone bonuses
  for (const ms of milestones) {
    switch (ms.name) {
      case 'Heavy Shell': damage = Math.floor(damage * 1.5); break;
      case 'Focused Beam': range *= 1.25; break;
      case 'Wider Blast': break; // handled in createProjectile
      case 'Marksman': break; // handled in createProjectile
      case 'Surge': break; // handled in createProjectile
      case 'Napalm Tips':
        if (statusOnHit) statusOnHit.duration *= 1.5;
        break;
      case 'Overcharge': damage = Math.floor(damage * 2); fireRate *= 0.7; break;
      case 'Plasma Burn':
        if (statusOnHit && statusOnHit.type === 'burn') statusOnHit.intensity *= 2;
        break;
      case 'Thermobaric':
        if (statusOnHit && statusOnHit.type === 'stun') statusOnHit.duration = 2000;
        break;
    }
  }

  return {
    ...tower,
    level: newLevel,
    stats: { ...tower.stats, damage, range, fireRate, statusOnHit },
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
  let damage = tower.stats.damage;
  let critApplied = false;
  const milestones = getActiveMilestones(tower.towerType, tower.level);
  const milestoneNames = new Set(milestones.map((m) => m.name));

  // Synergy bonuses
  for (const buff of tower.synergyBuffs) {
    if (buff.bonusType === 'damageBoost') damage = Math.floor(damage * (1 + buff.value));
    if (buff.bonusType === 'piercing') damage = Math.floor(damage * (1 + buff.value));
    if (buff.bonusType === 'critChance') {
      let critChance = buff.value;
      if (milestoneNames.has('Marksman')) critChance += 0.2;
      if (Math.random() < critChance) {
        damage = Math.floor(damage * 2.5);
        critApplied = true;
      }
    }
  }

  // Standalone milestone crit (Marksman without synergy)
  if (!critApplied && milestoneNames.has('Marksman') && Math.random() < 0.2) {
    damage = Math.floor(damage * 2.5);
    critApplied = true;
  }

  // Killshot: 3x damage to low HP enemies
  if (milestoneNames.has('Killshot') && target.hp < target.stats.maxHp * 0.25) {
    damage = Math.floor(damage * 3);
  }

  // AoE radius
  let aoeRadius: number | undefined;
  if (tower.towerType === 'aoe' || tower.towerType === 'missile') {
    let splashMultiplier = 1;
    if (milestoneNames.has('Wider Blast')) splashMultiplier += 0.4;
    if (milestoneNames.has('Thermobaric')) splashMultiplier += 1.0;
    for (const buff of tower.synergyBuffs) {
      if (buff.bonusType === 'shrapnel') splashMultiplier += buff.value;
    }
    aoeRadius = tower.stats.range * 0.5 * 64 * splashMultiplier;
  }

  // Flame cone: acts like AoE at short range
  if (tower.towerType === 'flame') {
    let coneMultiplier = 1;
    if (milestoneNames.has('Inferno')) coneMultiplier = 2;
    aoeRadius = tower.stats.range * 0.4 * 64 * coneMultiplier;
  }

  // Status effect
  let statusOnHit = tower.stats.statusOnHit ? { ...tower.stats.statusOnHit } : undefined;

  // Tesla chain count
  let chainCount: number | undefined;
  if (tower.towerType === 'tesla') {
    chainCount = 3;
    if (milestoneNames.has('Surge')) chainCount += 2;
    if (milestoneNames.has('Storm')) chainCount = 99; // all in range
    for (const buff of tower.synergyBuffs) {
      if (buff.bonusType === 'chainBoost') chainCount += buff.value;
    }
    // Chain stun
    if (milestoneNames.has('Overload')) {
      statusOnHit = { type: 'stun', duration: 300, intensity: 1 };
    }
  }

  // Burn synergy
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
    chainCount,
  };
}

export function resetTowerIds() {
  nextTowerId = 0;
  nextProjectileId = 0;
}
