import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, Tower, TowerType } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const TOWER_COLORS: Record<TowerType, number> = {
  cannon: 0xff6b35,
  laser: 0x00ff88,
  aoe: 0xff3366,
  sniper: 0xffdd00,
  tesla: 0xaa44ff,
};

interface TowerSprite {
  container: Container;
  body: Graphics;
  barrel: Graphics;
  rangeCircle: Graphics;
  synergyGlow: Graphics;
  laserBeam: Graphics;
  teslaArc: Graphics;
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

      // Barrel rotation
      if (tower.target) {
        const target = enemies.find((e) => e.id === tower.target);
        if (target) {
          const dx = target.position.x - tower.position.x;
          const dy = target.position.y - tower.position.y;
          sprite.barrel.rotation = Math.atan2(dy, dx);

          // Laser beam
          if (tower.towerType === 'laser' && tower.cooldown < 0.05) {
            sprite.laserBeam.clear();
            sprite.laserBeam.moveTo(0, 0);
            sprite.laserBeam.lineTo(dx, dy);
            sprite.laserBeam.stroke({ color: 0x00ff88, width: 2, alpha: 0.6 });
            sprite.laserBeam.visible = true;
          } else {
            sprite.laserBeam.visible = false;
          }

          // Tesla arc
          if (tower.towerType === 'tesla' && tower.cooldown < 0.1) {
            sprite.teslaArc.clear();
            // Zigzag line to target
            const steps = 6;
            sprite.teslaArc.moveTo(0, 0);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const px = dx * t + (Math.random() - 0.5) * 12;
              const py = dy * t + (Math.random() - 0.5) * 12;
              sprite.teslaArc.lineTo(px, py);
            }
            sprite.teslaArc.stroke({ color: 0xaa44ff, width: 2, alpha: 0.7 });
            sprite.teslaArc.visible = true;
          } else {
            sprite.teslaArc.visible = false;
          }
        } else {
          sprite.laserBeam.visible = false;
          sprite.teslaArc.visible = false;
        }
      } else {
        sprite.laserBeam.visible = false;
        sprite.teslaArc.visible = false;
      }

      sprite.rangeCircle.visible = tower.id === selectedTowerId;
      sprite.synergyGlow.visible = tower.synergyBuffs.length > 0;
    }
  }

  private createTowerSprite(tower: Tower): TowerSprite {
    const { cellSize } = this.map;
    const color = TOWER_COLORS[tower.towerType];
    const size = cellSize * (0.5 + tower.level * 0.02);

    const spriteContainer = new Container();
    spriteContainer.x = tower.gridPos.col * cellSize + cellSize / 2;
    spriteContainer.y = tower.gridPos.row * cellSize + cellSize / 2;

    // Range circle
    const rangeCircle = new Graphics();
    const rangeInPixels = tower.stats.range * cellSize;
    rangeCircle.circle(0, 0, rangeInPixels);
    rangeCircle.fill({ color: 0xffffff, alpha: 0.05 });
    rangeCircle.stroke({ color, width: 1, alpha: 0.3 });
    rangeCircle.visible = false;
    spriteContainer.addChild(rangeCircle);

    // Synergy glow
    const synergyGlow = new Graphics();
    synergyGlow.circle(0, 0, size / 2 + 6);
    synergyGlow.stroke({ color: 0xffd700, width: 2, alpha: 0.4 });
    synergyGlow.visible = false;
    spriteContainer.addChild(synergyGlow);

    // Body — different shapes per type
    const body = new Graphics();
    const half = size / 2;

    switch (tower.towerType) {
      case 'cannon':
        body.roundRect(-half, -half, size, size, 4);
        body.fill({ color, alpha: 0.85 });
        body.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
        break;
      case 'laser':
        body.circle(0, 0, half);
        body.fill({ color, alpha: 0.85 });
        body.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
        break;
      case 'aoe':
        // Octagon
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
          const x = Math.cos(angle) * half;
          const y = Math.sin(angle) * half;
          if (i === 0) body.moveTo(x, y); else body.lineTo(x, y);
        }
        body.closePath();
        body.fill({ color, alpha: 0.85 });
        body.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
        break;
      case 'sniper':
        // Elongated diamond
        body.moveTo(0, -half);
        body.lineTo(half * 0.6, 0);
        body.lineTo(0, half);
        body.lineTo(-half * 0.6, 0);
        body.closePath();
        body.fill({ color, alpha: 0.85 });
        body.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
        break;
      case 'tesla':
        // Star shape
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
        body.fill({ color, alpha: 0.85 });
        body.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
        break;
    }

    // Level dots
    if (tower.level > 1) {
      const dotY = half - 4;
      for (let i = 0; i < tower.level; i++) {
        const dotX = -((tower.level - 1) * 4) / 2 + i * 4;
        body.circle(dotX, dotY, 1.5);
        body.fill({ color: 0xffffff, alpha: 0.9 });
      }
    }
    spriteContainer.addChild(body);

    // Barrel
    const barrel = new Graphics();
    const barrelLen = tower.towerType === 'sniper' ? size * 0.75 : size * 0.45;
    barrel.rect(0, -2, barrelLen, 4);
    barrel.fill({ color: 0xffffff, alpha: 0.7 });
    spriteContainer.addChild(barrel);

    // Laser beam
    const laserBeam = new Graphics();
    laserBeam.visible = false;
    spriteContainer.addChild(laserBeam);

    // Tesla arc
    const teslaArc = new Graphics();
    teslaArc.visible = false;
    spriteContainer.addChild(teslaArc);

    return {
      container: spriteContainer, body, barrel, rangeCircle,
      synergyGlow, laserBeam, teslaArc, level: tower.level,
    };
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
