import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, Enemy, EnemyType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const ENEMY_COLORS: Record<EnemyType, number> = {
  fast: 0x00ffcc,
  tank: 0xff4444,
  swarm: 0xffaa00,
};

const ENEMY_SIZES: Record<EnemyType, number> = {
  fast: 0.35,
  tank: 0.55,
  swarm: 0.25,
};

export class EnemyRenderer implements GameSystem {
  readonly name = 'enemyRenderer';

  private container: Container;
  private map: GameMap;
  private sprites = new Map<string, Container>();

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  update(_dt: number) {
    const enemies = useGameStore.getState().enemies;
    const activeIds = new Set(enemies.map((e) => e.id));

    // Remove sprites for dead enemies
    for (const [id, sprite] of this.sprites) {
      if (!activeIds.has(id)) {
        this.container.removeChild(sprite);
        sprite.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    // Add or update
    for (const enemy of enemies) {
      let sprite = this.sprites.get(enemy.id);

      if (!sprite) {
        sprite = this.createEnemySprite(enemy);
        this.sprites.set(enemy.id, sprite);
        this.container.addChild(sprite);
      }

      // Update position
      sprite.x = enemy.position.x;
      sprite.y = enemy.position.y;

      // Update HP bar
      this.updateHpBar(sprite, enemy);
    }
  }

  private createEnemySprite(enemy: Enemy): Container {
    const { cellSize } = this.map;
    const color = ENEMY_COLORS[enemy.enemyType];
    const sizeFactor = ENEMY_SIZES[enemy.enemyType];
    const size = cellSize * sizeFactor;

    const spriteContainer = new Container();

    // Body
    const body = new Graphics();
    body.circle(0, 0, size / 2);
    body.fill({ color, alpha: 0.9 });
    body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
    spriteContainer.addChild(body);

    // HP bar background
    const hpBg = new Graphics();
    hpBg.rect(-size / 2, -size / 2 - 6, size, 4);
    hpBg.fill({ color: 0x333333 });
    spriteContainer.addChild(hpBg);

    // HP bar fill
    const hpFill = new Graphics();
    hpFill.rect(-size / 2, -size / 2 - 6, size, 4);
    hpFill.fill({ color: 0x00ff00 });
    hpFill.label = 'hpFill';
    spriteContainer.addChild(hpFill);

    return spriteContainer;
  }

  private updateHpBar(sprite: Container, enemy: Enemy) {
    const hpFill = sprite.children.find((c) => c.label === 'hpFill');
    if (hpFill) {
      const ratio = enemy.hp / enemy.stats.maxHp;
      hpFill.scale.x = Math.max(0, ratio);

      // Color shift: green → yellow → red
      if (hpFill instanceof Graphics) {
        hpFill.tint = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
