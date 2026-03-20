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

  async init(canvas: HTMLCanvasElement) {
    await this.app.init({
      canvas,
      width: GAME_MAP.width * GAME_MAP.cellSize,
      height: GAME_MAP.height * GAME_MAP.cellSize,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    this.app.stage.addChild(this.stage);

    // Prevent right-click context menu on canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Register scenes
    const gameScene = new GameScene(this);
    this.sceneManager.register(gameScene);

    // Start with game scene
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

    // Clamp dt to prevent spiral of death after tab switch
    const clampedDt = Math.min(dt, 0.1);

    this.sceneManager.update(clampedDt);
  };

  destroy() {
    this.stop();
    this.sceneManager.destroy();
    this.app.destroy(true);
  }
}
