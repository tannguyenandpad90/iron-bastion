import { Container, Graphics } from 'pixi.js';
import type { GameSystem, GameMap, GridClickEvent, HoverEvent, GridPosition } from '../../types';
import type { InputManager } from '../InputManager';
import { useGameStore } from '../../stores/gameStore';
import { TOWER_CONFIG } from '../../config/towers';
import { SKILL_CONFIG } from '../../config/skills';
import { createTower } from '../../game/towers/factory';
import { executeSkill } from '../../game/skills/execute';
import { audio } from '../AudioManager';
import { vfxBridge } from '../VfxBridge';
import { CELL_SIZE } from '../../config/game';

export class InputSystem implements GameSystem {
  readonly name = 'inputSystem';

  private input: InputManager;
  private map: GameMap;
  private hoverGraphic: Graphics;
  private rangeGraphic: Graphics;
  private skillTargetGraphic: Graphics;
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

    this.skillTargetGraphic = new Graphics();
    this.skillTargetGraphic.visible = false;
    uiLayer.addChild(this.skillTargetGraphic);
  }

  init() {
    this.cleanups.push(this.input.onGridClick(this.handleClick));
    this.cleanups.push(this.input.onHover(this.handleHover));
    this.cleanups.push(this.input.onKeyDownEvent(this.handleKey));
  }

  update(_dt: number) {
    const store = useGameStore.getState();
    const { cellSize } = this.map;

    // Skill targeting mode
    if (store.activeSkill && this.currentHover) {
      const config = SKILL_CONFIG[store.activeSkill];
      const cx = this.currentHover.col * cellSize + cellSize / 2;
      const cy = this.currentHover.row * cellSize + cellSize / 2;
      const radius = config.radius * cellSize;

      this.skillTargetGraphic.clear();
      this.skillTargetGraphic.circle(cx, cy, radius);
      this.skillTargetGraphic.fill({ color: 0xff4444, alpha: 0.1 });
      this.skillTargetGraphic.stroke({ color: 0xff4444, width: 2, alpha: 0.5 });
      // Crosshair
      this.skillTargetGraphic.moveTo(cx - 8, cy);
      this.skillTargetGraphic.lineTo(cx + 8, cy);
      this.skillTargetGraphic.moveTo(cx, cy - 8);
      this.skillTargetGraphic.lineTo(cx, cy + 8);
      this.skillTargetGraphic.stroke({ color: 0xff4444, width: 1, alpha: 0.8 });
      this.skillTargetGraphic.visible = true;

      this.hoverGraphic.visible = false;
      this.rangeGraphic.visible = false;
      return;
    }
    this.skillTargetGraphic.visible = false;

    // Tower placement hover
    if (this.currentHover && store.selectedTowerType) {
      const { col, row } = this.currentHover;
      const cellType = this.map.grid[row][col];
      const hasTower = store.towers.some(
        (t) => t.gridPos.col === col && t.gridPos.row === row,
      );
      const canPlace = cellType === 'buildable' && !hasTower;
      const towerConfig = TOWER_CONFIG[store.selectedTowerType];
      const valid = canPlace && store.gold >= towerConfig.cost;

      this.hoverGraphic.clear();
      this.hoverGraphic.rect(col * cellSize, row * cellSize, cellSize, cellSize);
      this.hoverGraphic.fill({ color: valid ? 0x00ff00 : 0xff0000, alpha: 0.2 });
      this.hoverGraphic.stroke({ color: valid ? 0x00ff00 : 0xff0000, width: 2, alpha: 0.5 });
      this.hoverGraphic.visible = true;

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
      store.setActiveSkill(null);
      return;
    }

    // Skill targeting
    if (store.activeSkill) {
      const worldPos = this.input.gridToWorld(event.gridPos);
      const skillType = store.activeSkill;
      executeSkill(skillType, worldPos);
      const soundMap: Record<string, any> = { emp: 'skill_emp', airstrike: 'skill_airstrike', freeze: 'skill_freeze' };
      audio.play(soundMap[skillType]);
      const skillCfg = SKILL_CONFIG[skillType];
      vfxBridge.emit({ type: 'skill', pos: worldPos, radius: skillCfg.radius * CELL_SIZE, skillType });
      store.setActiveSkill(null);
      return;
    }

    // Tower placement
    if (store.selectedTowerType && event.cellType === 'buildable') {
      const hasTower = store.towers.some(
        (t) =>
          t.gridPos.col === event.gridPos.col &&
          t.gridPos.row === event.gridPos.row,
      );
      if (!hasTower) {
        const config = TOWER_CONFIG[store.selectedTowerType];
        if (store.spendGold(config.cost)) {
          const tower = createTower(store.selectedTowerType, event.gridPos, this.map.cellSize);
          store.addTower(tower);
          audio.play('place_tower');
          return;
        }
      }
      return;
    }

    // Click existing tower
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
        store.setActiveSkill(null);
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
      case '4':
        store.selectTowerType('sniper');
        break;
      case '5':
        store.selectTowerType('tesla');
        break;
      case 'q':
      case 'Q':
        store.setActiveSkill(store.activeSkill === 'emp' ? null : 'emp');
        break;
      case 'w':
      case 'W':
        store.setActiveSkill(store.activeSkill === 'airstrike' ? null : 'airstrike');
        break;
      case 'e':
      case 'E':
        store.setActiveSkill(store.activeSkill === 'freeze' ? null : 'freeze');
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
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
  }
}
