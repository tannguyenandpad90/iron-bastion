import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameSystem, WorldPosition } from '../../types';

// --- Particle ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  gravity: number;
  friction: number;
}

// --- Visual Effect ---
interface VisualEffect {
  id: string;
  position: WorldPosition;
  color: number;
  radius: number;
  duration: number;
  elapsed: number;
  type: 'explosion' | 'ring' | 'flash' | 'shockwave';
}

// --- Floating Text ---
interface FloatingText {
  text: Text;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

// --- Ambient Particle ---
interface AmbientDust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class EffectRenderer implements GameSystem {
  readonly name = 'effectRenderer';

  private container: Container;
  private particleGfx: Graphics;
  private effectSprites = new Map<string, Graphics>();
  private effects: VisualEffect[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private ambientDust: AmbientDust[] = [];
  private nextId = 0;
  private screenShake = 0;
  private shakeIntensity = 0;
  private parentContainer: Container | null = null;
  private mapWidth = 960;
  private mapHeight = 640;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
    this.particleGfx = new Graphics();
    this.container.addChild(this.particleGfx);
    this.parentContainer = parent.parent;
  }

  setMapSize(w: number, h: number) {
    this.mapWidth = w;
    this.mapHeight = h;
  }

  // ==================== PUBLIC API ====================

  spawnExplosion(pos: WorldPosition, radius: number, color = 0xff6600) {
    this.addEffect(pos, color, radius, 0.35, 'explosion');
    this.addEffect(pos, 0xffffff, radius * 0.3, 0.1, 'flash');
  }

  spawnRing(pos: WorldPosition, radius: number, color = 0x00aaff) {
    this.addEffect(pos, color, radius, 0.5, 'ring');
  }

  spawnShockwave(pos: WorldPosition, radius: number, color = 0xffffff) {
    this.addEffect(pos, color, radius, 0.4, 'shockwave');
  }

  spawnFlash(pos: WorldPosition, color = 0xffffff) {
    this.addEffect(pos, color, 20, 0.12, 'flash');
  }

  /** Spawn particles in a burst pattern */
  spawnParticleBurst(pos: WorldPosition, count: number, color: number, speed = 80, size = 3, gravity = 60) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x: pos.x + (Math.random() - 0.5) * 4,
        y: pos.y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.3 + Math.random() * 0.4,
        color,
        size: size * (0.5 + Math.random() * 0.5),
        gravity,
        friction: 0.96,
      });
    }
  }

  /** Spark trail (directional) */
  spawnSparks(pos: WorldPosition, count: number, color: number, dirX = 0, dirY = -1) {
    for (let i = 0; i < count; i++) {
      const spread = 0.8;
      const spd = 40 + Math.random() * 60;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: (dirX + (Math.random() - 0.5) * spread) * spd,
        vy: (dirY + (Math.random() - 0.5) * spread) * spd,
        life: 0.15 + Math.random() * 0.2,
        maxLife: 0.15 + Math.random() * 0.2,
        color,
        size: 1.5 + Math.random() * 1.5,
        gravity: 30,
        friction: 0.94,
      });
    }
  }

  /** Floating damage number */
  spawnDamageNumber(pos: WorldPosition, damage: number, isCrit = false) {
    const style = new TextStyle({
      fontSize: isCrit ? 16 : 11,
      fontWeight: 'bold',
      fill: isCrit ? 0xffff00 : 0xffffff,
      fontFamily: 'monospace',
      stroke: { color: 0x000000, width: isCrit ? 3 : 2 },
    });
    const text = new Text({
      text: isCrit ? `${damage}!` : `${damage}`,
      style,
    });
    text.anchor.set(0.5);
    text.x = pos.x + (Math.random() - 0.5) * 10;
    text.y = pos.y - 10;
    this.container.addChild(text);

    this.floatingTexts.push({
      text,
      vx: (Math.random() - 0.5) * 20,
      vy: -40 - Math.random() * 20,
      life: 0.8,
      maxLife: 0.8,
    });
  }

  /** Gold earned text */
  spawnGoldText(pos: WorldPosition, amount: number) {
    const style = new TextStyle({
      fontSize: 10,
      fontWeight: 'bold',
      fill: 0xffd700,
      fontFamily: 'monospace',
      stroke: { color: 0x000000, width: 2 },
    });
    const text = new Text({ text: `+${amount}g`, style });
    text.anchor.set(0.5);
    text.x = pos.x;
    text.y = pos.y - 16;
    this.container.addChild(text);

    this.floatingTexts.push({
      text,
      vx: 0,
      vy: -30,
      life: 1.0,
      maxLife: 1.0,
    });
  }

  /** Screen shake */
  shake(intensity = 4, duration = 0.2) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.screenShake = Math.max(this.screenShake, duration);
  }

  /** Enemy death effect */
  spawnDeathEffect(pos: WorldPosition, color: number, isBoss = false) {
    if (isBoss) {
      this.spawnParticleBurst(pos, 40, color, 150, 5, 40);
      this.spawnParticleBurst(pos, 20, 0xffffff, 100, 3, 30);
      this.spawnShockwave(pos, 120, color);
      this.spawnExplosion(pos, 50, color);
      this.shake(8, 0.4);
    } else {
      this.spawnParticleBurst(pos, 8, color, 60, 2.5, 50);
      this.spawnFlash(pos, color);
    }
  }

  /** Muzzle flash with sparks */
  spawnMuzzleFlash(pos: WorldPosition, color: number, dirX: number, dirY: number) {
    this.spawnSparks(pos, 3, color, dirX, dirY);
    this.spawnFlash(pos, 0xffffff);
  }

  // ==================== UPDATE ====================

  update(dt: number) {
    // Screen shake
    if (this.screenShake > 0 && this.parentContainer) {
      this.screenShake -= dt;
      const decay = this.screenShake > 0 ? this.shakeIntensity : 0;
      this.parentContainer.x = (Math.random() - 0.5) * decay * 2;
      this.parentContainer.y = (Math.random() - 0.5) * decay * 2;
      if (this.screenShake <= 0) {
        this.parentContainer.x = 0;
        this.parentContainer.y = 0;
        this.shakeIntensity = 0;
      }
    }

    // Ambient dust
    this.updateAmbientDust(dt);

    // Particles
    this.updateParticles(dt);

    // Effects
    this.updateEffects(dt);

    // Floating texts
    this.updateFloatingTexts(dt);
  }

  private updateAmbientDust(dt: number) {
    // Spawn ambient dust
    if (this.ambientDust.length < 30 && Math.random() < 0.3) {
      this.ambientDust.push({
        x: Math.random() * this.mapWidth,
        y: Math.random() * this.mapHeight,
        vx: (Math.random() - 0.5) * 8,
        vy: -3 - Math.random() * 5,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.15,
        life: 3 + Math.random() * 4,
        maxLife: 3 + Math.random() * 4,
      });
    }

    // Update
    for (let i = this.ambientDust.length - 1; i >= 0; i--) {
      const d = this.ambientDust[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0 || d.y < -10) {
        this.ambientDust.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    this.particleGfx.clear();

    // Draw ambient dust
    for (const d of this.ambientDust) {
      const fadeIn = Math.min(1, (d.maxLife - d.life) / 0.5);
      const fadeOut = Math.min(1, d.life / 0.5);
      const alpha = d.alpha * fadeIn * fadeOut;
      this.particleGfx.circle(d.x, d.y, d.size);
      this.particleGfx.fill({ color: 0xffffff, alpha });
    }

    // Draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const t = p.life / p.maxLife;
      const alpha = t;
      const size = p.size * (0.3 + t * 0.7);

      // Glow
      this.particleGfx.circle(p.x, p.y, size + 2);
      this.particleGfx.fill({ color: p.color, alpha: alpha * 0.2 });

      // Core
      this.particleGfx.circle(p.x, p.y, size);
      this.particleGfx.fill({ color: p.color, alpha });

      // Hot center
      if (size > 1.5) {
        this.particleGfx.circle(p.x, p.y, size * 0.4);
        this.particleGfx.fill({ color: 0xffffff, alpha: alpha * 0.5 });
      }
    }
  }

  private updateEffects(dt: number) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.elapsed += dt;

      if (fx.elapsed >= fx.duration) {
        const sprite = this.effectSprites.get(fx.id);
        if (sprite) {
          this.container.removeChild(sprite);
          sprite.destroy();
          this.effectSprites.delete(fx.id);
        }
        this.effects.splice(i, 1);
        continue;
      }

      const progress = fx.elapsed / fx.duration;
      let sprite = this.effectSprites.get(fx.id);
      if (!sprite) {
        sprite = new Graphics();
        this.effectSprites.set(fx.id, sprite);
        this.container.addChild(sprite);
      }

      sprite.clear();
      sprite.x = fx.position.x;
      sprite.y = fx.position.y;
      const alpha = 1 - progress;

      switch (fx.type) {
        case 'explosion': {
          const r = fx.radius * (0.3 + progress * 0.7);
          // Outer glow
          sprite.circle(0, 0, r * 1.4);
          sprite.fill({ color: fx.color, alpha: alpha * 0.15 });
          // Main body
          sprite.circle(0, 0, r);
          sprite.fill({ color: fx.color, alpha: alpha * 0.5 });
          // Hot core
          sprite.circle(0, 0, r * 0.4 * (1 - progress));
          sprite.fill({ color: 0xffffff, alpha: alpha * 0.7 });
          break;
        }
        case 'ring': {
          const r = fx.radius * progress;
          sprite.circle(0, 0, r);
          sprite.stroke({ color: fx.color, width: 3, alpha: alpha * 0.6 });
          sprite.circle(0, 0, r);
          sprite.stroke({ color: 0xffffff, width: 1, alpha: alpha * 0.3 });
          break;
        }
        case 'shockwave': {
          const r = fx.radius * progress;
          sprite.circle(0, 0, r);
          sprite.stroke({ color: fx.color, width: 4 * (1 - progress), alpha: alpha * 0.5 });
          sprite.circle(0, 0, r * 0.9);
          sprite.stroke({ color: 0xffffff, width: 1, alpha: alpha * 0.2 });
          break;
        }
        case 'flash': {
          const r = fx.radius * (1 - progress);
          sprite.circle(0, 0, r);
          sprite.fill({ color: fx.color, alpha: alpha * 0.8 });
          break;
        }
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.text.x += ft.vx * dt;
      ft.text.y += ft.vy * dt;
      ft.vy += 20 * dt; // slight gravity
      ft.life -= dt;

      const t = ft.life / ft.maxLife;
      ft.text.alpha = Math.min(1, t * 2); // fade out in last half

      if (ft.life <= 0) {
        this.container.removeChild(ft.text);
        ft.text.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private addEffect(
    position: WorldPosition, color: number, radius: number,
    duration: number, type: VisualEffect['type'],
  ) {
    this.effects.push({
      id: `fx_${this.nextId++}`,
      position: { ...position },
      color, radius, duration, elapsed: 0, type,
    });
  }

  destroy() {
    this.container.destroy({ children: true });
    this.effects = [];
    this.particles = [];
    this.floatingTexts = [];
    this.ambientDust = [];
    this.effectSprites.clear();
  }
}
