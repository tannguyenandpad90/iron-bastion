import type { Enemy } from '../../types';

export function calcDamage(baseDamage: number, target: Enemy): number {
  // Armor: damage = base * (100 / (100 + armor))
  const armorReduction = 100 / (100 + target.stats.armor);
  let damage = baseDamage * armorReduction;

  // Shield trait: 50% reduction while above 50% HP
  if (target.traits.includes('shield') && target.hp > target.stats.maxHp * 0.5) {
    damage *= 0.5;
  }

  // Boss shield phase: 90% reduction
  if (target.isBoss && target.bossPhases) {
    const shieldPhase = target.bossPhases.find(
      (p) => p.type === 'shield' && p.active && p.remaining > 0,
    );
    if (shieldPhase) {
      damage *= 0.1;
    }
  }

  // Boss enrage: takes 20% more damage but moves faster (handled in movement)
  if (target.isBoss && target.bossPhases) {
    const enragePhase = target.bossPhases.find((p) => p.type === 'enrage' && p.active);
    if (enragePhase) {
      damage *= 1.2;
    }
  }

  return Math.max(1, Math.floor(damage));
}
