import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, Tower, TowerType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const TOWER_COLORS: Record<TowerType, { main: number; dark: number; light: number }> = {
  cannon: { main: 0xff6b35, dark: 0xaa4420, light: 0xff9966 },
  laser: { main: 0x00ff88, dark: 0x00aa55, light: 0x66ffbb },
  aoe: { main: 0xff3366, dark: 0xaa2244, light: 0xff6699 },
  sniper: { main: 0xffdd00, dark: 0xaa9900, light: 0xffee66 },
  tesla: { main: 0xaa44ff, dark: 0x7722cc, light: 0xcc88ff },
};

interface TowerSprite {
  container: Container;
  body: Graphics;
  barrel: Graphics;
  rangeCircle: Graphics;
  synergyGlow: Graphics;
  laserBeam: Graphics;
  teslaArc: Graphics;
  muzzleFlash: Graphics;
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
    const activeTowerIds = new Set(towers.map((t) => t.id));

    for (const [id, sprite] of this.sprites) {
      if (!activeTowerIds.has(id)) {
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    for (const tower of towers) {
      let sprite = this.sprites.get(tower.id);

      if (sprite && sprite.level !== tower.level) {
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this.sprites.delete(tower.id);
        sprite = undefined;
      }

      if (!sprite) {
        sprite = this.createTowerSprite(tower);
        this.sprites.set(tower.id, sprite);
        this.container.addChild(sprite.container);
      }

      const isFiring = tower.cooldown > 0 && tower.cooldown > (1 / tower.stats.fireRate) * 0.7;

      if (tower.target) {
        const target = enemies.find((e) => e.id === tower.target);
        if (target) {
          const dx = target.position.x - tower.position.x;
          const dy = target.position.y - tower.position.y;
          sprite.barrel.rotation = Math.atan2(dy, dx);

          // Muzzle flash
          sprite.muzzleFlash.rotation = Math.atan2(dy, dx);
          sprite.muzzleFlash.visible = isFiring && tower.towerType !== 'laser';

          // Laser beam
          if (tower.towerType === 'laser' && tower.cooldown < 0.05) {
            sprite.laserBeam.clear();
            // Main beam
            sprite.laserBeam.moveTo(0, 0);
            sprite.laserBeam.lineTo(dx, dy);
            sprite.laserBeam.stroke({ color: 0x00ff88, width: 3, alpha: 0.4 });
            // Core beam
            sprite.laserBeam.moveTo(0, 0);
            sprite.laserBeam.lineTo(dx, dy);
            sprite.laserBeam.stroke({ color: 0xaaffdd, width: 1, alpha: 0.8 });
            sprite.laserBeam.visible = true;
          } else {
            sprite.laserBeam.visible = false;
          }

          // Tesla arc
          if (tower.towerType === 'tesla' && tower.cooldown < 0.15) {
            sprite.teslaArc.clear();
            const steps = 8;
            sprite.teslaArc.moveTo(0, 0);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const px = dx * t + (Math.random() - 0.5) * 16;
              const py = dy * t + (Math.random() - 0.5) * 16;
              sprite.teslaArc.lineTo(px, py);
            }
            sprite.teslaArc.stroke({ color: 0xcc88ff, width: 2, alpha: 0.6 });
            // Thin core
            sprite.teslaArc.moveTo(0, 0);
            sprite.teslaArc.lineTo(dx, dy);
            sprite.teslaArc.stroke({ color: 0xeeccff, width: 1, alpha: 0.4 });
            sprite.teslaArc.visible = true;
          } else {
            sprite.teslaArc.visible = false;
          }
        } else {
          sprite.laserBeam.visible = false;
          sprite.teslaArc.visible = false;
          sprite.muzzleFlash.visible = false;
        }
      } else {
        sprite.laserBeam.visible = false;
        sprite.teslaArc.visible = false;
        sprite.muzzleFlash.visible = false;
      }

      sprite.rangeCircle.visible = tower.id === selectedTowerId;
      sprite.synergyGlow.visible = tower.synergyBuffs.length > 0;

      // Idle animation — subtle pulse
      if (!tower.target) {
        const pulse = 1 + Math.sin(Date.now() * 0.003 + tower.gridPos.col * 2) * 0.03;
        sprite.body.scale.set(pulse);
      } else {
        sprite.body.scale.set(1);
      }
    }
  }

  private createTowerSprite(tower: Tower): TowerSprite {
    const { cellSize } = this.map;
    const c = TOWER_COLORS[tower.towerType];
    const size = cellSize * (0.5 + tower.level * 0.025);
    const half = size / 2;

    const spriteContainer = new Container();
    spriteContainer.x = tower.gridPos.col * cellSize + cellSize / 2;
    spriteContainer.y = tower.gridPos.row * cellSize + cellSize / 2;

    // Range circle
    const rangeCircle = new Graphics();
    const rangeInPixels = tower.stats.range * cellSize;
    rangeCircle.circle(0, 0, rangeInPixels);
    rangeCircle.fill({ color: c.main, alpha: 0.04 });
    rangeCircle.stroke({ color: c.main, width: 1, alpha: 0.2 });
    rangeCircle.visible = false;
    spriteContainer.addChild(rangeCircle);

    // Synergy glow (animated ring)
    const synergyGlow = new Graphics();
    synergyGlow.circle(0, 0, half + 8);
    synergyGlow.stroke({ color: 0xffd700, width: 2, alpha: 0.35 });
    synergyGlow.circle(0, 0, half + 5);
    synergyGlow.stroke({ color: 0xffd700, width: 1, alpha: 0.15 });
    synergyGlow.visible = false;
    spriteContainer.addChild(synergyGlow);

    // Platform base (shadow)
    const platform = new Graphics();
    platform.circle(0, 2, half + 3);
    platform.fill({ color: 0x000000, alpha: 0.25 });
    spriteContainer.addChild(platform);

    // Body
    const body = new Graphics();
    this.drawTowerBody(body, tower.towerType, half, size, c);

    // Level pips
    if (tower.level > 1) {
      for (let i = 0; i < tower.level; i++) {
        const pipX = -((tower.level - 1) * 5) / 2 + i * 5;
        body.circle(pipX, half - 3, 2);
        body.fill({ color: c.light });
        body.circle(pipX, half - 3, 1);
        body.fill({ color: 0xffffff, alpha: 0.8 });
      }
    }
    spriteContainer.addChild(body);

    // Barrel
    const barrel = new Graphics();
    this.drawBarrel(barrel, tower.towerType, size, c);
    spriteContainer.addChild(barrel);

    // Muzzle flash
    const muzzleFlash = new Graphics();
    const flashDist = size * 0.55;
    muzzleFlash.circle(flashDist, 0, 5);
    muzzleFlash.fill({ color: 0xffffaa, alpha: 0.7 });
    muzzleFlash.circle(flashDist, 0, 3);
    muzzleFlash.fill({ color: 0xffffff, alpha: 0.9 });
    muzzleFlash.visible = false;
    spriteContainer.addChild(muzzleFlash);

    // Laser beam / Tesla arc
    const laserBeam = new Graphics();
    laserBeam.visible = false;
    spriteContainer.addChild(laserBeam);

    const teslaArc = new Graphics();
    teslaArc.visible = false;
    spriteContainer.addChild(teslaArc);

    return {
      container: spriteContainer, body, barrel, rangeCircle,
      synergyGlow, laserBeam, teslaArc, muzzleFlash, level: tower.level,
    };
  }

  private drawTowerBody(body: Graphics, type: TowerType, half: number, size: number, c: { main: number; dark: number; light: number }) {
    switch (type) {
      case 'cannon': {
        // Square with inner plate
        body.roundRect(-half, -half, size, size, 5);
        body.fill({ color: c.dark });
        body.roundRect(-half + 3, -half + 3, size - 6, size - 6, 3);
        body.fill({ color: c.main });
        body.stroke({ color: c.light, width: 1, alpha: 0.4 });
        // Center rivet
        body.circle(0, 0, 4);
        body.fill({ color: c.dark });
        body.circle(0, 0, 2);
        body.fill({ color: c.light, alpha: 0.5 });
        break;
      }
      case 'laser': {
        // Circle with inner ring
        body.circle(0, 0, half);
        body.fill({ color: c.dark });
        body.circle(0, 0, half - 3);
        body.fill({ color: c.main });
        body.stroke({ color: c.light, width: 1, alpha: 0.4 });
        // Core lens
        body.circle(0, 0, half * 0.35);
        body.fill({ color: c.light, alpha: 0.3 });
        body.circle(0, 0, half * 0.15);
        body.fill({ color: 0xffffff, alpha: 0.5 });
        break;
      }
      case 'aoe': {
        // Octagon with inner star
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
          const x = Math.cos(angle) * half;
          const y = Math.sin(angle) * half;
          if (i === 0) body.moveTo(x, y); else body.lineTo(x, y);
        }
        body.closePath();
        body.fill({ color: c.dark });
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
          const x = Math.cos(angle) * (half - 3);
          const y = Math.sin(angle) * (half - 3);
          if (i === 0) body.moveTo(x, y); else body.lineTo(x, y);
        }
        body.closePath();
        body.fill({ color: c.main });
        body.stroke({ color: c.light, width: 1, alpha: 0.3 });
        // Radiation rings
        body.circle(0, 0, half * 0.4);
        body.stroke({ color: c.light, width: 1, alpha: 0.25 });
        body.circle(0, 0, half * 0.2);
        body.fill({ color: c.light, alpha: 0.2 });
        break;
      }
      case 'sniper': {
        // Elongated diamond with scope detail
        body.moveTo(0, -half);
        body.lineTo(half * 0.6, 0);
        body.lineTo(0, half);
        body.lineTo(-half * 0.6, 0);
        body.closePath();
        body.fill({ color: c.dark });
        body.moveTo(0, -half + 4);
        body.lineTo(half * 0.6 - 4, 0);
        body.lineTo(0, half - 4);
        body.lineTo(-half * 0.6 + 4, 0);
        body.closePath();
        body.fill({ color: c.main });
        body.stroke({ color: c.light, width: 1, alpha: 0.4 });
        // Crosshair
        body.moveTo(-half * 0.25, 0); body.lineTo(half * 0.25, 0);
        body.moveTo(0, -half * 0.25); body.lineTo(0, half * 0.25);
        body.stroke({ color: c.light, width: 1, alpha: 0.35 });
        body.circle(0, 0, 3);
        body.stroke({ color: c.light, width: 1, alpha: 0.3 });
        break;
      }
      case 'tesla': {
        // Star with electric core
        for (let i = 0; i < 5; i++) {
          const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const innerAngle = outerAngle + Math.PI / 5;
          const ox = Math.cos(outerAngle) * half;
          const oy = Math.sin(outerAngle) * half;
          const ix = Math.cos(innerAngle) * half * 0.45;
          const iy = Math.sin(innerAngle) * half * 0.45;
          if (i === 0) body.moveTo(ox, oy); else body.lineTo(ox, oy);
          body.lineTo(ix, iy);
        }
        body.closePath();
        body.fill({ color: c.dark });
        // Inner star
        for (let i = 0; i < 5; i++) {
          const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const innerAngle = outerAngle + Math.PI / 5;
          const ox = Math.cos(outerAngle) * (half - 3);
          const oy = Math.sin(outerAngle) * (half - 3);
          const ix = Math.cos(innerAngle) * (half * 0.45 - 2);
          const iy = Math.sin(innerAngle) * (half * 0.45 - 2);
          if (i === 0) body.moveTo(ox, oy); else body.lineTo(ox, oy);
          body.lineTo(ix, iy);
        }
        body.closePath();
        body.fill({ color: c.main });
        // Electric core
        body.circle(0, 0, half * 0.3);
        body.fill({ color: c.light, alpha: 0.3 });
        body.circle(0, 0, half * 0.12);
        body.fill({ color: 0xffffff, alpha: 0.6 });
        break;
      }
    }
  }

  private drawBarrel(barrel: Graphics, type: TowerType, size: number, c: { main: number; dark: number; light: number }) {
    const len = type === 'sniper' ? size * 0.8 : type === 'laser' ? size * 0.55 : size * 0.45;
    const w = type === 'sniper' ? 3 : 4;

    // Barrel shadow
    barrel.rect(2, -w / 2 + 1, len, w);
    barrel.fill({ color: 0x000000, alpha: 0.2 });

    // Main barrel
    barrel.rect(0, -w / 2, len, w);
    barrel.fill({ color: c.dark });

    // Barrel highlight
    barrel.rect(0, -w / 2, len, 1);
    barrel.fill({ color: c.light, alpha: 0.3 });

    // Muzzle tip
    if (type === 'sniper') {
      barrel.rect(len - 4, -w / 2 - 1, 4, w + 2);
      barrel.fill({ color: c.light, alpha: 0.4 });
    }
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
