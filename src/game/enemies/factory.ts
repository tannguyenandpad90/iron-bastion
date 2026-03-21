import type { Enemy, EnemyType, EnemyTrait, GridPosition, BossPhase } from '../../types';
import { ENEMY_CONFIG, ENEMY_SCALE_PER_WAVE, BOSS_PHASES } from '../../config/enemies';

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

  // Shield trait: +50% HP
  if (traits.includes('shield')) {
    stats.maxHp = Math.floor(stats.maxHp * 1.5);
  }

  // Flying trait: +20% speed, ignore terrain
  if (traits.includes('flying') || enemyType === 'flyer') {
    stats.speed *= 1.2;
    if (!traits.includes('flying')) traits = [...traits, 'flying'];
  }

  const isBoss = enemyType === 'boss';
  if (isBoss) {
    stats.maxHp = Math.floor(stats.maxHp * (1 + waveNumber * 0.2));
    stats.armor = Math.floor(stats.armor * 1.5);
  }

  let bossPhases: BossPhase[] | undefined;
  if (isBoss) {
    bossPhases = BOSS_PHASES.map((p) => ({
      hpThreshold: p.hpThreshold,
      type: p.type,
      active: false,
      duration: p.duration,
      remaining: p.duration,
    }));
  }

  return {
    id: `enemy_${nextEnemyId++}`,
    type: 'enemy',
    enemyType,
    stats,
    hp: stats.maxHp,
    pathIndex: 0,
    pathProgress: 0,
    traits,
    statusEffects: [],
    isBoss,
    bossPhases,
    healCooldown: enemyType === 'healer' ? 0 : undefined,
    position: {
      x: spawnGridPos.col * cellSize + cellSize / 2,
      y: spawnGridPos.row * cellSize + cellSize / 2,
    },
    active: true,
  };
}

export function resetEnemyIds() {
  nextEnemyId = 0;
}
