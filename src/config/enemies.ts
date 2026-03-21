import type { EnemyType, EnemyStats } from '../types';

export const ENEMY_CONFIG: Record<EnemyType, EnemyStats> = {
  fast: {
    maxHp: 50,
    speed: 3,
    armor: 0,
    reward: 10,
  },
  tank: {
    maxHp: 200,
    speed: 1,
    armor: 5,
    reward: 25,
  },
  swarm: {
    maxHp: 30,
    speed: 2.5,
    armor: 0,
    reward: 5,
  },
  boss: {
    maxHp: 1500,
    speed: 0.6,
    armor: 10,
    reward: 200,
  },
  healer: {
    maxHp: 80,
    speed: 1.5,
    armor: 2,
    reward: 30,
  },
  flyer: {
    maxHp: 60,
    speed: 3.5,
    armor: 0,
    reward: 15,
  },
};

export const ENEMY_SCALE_PER_WAVE = 1.12;

export const BOSS_PHASES = [
  { hpThreshold: 0.75, type: 'shield' as const, duration: 4000 },
  { hpThreshold: 0.50, type: 'spawn' as const, duration: 0 },
  { hpThreshold: 0.30, type: 'enrage' as const, duration: 0 },
];
