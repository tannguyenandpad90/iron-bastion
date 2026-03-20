import type { GameSystem, GameMap, Enemy, Tower } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export class TowerTargeting implements GameSystem {
  readonly name = 'towerTargeting';

  private map: GameMap;

  constructor(map: GameMap) {
    this.map = map;
  }

  update(_dt: number) {
    const store = useGameStore.getState();

    if (store.phase !== 'wave') return;

    for (const tower of store.towers) {
      const target = this.findTarget(tower, store.enemies);
      if (target?.id !== tower.target) {
        store.updateTower(tower.id, { target: target?.id ?? null });
      }
    }
  }

  private findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
    const rangeInPixels = tower.stats.range * this.map.cellSize;
    const rangeSquared = rangeInPixels * rangeInPixels;

    let bestTarget: Enemy | null = null;
    let bestProgress = -1; // furthest along the path = highest priority

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // Skip stealth enemies (for now, until detection is implemented)
      if (enemy.traits.includes('stealth')) continue;

      const dx = enemy.position.x - tower.position.x;
      const dy = enemy.position.y - tower.position.y;
      const distSquared = dx * dx + dy * dy;

      if (distSquared <= rangeSquared) {
        // "First" targeting — prefer enemies furthest along the path
        const progress = enemy.pathIndex + enemy.pathProgress;
        if (progress > bestProgress) {
          bestProgress = progress;
          bestTarget = enemy;
        }
      }
    }

    return bestTarget;
  }
}
