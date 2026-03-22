import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, Tower, TowerType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

// Neon sci-fi tower palette
const TC: Record<TowerType, { main: number; glow: number; dark: number }> = {
  cannon: { main: 0x00F5A0, glow: 0x00FFCC, dark: 0x00884C },
  laser:  { main: 0x00E5FF, glow: 0x5BFFFF, dark: 0x006688 },
  aoe:    { main: 0xFF3D6E, glow: 0xFF6B6B, dark: 0x882233 },
  sniper: { main: 0xFFD166, glow: 0xFFE088, dark: 0x887733 },
  tesla:  { main: 0x9B5CFF, glow: 0xBB88FF, dark: 0x5533AA },
};

interface TowerSprite {
  container: Container;
  body: Graphics;
  barrel: Graphics;
  rangeCircle: Graphics;
  synergyGlow: Graphics;
  beamGfx: Graphics;
  level: number;
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
    const activeIds = new Set(towers.map((t) => t.id));

    for (const [id, sp] of this.sprites) {
      if (!activeIds.has(id)) {
        this.container.removeChild(sp.container);
        sp.container.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    for (const tower of towers) {
      let sp = this.sprites.get(tower.id);

      if (sp && sp.level !== tower.level) {
        this.container.removeChild(sp.container);
        sp.container.destroy({ children: true });
        this.sprites.delete(tower.id);
        sp = undefined;
      }

      if (!sp) {
        sp = this.createSprite(tower);
        this.sprites.set(tower.id, sp);
        this.container.addChild(sp.container);
      }

      const c = TC[tower.towerType];
      const isFiring = tower.cooldown > 0 && tower.cooldown > (1 / tower.stats.fireRate) * 0.7;

      if (tower.target) {
        const target = enemies.find((e) => e.id === tower.target);
        if (target) {
          const dx = target.position.x - tower.position.x;
          const dy = target.position.y - tower.position.y;
          sp.barrel.rotation = Math.atan2(dy, dx);

          // Beam effects
          sp.beamGfx.clear();
          if (tower.towerType === 'laser' && tower.cooldown < 0.05) {
            // Multi-layer laser beam
            sp.beamGfx.moveTo(0, 0); sp.beamGfx.lineTo(dx, dy);
            sp.beamGfx.stroke({ color: c.glow, width: 6, alpha: 0.12 });
            sp.beamGfx.moveTo(0, 0); sp.beamGfx.lineTo(dx, dy);
            sp.beamGfx.stroke({ color: c.main, width: 3, alpha: 0.35 });
            sp.beamGfx.moveTo(0, 0); sp.beamGfx.lineTo(dx, dy);
            sp.beamGfx.stroke({ color: 0xffffff, width: 1, alpha: 0.6 });
            sp.beamGfx.visible = true;
          } else if (tower.towerType === 'tesla' && tower.cooldown < 0.15) {
            // Jagged lightning
            const steps = 8;
            // Outer glow
            sp.beamGfx.moveTo(0, 0);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              sp.beamGfx.lineTo(dx * t + (Math.random() - 0.5) * 18, dy * t + (Math.random() - 0.5) * 18);
            }
            sp.beamGfx.stroke({ color: c.glow, width: 4, alpha: 0.2 });
            // Core
            sp.beamGfx.moveTo(0, 0);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              sp.beamGfx.lineTo(dx * t + (Math.random() - 0.5) * 10, dy * t + (Math.random() - 0.5) * 10);
            }
            sp.beamGfx.stroke({ color: c.main, width: 2, alpha: 0.5 });
            sp.beamGfx.moveTo(0, 0); sp.beamGfx.lineTo(dx, dy);
            sp.beamGfx.stroke({ color: 0xffffff, width: 0.5, alpha: 0.3 });
            sp.beamGfx.visible = true;
          } else {
            sp.beamGfx.visible = false;
          }
        } else {
          sp.beamGfx.visible = false;
        }
      } else {
        sp.beamGfx.visible = false;
        // Idle pulse
        const pulse = 1 + Math.sin(Date.now() * 0.003 + tower.gridPos.col * 2) * 0.025;
        sp.body.scale.set(pulse);
      }

      if (!tower.target) sp.body.scale.set(1 + Math.sin(Date.now() * 0.003) * 0.02);

      sp.rangeCircle.visible = tower.id === selectedTowerId;
      sp.synergyGlow.visible = tower.synergyBuffs.length > 0;
    }
  }

  private createSprite(tower: Tower): TowerSprite {
    const { cellSize: s } = this.map;
    const c = TC[tower.towerType];
    const sz = s * (0.48 + tower.level * 0.025);
    const h = sz / 2;

    const ct = new Container();
    ct.x = tower.gridPos.col * s + s / 2;
    ct.y = tower.gridPos.row * s + s / 2;

    // Range circle (neon accent)
    const rangeCircle = new Graphics();
    const rPx = tower.stats.range * s;
    rangeCircle.circle(0, 0, rPx);
    rangeCircle.fill({ color: c.main, alpha: 0.03 });
    rangeCircle.circle(0, 0, rPx);
    rangeCircle.stroke({ color: c.main, width: 1, alpha: 0.15 });
    rangeCircle.visible = false;
    ct.addChild(rangeCircle);

    // Synergy glow ring
    const synergyGlow = new Graphics();
    synergyGlow.circle(0, 0, h + 8);
    synergyGlow.stroke({ color: 0xFFD166, width: 2, alpha: 0.3 });
    synergyGlow.circle(0, 0, h + 5);
    synergyGlow.stroke({ color: 0xFFD166, width: 1, alpha: 0.15 });
    synergyGlow.visible = false;
    ct.addChild(synergyGlow);

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 3, h * 0.8, h * 0.3);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    ct.addChild(shadow);

    // Base platform
    const platform = new Graphics();
    platform.circle(0, 0, h + 2);
    platform.fill({ color: 0x0D1220, alpha: 0.8 });
    platform.circle(0, 0, h + 2);
    platform.stroke({ color: c.dark, width: 1, alpha: 0.4 });
    ct.addChild(platform);

    // Tower body
    const body = new Graphics();

    // Outer neon glow
    body.circle(0, 0, h + 1);
    body.fill({ color: c.glow, alpha: 0.06 });

    // Main shape
    switch (tower.towerType) {
      case 'cannon':
        body.roundRect(-h, -h, sz, sz, 5);
        body.fill({ color: 0x0D1825 });
        body.roundRect(-h + 2, -h + 2, sz - 4, sz - 4, 3);
        body.fill({ color: 0x162030 });
        body.stroke({ color: c.main, width: 1.5, alpha: 0.5 });
        body.circle(0, 0, 4);
        body.fill({ color: c.main, alpha: 0.4 });
        body.circle(0, 0, 2);
        body.fill({ color: c.glow, alpha: 0.6 });
        break;
      case 'laser':
        body.circle(0, 0, h);
        body.fill({ color: 0x0D1825 });
        body.circle(0, 0, h - 2);
        body.fill({ color: 0x102030 });
        body.stroke({ color: c.main, width: 1.5, alpha: 0.5 });
        // Lens
        body.circle(0, 0, h * 0.35);
        body.fill({ color: c.main, alpha: 0.15 });
        body.circle(0, 0, h * 0.15);
        body.fill({ color: c.glow, alpha: 0.6 });
        break;
      case 'aoe':
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8 - Math.PI / 8;
          if (i === 0) body.moveTo(Math.cos(a) * h, Math.sin(a) * h);
          else body.lineTo(Math.cos(a) * h, Math.sin(a) * h);
        }
        body.closePath();
        body.fill({ color: 0x0D1825 });
        body.stroke({ color: c.main, width: 1.5, alpha: 0.5 });
        body.circle(0, 0, h * 0.4);
        body.stroke({ color: c.main, width: 1, alpha: 0.2 });
        body.circle(0, 0, h * 0.15);
        body.fill({ color: c.glow, alpha: 0.4 });
        break;
      case 'sniper':
        body.moveTo(0, -h); body.lineTo(h * 0.6, 0); body.lineTo(0, h); body.lineTo(-h * 0.6, 0);
        body.closePath();
        body.fill({ color: 0x0D1825 });
        body.stroke({ color: c.main, width: 1.5, alpha: 0.5 });
        // Crosshair
        body.moveTo(-h * 0.2, 0); body.lineTo(h * 0.2, 0);
        body.moveTo(0, -h * 0.2); body.lineTo(0, h * 0.2);
        body.stroke({ color: c.main, width: 0.5, alpha: 0.3 });
        body.circle(0, 0, 3);
        body.stroke({ color: c.glow, width: 1, alpha: 0.4 });
        break;
      case 'tesla':
        for (let i = 0; i < 5; i++) {
          const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const ia = oa + Math.PI / 5;
          if (i === 0) body.moveTo(Math.cos(oa) * h, Math.sin(oa) * h);
          else body.lineTo(Math.cos(oa) * h, Math.sin(oa) * h);
          body.lineTo(Math.cos(ia) * h * 0.45, Math.sin(ia) * h * 0.45);
        }
        body.closePath();
        body.fill({ color: 0x0D1825 });
        body.stroke({ color: c.main, width: 1.5, alpha: 0.5 });
        body.circle(0, 0, h * 0.25);
        body.fill({ color: c.main, alpha: 0.2 });
        body.circle(0, 0, h * 0.1);
        body.fill({ color: 0xffffff, alpha: 0.5 });
        break;
    }

    // Level pips (neon dots)
    if (tower.level > 1) {
      for (let i = 0; i < tower.level; i++) {
        const dx = -((tower.level - 1) * 4) / 2 + i * 4;
        body.circle(dx, h - 3, 1.5);
        body.fill({ color: c.glow, alpha: 0.8 });
      }
    }
    ct.addChild(body);

    // Barrel
    const barrel = new Graphics();
    const bLen = tower.towerType === 'sniper' ? sz * 0.8 : tower.towerType === 'laser' ? sz * 0.55 : sz * 0.45;
    // Shadow
    barrel.rect(1, -1, bLen, 4);
    barrel.fill({ color: 0x000000, alpha: 0.2 });
    // Main
    barrel.rect(0, -2, bLen, 4);
    barrel.fill({ color: 0x1A2535 });
    // Neon edge
    barrel.rect(0, -2, bLen, 1);
    barrel.fill({ color: c.main, alpha: 0.25 });
    // Muzzle
    if (tower.towerType === 'sniper') {
      barrel.rect(bLen - 3, -3, 3, 6);
      barrel.fill({ color: c.main, alpha: 0.3 });
    }
    ct.addChild(barrel);

    // Beam graphics layer
    const beamGfx = new Graphics();
    beamGfx.visible = false;
    ct.addChild(beamGfx);

    return { container: ct, body, barrel, rangeCircle, synergyGlow, beamGfx, level: tower.level };
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
