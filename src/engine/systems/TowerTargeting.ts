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
    if (store.towers.length === 0) return;

    let changed = false;

    const updatedTowers = store.towers.map((tower) => {
      const target = this.findTarget(tower, store.enemies);
      const newTargetId = target?.id ?? null;

      if (newTargetId !== tower.target) {
        changed = true;
        return { ...tower, target: newTargetId };
      }
      return tower;
    });

    if (changed) {
      useGameStore.setState({ towers: updatedTowers });
    }
  }

  private findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
    const rangeInPixels = tower.stats.range * this.map.cellSize;
    const rangeSquared = rangeInPixels * rangeInPixels;

    let bestTarget: Enemy | null = null;
    let bestProgress = -1;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // Skip stealth enemies unless very close
      if (enemy.traits.includes('stealth')) {
        const detectRange = this.map.cellSize * 1.5;
        const dx = enemy.position.x - tower.position.x;
        const dy = enemy.position.y - tower.position.y;
        if (dx * dx + dy * dy > detectRange * detectRange) continue;
      }

      const dx = enemy.position.x - tower.position.x;
      const dy = enemy.position.y - tower.position.y;
      const distSquared = dx * dx + dy * dy;

      if (distSquared <= rangeSquared) {
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
