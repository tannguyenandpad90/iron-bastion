import type { GameSystem, GameMap } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { getNextPosition } from '../../game/pathfinding/follow';

export class EnemyMovement implements GameSystem {
  readonly name = 'enemyMovement';

  private map: GameMap;

  constructor(map: GameMap) {
    this.map = map;
  }

  update(dt: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'wave' || store.enemies.length === 0) return;

    const surviving = [];
    let livesLost = 0;

    for (const enemy of store.enemies) {
      // Stunned enemies don't move
      const isStunned = enemy.statusEffects.some((e) => e.type === 'stun' && e.remaining > 0);
      if (isStunned) {
        surviving.push(enemy);
        continue;
      }

      // Speed modifiers
      let speedMultiplier = 1;
      for (const effect of enemy.statusEffects) {
        if (effect.type === 'slow' && effect.remaining > 0) {
          speedMultiplier *= (1 - effect.intensity);
        }
      }

      // Boss enrage: +60% speed
      if (enemy.isBoss && enemy.bossPhases) {
        const enrage = enemy.bossPhases.find((p) => p.type === 'enrage' && p.active);
        if (enrage) {
          speedMultiplier *= 1.6;
        }
      }

      const result = getNextPosition(
        enemy,
        this.map.path,
        this.map.cellSize,
        dt,
        speedMultiplier,
      );

      if (result.reachedEnd) {
        livesLost += enemy.isBoss ? 5 : 1;
      } else {
        surviving.push({
          ...enemy,
          position: result.position,
          pathIndex: result.pathIndex,
          pathProgress: result.pathProgress,
        });
      }
    }

    store.setEnemies(surviving);
    if (livesLost > 0) {
      store.loseLives(livesLost);
    }
  }
}
