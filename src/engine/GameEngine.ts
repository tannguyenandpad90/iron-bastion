import { Application, Container } from 'pixi.js';
import { GridRenderer } from './systems/GridRenderer';
import { GAME_MAP } from '../config/game';

export class GameEngine {
  app: Application;
  gameContainer: Container;
  gridRenderer: GridRenderer | null = null;
  private running = false;
  private lastTime = 0;

  constructor() {
    this.app = new Application();
    this.gameContainer = new Container();
  }

  async init(canvas: HTMLCanvasElement) {
    await this.app.init({
      canvas,
      width: GAME_MAP.width * GAME_MAP.cellSize,
      height: GAME_MAP.height * GAME_MAP.cellSize,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    this.app.stage.addChild(this.gameContainer);

    // Init systems
    this.gridRenderer = new GridRenderer(this.gameContainer, GAME_MAP);
    this.gridRenderer.render();
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.app.ticker.add(this.update);
  }

  stop() {
    this.running = false;
    this.app.ticker.remove(this.update);
  }

  private update = () => {
    if (!this.running) return;

    const now = performance.now();
    const _dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // TODO: Update game systems
    // - Enemy movement
    // - Tower targeting
    // - Projectile movement
    // - Damage resolution
    // - Wave spawning
  };

  destroy() {
    this.stop();
    this.app.destroy(true);
  }
}
