import { Container, Graphics } from 'pixi.js';
import type { GameSystem, WorldPosition } from '../../types';

interface VisualEffect {
  id: string;
  position: WorldPosition;
  color: number;
  radius: number;
  duration: number;
  elapsed: number;
  type: 'explosion' | 'ring' | 'flash';
}

export class EffectRenderer implements GameSystem {
  readonly name = 'effectRenderer';

  private container: Container;
  private effects: VisualEffect[] = [];
  private sprites = new Map<string, Graphics>();
  private nextId = 0;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  // Public API — other systems call this to spawn VFX
  spawnExplosion(pos: WorldPosition, radius: number, color = 0xff6600) {
    this.addEffect(pos, color, radius, 0.4, 'explosion');
  }

  spawnRing(pos: WorldPosition, radius: number, color = 0x00aaff) {
    this.addEffect(pos, color, radius, 0.6, 'ring');
  }

  spawnFlash(pos: WorldPosition, color = 0xffffff) {
    this.addEffect(pos, color, 20, 0.15, 'flash');
  }

  private addEffect(
    position: WorldPosition,
    color: number,
    radius: number,
    duration: number,
    type: VisualEffect['type'],
  ) {
    this.effects.push({
      id: `fx_${this.nextId++}`,
      position,
      color,
      radius,
      duration,
      elapsed: 0,
      type,
    });
  }

  update(dt: number) {
    // Update and remove expired effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.elapsed += dt;

      if (fx.elapsed >= fx.duration) {
        // Remove
        const sprite = this.sprites.get(fx.id);
        if (sprite) {
          this.container.removeChild(sprite);
          sprite.destroy();
          this.sprites.delete(fx.id);
        }
        this.effects.splice(i, 1);
        continue;
      }

      const progress = fx.elapsed / fx.duration;

      let sprite = this.sprites.get(fx.id);
      if (!sprite) {
        sprite = new Graphics();
        this.sprites.set(fx.id, sprite);
        this.container.addChild(sprite);
      }

      // Redraw based on progress
      sprite.clear();
      sprite.x = fx.position.x;
      sprite.y = fx.position.y;

      const alpha = 1 - progress;

      switch (fx.type) {
        case 'explosion': {
          const currentRadius = fx.radius * progress;
          sprite.circle(0, 0, currentRadius);
          sprite.fill({ color: fx.color, alpha: alpha * 0.6 });
          break;
        }
        case 'ring': {
          const ringRadius = fx.radius * progress;
          sprite.circle(0, 0, ringRadius);
          sprite.stroke({ color: fx.color, width: 2, alpha });
          break;
        }
        case 'flash': {
          sprite.circle(0, 0, fx.radius * (1 - progress));
          sprite.fill({ color: fx.color, alpha });
          break;
        }
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true });
    this.effects = [];
    this.sprites.clear();
  }
}
