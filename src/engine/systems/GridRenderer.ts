import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameMap, CellType } from '../../types';

const CELL_COLORS: Record<CellType, number> = {
  path: 0x2d2d44,
  buildable: 0x16213e,
  blocked: 0x0f0f23,
  spawn: 0xe94560,
  base: 0x00d4ff,
};

export class GridRenderer {
  private container: Container;
  private map: GameMap;

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  render() {
    this.container.removeChildren();

    const { grid, cellSize, width, height } = this.map;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const cellType = grid[row][col];
        const g = new Graphics();

        // Cell fill
        g.rect(col * cellSize, row * cellSize, cellSize, cellSize);
        g.fill({ color: CELL_COLORS[cellType], alpha: 0.8 });

        // Cell border
        g.rect(col * cellSize, row * cellSize, cellSize, cellSize);
        g.stroke({ color: 0x333355, width: 1, alpha: 0.3 });

        // Buildable cell subtle indicator
        if (cellType === 'buildable') {
          const cx = col * cellSize + cellSize / 2;
          const cy = row * cellSize + cellSize / 2;
          g.circle(cx, cy, 2);
          g.fill({ color: 0x333355, alpha: 0.3 });
        }

        this.container.addChild(g);

        // Labels for spawn/base
        if (cellType === 'spawn' || cellType === 'base') {
          const style = new TextStyle({
            fontSize: 10,
            fill: 0xffffff,
            fontFamily: 'monospace',
            fontWeight: 'bold',
          });
          const label = new Text({
            text: cellType === 'spawn' ? 'SPAWN' : 'BASE',
            style,
          });
          label.x = col * cellSize + cellSize / 2;
          label.y = row * cellSize + cellSize / 2;
          label.anchor.set(0.5);
          this.container.addChild(label);
        }
      }
    }

    this.drawPathIndicators();
  }

  private drawPathIndicators() {
    const { path, cellSize } = this.map;
    const g = new Graphics();

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      const fx = from.col * cellSize + cellSize / 2;
      const fy = from.row * cellSize + cellSize / 2;
      const tx = to.col * cellSize + cellSize / 2;
      const ty = to.row * cellSize + cellSize / 2;

      // Dotted line along path
      const mx = (fx + tx) / 2;
      const my = (fy + ty) / 2;
      g.circle(mx, my, 2);
      g.fill({ color: 0xe94560, alpha: 0.3 });

      // Small arrow at midpoint
      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / len;
      const ny = dy / len;
      const arrowSize = 4;

      g.moveTo(mx + nx * arrowSize, my + ny * arrowSize);
      g.lineTo(mx - ny * arrowSize * 0.5 - nx * arrowSize * 0.3, my + nx * arrowSize * 0.5 - ny * arrowSize * 0.3);
      g.lineTo(mx + ny * arrowSize * 0.5 - nx * arrowSize * 0.3, my - nx * arrowSize * 0.5 - ny * arrowSize * 0.3);
      g.closePath();
      g.fill({ color: 0xe94560, alpha: 0.25 });
    }

    this.container.addChild(g);
  }
}
