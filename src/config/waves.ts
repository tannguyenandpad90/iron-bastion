import type { Wave } from '../types';

export const WAVES: Wave[] = [
  {
    segments: [{ enemyType: 'swarm', count: 8, interval: 600 }],
    reward: 50,
  },
  {
    segments: [
      { enemyType: 'fast', count: 5, interval: 800 },
      { enemyType: 'swarm', count: 6, interval: 500 },
    ],
    reward: 75,
  },
  {
    segments: [
      { enemyType: 'tank', count: 3, interval: 1500 },
      { enemyType: 'fast', count: 4, interval: 700 },
    ],
    reward: 100,
  },
  {
    segments: [
      { enemyType: 'swarm', count: 12, interval: 400 },
      { enemyType: 'tank', count: 2, interval: 2000 },
    ],
    reward: 120,
  },
  {
    segments: [
      { enemyType: 'fast', count: 8, interval: 500, traits: ['stealth'] },
      { enemyType: 'tank', count: 4, interval: 1200, traits: ['shield'] },
      { enemyType: 'swarm', count: 15, interval: 300 },
    ],
    reward: 200,
  },
];
