import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, GridClickEvent, HoverEvent, GridPosition } from '../../types';
import type { InputManager } from '../InputManager';
import { useGameStore } from '../../stores/gameStore';
import { TOWER_CONFIG } from '../../config/towers';
import { createTower } from '../../game/towers/factory';

export class InputSystem implements GameSystem {
  readonly name = 'inputSystem';

  private input: InputManager;
  private map: GameMap;
  private hoverGraphic: Graphics;
  private rangeGraphic: Graphics;
  private currentHover: GridPosition | null = null;
  private cleanups: (() => void)[] = [];

  constructor(input: InputManager, uiLayer: Container, map: GameMap) {
    this.input = input;
    this.map = map;

    this.hoverGraphic = new Graphics();
    this.hoverGraphic.visible = false;
    uiLayer.addChild(this.hoverGraphic);

    this.rangeGraphic = new Graphics();
    this.rangeGraphic.visible = false;
    uiLayer.addChild(this.rangeGraphic);
  }

  init() {
    this.cleanups.push(this.input.onGridClick(this.handleClick));
    this.cleanups.push(this.input.onHover(this.handleHover));
    this.cleanups.push(this.input.onKeyDownEvent(this.handleKey));
  }

  update(_dt: number) {
    const store = useGameStore.getState();
    const { cellSize } = this.map;

    if (this.currentHover && store.selectedTowerType) {
      const { col, row } = this.currentHover;
      const cellType = this.map.grid[row][col];
      const hasTower = store.towers.some(
        (t) => t.gridPos.col === col && t.gridPos.row === row,
      );
      const canPlace = cellType === 'buildable' && !hasTower;
      const towerConfig = TOWER_CONFIG[store.selectedTowerType];
      const canAfford = store.gold >= towerConfig.cost;
      const valid = canPlace && canAfford;

      // Hover highlight
      this.hoverGraphic.clear();
      this.hoverGraphic.rect(col * cellSize, row * cellSize, cellSize, cellSize);
      this.hoverGraphic.fill({
        color: valid ? 0x00ff00 : 0xff0000,
        alpha: 0.2,
      });
      this.hoverGraphic.stroke({
        color: valid ? 0x00ff00 : 0xff0000,
        width: 2,
        alpha: 0.5,
      });
      this.hoverGraphic.visible = true;

      // Range preview
      if (canPlace) {
        const rangeInPixels = towerConfig.range * cellSize;
        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;

        this.rangeGraphic.clear();
        this.rangeGraphic.circle(cx, cy, rangeInPixels);
        this.rangeGraphic.fill({ color: 0xffffff, alpha: 0.04 });
        this.rangeGraphic.stroke({ color: 0xffffff, width: 1, alpha: 0.15 });
        this.rangeGraphic.visible = true;
      } else {
        this.rangeGraphic.visible = false;
      }
    } else {
      this.hoverGraphic.visible = false;
      this.rangeGraphic.visible = false;
    }
  }

  private handleClick = (event: GridClickEvent) => {
    const store = useGameStore.getState();

    if (event.button === 'right') {
      store.selectTowerType(null);
      store.selectTower(null);
      return;
    }

    // Place tower
    if (store.selectedTowerType && event.cellType === 'buildable') {
      const hasTower = store.towers.some(
        (t) =>
          t.gridPos.col === event.gridPos.col &&
          t.gridPos.row === event.gridPos.row,
      );

      if (!hasTower) {
        const config = TOWER_CONFIG[store.selectedTowerType];
        if (store.spendGold(config.cost)) {
          const tower = createTower(
            store.selectedTowerType,
            event.gridPos,
            this.map.cellSize,
          );
          store.addTower(tower);
          return;
        }
      }
      return;
    }

    // Click existing tower to select
    const clickedTower = store.towers.find(
      (t) =>
        t.gridPos.col === event.gridPos.col &&
        t.gridPos.row === event.gridPos.row,
    );
    if (clickedTower) {
      store.selectTower(clickedTower.id);
    } else {
      store.selectTower(null);
    }
  };

  private handleHover = (event: HoverEvent) => {
    this.currentHover = event.gridPos;
  };

  private handleKey = (key: string) => {
    const store = useGameStore.getState();

    switch (key) {
      case 'Escape':
        store.selectTowerType(null);
        store.selectTower(null);
        break;
      case '1':
        store.selectTowerType('cannon');
        break;
      case '2':
        store.selectTowerType('laser');
        break;
      case '3':
        store.selectTowerType('aoe');
        break;
      case ' ':
        if (store.phase === 'prep') {
          store.nextWave();
          store.setPhase('wave');
        } else if (store.phase === 'wave') {
          store.setPhase('paused');
        } else if (store.phase === 'paused') {
          store.setPhase('wave');
        }
        break;
    }
  };

  destroy() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
    this.cleanups = [];
  }
}
