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

    if (store.phase !== 'wave') return;

    for (const enemy of store.enemies) {
      // Skip stunned enemies
      const isStunned = enemy.statusEffects.some((e) => e.type === 'stun' && e.remaining > 0);
      if (isStunned) continue;

      // Calculate speed modifier from status effects
      let speedMultiplier = 1;
      for (const effect of enemy.statusEffects) {
        if (effect.type === 'slow' && effect.remaining > 0) {
          speedMultiplier *= (1 - effect.intensity);
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
        // Enemy reached the base
        store.removeEnemy(enemy.id);
        store.loseLives(1);
      } else {
        store.updateEnemy(enemy.id, {
          position: result.position,
          pathIndex: result.pathIndex,
          pathProgress: result.pathProgress,
        });
      }
    }
  }
}
