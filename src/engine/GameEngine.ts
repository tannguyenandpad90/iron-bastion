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
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // PixiJS v8 creates its own canvas — append it to our container
    parentElement.appendChild(this.app.canvas);

    // Prevent right-click context menu
    this.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.app.stage.addChild(this.stage);

    // Register and start game scene
    const gameScene = new GameScene(this);
    this.sceneManager.register(gameScene);
    this.sceneManager.switch('game');
  }

  start() {
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
    this.stop();
    this.sceneManager.destroy();
    this.app.destroy({ removeView: true }, { children: true });
  }
}
