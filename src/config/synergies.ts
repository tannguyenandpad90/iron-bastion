import type { TowerType } from '../types';

export interface SynergyConfig {
  pair: [TowerType, TowerType];
  bonusType: 'critChance' | 'burnDot' | 'shrapnel' | 'damageBoost';
  value: number;
  description: string;
}

export const SYNERGY_CONFIG: SynergyConfig[] = [
  {
    pair: ['cannon', 'laser'],
    bonusType: 'critChance',
    value: 0.15,
    description: '+15% crit chance',
  },
  {
    pair: ['laser', 'aoe'],
    bonusType: 'burnDot',
    value: 5,
    description: 'Burn DOT 5 dmg/sec',
  },
  {
    pair: ['cannon', 'aoe'],
    bonusType: 'shrapnel',
    value: 0.3,
    description: '+30% splash range',
  },
];
