import { Container } from 'pixi.js';
import type { Scene, MapId } from '../../types';
import type { GameEngine } from '../GameEngine';
import { SystemManager } from '../SystemManager';
import { InputManager } from '../InputManager';
import { getActiveMap } from '../../config/game';
import { getMap } from '../../config/maps';
import { useGameStore } from '../../stores/gameStore';

import { GridRenderer } from '../systems/GridRenderer';
import { TowerRenderer } from '../systems/TowerRenderer';
import { EnemyRenderer } from '../systems/EnemyRenderer';
import { ProjectileRenderer } from '../systems/ProjectileRenderer';
import { EffectRenderer } from '../systems/EffectRenderer';

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
  private logicSystems: SystemManager;
  private renderSystems: SystemManager;
  private input: InputManager | null = null;

  private gridLayer: Container;
  private entityLayer: Container;
  private projectileLayer: Container;
  private effectLayer: Container;
  private uiLayer: Container;

  private currentMapId: MapId = 'canyon';
  private gridRenderer: GridRenderer | null = null;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.container = new Container();
    this.logicSystems = new SystemManager();
    this.renderSystems = new SystemManager();

    this.gridLayer = new Container();
    this.entityLayer = new Container();
    this.projectileLayer = new Container();
    this.effectLayer = new Container();
    this.uiLayer = new Container();
  }

  init() {
    const map = getActiveMap(useGameStore.getState().mapId);
    this.currentMapId = map.id;

    this.container.addChild(this.gridLayer);
    this.container.addChild(this.entityLayer);
    this.container.addChild(this.projectileLayer);
    this.container.addChild(this.effectLayer);
    this.container.addChild(this.uiLayer);

    this.engine.stage.addChild(this.container);

    this.input = new InputManager(this.container, map);

    this.gridRenderer = new GridRenderer(this.gridLayer, map);
    this.gridRenderer.render();

    this.logicSystems.register(new InputSystem(this.input, this.uiLayer, map));
    this.logicSystems.register(new WaveSpawner(map));
    this.logicSystems.register(new EnemyMovement(map));
    this.logicSystems.register(new TowerTargeting(map));
    this.logicSystems.register(new CombatSystem());
    this.logicSystems.register(new DamageSystem());
    this.logicSystems.register(new EnergySystem());

    this.renderSystems.register(new TowerRenderer(this.entityLayer, map));
    this.renderSystems.register(new EnemyRenderer(this.entityLayer, map));
    this.renderSystems.register(new ProjectileRenderer(this.projectileLayer));
    this.renderSystems.register(new EffectRenderer(this.effectLayer));
  }

  update(dt: number) {
    // Check if map changed (wave switched map)
    const storeMapId = useGameStore.getState().mapId;
    if (storeMapId !== this.currentMapId) {
      this.onMapChanged(storeMapId);
    }

    this.logicSystems.update(dt);
    this.renderSystems.update(dt);
  }

  private onMapChanged(newMapId: MapId) {
    const newMap = getMap(newMapId);
    this.currentMapId = newMapId;

    // Clear towers (they don't carry over between maps)
    const store = useGameStore.getState();
    store.setTowers([]);
    store.clearProjectiles();

    // Re-render grid
    if (this.gridRenderer) {
      this.gridRenderer.setMap(newMap);
      this.gridRenderer.render();
    }

    // Update systems that hold map reference
    const waveSpawner = this.logicSystems.get<WaveSpawner>('waveSpawner');
    if (waveSpawner) waveSpawner.setMap(newMap);

    const enemyMovement = this.logicSystems.get<EnemyMovement>('enemyMovement');
    if (enemyMovement) enemyMovement.setMap(newMap);

    const towerTargeting = this.logicSystems.get<TowerTargeting>('towerTargeting');
    if (towerTargeting) towerTargeting.setMap(newMap);
  }

  destroy() {
    this.input?.destroy();
    this.logicSystems.destroy();
    this.renderSystems.destroy();
    this.engine.stage.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
