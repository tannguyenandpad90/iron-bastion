import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameSystem, GameMap, Enemy, EnemyType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const ENEMY_COLORS: Record<EnemyType, { main: number; dark: number; light: number; eye: number }> = {
  fast:   { main: 0x00ffcc, dark: 0x00aa88, light: 0x66ffdd, eye: 0xffffff },
  tank:   { main: 0xff4444, dark: 0xaa2222, light: 0xff8888, eye: 0xffcc00 },
  swarm:  { main: 0xffaa00, dark: 0xaa7700, light: 0xffcc44, eye: 0xff4444 },
  boss:   { main: 0xff00ff, dark: 0xaa00aa, light: 0xff66ff, eye: 0xff0000 },
  healer: { main: 0x44ff44, dark: 0x22aa22, light: 0x88ff88, eye: 0xffffff },
  flyer:  { main: 0x66ccff, dark: 0x4488bb, light: 0xaaddff, eye: 0xffffff },
};

const ENEMY_SIZES: Record<EnemyType, number> = {
  fast: 0.35, tank: 0.5, swarm: 0.25, boss: 0.75, healer: 0.4, flyer: 0.3,
};

const STATUS_TINTS: Record<string, number> = {
  stun: 0x8888ff, slow: 0x88ccff, burn: 0xff8844, chain: 0xaa44ff,
};

interface EnemySprite {
  container: Container;
  body: Graphics;
  hpBg: Graphics;
  hpFill: Graphics;
  shieldRing: Graphics;
  healAura: Graphics;
  shadow: Graphics;
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

      // Flyer bob
      if (enemy.traits.includes('flying')) {
        sprite.container.y += Math.sin(Date.now() * 0.005 + enemy.pathIndex) * 4;
        sprite.shadow.scale.set(1, 0.3);
        sprite.shadow.y = 10;
        sprite.shadow.visible = true;
      }

      // HP bar
      const ratio = Math.max(0, enemy.hp / enemy.stats.maxHp);
      sprite.hpFill.clear();
      const barW = sprite.size * ratio;
      if (barW > 0) {
        const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
        sprite.hpFill.rect(-sprite.size / 2, -sprite.size / 2 - 10, barW, 4);
        sprite.hpFill.fill({ color });
        // HP bar shine
        sprite.hpFill.rect(-sprite.size / 2, -sprite.size / 2 - 10, barW, 1);
        sprite.hpFill.fill({ color: 0xffffff, alpha: 0.3 });
      }

      // Status tint
      let tint = 0xffffff;
      for (const effect of enemy.statusEffects) {
        if (effect.remaining > 0 && STATUS_TINTS[effect.type]) {
          tint = STATUS_TINTS[effect.type]; break;
        }
      }
      sprite.body.tint = tint;

      if (enemy.isBoss && enemy.bossPhases?.some((p) => p.type === 'enrage' && p.active)) {
        sprite.body.tint = 0xff4400;
      }

      const hasShield = (enemy.traits.includes('shield') && enemy.hp > enemy.stats.maxHp * 0.5)
        || (enemy.isBoss && enemy.bossPhases?.some((p) => p.type === 'shield' && p.active && p.remaining > 0));
      sprite.shieldRing.visible = !!hasShield;

      if (enemy.enemyType === 'healer') {
        const pulse = 0.5 + Math.sin(Date.now() * 0.004) * 0.5;
        sprite.healAura.alpha = pulse * 0.2;
        sprite.healAura.visible = true;
      }
    }
  }

  private createEnemySprite(enemy: Enemy): EnemySprite {
    const { cellSize } = this.map;
    const c = ENEMY_COLORS[enemy.enemyType];
    const sizeFactor = ENEMY_SIZES[enemy.enemyType];
    const size = cellSize * sizeFactor;
    const r = size / 2;

    const ct = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 4, r * 0.8, r * 0.3);
    shadow.fill({ color: 0x000000, alpha: 0.2 });
    shadow.visible = !enemy.traits.includes('flying');
    ct.addChild(shadow);

    // Healer aura
    const healAura = new Graphics();
    healAura.circle(0, 0, r * 3);
    healAura.fill({ color: 0x44ff44, alpha: 0.1 });
    healAura.circle(0, 0, r * 2);
    healAura.stroke({ color: 0x44ff44, width: 1, alpha: 0.15 });
    healAura.visible = false;
    ct.addChild(healAura);

    // Shield ring
    const shieldRing = new Graphics();
    shieldRing.circle(0, 0, r + 5);
    shieldRing.stroke({ color: 0x44aaff, width: 2, alpha: 0.6 });
    shieldRing.circle(0, 0, r + 3);
    shieldRing.stroke({ color: 0x88ccff, width: 1, alpha: 0.3 });
    shieldRing.visible = false;
    ct.addChild(shieldRing);

    // Body
    const body = new Graphics();
    this.drawEnemyBody(body, enemy, r, size, c);
    ct.addChild(body);

    // HP bar
    const hpBg = new Graphics();
    hpBg.rect(-size / 2, -size / 2 - 10, size, 4);
    hpBg.fill({ color: 0x222222 });
    hpBg.rect(-size / 2, -size / 2 - 10, size, 4);
    hpBg.stroke({ color: 0x444444, width: 0.5 });
    ct.addChild(hpBg);

    const hpFill = new Graphics();
    hpFill.rect(-size / 2, -size / 2 - 10, size, 4);
    hpFill.fill({ color: 0x00ff00 });
    ct.addChild(hpFill);

    // Trait icons
    if (enemy.traits.length > 0 || enemy.isBoss) {
      const icons: string[] = [];
      if (enemy.isBoss) icons.push('B');
      if (enemy.traits.includes('shield')) icons.push('S');
      if (enemy.traits.includes('stealth')) icons.push('?');
      if (enemy.traits.includes('regen')) icons.push('+');
      if (enemy.traits.includes('flying')) icons.push('^');

      if (icons.length > 0) {
        const label = new Text({
          text: icons.join(''),
          style: new TextStyle({
            fontSize: enemy.isBoss ? 10 : 7,
            fill: 0xffffff,
            fontFamily: 'monospace',
            fontWeight: 'bold',
          }),
        });
        label.anchor.set(0.5);
        label.y = r + 8;
        ct.addChild(label);
      }
    }

    return { container: ct, body, hpBg, hpFill, shieldRing, healAura, shadow, size };
  }

  private drawEnemyBody(body: Graphics, enemy: Enemy, r: number, size: number, c: { main: number; dark: number; light: number; eye: number }) {
    if (enemy.isBoss) {
      // Hexagon — outer ring + inner core
      this.drawPoly(body, 6, r, c.dark);
      this.drawPoly(body, 6, r - 3, c.main);
      body.stroke({ color: c.light, width: 1, alpha: 0.4 });
      // Glowing core
      body.circle(0, 0, r * 0.3);
      body.fill({ color: c.light, alpha: 0.4 });
      body.circle(0, 0, r * 0.12);
      body.fill({ color: c.eye });
      // Spikes
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const sx = Math.cos(angle) * (r + 4);
        const sy = Math.sin(angle) * (r + 4);
        body.circle(sx, sy, 2);
        body.fill({ color: c.light, alpha: 0.5 });
      }
    } else if (enemy.enemyType === 'tank') {
      // Armored square with plates
      body.roundRect(-r, -r, size, size, 3);
      body.fill({ color: c.dark });
      body.roundRect(-r + 3, -r + 3, size - 6, size - 6, 2);
      body.fill({ color: c.main });
      // Armor plates
      body.rect(-r + 2, -r + 2, size - 4, 4);
      body.fill({ color: c.light, alpha: 0.2 });
      body.rect(-r + 2, r - 6, size - 4, 4);
      body.fill({ color: c.dark, alpha: 0.3 });
      // Eye slit
      body.rect(-r * 0.4, -2, r * 0.8, 4);
      body.fill({ color: c.eye, alpha: 0.6 });
    } else if (enemy.enemyType === 'fast') {
      // Sleek circle with speed lines
      body.circle(0, 0, r);
      body.fill({ color: c.dark });
      body.circle(0, 0, r - 2);
      body.fill({ color: c.main });
      // Speed streak
      body.moveTo(-r * 0.6, -r * 0.2);
      body.lineTo(r * 0.6, -r * 0.2);
      body.stroke({ color: c.light, width: 1, alpha: 0.4 });
      // Eye
      body.circle(r * 0.2, -r * 0.1, 2.5);
      body.fill({ color: c.eye });
      body.circle(r * 0.2, -r * 0.1, 1);
      body.fill({ color: 0x000000 });
    } else if (enemy.enemyType === 'swarm') {
      // Small triangle
      body.moveTo(0, -r);
      body.lineTo(r * 0.8, r * 0.6);
      body.lineTo(-r * 0.8, r * 0.6);
      body.closePath();
      body.fill({ color: c.main });
      body.stroke({ color: c.light, width: 1, alpha: 0.4 });
      // Dot eye
      body.circle(0, -r * 0.1, 1.5);
      body.fill({ color: c.eye });
    } else if (enemy.enemyType === 'healer') {
      // Cross with glow center
      const s = r * 0.35;
      body.rect(-s, -r + 2, s * 2, (r - 2) * 2);
      body.rect(-r + 2, -s, (r - 2) * 2, s * 2);
      body.fill({ color: c.dark });
      const s2 = s - 2;
      body.rect(-s2, -r + 4, s2 * 2, (r - 4) * 2);
      body.rect(-r + 4, -s2, (r - 4) * 2, s2 * 2);
      body.fill({ color: c.main });
      // Center orb
      body.circle(0, 0, r * 0.2);
      body.fill({ color: 0xffffff, alpha: 0.6 });
    } else if (enemy.enemyType === 'flyer') {
      // Wing shape
      body.moveTo(0, -r);
      body.lineTo(r, r * 0.3);
      body.lineTo(r * 0.4, r);
      body.lineTo(0, r * 0.5);
      body.lineTo(-r * 0.4, r);
      body.lineTo(-r, r * 0.3);
      body.closePath();
      body.fill({ color: c.dark });
      // Inner
      body.moveTo(0, -r + 4);
      body.lineTo(r - 4, r * 0.3);
      body.lineTo(r * 0.4, r - 3);
      body.lineTo(0, r * 0.5 - 2);
      body.lineTo(-r * 0.4, r - 3);
      body.lineTo(-r + 4, r * 0.3);
      body.closePath();
      body.fill({ color: c.main });
      // Eye
      body.circle(0, -r * 0.2, 2);
      body.fill({ color: c.eye });
    }
  }

  private drawPoly(g: Graphics, sides: number, radius: number, color: number) {
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fill({ color });
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
