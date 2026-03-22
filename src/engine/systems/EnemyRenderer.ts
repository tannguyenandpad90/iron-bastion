import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameSystem, GameMap, Enemy, EnemyType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

// Neon enemy palette
const EC: Record<EnemyType, { main: number; glow: number; core: number }> = {
  fast:   { main: 0xFFB800, glow: 0xFFCC44, core: 0xffffff },
  tank:   { main: 0xFF5C5C, glow: 0xFF8888, core: 0xffdddd },
  swarm:  { main: 0xFFB800, glow: 0xFFDD66, core: 0xffffff },
  boss:   { main: 0xFF3D6E, glow: 0xFF6B6B, core: 0xffffff },
  healer: { main: 0x00F5A0, glow: 0x00FFCC, core: 0xffffff },
  flyer:  { main: 0x00E5FF, glow: 0x5BFFFF, core: 0xffffff },
};

const SIZES: Record<EnemyType, number> = {
  fast: 0.32, tank: 0.48, swarm: 0.22, boss: 0.7, healer: 0.36, flyer: 0.28,
};

const STATUS_GLOW: Record<string, number> = {
  stun: 0x9B5CFF, slow: 0x00BFFF, burn: 0xFF5C5C, chain: 0x9B5CFF,
};

interface ESprite {
  ct: Container;
  body: Graphics;
  hpBg: Graphics;
  hpFill: Graphics;
  shield: Graphics;
  aura: Graphics;
  shadow: Graphics;
  size: number;
}

export class EnemyRenderer implements GameSystem {
  readonly name = 'enemyRenderer';

  private container: Container;
  private map: GameMap;
  private sprites = new Map<string, ESprite>();

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  update(_dt: number) {
    const enemies = useGameStore.getState().enemies;
    const ids = new Set(enemies.map((e) => e.id));

    for (const [id, sp] of this.sprites) {
      if (!ids.has(id)) {
        this.container.removeChild(sp.ct);
        sp.ct.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    for (const enemy of enemies) {
      let sp = this.sprites.get(enemy.id);
      if (!sp) {
        sp = this.createSprite(enemy);
        this.sprites.set(enemy.id, sp);
        this.container.addChild(sp.ct);
      }

      sp.ct.x = enemy.position.x;
      sp.ct.y = enemy.position.y;

      // Flyer bob
      if (enemy.traits.includes('flying')) {
        sp.ct.y += Math.sin(Date.now() * 0.005 + enemy.pathIndex) * 4;
        sp.shadow.y = 10; sp.shadow.visible = true;
      }

      // HP bar
      const ratio = Math.max(0, enemy.hp / enemy.stats.maxHp);
      sp.hpFill.clear();
      const bw = sp.size * ratio;
      if (bw > 0) {
        const hpColor = ratio > 0.5 ? 0x00F5A0 : ratio > 0.25 ? 0xFFD166 : 0xFF3D6E;
        sp.hpFill.rect(-sp.size / 2, -sp.size / 2 - 10, bw, 3);
        sp.hpFill.fill({ color: hpColor });
        // Bright top edge
        sp.hpFill.rect(-sp.size / 2, -sp.size / 2 - 10, bw, 1);
        sp.hpFill.fill({ color: 0xffffff, alpha: 0.3 });
      }

      // Status glow
      let tint = 0xffffff;
      for (const fx of enemy.statusEffects) {
        if (fx.remaining > 0 && STATUS_GLOW[fx.type]) { tint = STATUS_GLOW[fx.type]; break; }
      }
      sp.body.tint = tint;

      // Boss enrage
      if (enemy.isBoss && enemy.bossPhases?.some((p) => p.type === 'enrage' && p.active)) {
        sp.body.tint = 0xFF3D6E;
      }

      // Shield
      const hasShield = (enemy.traits.includes('shield') && enemy.hp > enemy.stats.maxHp * 0.5)
        || (enemy.isBoss && enemy.bossPhases?.some((p) => p.type === 'shield' && p.active && p.remaining > 0));
      sp.shield.visible = !!hasShield;

      // Healer aura
      if (enemy.enemyType === 'healer') {
        sp.aura.alpha = 0.1 + Math.sin(Date.now() * 0.004) * 0.08;
        sp.aura.visible = true;
      }
    }
  }

  private createSprite(enemy: Enemy): ESprite {
    const { cellSize: s } = this.map;
    const c = EC[enemy.enemyType];
    const szF = SIZES[enemy.enemyType];
    const sz = s * szF;
    const r = sz / 2;

    const ct = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 4, r * 0.7, r * 0.25);
    shadow.fill({ color: 0x000000, alpha: 0.25 });
    shadow.visible = !enemy.traits.includes('flying');
    ct.addChild(shadow);

    // Healer aura
    const aura = new Graphics();
    aura.circle(0, 0, r * 3);
    aura.fill({ color: c.main, alpha: 0.06 });
    aura.circle(0, 0, r * 2);
    aura.stroke({ color: c.glow, width: 1, alpha: 0.1 });
    aura.visible = false;
    ct.addChild(aura);

    // Shield ring
    const shield = new Graphics();
    shield.circle(0, 0, r + 5);
    shield.stroke({ color: 0x00BFFF, width: 2, alpha: 0.5 });
    shield.circle(0, 0, r + 5);
    shield.stroke({ color: 0x5BFFFF, width: 4, alpha: 0.1 }); // glow
    shield.visible = false;
    ct.addChild(shield);

    // Body with neon outline
    const body = new Graphics();

    // Outer neon glow
    if (enemy.isBoss) {
      body.circle(0, 0, r + 3);
      body.fill({ color: c.glow, alpha: 0.1 });
    }

    // Shape
    if (enemy.isBoss) {
      this.drawPoly(body, 6, r, 0x0D1220);
      this.drawPoly(body, 6, r - 2, 0x152030);
      body.circle(0, 0, r); body.stroke({ color: c.main, width: 2, alpha: 0.6 });
      // Glowing core
      body.circle(0, 0, r * 0.3);
      body.fill({ color: c.main, alpha: 0.2 });
      body.circle(0, 0, r * 0.12);
      body.fill({ color: c.core, alpha: 0.7 });
      // Spike dots
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        body.circle(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4), 2);
        body.fill({ color: c.glow, alpha: 0.4 });
      }
    } else if (enemy.enemyType === 'tank') {
      body.roundRect(-r, -r, sz, sz, 3);
      body.fill({ color: 0x0D1220 });
      body.roundRect(-r + 2, -r + 2, sz - 4, sz - 4, 2);
      body.fill({ color: 0x152030 });
      body.roundRect(-r, -r, sz, sz, 3);
      body.stroke({ color: c.main, width: 1.5, alpha: 0.5 });
      // Armor lines
      body.rect(-r + 3, -r + 3, sz - 6, 3);
      body.fill({ color: c.main, alpha: 0.12 });
      // Core slit
      body.rect(-r * 0.35, -1.5, r * 0.7, 3);
      body.fill({ color: c.core, alpha: 0.5 });
    } else if (enemy.enemyType === 'fast') {
      body.circle(0, 0, r);
      body.fill({ color: 0x0D1220 });
      body.circle(0, 0, r - 2);
      body.fill({ color: 0x152030 });
      body.circle(0, 0, r);
      body.stroke({ color: c.main, width: 1, alpha: 0.5 });
      // Speed line
      body.moveTo(-r * 0.5, 0); body.lineTo(r * 0.5, 0);
      body.stroke({ color: c.main, width: 0.5, alpha: 0.3 });
      // Eye
      body.circle(r * 0.2, -1, 2.5);
      body.fill({ color: c.core, alpha: 0.7 });
    } else if (enemy.enemyType === 'swarm') {
      body.moveTo(0, -r); body.lineTo(r * 0.7, r * 0.6); body.lineTo(-r * 0.7, r * 0.6);
      body.closePath();
      body.fill({ color: 0x152030 });
      body.stroke({ color: c.main, width: 1, alpha: 0.5 });
      body.circle(0, 0, 1.5);
      body.fill({ color: c.core, alpha: 0.6 });
    } else if (enemy.enemyType === 'healer') {
      const cs = r * 0.3;
      body.rect(-cs, -r + 2, cs * 2, (r - 2) * 2);
      body.rect(-r + 2, -cs, (r - 2) * 2, cs * 2);
      body.fill({ color: 0x152030 });
      body.rect(-cs, -r + 2, cs * 2, (r - 2) * 2);
      body.rect(-r + 2, -cs, (r - 2) * 2, cs * 2);
      body.stroke({ color: c.main, width: 1, alpha: 0.5 });
      body.circle(0, 0, r * 0.18);
      body.fill({ color: c.core, alpha: 0.6 });
    } else if (enemy.enemyType === 'flyer') {
      // Wing shape
      body.moveTo(0, -r); body.lineTo(r, r * 0.3); body.lineTo(r * 0.35, r);
      body.lineTo(0, r * 0.4); body.lineTo(-r * 0.35, r); body.lineTo(-r, r * 0.3);
      body.closePath();
      body.fill({ color: 0x152030 });
      body.stroke({ color: c.main, width: 1, alpha: 0.5 });
      body.circle(0, -r * 0.15, 2);
      body.fill({ color: c.core, alpha: 0.7 });
    }
    ct.addChild(body);

    // HP bar
    const hpBg = new Graphics();
    hpBg.rect(-sz / 2, -sz / 2 - 10, sz, 3);
    hpBg.fill({ color: 0x0B0F1A });
    hpBg.rect(-sz / 2, -sz / 2 - 10, sz, 3);
    hpBg.stroke({ color: 0x1A2333, width: 0.5 });
    ct.addChild(hpBg);

    const hpFill = new Graphics();
    ct.addChild(hpFill);

    // Trait labels
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
          style: new TextStyle({ fontSize: enemy.isBoss ? 9 : 7, fill: c.main, fontFamily: 'Exo 2, monospace', fontWeight: '700' }),
        });
        label.anchor.set(0.5);
        label.y = r + 7;
        ct.addChild(label);
      }
    }

    return { ct, body, hpBg, hpFill, shield, aura, shadow, size: sz };
  }

  private drawPoly(g: Graphics, sides: number, radius: number, color: number) {
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
      if (i === 0) g.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
      else g.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    g.closePath();
    g.fill({ color });
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
