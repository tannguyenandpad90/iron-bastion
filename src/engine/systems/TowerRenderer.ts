import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, Tower, TowerType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const TOWER_COLORS: Record<TowerType, number> = {
  cannon: 0xff6b35,
  laser: 0x00ff88,
  aoe: 0xff3366,
};

export class TowerRenderer implements GameSystem {
  readonly name = 'towerRenderer';

  private container: Container;
  private map: GameMap;
  private sprites = new Map<string, Graphics>();

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  update(_dt: number) {
    const towers = useGameStore.getState().towers;
    const activeTowerIds = new Set(towers.map((t) => t.id));

    // Remove sprites for towers that no longer exist
    for (const [id, sprite] of this.sprites) {
      if (!activeTowerIds.has(id)) {
        this.container.removeChild(sprite);
        sprite.destroy();
        this.sprites.delete(id);
      }
    }

    // Add or update sprites
    for (const tower of towers) {
      if (!this.sprites.has(tower.id)) {
        const sprite = this.createTowerSprite(tower);
        this.sprites.set(tower.id, sprite);
        this.container.addChild(sprite);
      }
    }
  }

  private createTowerSprite(tower: Tower): Graphics {
    const { cellSize } = this.map;
    const color = TOWER_COLORS[tower.towerType];
    const g = new Graphics();
    const size = cellSize * 0.6;

    // Tower body
    g.rect(-size / 2, -size / 2, size, size);
    g.fill({ color, alpha: 0.9 });
    g.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });

    // Center dot
    g.circle(0, 0, 4);
    g.fill({ color: 0xffffff });

    // Position at grid center
    g.x = tower.gridPos.col * cellSize + cellSize / 2;
    g.y = tower.gridPos.row * cellSize + cellSize / 2;

    return g;
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
