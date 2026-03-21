import { Container, Graphics } from 'pixi.js';
import type { GameSystem } from '../../types';
import { useGameStore } from '../../stores/gameStore';

// Map sourceId prefix to tower type for visual differentiation
const PROJ_COLORS: Record<string, { core: number; glow: number; size: number }> = {
  cannon: { core: 0xffaa44, glow: 0xff6600, size: 4 },
  aoe:    { core: 0xff3366, glow: 0xff0044, size: 6 },
  sniper: { core: 0xffff44, glow: 0xffdd00, size: 3 },
  tesla:  { core: 0xcc88ff, glow: 0xaa44ff, size: 3 },
};

const DEFAULT_PROJ = { core: 0xffdd44, glow: 0xffaa00, size: 3 };

export class ProjectileRenderer implements GameSystem {
  readonly name = 'projectileRenderer';

  private container: Container;
  private sprites = new Map<string, Graphics>();

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  update(_dt: number) {
    const { projectiles, towers } = useGameStore.getState();
    const activeIds = new Set(projectiles.map((p) => p.id));

    for (const [id, sprite] of this.sprites) {
      if (!activeIds.has(id)) {
        this.container.removeChild(sprite);
        sprite.destroy();
        this.sprites.delete(id);
      }
    }

    for (const proj of projectiles) {
      let sprite = this.sprites.get(proj.id);

      if (!sprite) {
        // Determine tower type from source
        const tower = towers.find((t) => t.id === proj.sourceId);
        const towerType = tower?.towerType ?? 'cannon';
        const style = PROJ_COLORS[towerType] ?? DEFAULT_PROJ;

        sprite = new Graphics();

        // Outer glow
        sprite.circle(0, 0, style.size + 3);
        sprite.fill({ color: style.glow, alpha: 0.15 });

        // Mid glow
        sprite.circle(0, 0, style.size + 1);
        sprite.fill({ color: style.glow, alpha: 0.3 });

        // Core
        sprite.circle(0, 0, style.size);
        sprite.fill({ color: style.core });

        // Bright center
        sprite.circle(0, 0, style.size * 0.4);
        sprite.fill({ color: 0xffffff, alpha: 0.7 });

        // AoE indicator ring
        if (proj.aoeRadius && proj.aoeRadius > 0) {
          sprite.circle(0, 0, style.size + 2);
          sprite.stroke({ color: style.core, width: 1, alpha: 0.4 });
        }

        this.sprites.set(proj.id, sprite);
        this.container.addChild(sprite);
      }

      sprite.x = proj.position.x;
      sprite.y = proj.position.y;
    }
  }

  destroy() {
    this.container.destroy({ children: true });
    this.sprites.clear();
  }
}
