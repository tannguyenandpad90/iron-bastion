import type { TowerType } from '../types';

export interface SynergyConfig {
  pair: [TowerType, TowerType];
  bonusType: 'critChance' | 'burnDot' | 'shrapnel' | 'damageBoost' | 'chainBoost' | 'piercing';
  value: number;
  description: string;
}

export const SYNERGY_CONFIG: SynergyConfig[] = [
  // Original synergies
  { pair: ['cannon', 'laser'],   bonusType: 'critChance',  value: 0.15, description: '+15% crit' },
  { pair: ['laser', 'aoe'],      bonusType: 'burnDot',     value: 5,    description: '+5 burn DOT' },
  { pair: ['cannon', 'aoe'],     bonusType: 'shrapnel',    value: 0.3,  description: '+30% splash' },
  { pair: ['sniper', 'cannon'],  bonusType: 'piercing',    value: 0.25, description: '+25% pierce' },
  { pair: ['tesla', 'laser'],    bonusType: 'chainBoost',  value: 2,    description: '+2 chains' },
  { pair: ['tesla', 'aoe'],      bonusType: 'damageBoost', value: 0.2,  description: '+20% damage' },
  { pair: ['sniper', 'tesla'],   bonusType: 'critChance',  value: 0.2,  description: '+20% crit' },
  // New tower synergies
  { pair: ['flame', 'laser'],    bonusType: 'burnDot',     value: 8,    description: '+8 burn DOT' },
  { pair: ['flame', 'aoe'],      bonusType: 'shrapnel',    value: 0.5,  description: '+50% cone' },
  { pair: ['missile', 'cannon'], bonusType: 'damageBoost', value: 0.25, description: '+25% damage' },
  { pair: ['missile', 'aoe'],    bonusType: 'shrapnel',    value: 0.4,  description: '+40% blast' },
  { pair: ['railgun', 'sniper'], bonusType: 'critChance',  value: 0.3,  description: '+30% crit' },
  { pair: ['railgun', 'tesla'],  bonusType: 'piercing',    value: 0.4,  description: '+40% pierce' },
  { pair: ['flame', 'tesla'],    bonusType: 'chainBoost',  value: 1,    description: '+1 chain' },
  { pair: ['missile', 'sniper'], bonusType: 'damageBoost', value: 0.3,  description: '+30% damage' },
  { pair: ['railgun', 'laser'],  bonusType: 'damageBoost', value: 0.35, description: '+35% damage' },
  // Plasma synergies
  { pair: ['plasma', 'tesla'],   bonusType: 'chainBoost',  value: 3,    description: '+3 chains' },
  { pair: ['plasma', 'aoe'],     bonusType: 'shrapnel',    value: 0.6,  description: '+60% blast' },
  { pair: ['plasma', 'flame'],   bonusType: 'burnDot',     value: 10,   description: '+10 burn DOT' },
  { pair: ['plasma', 'railgun'], bonusType: 'damageBoost', value: 0.5,  description: '+50% damage' },
];
