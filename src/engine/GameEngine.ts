import { Application, Container } from 'pixi.js';
import { SceneManager } from './SceneManager';
import { getActiveMap } from '../config/game';
import { GameScene } from './scenes/GameScene';
import { useGameStore } from '../stores/gameStore';

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
    const map = getActiveMap(useGameStore.getState().mapId);
    const width = map.width * map.cellSize;
    const height = map.height * map.cellSize;

    await this.app.init({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    if (this.destroyed) return;

    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    parentElement.appendChild(canvas);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.app.stage.addChild(this.stage);

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

  private tick = () => {
    if (!this.running) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Apply game speed multiplier
    const gameSpeed = useGameStore.getState().gameSpeed;
    const dt = Math.min(rawDt, 0.1) * gameSpeed;

    this.sceneManager.update(dt);
  };

  destroy() {
    this.destroyed = true;
    this.stop();
    this.sceneManager.destroy();
    try {
      this.app.destroy({ removeView: true }, { children: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
