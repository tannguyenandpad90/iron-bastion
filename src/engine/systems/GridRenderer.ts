import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameMap, CellType, MapId } from '../../types';

// Light direction: top-left
const LIGHT_TOP = 0.4;    // top edge brightness boost
const LIGHT_LEFT = 0.25;  // left edge brightness boost
const SHADOW_BOTTOM = 0.35;
const SHADOW_RIGHT = 0.2;

interface Theme {
  path: number; pathHi: number; build: number; buildHi: number;
  blocked: number; blockedHi: number; spawn: number; base: number;
  bg: number; accent: number; wallHeight: number;
}

// 15 unique color themes
const THEMES: Record<string, Theme> = {
  canyon:     { path: 0x3d3250, pathHi: 0x5a4a6e, build: 0x1a2040, buildHi: 0x283060, blocked: 0x252035, blockedHi: 0x3a3050, spawn: 0xe94560, base: 0x00d4ff, bg: 0x12122a, accent: 0xe94560, wallHeight: 8 },
  crossroads: { path: 0x2a3a28, pathHi: 0x4a6a40, build: 0x1a2818, buildHi: 0x2a4025, blocked: 0x1e2e1a, blockedHi: 0x354a30, spawn: 0xff8800, base: 0x44ddff, bg: 0x101a10, accent: 0xff8800, wallHeight: 6 },
  fortress:  { path: 0x3a2a28, pathHi: 0x6a4a40, build: 0x201818, buildHi: 0x402828, blocked: 0x2e2020, blockedHi: 0x4a3535, spawn: 0xff4444, base: 0x44ff88, bg: 0x1a1010, accent: 0xff4444, wallHeight: 10 },
  spiral:    { path: 0x2a2a3a, pathHi: 0x4a4a6a, build: 0x181828, buildHi: 0x282840, blocked: 0x202030, blockedHi: 0x353548, spawn: 0xff8800, base: 0xff44ff, bg: 0x101018, accent: 0xff8800, wallHeight: 7 },
  gauntlet:  { path: 0x3a3228, pathHi: 0x6a5a40, build: 0x201c14, buildHi: 0x403420, blocked: 0x2a2418, blockedHi: 0x454030, spawn: 0x44ff44, base: 0xff4444, bg: 0x1a1408, accent: 0x44ff44, wallHeight: 9 },
  tundra:    { path: 0x2a3848, pathHi: 0x4a6888, build: 0x182838, buildHi: 0x284058, blocked: 0x1e3040, blockedHi: 0x354a5e, spawn: 0x44ccff, base: 0xff8844, bg: 0x0e1820, accent: 0x44ccff, wallHeight: 5 },
  volcano:   { path: 0x3a2020, pathHi: 0x6a3535, build: 0x281414, buildHi: 0x482020, blocked: 0x301818, blockedHi: 0x4a2a2a, spawn: 0xff6600, base: 0x44ffff, bg: 0x1a0808, accent: 0xff6600, wallHeight: 10 },
  swamp:     { path: 0x1a2a1a, pathHi: 0x2a4a2a, build: 0x142014, buildHi: 0x1e3a1e, blocked: 0x182818, blockedHi: 0x2a3e2a, spawn: 0xaaff00, base: 0xff44aa, bg: 0x0a140a, accent: 0xaaff00, wallHeight: 4 },
  desert:    { path: 0x3a3020, pathHi: 0x5a5035, build: 0x2a2418, buildHi: 0x4a4030, blocked: 0x322a1e, blockedHi: 0x4e4435, spawn: 0xffaa00, base: 0x4488ff, bg: 0x1a1408, accent: 0xffaa00, wallHeight: 6 },
  neon_city: { path: 0x1a1a30, pathHi: 0x2a2a50, build: 0x10102a, buildHi: 0x1a1a44, blocked: 0x181835, blockedHi: 0x2a2a50, spawn: 0x00ffaa, base: 0xff00aa, bg: 0x080818, accent: 0x00ffaa, wallHeight: 8 },
  skybridge: { path: 0x202840, pathHi: 0x354868, build: 0x182038, buildHi: 0x283858, blocked: 0x1e2a42, blockedHi: 0x304560, spawn: 0x88ddff, base: 0xffaa44, bg: 0x0e1420, accent: 0x88ddff, wallHeight: 12 },
  catacombs: { path: 0x282020, pathHi: 0x403535, build: 0x1a1414, buildHi: 0x302222, blocked: 0x221a1a, blockedHi: 0x382e2e, spawn: 0xaa88ff, base: 0x88ff44, bg: 0x100c0c, accent: 0xaa88ff, wallHeight: 9 },
  reactor:   { path: 0x202830, pathHi: 0x354050, build: 0x141c24, buildHi: 0x223040, blocked: 0x1a2430, blockedHi: 0x2e3e4e, spawn: 0x00ff88, base: 0xff4400, bg: 0x0a1018, accent: 0x00ff88, wallHeight: 7 },
  void_rift: { path: 0x1a1028, pathHi: 0x2e1a48, build: 0x120a20, buildHi: 0x201438, blocked: 0x180e28, blockedHi: 0x2a1840, spawn: 0xff44ff, base: 0x44ff44, bg: 0x0a0618, accent: 0xff44ff, wallHeight: 10 },
  last_stand: { path: 0x2a2028, pathHi: 0x4a3548, build: 0x1e1420, buildHi: 0x3a2838, blocked: 0x241a28, blockedHi: 0x3e2e42, spawn: 0xff0000, base: 0x00ffff, bg: 0x140e14, accent: 0xff0000, wallHeight: 11 },
};

function getTheme(id: MapId): Theme {
  return THEMES[id] ?? THEMES.canyon;
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - Math.floor(amount * 255));
  const g = Math.max(0, ((color >> 8) & 0xff) - Math.floor(amount * 255));
  const b = Math.max(0, (color & 0xff) - Math.floor(amount * 255));
  return (r << 16) | (g << 8) | b;
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(amount * 255));
  const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(amount * 255));
  const b = Math.min(255, (color & 0xff) + Math.floor(amount * 255));
  return (r << 16) | (g << 8) | b;
}

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
    const t = getTheme(id);

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, w * s, h * s);
    bg.fill({ color: t.bg });
    this.container.addChild(bg);

    // Path glow
    const glow = new Graphics();
    for (const pt of pa) {
      glow.circle(pt.col * s + s / 2, pt.row * s + s / 2, s * 0.7);
      glow.fill({ color: t.accent, alpha: 0.025 });
    }
    this.container.addChild(glow);

    // --- PSEUDO-3D CELLS ---
    // Draw blocked walls first (they cast shadows), then other cells
    const wh = t.wallHeight;

    // Pass 1: Shadows from blocked cells
    const shadowG = new Graphics();
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (grid[row][col] === 'blocked') {
          // Shadow projects down-right
          shadowG.rect(col * s + 3, row * s + 3, s + wh * 0.5, s + wh * 0.5);
          shadowG.fill({ color: 0x000000, alpha: 0.2 });
        }
      }
    }
    this.container.addChild(shadowG);

    // Pass 2: All cells with 3D effect
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const ct = grid[row][col];
        const x = col * s;
        const y = row * s;
        const g = new Graphics();

        switch (ct) {
          case 'blocked': this.draw3DBlock(g, x, y, s, wh, t); break;
          case 'path':    this.draw3DPath(g, x, y, s, t); break;
          case 'buildable': this.draw3DBuildable(g, x, y, s, col, row, t); break;
          case 'spawn':   this.draw3DSpawn(g, x, y, s, t); break;
          case 'base':    this.draw3DBase(g, x, y, s, t); break;
        }

        this.container.addChild(g);
      }
    }

    // Path arrows
    this.drawPathArrows(pa, s, t);
    // Labels
    this.drawLabels(grid, s, w, h, t);
  }

  private draw3DBlock(g: Graphics, x: number, y: number, s: number, wh: number, t: Theme) {
    // Right face (shadow side)
    g.moveTo(x + s, y);
    g.lineTo(x + s + wh * 0.4, y + wh * 0.4);
    g.lineTo(x + s + wh * 0.4, y + s + wh * 0.4);
    g.lineTo(x + s, y + s);
    g.closePath();
    g.fill({ color: darken(t.blocked, SHADOW_RIGHT) });

    // Bottom face (shadow side)
    g.moveTo(x, y + s);
    g.lineTo(x + wh * 0.4, y + s + wh * 0.4);
    g.lineTo(x + s + wh * 0.4, y + s + wh * 0.4);
    g.lineTo(x + s, y + s);
    g.closePath();
    g.fill({ color: darken(t.blocked, SHADOW_BOTTOM) });

    // Top face (lit)
    g.rect(x, y, s, s);
    g.fill({ color: t.blocked });

    // Top edge highlight
    g.moveTo(x, y); g.lineTo(x + s, y);
    g.stroke({ color: t.blockedHi, width: 1.5, alpha: LIGHT_TOP });

    // Left edge highlight
    g.moveTo(x, y); g.lineTo(x, y + s);
    g.stroke({ color: t.blockedHi, width: 1, alpha: LIGHT_LEFT });

    // Surface texture
    const hash = ((x * 7 + y * 13) >> 4) % 4;
    if (hash < 2) {
      g.moveTo(x + 10, y + 10); g.lineTo(x + s - 10, y + s - 10);
      g.stroke({ color: t.blockedHi, width: 0.5, alpha: 0.1 });
    }
  }

  private draw3DPath(g: Graphics, x: number, y: number, s: number, t: Theme) {
    // Inset — path is lower than surroundings
    const inset = 2;

    // Outer rim (raised edge illusion)
    g.rect(x, y, s, s);
    g.fill({ color: darken(t.path, 0.15) });

    // Inner sunken floor
    g.rect(x + inset, y + inset, s - inset * 2, s - inset * 2);
    g.fill({ color: t.path });

    // Top inner shadow (light from top = top edge of inset is shadowed)
    g.rect(x + inset, y + inset, s - inset * 2, 2);
    g.fill({ color: 0x000000, alpha: 0.15 });

    // Left inner shadow
    g.rect(x + inset, y + inset, 2, s - inset * 2);
    g.fill({ color: 0x000000, alpha: 0.1 });

    // Bottom highlight
    g.moveTo(x + inset, y + s - inset);
    g.lineTo(x + s - inset, y + s - inset);
    g.stroke({ color: t.pathHi, width: 1, alpha: 0.2 });

    // Floor texture dots
    for (let i = 0; i < 2; i++) {
      const dx = x + 12 + (i * 22) % (s - 20);
      const dy = y + 12 + (i * 17) % (s - 20);
      g.circle(dx, dy, 1);
      g.fill({ color: t.pathHi, alpha: 0.08 });
    }
  }

  private draw3DBuildable(g: Graphics, x: number, y: number, s: number, col: number, row: number, t: Theme) {
    // Flat platform with subtle bevel
    g.rect(x, y, s, s);
    g.fill({ color: t.build });

    // Top bevel (lighter)
    g.moveTo(x, y); g.lineTo(x + s, y);
    g.stroke({ color: t.buildHi, width: 1, alpha: 0.15 });

    // Left bevel
    g.moveTo(x, y); g.lineTo(x, y + s);
    g.stroke({ color: t.buildHi, width: 1, alpha: 0.1 });

    // Bottom/right edge (darker)
    g.moveTo(x + s, y); g.lineTo(x + s, y + s); g.lineTo(x, y + s);
    g.stroke({ color: 0x000000, width: 1, alpha: 0.1 });

    // Grid border
    g.rect(x, y, s, s);
    g.stroke({ color: t.buildHi, width: 0.5, alpha: 0.12 });

    // Corner brackets
    const bL = 5, bO = 3;
    const ba = 0.18;
    g.moveTo(x + bO, y + bO + bL); g.lineTo(x + bO, y + bO); g.lineTo(x + bO + bL, y + bO);
    g.stroke({ color: t.buildHi, width: 1, alpha: ba });
    g.moveTo(x + s - bO - bL, y + bO); g.lineTo(x + s - bO, y + bO); g.lineTo(x + s - bO, y + bO + bL);
    g.stroke({ color: t.buildHi, width: 1, alpha: ba });
    g.moveTo(x + bO, y + s - bO - bL); g.lineTo(x + bO, y + s - bO); g.lineTo(x + bO + bL, y + s - bO);
    g.stroke({ color: t.buildHi, width: 1, alpha: ba });
    g.moveTo(x + s - bO - bL, y + s - bO); g.lineTo(x + s - bO, y + s - bO); g.lineTo(x + s - bO, y + s - bO - bL);
    g.stroke({ color: t.buildHi, width: 1, alpha: ba });

    // Center crosshair
    const cx = x + s / 2, cy = y + s / 2;
    g.circle(cx, cy, 1.5);
    g.fill({ color: t.buildHi, alpha: 0.1 });
  }

  private draw3DSpawn(g: Graphics, x: number, y: number, s: number, t: Theme) {
    this.draw3DPath(g, x, y, s, t);

    // Glowing border
    g.rect(x + 2, y + 2, s - 4, s - 4);
    g.stroke({ color: t.spawn, width: 2, alpha: 0.5 });

    // Inner glow
    g.rect(x + 6, y + 6, s - 12, s - 12);
    g.fill({ color: t.spawn, alpha: 0.1 });

    // Corner triangles
    const tri = 8;
    g.moveTo(x, y); g.lineTo(x + tri, y); g.lineTo(x, y + tri); g.closePath();
    g.fill({ color: t.spawn, alpha: 0.25 });
    g.moveTo(x + s, y); g.lineTo(x + s - tri, y); g.lineTo(x + s, y + tri); g.closePath();
    g.fill({ color: t.spawn, alpha: 0.25 });
    g.moveTo(x, y + s); g.lineTo(x + tri, y + s); g.lineTo(x, y + s - tri); g.closePath();
    g.fill({ color: t.spawn, alpha: 0.25 });
    g.moveTo(x + s, y + s); g.lineTo(x + s - tri, y + s); g.lineTo(x + s, y + s - tri); g.closePath();
    g.fill({ color: t.spawn, alpha: 0.25 });
  }

  private draw3DBase(g: Graphics, x: number, y: number, s: number, t: Theme) {
    this.draw3DPath(g, x, y, s, t);

    const cx = x + s / 2, cy = y + s / 2;

    // Concentric target rings with 3D bevel
    g.circle(cx, cy, s * 0.4);
    g.stroke({ color: t.base, width: 2, alpha: 0.4 });
    g.circle(cx, cy, s * 0.28);
    g.stroke({ color: lighten(t.base, 0.1), width: 1.5, alpha: 0.3 });
    g.circle(cx, cy, s * 0.15);
    g.fill({ color: t.base, alpha: 0.3 });
    g.circle(cx, cy, s * 0.06);
    g.fill({ color: 0xffffff, alpha: 0.4 });

    // Border
    g.rect(x + 2, y + 2, s - 4, s - 4);
    g.stroke({ color: t.base, width: 2, alpha: 0.35 });
  }

  private drawPathArrows(pa: { col: number; row: number }[], s: number, t: Theme) {
    const g = new Graphics();
    for (let i = 0; i < pa.length - 1; i++) {
      const f = pa[i], to = pa[i + 1];
      const mx = (f.col + to.col) * s / 2 + s / 2;
      const my = (f.row + to.row) * s / 2 + s / 2;
      const dx = to.col - f.col, dy = to.row - f.row;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const nx = dx / len, ny = dy / len;
      const a = 5;
      g.moveTo(mx + nx * a, my + ny * a);
      g.lineTo(mx - ny * a * 0.5 - nx * a * 0.3, my + nx * a * 0.5 - ny * a * 0.3);
      g.lineTo(mx + ny * a * 0.5 - nx * a * 0.3, my - nx * a * 0.5 - ny * a * 0.3);
      g.closePath();
      g.fill({ color: t.accent, alpha: 0.15 });
    }
    this.container.addChild(g);
  }

  private drawLabels(grid: CellType[][], s: number, w: number, h: number, t: Theme) {
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const ct = grid[row][col];
        if (ct !== 'spawn' && ct !== 'base') continue;
        const color = ct === 'spawn' ? t.spawn : t.base;
        const label = new Text({
          text: ct === 'spawn' ? 'SPAWN' : 'CORE',
          style: new TextStyle({ fontSize: 9, fill: lighten(color, 0.2), fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 2 }),
        });
        label.anchor.set(0.5);
        label.x = col * s + s / 2;
        label.y = row * s + s / 2;
        this.container.addChild(label);
      }
    }
  }
}
