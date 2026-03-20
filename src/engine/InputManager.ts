import { Container, FederatedPointerEvent } from 'pixi.js';
import type { GridPosition, WorldPosition, CellType, GridClickEvent, HoverEvent, GameMap } from '../types';

type GridClickHandler = (event: GridClickEvent) => void;
type HoverHandler = (event: HoverEvent) => void;
type KeyHandler = (key: string) => void;

export class InputManager {
  private map: GameMap;
  private clickHandlers: GridClickHandler[] = [];
  private hoverHandlers: HoverHandler[] = [];
  private keyDownHandlers: KeyHandler[] = [];
  private keyUpHandlers: KeyHandler[] = [];
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor(interactiveArea: Container, map: GameMap) {
    this.map = map;

    // Make the container interactive for PixiJS events
    interactiveArea.eventMode = 'static';
    interactiveArea.hitArea = {
      contains: () => true,
    };

    // Pointer events on canvas
    interactiveArea.on('pointerdown', this.onPointerDown);
    interactiveArea.on('pointermove', this.onPointerMove);
    interactiveArea.on('rightclick', this.onRightClick);

    // Keyboard events on window
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  // --- Registration ---
  onGridClick(handler: GridClickHandler) {
    this.clickHandlers.push(handler);
    return () => {
      this.clickHandlers = this.clickHandlers.filter((h) => h !== handler);
    };
  }

  onHover(handler: HoverHandler) {
    this.hoverHandlers.push(handler);
    return () => {
      this.hoverHandlers = this.hoverHandlers.filter((h) => h !== handler);
    };
  }

  onKeyDownEvent(handler: KeyHandler) {
    this.keyDownHandlers.push(handler);
    return () => {
      this.keyDownHandlers = this.keyDownHandlers.filter((h) => h !== handler);
    };
  }

  onKeyUpEvent(handler: KeyHandler) {
    this.keyUpHandlers.push(handler);
    return () => {
      this.keyUpHandlers = this.keyUpHandlers.filter((h) => h !== handler);
    };
  }

  // --- Coordinate conversion ---
  worldToGrid(worldPos: WorldPosition): GridPosition | null {
    const col = Math.floor(worldPos.x / this.map.cellSize);
    const row = Math.floor(worldPos.y / this.map.cellSize);

    if (col < 0 || col >= this.map.width || row < 0 || row >= this.map.height) {
      return null;
    }

    return { col, row };
  }

  gridToWorld(gridPos: GridPosition): WorldPosition {
    return {
      x: gridPos.col * this.map.cellSize + this.map.cellSize / 2,
      y: gridPos.row * this.map.cellSize + this.map.cellSize / 2,
    };
  }

  getCellType(gridPos: GridPosition): CellType {
    return this.map.grid[gridPos.row][gridPos.col];
  }

  // --- Internal handlers ---
  private onPointerDown = (e: FederatedPointerEvent) => {
    if (e.button !== 0) return; // left click only
    this.emitGridClick(e, 'left');
  };

  private onRightClick = (e: FederatedPointerEvent) => {
    e.preventDefault?.();
    this.emitGridClick(e, 'right');
  };

  private emitGridClick(e: FederatedPointerEvent, button: 'left' | 'right') {
    const worldPos: WorldPosition = { x: e.globalX, y: e.globalY };
    const gridPos = this.worldToGrid(worldPos);
    if (!gridPos) return;

    const event: GridClickEvent = {
      gridPos,
      worldPos,
      cellType: this.getCellType(gridPos),
      button,
    };

    for (const handler of this.clickHandlers) {
      handler(event);
    }
  }

  private onPointerMove = (e: FederatedPointerEvent) => {
    const worldPos: WorldPosition = { x: e.globalX, y: e.globalY };
    const gridPos = this.worldToGrid(worldPos);

    const event: HoverEvent = { gridPos, worldPos };

    for (const handler of this.hoverHandlers) {
      handler(event);
    }
  };

  private onKeyDown(e: KeyboardEvent) {
    for (const handler of this.keyDownHandlers) {
      handler(e.key);
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    for (const handler of this.keyUpHandlers) {
      handler(e.key);
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.clickHandlers = [];
    this.hoverHandlers = [];
    this.keyDownHandlers = [];
    this.keyUpHandlers = [];
  }
}
