import type { Tower, GridPosition } from '../../types';
import { SYNERGY_CONFIG } from '../../config/synergies';

export interface SynergyBonus {
  towerId: string;
  bonusType: string;
  value: number;
  pairedWith: string;
}

function isAdjacent(a: GridPosition, b: GridPosition): boolean {
  const dc = Math.abs(a.col - b.col);
  const dr = Math.abs(a.row - b.row);
  return (dc === 1 && dr === 0) || (dc === 0 && dr === 1);
}

export function evaluateSynergies(towers: Tower[]): SynergyBonus[] {
  const bonuses: SynergyBonus[] = [];

  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      const a = towers[i];
      const b = towers[j];

      if (!isAdjacent(a.gridPos, b.gridPos)) continue;

      for (const synergy of SYNERGY_CONFIG) {
        const [t1, t2] = synergy.pair;
        const match =
          (a.towerType === t1 && b.towerType === t2) ||
          (a.towerType === t2 && b.towerType === t1);

        if (match) {
          bonuses.push({
            towerId: a.id,
            bonusType: synergy.bonusType,
            value: synergy.value,
            pairedWith: b.id,
          });
          bonuses.push({
            towerId: b.id,
            bonusType: synergy.bonusType,
            value: synergy.value,
            pairedWith: a.id,
          });
        }
      }
    }
  }

  return bonuses;
}
