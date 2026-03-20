import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameSystem, GameMap, Enemy, EnemyType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const ENEMY_COLORS: Record<EnemyType, number> = {
  fast: 0x00ffcc,
  tank: 0xff4444,
  swarm: 0xffaa00,
  boss: 0xff00ff,
};

const ENEMY_SIZES: Record<EnemyType, number> = {
  fast: 0.35,
  tank: 0.5,
  swarm: 0.25,
  boss: 0.75,
};

const STATUS_TINTS: Record<string, number> = {
  stun: 0x8888ff,
  slow: 0x88ccff,
  burn: 0xff8844,
};

interface EnemySprite {
  container: Container;
  body: Graphics;
  hpBg: Graphics;
  hpFill: Graphics;
  shieldRing: Graphics;
  traitLabel: Text | null;
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

    // Remove dead
    for (const [id, sprite] of this.sprites) {
      if (!activeIds.has(id)) {
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    for (const enemy of enemies) {
      let sprite = this.sprites.get(enemy.id);

      if (!sprite) {
        sprite = this.createEnemySprite(enemy);
        this.sprites.set(enemy.id, sprite);
        this.container.addChild(sprite.container);
      }

      // Position
      sprite.container.x = enemy.position.x;
      sprite.container.y = enemy.position.y;

      // HP bar
      const ratio = Math.max(0, enemy.hp / enemy.stats.maxHp);
      sprite.hpFill.clear();
      const barWidth = sprite.size * ratio;
      if (barWidth > 0) {
        const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
        sprite.hpFill.rect(-sprite.size / 2, -sprite.size / 2 - 8, barWidth, 4);
        sprite.hpFill.fill({ color });
      }

      // Status effect tint
      let tint = 0xffffff;
      for (const effect of enemy.statusEffects) {
        if (effect.remaining > 0 && STATUS_TINTS[effect.type]) {
          tint = STATUS_TINTS[effect.type];
          break; // show only first active status
        }
      }
      sprite.body.tint = tint;

      // Shield visual (trait or boss phase)
      const hasShieldTrait = enemy.traits.includes('shield') && enemy.hp > enemy.stats.maxHp * 0.5;
      const hasBossShield = enemy.isBoss && enemy.bossPhases?.some(
        (p) => p.type === 'shield' && p.active && p.remaining > 0,
      );
      sprite.shieldRing.visible = hasShieldTrait || !!hasBossShield;

      // Boss enrage glow
      if (enemy.isBoss && enemy.bossPhases?.some((p) => p.type === 'enrage' && p.active)) {
        sprite.body.tint = 0xff4400;
      }
    }
  }

  private createEnemySprite(enemy: Enemy): EnemySprite {
    const { cellSize } = this.map;
    const color = ENEMY_COLORS[enemy.enemyType];
    const sizeFactor = ENEMY_SIZES[enemy.enemyType];
    const size = cellSize * sizeFactor;
    const radius = size / 2;

    const spriteContainer = new Container();

    // Shield ring (hidden by default)
    const shieldRing = new Graphics();
    shieldRing.circle(0, 0, radius + 4);
    shieldRing.stroke({ color: 0x44aaff, width: 2, alpha: 0.7 });
    shieldRing.visible = false;
    spriteContainer.addChild(shieldRing);

    // Body
    const body = new Graphics();
    if (enemy.isBoss) {
      // Boss: hexagon shape
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) body.moveTo(x, y);
        else body.lineTo(x, y);
      }
      body.closePath();
      body.fill({ color, alpha: 0.9 });
      body.stroke({ color: 0xffffff, width: 2, alpha: 0.6 });
    } else {
      body.circle(0, 0, radius);
      body.fill({ color, alpha: 0.9 });
      body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
    }
    spriteContainer.addChild(body);

    // HP bar bg
    const hpBg = new Graphics();
    const barY = -size / 2 - 8;
    hpBg.rect(-size / 2, barY, size, 4);
    hpBg.fill({ color: 0x333333 });
    spriteContainer.addChild(hpBg);

    // HP bar fill
    const hpFill = new Graphics();
    hpFill.rect(-size / 2, barY, size, 4);
    hpFill.fill({ color: 0x00ff00 });
    spriteContainer.addChild(hpFill);

    // Trait indicator
    let traitLabel: Text | null = null;
    if (enemy.traits.length > 0 || enemy.isBoss) {
      const icons = [];
      if (enemy.isBoss) icons.push('B');
      if (enemy.traits.includes('shield')) icons.push('S');
      if (enemy.traits.includes('stealth')) icons.push('?');
      if (enemy.traits.includes('regen')) icons.push('+');

      if (icons.length > 0) {
        traitLabel = new Text({
          text: icons.join(''),
          style: new TextStyle({
            fontSize: 8,
            fill: 0xffffff,
            fontFamily: 'monospace',
            fontWeight: 'bold',
          }),
        });
        traitLabel.anchor.set(0.5);
        traitLabel.y = radius + 6;
        spriteContainer.addChild(traitLabel);
      }
    }

    return { container: spriteContainer, body, hpBg, hpFill, shieldRing, traitLabel, size };
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
