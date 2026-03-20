import type { Enemy } from '../../types';

export function calcDamage(baseDamage: number, target: Enemy): number {
  // Armor reduces damage: damage = base * (100 / (100 + armor))
  const armorReduction = 100 / (100 + target.stats.armor);
  let damage = baseDamage * armorReduction;

  // Shield trait: take reduced damage while above 50% HP
  if (target.traits.includes('shield') && target.hp > target.stats.maxHp * 0.5) {
    damage *= 0.5;
  }

  return Math.max(1, Math.floor(damage));
}

export function calcAoeDamage(baseDamage: number, target: Enemy): number {
  // AoE splash does 50% damage
  return calcDamage(Math.floor(baseDamage * 0.5), target);
}
