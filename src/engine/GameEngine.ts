import { Application, Container } from 'pixi.js';
import { SceneManager } from './SceneManager';
import { GAME_MAP } from '../config/game';
import { GameScene } from './scenes/GameScene';

export class GameEngine {
  app: Application;
  stage: Container;
  sceneManager: SceneManager;
  private running = false;
  private lastTime = 0;
  private destroyed = false;

  constructor() {
    this.app = new Application();
    this.stage = new Container();
    this.sceneManager = new SceneManager();
  }

  async init(parentElement: HTMLElement) {
    const width = GAME_MAP.width * GAME_MAP.cellSize;
    const height = GAME_MAP.height * GAME_MAP.cellSize;

    await this.app.init({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    if (this.destroyed) return;

    // Append PixiJS canvas to container
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    parentElement.appendChild(canvas);

    // Prevent right-click context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.app.stage.addChild(this.stage);

    // Register and start game scene
    const gameScene = new GameScene(this);
    this.sceneManager.register(gameScene);
    this.sceneManager.switch('game');
  }

  start() {
    if (this.destroyed) return;
    this.running = true;
    this.lastTime = performance.now();
    this.app.ticker.add(this.tick);
  }

  stop() {
    this.running = false;
    this.app.ticker.remove(this.tick);
  }

  pause() {
    this.running = false;
  }

  resume() {
    this.running = true;
    this.lastTime = performance.now();
  }

  private tick = () => {
    if (!this.running) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    const clampedDt = Math.min(dt, 0.1);
    this.sceneManager.update(clampedDt);
  };

  destroy() {
    this.destroyed = true;
    this.stop();
    this.sceneManager.destroy();
    try {
      this.app.destroy({ removeView: true }, { children: true });
    } catch {
      // Ignore errors during cleanup
    }
  }
}
