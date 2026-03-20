import type { SkillType } from '../types';

export interface SkillConfig {
  cooldown: number;    // ms
  energyCost: number;
  radius: number;      // grid cells
  damage: number;
  duration: number;    // ms, for status effects
  description: string;
}

export const SKILL_CONFIG: Record<SkillType, SkillConfig> = {
  emp: {
    cooldown: 15000,
    energyCost: 30,
    radius: 3,
    damage: 0,
    duration: 3000,
    description: 'Stun all enemies in area',
  },
  airstrike: {
    cooldown: 20000,
    energyCost: 50,
    radius: 2.5,
    damage: 100,
    duration: 0,
    description: 'Massive area damage',
  },
  freeze: {
    cooldown: 12000,
    energyCost: 25,
    radius: 4,
    damage: 0,
    duration: 4000,
    description: 'Slow all enemies globally',
  },
};
