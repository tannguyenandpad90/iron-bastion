import type { TowerType, TowerStats } from '../types';

export const TOWER_CONFIG: Record<TowerType, TowerStats> = {
  cannon: {
    damage: 30,
    range: 3,
    fireRate: 1.2,
    cost: 50,
    upgradeCost: 40,
    projectileSpeed: 450,
  },
  laser: {
    damage: 6,
    range: 4.5,
    fireRate: 10,
    cost: 75,
    upgradeCost: 60,
    projectileSpeed: 0, // instant beam, no projectile
    statusOnHit: { type: 'burn', duration: 2000, intensity: 4 },
  },
  aoe: {
    damage: 18,
    range: 2.5,
    fireRate: 0.6,
    cost: 100,
    upgradeCost: 80,
    projectileSpeed: 300,
    statusOnHit: { type: 'slow', duration: 1500, intensity: 0.3 },
  },
};

export const TOWER_UPGRADE_MULTIPLIER = 1.3;
export const MAX_TOWER_LEVEL = 5;

export const TOWER_DESCRIPTIONS: Record<TowerType, { name: string; desc: string; color: string; key: string }> = {
  cannon: { name: 'Cannon', desc: 'High single-target DMG', color: '#ff6b35', key: '1' },
  laser: { name: 'Laser', desc: 'Beam + burn DOT', color: '#00ff88', key: '2' },
  aoe: { name: 'AoE Splash', desc: 'Area DMG + slow', color: '#ff3366', key: '3' },
};
