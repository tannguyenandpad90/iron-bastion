import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, Tower, TowerType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const TC: Record<TowerType, { main: number; glow: number; dark: number }> = {
  cannon:  { main: 0x00F5A0, glow: 0x00FFCC, dark: 0x00884C },
  laser:   { main: 0x00E5FF, glow: 0x5BFFFF, dark: 0x006688 },
  aoe:     { main: 0xFF3D6E, glow: 0xFF6B6B, dark: 0x882233 },
  sniper:  { main: 0xFFD166, glow: 0xFFE088, dark: 0x887733 },
  tesla:   { main: 0x9B5CFF, glow: 0xBB88FF, dark: 0x5533AA },
  flame:   { main: 0xFF8C00, glow: 0xFFAA33, dark: 0x884400 },
  missile: { main: 0xFF4444, glow: 0xFF6666, dark: 0x882222 },
  railgun: { main: 0x44DDFF, glow: 0x88EEFF, dark: 0x226688 },
  plasma:  { main: 0xFF00FF, glow: 0xFF88FF, dark: 0x880088 },
};

interface TSprite {
  ct: Container;
  body: Graphics;
  barrel: Graphics;
  range: Graphics;
  synergy: Graphics;
  beam: Graphics;
  level: number;
}

export class TowerRenderer implements GameSystem {
  readonly name = 'towerRenderer';
  private container: Container;
  private map: GameMap;
  private sprites = new Map<string, TSprite>();

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  update(_dt: number) {
    const { towers, enemies, selectedTowerId } = useGameStore.getState();
    const ids = new Set(towers.map((t) => t.id));

    for (const [id, sp] of this.sprites) {
      if (!ids.has(id)) { this.container.removeChild(sp.ct); sp.ct.destroy({ children: true }); this.sprites.delete(id); }
    }

    for (const tower of towers) {
      let sp = this.sprites.get(tower.id);
      if (sp && sp.level !== tower.level) {
        this.container.removeChild(sp.ct); sp.ct.destroy({ children: true }); this.sprites.delete(tower.id); sp = undefined;
      }
      if (!sp) { sp = this.create(tower); this.sprites.set(tower.id, sp); this.container.addChild(sp.ct); }

      const c = TC[tower.towerType];
      const firing = tower.cooldown > 0 && tower.cooldown > (1 / tower.stats.fireRate) * 0.6;

      if (tower.target) {
        const tgt = enemies.find((e) => e.id === tower.target);
        if (tgt) {
          const dx = tgt.position.x - tower.position.x;
          const dy = tgt.position.y - tower.position.y;
          sp.barrel.rotation = Math.atan2(dy, dx);

          sp.beam.clear();
          const tt = tower.towerType;
          if ((tt === 'laser' || tt === 'flame') && tower.cooldown < 0.06) {
            if (tt === 'flame') {
              // Cone flame
              const ang = Math.atan2(dy, dx);
              const dist = Math.min(Math.sqrt(dx * dx + dy * dy), tower.stats.range * 64);
              const spread = tower.level >= 6 ? 0.6 : 0.35;
              sp.beam.moveTo(0, 0);
              sp.beam.lineTo(Math.cos(ang - spread) * dist, Math.sin(ang - spread) * dist);
              sp.beam.lineTo(Math.cos(ang) * dist * 1.1, Math.sin(ang) * dist * 1.1);
              sp.beam.lineTo(Math.cos(ang + spread) * dist, Math.sin(ang + spread) * dist);
              sp.beam.closePath();
              sp.beam.fill({ color: c.glow, alpha: 0.12 });
              sp.beam.fill({ color: c.main, alpha: 0.06 });
              // Core line
              sp.beam.moveTo(0, 0); sp.beam.lineTo(dx * 0.8, dy * 0.8);
              sp.beam.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
            } else {
              // Laser multi-layer beam
              sp.beam.moveTo(0, 0); sp.beam.lineTo(dx, dy);
              sp.beam.stroke({ color: c.glow, width: tower.level >= 6 ? 8 : 5, alpha: 0.1 });
              sp.beam.moveTo(0, 0); sp.beam.lineTo(dx, dy);
              sp.beam.stroke({ color: c.main, width: tower.level >= 6 ? 4 : 2.5, alpha: 0.35 });
              sp.beam.moveTo(0, 0); sp.beam.lineTo(dx, dy);
              sp.beam.stroke({ color: 0xffffff, width: 1, alpha: 0.6 });
            }
            sp.beam.visible = true;
          } else if (tt === 'tesla' && tower.cooldown < 0.15) {
            const steps = 8;
            const jitter = tower.level >= 6 ? 20 : 12;
            sp.beam.moveTo(0, 0);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              sp.beam.lineTo(dx * t + (Math.random() - 0.5) * jitter, dy * t + (Math.random() - 0.5) * jitter);
            }
            sp.beam.stroke({ color: c.glow, width: tower.level >= 6 ? 5 : 3, alpha: 0.2 });
            sp.beam.moveTo(0, 0);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              sp.beam.lineTo(dx * t + (Math.random() - 0.5) * 8, dy * t + (Math.random() - 0.5) * 8);
            }
            sp.beam.stroke({ color: c.main, width: 2, alpha: 0.5 });
            sp.beam.moveTo(0, 0); sp.beam.lineTo(dx, dy);
            sp.beam.stroke({ color: 0xffffff, width: 0.5, alpha: 0.3 });
            sp.beam.visible = true;
          } else if (tt === 'railgun' && firing) {
            // Railgun: bright line across entire range
            const len = tower.stats.range * 64;
            const ang = Math.atan2(dy, dx);
            const ex = Math.cos(ang) * len, ey = Math.sin(ang) * len;
            sp.beam.moveTo(0, 0); sp.beam.lineTo(ex, ey);
            sp.beam.stroke({ color: c.glow, width: tower.level >= 6 ? 10 : 6, alpha: 0.15 });
            sp.beam.moveTo(0, 0); sp.beam.lineTo(ex, ey);
            sp.beam.stroke({ color: c.main, width: 3, alpha: 0.5 });
            sp.beam.moveTo(0, 0); sp.beam.lineTo(ex, ey);
            sp.beam.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });
            sp.beam.visible = true;
          } else if (tt === 'plasma' && firing) {
            // Plasma: pulsing energy charge VFX at barrel tip
            const ang = Math.atan2(dy, dx);
            const cellSz = this.map.cellSize * 0.5;
            const tipX = Math.cos(ang) * cellSz * 0.4;
            const tipY = Math.sin(ang) * cellSz * 0.4;
            const pulse = 8 + Math.sin(Date.now() * 0.02) * 4;
            // Outer glow
            sp.beam.circle(tipX, tipY, pulse + 6);
            sp.beam.fill({ color: 0xFF88FF, alpha: 0.1 });
            // Mid glow
            sp.beam.circle(tipX, tipY, pulse + 2);
            sp.beam.fill({ color: 0xFF00FF, alpha: 0.2 });
            // Core
            sp.beam.circle(tipX, tipY, pulse);
            sp.beam.fill({ color: 0xFF44FF, alpha: 0.4 });
            // White hot center
            sp.beam.circle(tipX, tipY, pulse * 0.3);
            sp.beam.fill({ color: 0xffffff, alpha: 0.7 });
            sp.beam.visible = true;
          } else {
            sp.beam.visible = false;
          }
        } else { sp.beam.visible = false; }
      } else {
        sp.beam.visible = false;
        const pulse = 1 + Math.sin(Date.now() * 0.003 + tower.gridPos.col * 2) * 0.02;
        sp.body.scale.set(pulse);
      }

      sp.range.visible = tower.id === selectedTowerId;
      sp.synergy.visible = tower.synergyBuffs.length > 0;
    }
  }

  private create(tower: Tower): TSprite {
    const { cellSize: s } = this.map;
    const c = TC[tower.towerType];
    const lvl = tower.level;
    const sz = s * (0.46 + lvl * 0.018);
    const h = sz / 2;
    const isMilestone = lvl >= 9;
    const isMid = lvl >= 6;

    const ct = new Container();
    ct.x = tower.gridPos.col * s + s / 2;
    ct.y = tower.gridPos.row * s + s / 2;

    // Range
    const range = new Graphics();
    const rPx = tower.stats.range * s;
    range.circle(0, 0, rPx);
    range.fill({ color: c.main, alpha: 0.03 });
    range.circle(0, 0, rPx);
    range.stroke({ color: c.main, width: 1, alpha: 0.15 });
    range.visible = false;
    ct.addChild(range);

    // Synergy glow
    const synergy = new Graphics();
    synergy.circle(0, 0, h + 8);
    synergy.stroke({ color: 0xFFD166, width: 2, alpha: 0.3 });
    synergy.visible = false;
    ct.addChild(synergy);

    // High-level outer glow ring
    if (isMid) {
      const outerGlow = new Graphics();
      outerGlow.circle(0, 0, h + (isMilestone ? 12 : 6));
      outerGlow.stroke({ color: c.glow, width: isMilestone ? 3 : 1.5, alpha: isMilestone ? 0.25 : 0.12 });
      ct.addChild(outerGlow);
    }

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 3, h * 0.8, h * 0.3);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    ct.addChild(shadow);

    // Platform
    const plat = new Graphics();
    plat.circle(0, 0, h + 2);
    plat.fill({ color: 0x0D1220 });
    plat.stroke({ color: isMilestone ? c.glow : c.dark, width: isMilestone ? 1.5 : 1, alpha: isMilestone ? 0.5 : 0.3 });
    ct.addChild(plat);

    // Body
    const body = new Graphics();
    // Outer neon glow
    body.circle(0, 0, h + 1);
    body.fill({ color: c.glow, alpha: isMilestone ? 0.1 : 0.05 });

    this.drawBody(body, tower.towerType, h, sz, c, lvl);

    // Level pips
    if (lvl > 1) {
      const maxShow = Math.min(lvl, 10);
      const spacing = Math.min(4, 36 / maxShow);
      for (let i = 0; i < maxShow; i++) {
        const dx = -((maxShow - 1) * spacing) / 2 + i * spacing;
        const isMsLevel = [3, 6, 9].includes(i + 1) && i + 1 <= lvl;
        body.circle(dx, h - 3, isMsLevel ? 2 : 1.2);
        body.fill({ color: isMsLevel ? 0xffffff : c.glow, alpha: isMsLevel ? 0.9 : 0.6 });
      }
    }
    ct.addChild(body);

    // Barrel
    const barrel = new Graphics();
    const bLen = tower.towerType === 'sniper' ? sz * 0.8
      : tower.towerType === 'railgun' ? sz * 0.9
      : tower.towerType === 'flame' ? sz * 0.3
      : tower.towerType === 'laser' ? sz * 0.55
      : sz * 0.45;
    const bW = tower.towerType === 'railgun' ? 5 : tower.towerType === 'flame' ? 6 : 4;

    barrel.rect(1, -bW / 2 + 1, bLen, bW);
    barrel.fill({ color: 0x000000, alpha: 0.15 });
    barrel.rect(0, -bW / 2, bLen, bW);
    barrel.fill({ color: 0x1A2535 });
    barrel.rect(0, -bW / 2, bLen, 1);
    barrel.fill({ color: c.main, alpha: 0.25 });

    // Muzzle tip
    if (tower.towerType === 'railgun') {
      barrel.rect(bLen - 5, -bW / 2 - 2, 5, bW + 4);
      barrel.fill({ color: c.glow, alpha: 0.35 });
    } else if (tower.towerType === 'flame') {
      // Wider nozzle
      barrel.moveTo(bLen, -bW); barrel.lineTo(bLen + 6, -bW * 1.5);
      barrel.lineTo(bLen + 6, bW * 1.5); barrel.lineTo(bLen, bW);
      barrel.closePath();
      barrel.fill({ color: c.dark, alpha: 0.5 });
    } else if (tower.towerType === 'missile') {
      barrel.rect(bLen - 3, -bW / 2 - 1, 3, bW + 2);
      barrel.fill({ color: c.main, alpha: 0.3 });
    }
    ct.addChild(barrel);

    // Beam layer
    const beam = new Graphics();
    beam.visible = false;
    ct.addChild(beam);

    return { ct, body, barrel, range, synergy, beam, level: tower.level };
  }

  private drawBody(g: Graphics, tt: TowerType, h: number, sz: number, c: { main: number; glow: number; dark: number }, lvl: number) {
    const fill = 0x0D1825;
    const inner = 0x162030;
    const strokeA = lvl >= 9 ? 0.7 : lvl >= 6 ? 0.6 : 0.45;
    const strokeW = lvl >= 9 ? 2 : 1.5;

    switch (tt) {
      case 'cannon':
        g.roundRect(-h, -h, sz, sz, 5); g.fill({ color: fill });
        g.roundRect(-h + 2, -h + 2, sz - 4, sz - 4, 3); g.fill({ color: inner });
        g.roundRect(-h, -h, sz, sz, 5); g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        g.circle(0, 0, 4); g.fill({ color: c.main, alpha: 0.4 });
        g.circle(0, 0, 2); g.fill({ color: c.glow, alpha: 0.7 });
        break;
      case 'laser':
        g.circle(0, 0, h); g.fill({ color: fill });
        g.circle(0, 0, h - 2); g.fill({ color: inner });
        g.circle(0, 0, h); g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        g.circle(0, 0, h * 0.35); g.fill({ color: c.main, alpha: 0.15 });
        g.circle(0, 0, h * 0.15); g.fill({ color: c.glow, alpha: 0.7 });
        break;
      case 'aoe':
        this.drawPoly(g, 8, h, fill, Math.PI / 8);
        this.drawPoly(g, 8, h - 2, inner, Math.PI / 8);
        g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        g.circle(0, 0, h * 0.35); g.stroke({ color: c.main, width: 1, alpha: 0.2 });
        g.circle(0, 0, h * 0.15); g.fill({ color: c.glow, alpha: 0.4 });
        break;
      case 'sniper':
        g.moveTo(0, -h); g.lineTo(h * 0.6, 0); g.lineTo(0, h); g.lineTo(-h * 0.6, 0); g.closePath();
        g.fill({ color: fill }); g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        g.moveTo(-h * 0.2, 0); g.lineTo(h * 0.2, 0); g.moveTo(0, -h * 0.2); g.lineTo(0, h * 0.2);
        g.stroke({ color: c.main, width: 0.5, alpha: 0.3 });
        g.circle(0, 0, 3); g.stroke({ color: c.glow, width: 1, alpha: 0.4 });
        break;
      case 'tesla':
        this.drawStar(g, 5, h, h * 0.45, fill);
        g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        g.circle(0, 0, h * 0.25); g.fill({ color: c.main, alpha: 0.2 });
        g.circle(0, 0, h * 0.1); g.fill({ color: 0xffffff, alpha: 0.5 });
        break;
      case 'flame':
        // Rounded rect wider at front
        g.roundRect(-h, -h * 0.8, sz, sz * 0.8, 4); g.fill({ color: fill });
        g.roundRect(-h + 2, -h * 0.8 + 2, sz - 4, sz * 0.8 - 4, 2); g.fill({ color: inner });
        g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        // Flame icon
        g.moveTo(0, -h * 0.3); g.quadraticCurveTo(h * 0.3, -h * 0.1, 0, h * 0.3);
        g.quadraticCurveTo(-h * 0.3, -h * 0.1, 0, -h * 0.3);
        g.fill({ color: c.glow, alpha: 0.3 });
        break;
      case 'missile':
        // Pentagon
        this.drawPoly(g, 5, h, fill, -Math.PI / 2);
        g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        g.circle(0, 0, h * 0.3); g.fill({ color: c.main, alpha: 0.15 });
        g.circle(0, 0, h * 0.12); g.fill({ color: c.glow, alpha: 0.5 });
        break;
      case 'railgun':
        // Elongated hexagon
        g.moveTo(-h * 0.4, -h); g.lineTo(h * 0.4, -h); g.lineTo(h, 0);
        g.lineTo(h * 0.4, h); g.lineTo(-h * 0.4, h); g.lineTo(-h, 0); g.closePath();
        g.fill({ color: fill }); g.stroke({ color: c.main, width: strokeW, alpha: strokeA });
        // Power core
        g.circle(0, 0, h * 0.3); g.fill({ color: c.main, alpha: 0.12 });
        g.circle(0, 0, h * 0.12); g.fill({ color: 0xffffff, alpha: 0.6 });
        // Charge lines
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 2 * i) / 4;
          g.moveTo(Math.cos(a) * h * 0.2, Math.sin(a) * h * 0.2);
          g.lineTo(Math.cos(a) * h * 0.5, Math.sin(a) * h * 0.5);
          g.stroke({ color: c.glow, width: 0.5, alpha: 0.25 });
        }
        break;
      case 'plasma':
        // Double circle with pulsing core — the most imposing tower
        g.circle(0, 0, h); g.fill({ color: fill });
        g.circle(0, 0, h); g.stroke({ color: c.main, width: strokeW + 0.5, alpha: strokeA });
        // Inner ring
        g.circle(0, 0, h * 0.7); g.stroke({ color: c.main, width: 1, alpha: 0.3 });
        // Plasma core — multi-layer glow
        g.circle(0, 0, h * 0.45); g.fill({ color: c.glow, alpha: 0.08 });
        g.circle(0, 0, h * 0.3); g.fill({ color: c.main, alpha: 0.2 });
        g.circle(0, 0, h * 0.15); g.fill({ color: c.glow, alpha: 0.5 });
        g.circle(0, 0, h * 0.06); g.fill({ color: 0xffffff, alpha: 0.8 });
        // Orbital dots (decorative)
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 * i) / 6;
          g.circle(Math.cos(a) * h * 0.55, Math.sin(a) * h * 0.55, 1.5);
          g.fill({ color: c.glow, alpha: 0.3 });
        }
        break;
    }
  }

  private drawPoly(g: Graphics, sides: number, r: number, color: number, offset = 0) {
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides + offset;
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill({ color });
  }

  private drawStar(g: Graphics, points: number, outerR: number, innerR: number, color: number) {
    for (let i = 0; i < points; i++) {
      const oa = (Math.PI * 2 * i) / points - Math.PI / 2;
      const ia = oa + Math.PI / points;
      if (i === 0) g.moveTo(Math.cos(oa) * outerR, Math.sin(oa) * outerR);
      else g.lineTo(Math.cos(oa) * outerR, Math.sin(oa) * outerR);
      g.lineTo(Math.cos(ia) * innerR, Math.sin(ia) * innerR);
    }
    g.closePath(); g.fill({ color });
  }

  destroy() { this.container.destroy({ children: true }); this.sprites.clear(); }
}
