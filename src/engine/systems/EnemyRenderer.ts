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

interface EnemySprite {
  container: Container;
  body: Graphics;
  hpBg: Graphics;
  hpFill: Graphics;
  size: number;
}

export class EnemyRenderer implements GameSystem {
  readonly name = 'enemyRenderer';

  private container: Container;
  private map: GameMap;
  private sprites = new Map<string, EnemySprite>();

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
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    // Add or update
    for (const enemy of enemies) {
      let sprite = this.sprites.get(enemy.id);

      if (!sprite) {
        sprite = this.createEnemySprite(enemy);
        this.sprites.set(enemy.id, sprite);
        this.container.addChild(sprite.container);
      }

      // Update position
      sprite.container.x = enemy.position.x;
      sprite.container.y = enemy.position.y;

      // Update HP bar
      const ratio = Math.max(0, enemy.hp / enemy.stats.maxHp);
      sprite.hpFill.clear();
      const barWidth = sprite.size * ratio;
      if (barWidth > 0) {
        const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
        sprite.hpFill.rect(-sprite.size / 2, -sprite.size / 2 - 8, barWidth, 4);
        sprite.hpFill.fill({ color });
      }

      // Status effect visual indicator
      if (enemy.statusEffects.length > 0) {
        sprite.body.tint = 0x8888ff; // tint when affected
      } else {
        sprite.body.tint = 0xffffff;
      }
    }
  }

  private createEnemySprite(enemy: Enemy): EnemySprite {
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

    // HP bar background
    const hpBg = new Graphics();
    hpBg.rect(-size / 2, -size / 2 - 8, size, 4);
    hpBg.fill({ color: 0x333333 });

    // HP bar fill (initially full)
    const hpFill = new Graphics();
    hpFill.rect(-size / 2, -size / 2 - 8, size, 4);
    hpFill.fill({ color: 0x00ff00 });

    spriteContainer.addChild(body);
    spriteContainer.addChild(hpBg);
    spriteContainer.addChild(hpFill);

    return { container: spriteContainer, body, hpBg, hpFill, size };
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
