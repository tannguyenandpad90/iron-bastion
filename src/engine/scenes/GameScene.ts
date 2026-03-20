import { Container } from 'pixi.js';
import type { Scene } from '../../types';
import type { GameEngine } from '../GameEngine';
import { SystemManager } from '../SystemManager';
import { InputManager } from '../InputManager';
import { GAME_MAP } from '../../config/game';

// Renderers
import { GridRenderer } from '../systems/GridRenderer';
import { TowerRenderer } from '../systems/TowerRenderer';
import { EnemyRenderer } from '../systems/EnemyRenderer';
import { ProjectileRenderer } from '../systems/ProjectileRenderer';
import { EffectRenderer } from '../systems/EffectRenderer';

// Game Systems
import { WaveSpawner } from '../systems/WaveSpawner';
import { EnemyMovement } from '../systems/EnemyMovement';
import { TowerTargeting } from '../systems/TowerTargeting';
import { CombatSystem } from '../systems/CombatSystem';
import { DamageSystem } from '../systems/DamageSystem';
import { EnergySystem } from '../systems/EnergySystem';
import { InputSystem } from '../systems/InputSystem';

export class GameScene implements Scene {
  readonly name = 'game';

  private engine: GameEngine;
  private container: Container;
  private systems: SystemManager;
  private input: InputManager | null = null;

  // Layer containers (render order = add order)
  private gridLayer: Container;
  private entityLayer: Container;
  private projectileLayer: Container;
  private effectLayer: Container;
  private uiLayer: Container;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.container = new Container();
    this.systems = new SystemManager();

    // Create render layers
    this.gridLayer = new Container();
    this.entityLayer = new Container();
    this.projectileLayer = new Container();
    this.effectLayer = new Container();
    this.uiLayer = new Container();
  }

  init() {
    // Add layers in render order
    this.container.addChild(this.gridLayer);
    this.container.addChild(this.entityLayer);
    this.container.addChild(this.projectileLayer);
    this.container.addChild(this.effectLayer);
    this.container.addChild(this.uiLayer);

    this.engine.stage.addChild(this.container);

    // Input manager
    this.input = new InputManager(this.container, GAME_MAP);

    // --- Register Renderers (visual-only systems) ---
    const gridRenderer = new GridRenderer(this.gridLayer, GAME_MAP);
    gridRenderer.render();

    this.systems.register(new TowerRenderer(this.entityLayer, GAME_MAP));
    this.systems.register(new EnemyRenderer(this.entityLayer, GAME_MAP));
    this.systems.register(new ProjectileRenderer(this.projectileLayer));
    this.systems.register(new EffectRenderer(this.effectLayer));

    // --- Register Game Logic Systems (order matters!) ---
    this.systems.register(new InputSystem(this.input, this.uiLayer, GAME_MAP));
    this.systems.register(new WaveSpawner(GAME_MAP));
    this.systems.register(new EnemyMovement(GAME_MAP));
    this.systems.register(new TowerTargeting(GAME_MAP));
    this.systems.register(new CombatSystem());
    this.systems.register(new DamageSystem());
    this.systems.register(new EnergySystem());
  }

  update(dt: number) {
    this.systems.update(dt);
  }

  destroy() {
    this.input?.destroy();
    this.systems.destroy();
    this.engine.stage.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
