import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameMap, CellType, MapId } from '../../types';

// Per-map color themes
const MAP_THEMES: Record<MapId, {
  path: number; pathEdge: number; buildable: number; buildGrid: number;
  blocked: number; spawn: number; base: number; bg: number; accent: number;
}> = {
  canyon: {
    path: 0x3d3250, pathEdge: 0x5a4a6e, buildable: 0x1a2040,
    buildGrid: 0x283060, blocked: 0x0e0e1e, spawn: 0xe94560,
    base: 0x00d4ff, bg: 0x12122a, accent: 0xe94560,
  },
  crossroads: {
    path: 0x2a3a28, pathEdge: 0x4a6a40, buildable: 0x1a2818,
    buildGrid: 0x2a4025, blocked: 0x0e1510, spawn: 0xff8800,
    base: 0x44ddff, bg: 0x101a10, accent: 0xff8800,
  },
  fortress: {
    path: 0x3a2a28, pathEdge: 0x6a4a40, buildable: 0x201818,
    buildGrid: 0x402828, blocked: 0x150e0e, spawn: 0xff4444,
    base: 0x44ff88, bg: 0x1a1010, accent: 0xff4444,
  },
  spiral: {
    path: 0x2a2a3a, pathEdge: 0x4a4a6a, buildable: 0x181828,
    buildGrid: 0x282840, blocked: 0x0e0e18, spawn: 0xff8800,
    base: 0xff44ff, bg: 0x101018, accent: 0xff8800,
  },
  gauntlet: {
    path: 0x3a3228, pathEdge: 0x6a5a40, buildable: 0x201c14,
    buildGrid: 0x403420, blocked: 0x151008, spawn: 0x44ff44,
    base: 0xff4444, bg: 0x1a1408, accent: 0x44ff44,
  },
};

export class GridRenderer {
  private container: Container;
  private map: GameMap;

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  setMap(map: GameMap) {
    this.map = map;
  }

  render() {
    this.container.removeChildren();

    const { grid, cellSize, width, height, id, path } = this.map;
    const theme = MAP_THEMES[id] ?? MAP_THEMES.canyon;

    // Background fill
    const bg = new Graphics();
    bg.rect(0, 0, width * cellSize, height * cellSize);
    bg.fill({ color: theme.bg });
    this.container.addChild(bg);

    // Draw path glow (underneath everything)
    this.drawPathGlow(path, cellSize, theme);

    // Draw cells
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const cellType = grid[row][col];
        const x = col * cellSize;
        const y = row * cellSize;
        const g = new Graphics();

        switch (cellType) {
          case 'path':
            this.drawPathCell(g, x, y, cellSize, theme);
            break;
          case 'buildable':
            this.drawBuildableCell(g, x, y, cellSize, col, row, theme);
            break;
          case 'blocked':
            this.drawBlockedCell(g, x, y, cellSize, col, row, theme);
            break;
          case 'spawn':
            this.drawSpawnCell(g, x, y, cellSize, theme);
            break;
          case 'base':
            this.drawBaseCell(g, x, y, cellSize, theme);
            break;
        }

        this.container.addChild(g);
      }
    }

    // Path direction arrows
    this.drawPathArrows(path, cellSize, theme);

    // Spawn/Base labels
    this.drawLabels(grid, cellSize, width, height);
  }

  private drawPathCell(g: Graphics, x: number, y: number, s: number, theme: typeof MAP_THEMES.canyon) {
    // Main fill
    g.rect(x, y, s, s);
    g.fill({ color: theme.path });

    // Inner groove
    const m = 3;
    g.rect(x + m, y + m, s - m * 2, s - m * 2);
    g.fill({ color: theme.path, alpha: 0.7 });
    g.stroke({ color: theme.pathEdge, width: 1, alpha: 0.3 });

    // Subtle noise dots
    for (let i = 0; i < 3; i++) {
      const dx = x + 8 + (i * 18) % (s - 16);
      const dy = y + 8 + (i * 13) % (s - 16);
      g.circle(dx, dy, 1);
      g.fill({ color: theme.pathEdge, alpha: 0.15 });
    }
  }

  private drawBuildableCell(g: Graphics, x: number, y: number, s: number, col: number, row: number, theme: typeof MAP_THEMES.canyon) {
    g.rect(x, y, s, s);
    g.fill({ color: theme.buildable });

    // Grid lines
    g.rect(x, y, s, s);
    g.stroke({ color: theme.buildGrid, width: 1, alpha: 0.25 });

    // Corner brackets (build indicator)
    const bLen = 6;
    const bOff = 4;
    const bColor = theme.buildGrid;

    // Top-left
    g.moveTo(x + bOff, y + bOff + bLen);
    g.lineTo(x + bOff, y + bOff);
    g.lineTo(x + bOff + bLen, y + bOff);
    g.stroke({ color: bColor, width: 1, alpha: 0.2 });

    // Top-right
    g.moveTo(x + s - bOff - bLen, y + bOff);
    g.lineTo(x + s - bOff, y + bOff);
    g.lineTo(x + s - bOff, y + bOff + bLen);
    g.stroke({ color: bColor, width: 1, alpha: 0.2 });

    // Bottom-left
    g.moveTo(x + bOff, y + s - bOff - bLen);
    g.lineTo(x + bOff, y + s - bOff);
    g.lineTo(x + bOff + bLen, y + s - bOff);
    g.stroke({ color: bColor, width: 1, alpha: 0.2 });

    // Bottom-right
    g.moveTo(x + s - bOff - bLen, y + s - bOff);
    g.lineTo(x + s - bOff, y + s - bOff);
    g.lineTo(x + s - bOff, y + s - bOff - bLen);
    g.stroke({ color: bColor, width: 1, alpha: 0.2 });

    // Center dot
    g.circle(x + s / 2, y + s / 2, 1.5);
    g.fill({ color: bColor, alpha: 0.15 });
  }

  private drawBlockedCell(g: Graphics, x: number, y: number, s: number, col: number, row: number, theme: typeof MAP_THEMES.canyon) {
    g.rect(x, y, s, s);
    g.fill({ color: theme.blocked });

    // Rocky texture — cross-hatch
    const hash = (col * 7 + row * 13) % 5;
    if (hash < 3) {
      g.moveTo(x + 8, y + 8);
      g.lineTo(x + s - 8, y + s - 8);
      g.stroke({ color: 0x1a1a2a, width: 1, alpha: 0.2 });
    }
    if (hash < 2) {
      g.moveTo(x + s - 8, y + 8);
      g.lineTo(x + 8, y + s - 8);
      g.stroke({ color: 0x1a1a2a, width: 1, alpha: 0.15 });
    }
  }

  private drawSpawnCell(g: Graphics, x: number, y: number, s: number, theme: typeof MAP_THEMES.canyon) {
    g.rect(x, y, s, s);
    g.fill({ color: theme.path });

    // Pulsing border ring
    g.rect(x + 2, y + 2, s - 4, s - 4);
    g.stroke({ color: theme.spawn, width: 2, alpha: 0.6 });

    // Inner glow
    g.rect(x + 6, y + 6, s - 12, s - 12);
    g.fill({ color: theme.spawn, alpha: 0.12 });

    // Corner triangles
    const t = 8;
    g.moveTo(x, y); g.lineTo(x + t, y); g.lineTo(x, y + t); g.closePath();
    g.fill({ color: theme.spawn, alpha: 0.3 });
    g.moveTo(x + s, y); g.lineTo(x + s - t, y); g.lineTo(x + s, y + t); g.closePath();
    g.fill({ color: theme.spawn, alpha: 0.3 });
  }

  private drawBaseCell(g: Graphics, x: number, y: number, s: number, theme: typeof MAP_THEMES.canyon) {
    g.rect(x, y, s, s);
    g.fill({ color: theme.path });

    // Concentric rings
    const cx = x + s / 2;
    const cy = y + s / 2;
    g.circle(cx, cy, s * 0.4);
    g.stroke({ color: theme.base, width: 2, alpha: 0.5 });
    g.circle(cx, cy, s * 0.25);
    g.stroke({ color: theme.base, width: 1.5, alpha: 0.3 });
    g.circle(cx, cy, s * 0.1);
    g.fill({ color: theme.base, alpha: 0.4 });

    // Corner brackets
    g.rect(x + 2, y + 2, s - 4, s - 4);
    g.stroke({ color: theme.base, width: 2, alpha: 0.4 });
  }

  private drawPathGlow(path: { col: number; row: number }[], cellSize: number, theme: typeof MAP_THEMES.canyon) {
    const g = new Graphics();

    for (const p of path) {
      const cx = p.col * cellSize + cellSize / 2;
      const cy = p.row * cellSize + cellSize / 2;
      g.circle(cx, cy, cellSize * 0.6);
      g.fill({ color: theme.accent, alpha: 0.03 });
    }

    this.container.addChild(g);
  }

  private drawPathArrows(path: { col: number; row: number }[], cellSize: number, theme: typeof MAP_THEMES.canyon) {
    const g = new Graphics();

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      const fx = from.col * cellSize + cellSize / 2;
      const fy = from.row * cellSize + cellSize / 2;
      const tx = to.col * cellSize + cellSize / 2;
      const ty = to.row * cellSize + cellSize / 2;

      const mx = (fx + tx) / 2;
      const my = (fy + ty) / 2;

      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const nx = dx / len;
      const ny = dy / len;

      // Arrow
      const aSize = 5;
      g.moveTo(mx + nx * aSize, my + ny * aSize);
      g.lineTo(mx - ny * aSize * 0.5 - nx * aSize * 0.3, my + nx * aSize * 0.5 - ny * aSize * 0.3);
      g.lineTo(mx + ny * aSize * 0.5 - nx * aSize * 0.3, my - nx * aSize * 0.5 - ny * aSize * 0.3);
      g.closePath();
      g.fill({ color: theme.accent, alpha: 0.2 });

      // Dot
      g.circle(mx, my, 2);
      g.fill({ color: theme.accent, alpha: 0.15 });
    }

    this.container.addChild(g);
  }

  private drawLabels(grid: CellType[][], cellSize: number, width: number, height: number) {
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const cellType = grid[row][col];
        if (cellType !== 'spawn' && cellType !== 'base') continue;

        const style = new TextStyle({
          fontSize: 9,
          fill: cellType === 'spawn' ? 0xff6680 : 0x88eeff,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          letterSpacing: 2,
        });
        const label = new Text({
          text: cellType === 'spawn' ? 'SPAWN' : 'CORE',
          style,
        });
        label.x = col * cellSize + cellSize / 2;
        label.y = row * cellSize + cellSize / 2;
        label.anchor.set(0.5);
        this.container.addChild(label);
      }
    }
  }
}
