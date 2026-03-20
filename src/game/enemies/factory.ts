import type { Enemy, EnemyType, EnemyTrait, GridPosition } from '../../types';
import { ENEMY_CONFIG, ENEMY_SCALE_PER_WAVE } from '../../config/enemies';

let nextEnemyId = 0;

export function createEnemy(
  enemyType: EnemyType,
  spawnGridPos: GridPosition,
  cellSize: number,
  waveNumber: number,
  traits: EnemyTrait[] = [],
): Enemy {
  const baseStats = ENEMY_CONFIG[enemyType];
  const scale = Math.pow(ENEMY_SCALE_PER_WAVE, waveNumber - 1);

  const stats = {
    maxHp: Math.floor(baseStats.maxHp * scale),
    speed: baseStats.speed,
    armor: Math.floor(baseStats.armor * scale),
    reward: baseStats.reward,
  };

  // Shield trait gives bonus HP
  let hp = stats.maxHp;
  if (traits.includes('shield')) {
    hp = Math.floor(hp * 1.5);
    stats.maxHp = hp;
  }

  return {
    id: `enemy_${nextEnemyId++}`,
    type: 'enemy',
    enemyType,
    stats,
    hp,
    pathIndex: 0,
    pathProgress: 0,
    traits,
    statusEffects: [],
    position: {
      x: spawnGridPos.col * cellSize + cellSize / 2,
      y: spawnGridPos.row * cellSize + cellSize / 2,
    },
    active: true,
  };
}
