import type { Wave } from '../types';

export const WAVES: Wave[] = [
  // Wave 1: intro swarm
  {
    segments: [{ enemyType: 'swarm', count: 8, interval: 600 }],
    reward: 50,
  },
  // Wave 2: mix fast + swarm
  {
    segments: [
      { enemyType: 'fast', count: 5, interval: 800 },
      { enemyType: 'swarm', count: 6, interval: 500 },
    ],
    reward: 75,
  },
  // Wave 3: tanks arrive
  {
    segments: [
      { enemyType: 'tank', count: 3, interval: 1500 },
      { enemyType: 'fast', count: 4, interval: 700 },
    ],
    reward: 100,
  },
  // Wave 4: swarm rush + tanks
  {
    segments: [
      { enemyType: 'swarm', count: 15, interval: 350 },
      { enemyType: 'tank', count: 3, interval: 1200 },
    ],
    reward: 120,
  },
  // Wave 5: BOSS + escorts
  {
    segments: [
      { enemyType: 'fast', count: 4, interval: 600 },
      { enemyType: 'boss', count: 1, interval: 2000 },
      { enemyType: 'swarm', count: 10, interval: 400 },
    ],
    reward: 300,
    isBoss: true,
  },
  // Wave 6: stealth + shields
  {
    segments: [
      { enemyType: 'fast', count: 8, interval: 500, traits: ['stealth'] },
      { enemyType: 'tank', count: 4, interval: 1000, traits: ['shield'] },
    ],
    reward: 150,
  },
  // Wave 7: regen tanks
  {
    segments: [
      { enemyType: 'tank', count: 6, interval: 1200, traits: ['regen'] },
      { enemyType: 'fast', count: 6, interval: 600 },
      { enemyType: 'swarm', count: 12, interval: 300 },
    ],
    reward: 175,
  },
  // Wave 8: massive swarm
  {
    segments: [
      { enemyType: 'swarm', count: 30, interval: 250 },
      { enemyType: 'fast', count: 8, interval: 400, traits: ['stealth'] },
    ],
    reward: 200,
  },
  // Wave 9: elite everything
  {
    segments: [
      { enemyType: 'tank', count: 5, interval: 1000, traits: ['shield', 'regen'] },
      { enemyType: 'fast', count: 10, interval: 400, traits: ['stealth'] },
      { enemyType: 'swarm', count: 20, interval: 250 },
    ],
    reward: 250,
  },
  // Wave 10: FINAL BOSS
  {
    segments: [
      { enemyType: 'tank', count: 4, interval: 800, traits: ['shield'] },
      { enemyType: 'boss', count: 1, interval: 3000 },
      { enemyType: 'fast', count: 8, interval: 400, traits: ['stealth'] },
      { enemyType: 'swarm', count: 20, interval: 200 },
      { enemyType: 'tank', count: 3, interval: 1000, traits: ['regen'] },
    ],
    reward: 500,
    isBoss: true,
  },
];
