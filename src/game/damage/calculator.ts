import type { Enemy } from '../../types';

export function calcDamage(baseDamage: number, target: Enemy): number {
  // Armor reduces damage: damage = base * (100 / (100 + armor))
  const armorReduction = 100 / (100 + target.stats.armor);
  let damage = baseDamage * armorReduction;

  // Shield trait: first 3 hits deal 50% damage (simplified as flat reduction)
  if (target.traits.includes('shield') && target.hp > target.stats.maxHp * 0.5) {
    damage *= 0.5;
  }

  return Math.max(1, Math.floor(damage));
}
