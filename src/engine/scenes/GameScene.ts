import { Container, Graphics } from 'pixi.js';
import type { Scene, MapId, GameMap } from '../../types';
import type { GameEngine } from '../GameEngine';
import { SystemManager } from '../SystemManager';
import { InputManager } from '../InputManager';
import { getActiveMap } from '../../config/game';
import { getMap } from '../../config/maps';
import { useGameStore } from '../../stores/gameStore';
import { vfxBridge } from '../VfxBridge';

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
  private pathAnimLayer: Container;
  private entityLayer: Container;
  private projectileLayer: Container;
  private effectLayer: Container;
  private uiLayer: Container;

  private currentMapId: MapId = 'canyon';
  private gridRenderer: GridRenderer | null = null;
  private effectRenderer: EffectRenderer | null = null;
  private pathAnimGfx: Graphics;
  private pathAnimTime = 0;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.container = new Container();
    this.logicSystems = new SystemManager();
    this.renderSystems = new SystemManager();

    this.gridLayer = new Container();
    this.pathAnimLayer = new Container();
    this.entityLayer = new Container();
    this.projectileLayer = new Container();
    this.effectLayer = new Container();
    this.uiLayer = new Container();
    this.pathAnimGfx = new Graphics();
  }

  init() {
    const map = getActiveMap(useGameStore.getState().mapId);
    this.currentMapId = map.id;

    this.container.addChild(this.gridLayer);
    this.container.addChild(this.pathAnimLayer);
    this.container.addChild(this.entityLayer);
    this.container.addChild(this.projectileLayer);
    this.container.addChild(this.effectLayer);
    this.container.addChild(this.uiLayer);

    this.engine.stage.addChild(this.container);

    // Path animation layer
    this.pathAnimLayer.addChild(this.pathAnimGfx);

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

    this.effectRenderer = new EffectRenderer(this.effectLayer);
    this.effectRenderer.setMapSize(map.width * map.cellSize, map.height * map.cellSize);
    this.renderSystems.register(this.effectRenderer);
  }

  update(dt: number) {
    // Map change check
    const storeMapId = useGameStore.getState().mapId;
    if (storeMapId !== this.currentMapId) {
      this.onMapChanged(storeMapId);
    }

    this.logicSystems.update(dt);

    // Process VFX events from combat
    this.processVfxEvents();

    // Animated path energy flow
    this.updatePathAnimation(dt);

    this.renderSystems.update(dt);
  }

  private processVfxEvents() {
    if (!this.effectRenderer) return;
    const events = vfxBridge.flush();

    for (const ev of events) {
      switch (ev.type) {
        case 'hit':
          this.effectRenderer.spawnDamageNumber(ev.pos, ev.damage, ev.isCrit);
          this.effectRenderer.spawnSparks(ev.pos, 2, ev.color);
          break;
        case 'kill':
          this.effectRenderer.spawnDeathEffect(ev.pos, ev.color, ev.isBoss);
          this.effectRenderer.spawnGoldText(ev.pos, ev.reward);
          break;
        case 'muzzle':
          this.effectRenderer.spawnMuzzleFlash(ev.pos, ev.color, ev.dirX, ev.dirY);
          break;
        case 'aoe_hit':
          this.effectRenderer.spawnExplosion(ev.pos, ev.radius, ev.color);
          this.effectRenderer.spawnRing(ev.pos, ev.radius, ev.color);
          this.effectRenderer.shake(3, 0.15);
          break;
        case 'skill':
          this.effectRenderer.spawnShockwave(ev.pos, ev.radius, 0x4488ff);
          this.effectRenderer.spawnParticleBurst(ev.pos, 15, 0x4488ff, 100, 3, 20);
          this.effectRenderer.shake(5, 0.25);
          break;
      }
    }
  }

  private updatePathAnimation(dt: number) {
    this.pathAnimTime += dt;
    const map = getActiveMap(useGameStore.getState().mapId);
    const { path, cellSize } = map;

    this.pathAnimGfx.clear();

    // Energy dots flowing along path
    const dotCount = 8;
    const pathLen = path.length;

    for (let d = 0; d < dotCount; d++) {
      const phase = ((this.pathAnimTime * 1.5 + d / dotCount) % 1) * pathLen;
      const idx = Math.floor(phase);
      const frac = phase - idx;

      if (idx >= pathLen - 1) continue;

      const a = path[idx];
      const b = path[idx + 1];
      const x = (a.col + (b.col - a.col) * frac) * cellSize + cellSize / 2;
      const y = (a.row + (b.row - a.row) * frac) * cellSize + cellSize / 2;

      // Outer glow
      this.pathAnimGfx.circle(x, y, 6);
      this.pathAnimGfx.fill({ color: 0xe94560, alpha: 0.06 });

      // Core dot
      this.pathAnimGfx.circle(x, y, 2.5);
      this.pathAnimGfx.fill({ color: 0xe94560, alpha: 0.25 });

      // Bright center
      this.pathAnimGfx.circle(x, y, 1);
      this.pathAnimGfx.fill({ color: 0xffffff, alpha: 0.3 });
    }
  }

  private onMapChanged(newMapId: MapId) {
    const newMap = getMap(newMapId);
    this.currentMapId = newMapId;

    const store = useGameStore.getState();
    store.setTowers([]);
    store.clearProjectiles();

    if (this.gridRenderer) {
      this.gridRenderer.setMap(newMap);
      this.gridRenderer.render();
    }

    if (this.effectRenderer) {
      this.effectRenderer.setMapSize(newMap.width * newMap.cellSize, newMap.height * newMap.cellSize);
    }

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
