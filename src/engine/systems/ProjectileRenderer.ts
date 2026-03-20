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

    // Remove dead projectiles
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
        sprite.circle(0, 0, proj.aoeRadius ? 4 : 3);
        sprite.fill({ color: proj.aoeRadius ? 0xff3366 : 0xffdd44 });
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
