import type { TowerType, TowerStats } from '../types';

export const TOWER_CONFIG: Record<TowerType, TowerStats> = {
  cannon: {
    damage: 25,
    range: 3,
    fireRate: 1.2,
    cost: 50,
    upgradeCost: 40,
  },
  laser: {
    damage: 8,
    range: 4,
    fireRate: 10, // continuous
    cost: 75,
    upgradeCost: 60,
  },
  aoe: {
    damage: 15,
    range: 2.5,
    fireRate: 0.6,
    cost: 100,
    upgradeCost: 80,
  },
};

export const TOWER_UPGRADE_MULTIPLIER = 1.3;
export const MAX_TOWER_LEVEL = 5;
