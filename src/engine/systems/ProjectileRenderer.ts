import { Container, Graphics } from 'pixi.js';
import type { GameSystem } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export class ProjectileRenderer implements GameSystem {
  readonly name = 'projectileRenderer';

  private container: Container;
  private sprites = new Map<string, Graphics>();

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  update(_dt: number) {
    const projectiles = useGameStore.getState().projectiles;
    const activeIds = new Set(projectiles.map((p) => p.id));

    // Remove dead
    for (const [id, sprite] of this.sprites) {
      if (!activeIds.has(id)) {
        this.container.removeChild(sprite);
        sprite.destroy();
        this.sprites.delete(id);
      }
    }

    // Add or update
    for (const proj of projectiles) {
      let sprite = this.sprites.get(proj.id);

      if (!sprite) {
        sprite = new Graphics();
        const isAoe = proj.aoeRadius && proj.aoeRadius > 0;
        const size = isAoe ? 5 : 3;
        const color = isAoe ? 0xff3366 : 0xffdd44;
        sprite.circle(0, 0, size);
        sprite.fill({ color });
        // Trail glow
        sprite.circle(0, 0, size + 2);
        sprite.fill({ color, alpha: 0.3 });
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
