import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameSystem, GameMap, Enemy, EnemyType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const ENEMY_COLORS: Record<EnemyType, number> = {
  fast: 0x00ffcc,
  tank: 0xff4444,
  swarm: 0xffaa00,
  boss: 0xff00ff,
  healer: 0x44ff44,
  flyer: 0x66ccff,
};

const ENEMY_SIZES: Record<EnemyType, number> = {
  fast: 0.35,
  tank: 0.5,
  swarm: 0.25,
  boss: 0.75,
  healer: 0.4,
  flyer: 0.3,
};

const STATUS_TINTS: Record<string, number> = {
  stun: 0x8888ff,
  slow: 0x88ccff,
  burn: 0xff8844,
  chain: 0xaa44ff,
};

interface EnemySprite {
  container: Container;
  body: Graphics;
  hpBg: Graphics;
  hpFill: Graphics;
  shieldRing: Graphics;
  healAura: Graphics;
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

  update(dt: number) {
    const enemies = useGameStore.getState().enemies;
    const activeIds = new Set(enemies.map((e) => e.id));

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

      sprite.container.x = enemy.position.x;
      sprite.container.y = enemy.position.y;

      // Flyer: bob up and down
      if (enemy.traits.includes('flying')) {
        sprite.container.y += Math.sin(Date.now() * 0.005 + enemy.pathIndex) * 3;
      }

      // HP bar
      const ratio = Math.max(0, enemy.hp / enemy.stats.maxHp);
      sprite.hpFill.clear();
      const barWidth = sprite.size * ratio;
      if (barWidth > 0) {
        const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
        sprite.hpFill.rect(-sprite.size / 2, -sprite.size / 2 - 8, barWidth, 4);
        sprite.hpFill.fill({ color });
      }

      // Status tint
      let tint = 0xffffff;
      for (const effect of enemy.statusEffects) {
        if (effect.remaining > 0 && STATUS_TINTS[effect.type]) {
          tint = STATUS_TINTS[effect.type];
          break;
        }
      }
      sprite.body.tint = tint;

      // Boss enrage
      if (enemy.isBoss && enemy.bossPhases?.some((p) => p.type === 'enrage' && p.active)) {
        sprite.body.tint = 0xff4400;
      }

      // Shield visual
      const hasShield = (enemy.traits.includes('shield') && enemy.hp > enemy.stats.maxHp * 0.5)
        || (enemy.isBoss && enemy.bossPhases?.some((p) => p.type === 'shield' && p.active && p.remaining > 0));
      sprite.shieldRing.visible = !!hasShield;

      // Healer aura pulse
      if (enemy.enemyType === 'healer') {
        const pulse = 0.6 + Math.sin(Date.now() * 0.003) * 0.4;
        sprite.healAura.alpha = pulse * 0.3;
        sprite.healAura.visible = true;
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

    // Healer aura
    const healAura = new Graphics();
    healAura.circle(0, 0, radius * 3);
    healAura.fill({ color: 0x44ff44, alpha: 0.15 });
    healAura.visible = false;
    spriteContainer.addChild(healAura);

    // Shield ring
    const shieldRing = new Graphics();
    shieldRing.circle(0, 0, radius + 4);
    shieldRing.stroke({ color: 0x44aaff, width: 2, alpha: 0.7 });
    shieldRing.visible = false;
    spriteContainer.addChild(shieldRing);

    // Body
    const body = new Graphics();
    if (enemy.isBoss) {
      // Hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) body.moveTo(x, y);
        else body.lineTo(x, y);
      }
      body.closePath();
      body.fill({ color, alpha: 0.9 });
      body.stroke({ color: 0xffffff, width: 2, alpha: 0.6 });
    } else if (enemy.enemyType === 'flyer') {
      // Diamond shape for flyers
      body.moveTo(0, -radius);
      body.lineTo(radius * 0.7, 0);
      body.lineTo(0, radius);
      body.lineTo(-radius * 0.7, 0);
      body.closePath();
      body.fill({ color, alpha: 0.9 });
      body.stroke({ color: 0xffffff, width: 1, alpha: 0.5 });
    } else if (enemy.enemyType === 'healer') {
      // Cross shape for healers
      const s = radius * 0.4;
      body.rect(-s, -radius, s * 2, radius * 2);
      body.rect(-radius, -s, radius * 2, s * 2);
      body.fill({ color, alpha: 0.9 });
      body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
    } else if (enemy.enemyType === 'tank') {
      // Square for tanks
      body.rect(-radius, -radius, size, size);
      body.fill({ color, alpha: 0.9 });
      body.stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 });
    } else {
      // Circle for default
      body.circle(0, 0, radius);
      body.fill({ color, alpha: 0.9 });
      body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
    }
    spriteContainer.addChild(body);

    // HP bar
    const hpBg = new Graphics();
    hpBg.rect(-size / 2, -size / 2 - 8, size, 4);
    hpBg.fill({ color: 0x333333 });
    spriteContainer.addChild(hpBg);

    const hpFill = new Graphics();
    hpFill.rect(-size / 2, -size / 2 - 8, size, 4);
    hpFill.fill({ color: 0x00ff00 });
    spriteContainer.addChild(hpFill);

    // Trait label
    if (enemy.traits.length > 0 || enemy.isBoss) {
      const icons = [];
      if (enemy.isBoss) icons.push('B');
      if (enemy.traits.includes('shield')) icons.push('S');
      if (enemy.traits.includes('stealth')) icons.push('?');
      if (enemy.traits.includes('regen')) icons.push('+');
      if (enemy.traits.includes('flying')) icons.push('^');

      if (icons.length > 0) {
        const label = new Text({
          text: icons.join(''),
          style: new TextStyle({
            fontSize: 8, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold',
          }),
        });
        label.anchor.set(0.5);
        label.y = radius + 6;
        spriteContainer.addChild(label);
      }
    }

    return { container: spriteContainer, body, hpBg, hpFill, shieldRing, healAura, size };
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
