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
};

export const ENEMY_SCALE_PER_WAVE = 1.15;
