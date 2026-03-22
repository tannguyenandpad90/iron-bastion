import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameMap, CellType, MapId } from '../../types';

// Neon sci-fi color palette
const BG = 0x0B0F1A;
const GRID_LINE = 0x1A2333;
const PATH_COLOR = 0x2A3A55;
const PATH_GLOW = 0x00F5A0;
const BUILD_COLOR = 0x111825;
const BUILD_LINE = 0x1E2D42;
const BLOCK_COLOR = 0x0D1220;
const BLOCK_HI = 0x1A2535;
const SPAWN_COLOR = 0xFF3D6E;
const BASE_COLOR = 0x00F5A0;

// Per-map accent override
const MAP_ACCENTS: Partial<Record<MapId, { accent: number; glow: number }>> = {
  canyon:     { accent: 0x00F5A0, glow: 0x00FFCC },
  crossroads: { accent: 0x00E5FF, glow: 0x5BFFFF },
  fortress:  { accent: 0xFF3D6E, glow: 0xFF6B6B },
  spiral:    { accent: 0x9B5CFF, glow: 0xBB88FF },
  gauntlet:  { accent: 0xFFD166, glow: 0xFFE088 },
  tundra:    { accent: 0x00BFFF, glow: 0x66DDFF },
  volcano:   { accent: 0xFF5C5C, glow: 0xFF8888 },
  swamp:     { accent: 0x88FF44, glow: 0xAAFF66 },
  desert:    { accent: 0xFFB800, glow: 0xFFCC44 },
  neon_city: { accent: 0x00FFAA, glow: 0x66FFCC },
  skybridge: { accent: 0x5BFFFF, glow: 0x88FFFF },
  catacombs: { accent: 0x9B5CFF, glow: 0xCC88FF },
  reactor:   { accent: 0x00FF88, glow: 0x44FFAA },
  void_rift: { accent: 0xFF44FF, glow: 0xFF88FF },
  last_stand: { accent: 0xFF3D6E, glow: 0xFF6B6B },
};

export class GridRenderer {
  private container: Container;
  private map: GameMap;

  constructor(parent: Container, map: GameMap) {
    this.container = new Container();
    this.map = map;
    parent.addChild(this.container);
  }

  setMap(map: GameMap) { this.map = map; }

  render() {
    this.container.removeChildren();
    const { grid, cellSize: s, width: w, height: h, id, path: pa } = this.map;
    const accent = MAP_ACCENTS[id]?.accent ?? 0x00F5A0;
    const glow = MAP_ACCENTS[id]?.glow ?? 0x00FFCC;

    // Dark background
    const bg = new Graphics();
    bg.rect(0, 0, w * s, h * s);
    bg.fill({ color: BG });
    this.container.addChild(bg);

    // Grid lines (very subtle)
    const gridG = new Graphics();
    for (let row = 0; row <= h; row++) {
      gridG.moveTo(0, row * s); gridG.lineTo(w * s, row * s);
      gridG.stroke({ color: GRID_LINE, width: 0.5, alpha: 0.25 });
    }
    for (let col = 0; col <= w; col++) {
      gridG.moveTo(col * s, 0); gridG.lineTo(col * s, h * s);
      gridG.stroke({ color: GRID_LINE, width: 0.5, alpha: 0.25 });
    }
    this.container.addChild(gridG);

    // Path glow layer (soft neon under path)
    const glowG = new Graphics();
    for (const pt of pa) {
      const cx = pt.col * s + s / 2, cy = pt.row * s + s / 2;
      glowG.circle(cx, cy, s * 0.9);
      glowG.fill({ color: accent, alpha: 0.03 });
      glowG.circle(cx, cy, s * 0.5);
      glowG.fill({ color: glow, alpha: 0.02 });
    }
    this.container.addChild(glowG);

    // Shadow layer for blocked cells
    const shadowG = new Graphics();
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (grid[row][col] === 'blocked') {
          shadowG.rect(col * s + 4, row * s + 4, s + 3, s + 3);
          shadowG.fill({ color: 0x000000, alpha: 0.3 });
        }
      }
    }
    this.container.addChild(shadowG);

    // Draw cells
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const ct = grid[row][col];
        const x = col * s, y = row * s;
        const g = new Graphics();

        switch (ct) {
          case 'blocked': this.drawBlock(g, x, y, s); break;
          case 'path': this.drawPath(g, x, y, s, accent); break;
          case 'buildable': this.drawBuild(g, x, y, s, accent); break;
          case 'spawn': this.drawSpawn(g, x, y, s); break;
          case 'base': this.drawBase(g, x, y, s, accent, glow); break;
        }

        this.container.addChild(g);
      }
    }

    this.drawPathFlow(pa, s, accent);
    this.drawLabels(grid, s, w, h);
  }

  private drawBlock(g: Graphics, x: number, y: number, s: number) {
    // Raised 3D block
    // Right face
    g.moveTo(x + s, y); g.lineTo(x + s + 4, y + 4); g.lineTo(x + s + 4, y + s + 4); g.lineTo(x + s, y + s);
    g.closePath(); g.fill({ color: 0x060A12 });
    // Bottom face
    g.moveTo(x, y + s); g.lineTo(x + 4, y + s + 4); g.lineTo(x + s + 4, y + s + 4); g.lineTo(x + s, y + s);
    g.closePath(); g.fill({ color: 0x050810 });
    // Top face
    g.rect(x, y, s, s);
    g.fill({ color: BLOCK_COLOR });
    // Top edge glow
    g.moveTo(x, y); g.lineTo(x + s, y);
    g.stroke({ color: BLOCK_HI, width: 1, alpha: 0.3 });
    g.moveTo(x, y); g.lineTo(x, y + s);
    g.stroke({ color: BLOCK_HI, width: 0.5, alpha: 0.2 });
  }

  private drawPath(g: Graphics, x: number, y: number, s: number, accent: number) {
    // Sunken path
    g.rect(x, y, s, s);
    g.fill({ color: PATH_COLOR, alpha: 0.6 });
    // Inner recessed floor
    const m = 2;
    g.rect(x + m, y + m, s - m * 2, s - m * 2);
    g.fill({ color: PATH_COLOR });
    // Top inner shadow
    g.rect(x + m, y + m, s - m * 2, 1.5);
    g.fill({ color: 0x000000, alpha: 0.2 });
    g.rect(x + m, y + m, 1.5, s - m * 2);
    g.fill({ color: 0x000000, alpha: 0.15 });
    // Bottom highlight
    g.moveTo(x + m, y + s - m); g.lineTo(x + s - m, y + s - m);
    g.stroke({ color: accent, width: 0.5, alpha: 0.08 });
  }

  private drawBuild(g: Graphics, x: number, y: number, s: number, accent: number) {
    g.rect(x, y, s, s);
    g.fill({ color: BUILD_COLOR });
    // Subtle bevel
    g.moveTo(x, y); g.lineTo(x + s, y);
    g.stroke({ color: BUILD_LINE, width: 0.5, alpha: 0.2 });
    g.moveTo(x, y); g.lineTo(x, y + s);
    g.stroke({ color: BUILD_LINE, width: 0.5, alpha: 0.15 });
    g.moveTo(x + s, y); g.lineTo(x + s, y + s);
    g.stroke({ color: 0x000000, width: 0.5, alpha: 0.15 });
    g.moveTo(x, y + s); g.lineTo(x + s, y + s);
    g.stroke({ color: 0x000000, width: 0.5, alpha: 0.15 });

    // Corner brackets (neon accent)
    const bL = 5, bO = 4;
    const drawBracket = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3);
      g.stroke({ color: accent, width: 0.7, alpha: 0.15 });
    };
    drawBracket(x+bO, y+bO+bL, x+bO, y+bO, x+bO+bL, y+bO);
    drawBracket(x+s-bO-bL, y+bO, x+s-bO, y+bO, x+s-bO, y+bO+bL);
    drawBracket(x+bO, y+s-bO-bL, x+bO, y+s-bO, x+bO+bL, y+s-bO);
    drawBracket(x+s-bO-bL, y+s-bO, x+s-bO, y+s-bO, x+s-bO, y+s-bO-bL);

    // Center dot
    g.circle(x + s / 2, y + s / 2, 1);
    g.fill({ color: accent, alpha: 0.1 });
  }

  private drawSpawn(g: Graphics, x: number, y: number, s: number) {
    this.drawPath(g, x, y, s, SPAWN_COLOR);
    // Neon border glow
    g.rect(x + 1, y + 1, s - 2, s - 2);
    g.stroke({ color: SPAWN_COLOR, width: 2, alpha: 0.5 });
    // Outer glow
    g.rect(x - 1, y - 1, s + 2, s + 2);
    g.stroke({ color: SPAWN_COLOR, width: 1, alpha: 0.15 });
    // Inner glow fill
    g.rect(x + 5, y + 5, s - 10, s - 10);
    g.fill({ color: SPAWN_COLOR, alpha: 0.08 });
    // Corner arrows
    const t = 7;
    g.moveTo(x,y); g.lineTo(x+t,y); g.lineTo(x,y+t); g.closePath();
    g.fill({ color: SPAWN_COLOR, alpha: 0.3 });
    g.moveTo(x+s,y); g.lineTo(x+s-t,y); g.lineTo(x+s,y+t); g.closePath();
    g.fill({ color: SPAWN_COLOR, alpha: 0.3 });
    g.moveTo(x,y+s); g.lineTo(x+t,y+s); g.lineTo(x,y+s-t); g.closePath();
    g.fill({ color: SPAWN_COLOR, alpha: 0.3 });
    g.moveTo(x+s,y+s); g.lineTo(x+s-t,y+s); g.lineTo(x+s,y+s-t); g.closePath();
    g.fill({ color: SPAWN_COLOR, alpha: 0.3 });
  }

  private drawBase(g: Graphics, x: number, y: number, s: number, accent: number, glow: number) {
    this.drawPath(g, x, y, s, accent);
    const cx = x + s / 2, cy = y + s / 2;

    // Reactor rings
    g.circle(cx, cy, s * 0.42);
    g.stroke({ color: accent, width: 2, alpha: 0.35 });
    g.circle(cx, cy, s * 0.42);
    g.stroke({ color: glow, width: 4, alpha: 0.08 }); // outer glow

    g.circle(cx, cy, s * 0.28);
    g.stroke({ color: accent, width: 1.5, alpha: 0.25 });

    g.circle(cx, cy, s * 0.14);
    g.fill({ color: glow, alpha: 0.3 });
    g.circle(cx, cy, s * 0.06);
    g.fill({ color: 0xffffff, alpha: 0.5 });

    // Border glow
    g.rect(x + 1, y + 1, s - 2, s - 2);
    g.stroke({ color: accent, width: 1.5, alpha: 0.3 });
    g.rect(x - 1, y - 1, s + 2, s + 2);
    g.stroke({ color: accent, width: 1, alpha: 0.1 });
  }

  private drawPathFlow(pa: { col: number; row: number }[], s: number, accent: number) {
    const g = new Graphics();
    for (let i = 0; i < pa.length - 1; i++) {
      const f = pa[i], t = pa[i + 1];
      const mx = (f.col + t.col) * s / 2 + s / 2;
      const my = (f.row + t.row) * s / 2 + s / 2;
      const dx = t.col - f.col, dy = t.row - f.row;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const nx = dx / len, ny = dy / len;
      const a = 4;
      // Small arrow
      g.moveTo(mx + nx * a, my + ny * a);
      g.lineTo(mx - ny * a * 0.4 - nx * a * 0.3, my + nx * a * 0.4 - ny * a * 0.3);
      g.lineTo(mx + ny * a * 0.4 - nx * a * 0.3, my - nx * a * 0.4 - ny * a * 0.3);
      g.closePath();
      g.fill({ color: accent, alpha: 0.12 });
    }
    this.container.addChild(g);
  }

  private drawLabels(grid: CellType[][], s: number, w: number, h: number) {
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const ct = grid[row][col];
        if (ct !== 'spawn' && ct !== 'base') continue;
        const color = ct === 'spawn' ? SPAWN_COLOR : BASE_COLOR;
        const label = new Text({
          text: ct === 'spawn' ? 'SPAWN' : 'CORE',
          style: new TextStyle({ fontSize: 8, fill: color, fontFamily: 'Exo 2, monospace', fontWeight: '700', letterSpacing: 3 }),
        });
        label.anchor.set(0.5);
        label.x = col * s + s / 2;
        label.y = row * s + s / 2;
        this.container.addChild(label);
      }
    }
  }
}
