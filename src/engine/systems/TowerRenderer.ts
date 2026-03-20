import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, Tower, TowerType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const TOWER_COLORS: Record<TowerType, number> = {
  cannon: 0xff6b35,
  laser: 0x00ff88,
  aoe: 0xff3366,
};

interface TowerSprite {
  container: Container;
  body: Graphics;
  barrel: Graphics;
  rangeCircle: Graphics;
}

export class TowerRenderer implements GameSystem {
  readonly name = 'towerRenderer';

  private container: Container;
  private map: GameMap;
  private sprites = new Map<string, TowerSprite>();

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  update(_dt: number) {
    const { towers, enemies, selectedTowerId } = useGameStore.getState();
    const activeTowerIds = new Set(towers.map((t) => t.id));

    // Remove old
    for (const [id, sprite] of this.sprites) {
      if (!activeTowerIds.has(id)) {
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    // Add or update
    for (const tower of towers) {
      let sprite = this.sprites.get(tower.id);

      if (!sprite) {
        sprite = this.createTowerSprite(tower);
        this.sprites.set(tower.id, sprite);
        this.container.addChild(sprite.container);
      }

      // Rotate barrel toward target
      if (tower.target) {
        const target = enemies.find((e) => e.id === tower.target);
        if (target) {
          const dx = target.position.x - tower.position.x;
          const dy = target.position.y - tower.position.y;
          sprite.barrel.rotation = Math.atan2(dy, dx);
        }
      }

      // Show range circle for selected tower
      sprite.rangeCircle.visible = tower.id === selectedTowerId;
    }
  }

  private createTowerSprite(tower: Tower): TowerSprite {
    const { cellSize } = this.map;
    const color = TOWER_COLORS[tower.towerType];
    const size = cellSize * 0.6;

    const spriteContainer = new Container();
    spriteContainer.x = tower.gridPos.col * cellSize + cellSize / 2;
    spriteContainer.y = tower.gridPos.row * cellSize + cellSize / 2;

    // Range circle (hidden by default)
    const rangeCircle = new Graphics();
    const rangeInPixels = tower.stats.range * cellSize;
    rangeCircle.circle(0, 0, rangeInPixels);
    rangeCircle.fill({ color: 0xffffff, alpha: 0.05 });
    rangeCircle.stroke({ color, width: 1, alpha: 0.3 });
    rangeCircle.visible = false;
    spriteContainer.addChild(rangeCircle);

    // Tower body
    const body = new Graphics();
    body.roundRect(-size / 2, -size / 2, size, size, 4);
    body.fill({ color, alpha: 0.85 });
    body.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
    spriteContainer.addChild(body);

    // Level indicator dots
    const dotY = size / 2 - 4;
    for (let i = 0; i < tower.level; i++) {
      const dotX = -((tower.level - 1) * 4) / 2 + i * 4;
      body.circle(dotX, dotY, 1.5);
      body.fill({ color: 0xffffff, alpha: 0.8 });
    }

    // Barrel (rotates toward target)
    const barrel = new Graphics();
    barrel.rect(0, -2, size * 0.5, 4);
    barrel.fill({ color: 0xffffff, alpha: 0.7 });
    spriteContainer.addChild(barrel);

    return { container: spriteContainer, body, barrel, rangeCircle };
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
