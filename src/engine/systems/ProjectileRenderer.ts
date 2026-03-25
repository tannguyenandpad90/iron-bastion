import { Container, Graphics } from 'pixi.js';
import type { GameSystem, Projectile } from '../../types';
import { useGameStore } from '../../stores/gameStore';

// Neon projectile styles
const PROJ_STYLE: Record<string, { core: number; glow: number; size: number; trail: boolean }> = {
  cannon:  { core: 0x00F5A0, glow: 0x00FFCC, size: 4, trail: true },
  aoe:     { core: 0xFF3D6E, glow: 0xFF6B6B, size: 5, trail: true },
  sniper:  { core: 0xFFD166, glow: 0xFFE088, size: 3, trail: true },
  tesla:   { core: 0x9B5CFF, glow: 0xBB88FF, size: 3, trail: false },
  flame:   { core: 0xFF8C00, glow: 0xFFAA33, size: 3, trail: false },
  missile: { core: 0xFF4444, glow: 0xFF6666, size: 6, trail: true },
  railgun: { core: 0x44DDFF, glow: 0x88EEFF, size: 3, trail: true },
  plasma:  { core: 0xFF00FF, glow: 0xFF88FF, size: 10, trail: true },
};

const DEFAULT = { core: 0x00F5A0, glow: 0x00FFCC, size: 3, trail: true };

interface ProjSprite {
  gfx: Graphics;
  prevX: number;
  prevY: number;
}

export class ProjectileRenderer implements GameSystem {
  readonly name = 'projectileRenderer';

  private container: Container;
  private trailGfx: Graphics;
  private sprites = new Map<string, ProjSprite>();

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
    // Trail layer underneath projectiles
    this.trailGfx = new Graphics();
    this.container.addChild(this.trailGfx);
  }

  update(_dt: number) {
    const { projectiles, towers } = useGameStore.getState();
    const ids = new Set(projectiles.map((p) => p.id));

    // Cleanup dead
    for (const [id, sp] of this.sprites) {
      if (!ids.has(id)) {
        this.container.removeChild(sp.gfx);
        sp.gfx.destroy();
        this.sprites.delete(id);
      }
    }

    // Clear trail layer and redraw
    this.trailGfx.clear();

    for (const proj of projectiles) {
      const tower = towers.find((t) => t.id === proj.sourceId);
      const tType = tower?.towerType ?? 'cannon';
      const style = PROJ_STYLE[tType] ?? DEFAULT;

      let sp = this.sprites.get(proj.id);

      if (!sp) {
        const gfx = new Graphics();

        // Outer glow
        gfx.circle(0, 0, style.size + 4);
        gfx.fill({ color: style.glow, alpha: 0.1 });

        // Mid glow
        gfx.circle(0, 0, style.size + 2);
        gfx.fill({ color: style.glow, alpha: 0.25 });

        // Core
        gfx.circle(0, 0, style.size);
        gfx.fill({ color: style.core });

        // Hot center
        gfx.circle(0, 0, style.size * 0.35);
        gfx.fill({ color: 0xffffff, alpha: 0.8 });

        // AoE indicator
        if (proj.aoeRadius && proj.aoeRadius > 0) {
          gfx.circle(0, 0, style.size + 3);
          gfx.stroke({ color: style.core, width: 1, alpha: 0.3 });
        }

        sp = { gfx, prevX: proj.position.x, prevY: proj.position.y };
        this.sprites.set(proj.id, sp);
        this.container.addChild(gfx);
      }

      // Draw trail (line from previous to current position)
      if (style.trail) {
        const dx = proj.position.x - sp.prevX;
        const dy = proj.position.y - sp.prevY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
          // Gradient trail: thicker+brighter near projectile, thinner+dimmer behind
          this.trailGfx.moveTo(sp.prevX, sp.prevY);
          this.trailGfx.lineTo(proj.position.x, proj.position.y);
          this.trailGfx.stroke({ color: style.glow, width: 3, alpha: 0.08 });

          this.trailGfx.moveTo(sp.prevX, sp.prevY);
          this.trailGfx.lineTo(proj.position.x, proj.position.y);
          this.trailGfx.stroke({ color: style.core, width: 1.5, alpha: 0.2 });
        }
      }

      // Update position
      sp.gfx.x = proj.position.x;
      sp.gfx.y = proj.position.y;
      sp.prevX = proj.position.x;
      sp.prevY = proj.position.y;
    }
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
