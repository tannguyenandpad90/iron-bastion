import type { GameSystem, GameMap, Enemy, Tower, TargetingMode } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export class TowerTargeting implements GameSystem {
  readonly name = 'towerTargeting';

  private map: GameMap;

  constructor(map: GameMap) {
    this.map = map;
  }

  setMap(map: GameMap) {
    this.map = map;
  }

  update(_dt: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'wave' || store.towers.length === 0) return;

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
    const rangeSq = rangeInPixels * rangeInPixels;

    const inRange: { enemy: Enemy; distSq: number }[] = [];

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // Stealth: only detectable within 1.5 cells
      if (enemy.traits.includes('stealth')) {
        const detectRange = this.map.cellSize * 1.5;
        const dx = enemy.position.x - tower.position.x;
        const dy = enemy.position.y - tower.position.y;
        if (dx * dx + dy * dy > detectRange * detectRange) continue;
      }

      const dx = enemy.position.x - tower.position.x;
      const dy = enemy.position.y - tower.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rangeSq) {
        inRange.push({ enemy, distSq });
      }
    }

    if (inRange.length === 0) return null;

    return this.selectByMode(tower.targetingMode, inRange);
  }

  private selectByMode(
    mode: TargetingMode,
    candidates: { enemy: Enemy; distSq: number }[],
  ): Enemy {
    switch (mode) {
      case 'first': {
        // Furthest along path = highest priority
        let best = candidates[0];
        for (let i = 1; i < candidates.length; i++) {
          const c = candidates[i];
          const cProgress = c.enemy.pathIndex + c.enemy.pathProgress;
          const bProgress = best.enemy.pathIndex + best.enemy.pathProgress;
          if (cProgress > bProgress) best = c;
        }
        return best.enemy;
      }

      case 'strongest': {
        // Highest current HP
        let best = candidates[0];
        for (let i = 1; i < candidates.length; i++) {
          if (candidates[i].enemy.hp > best.enemy.hp) {
            best = candidates[i];
          }
        }
        return best.enemy;
      }

      case 'closest': {
        let best = candidates[0];
        for (let i = 1; i < candidates.length; i++) {
          if (candidates[i].distSq < best.distSq) {
            best = candidates[i];
          }
        }
        return best.enemy;
      }
    }
  }
}
