import type { GameMap, CellType, MapId } from '../types';

const CELL_SIZE = 64;

const C: Record<number, CellType> = {
  0: 'buildable', 1: 'path', 2: 'blocked', 3: 'spawn', 4: 'base',
};

function parseGrid(layout: number[][]): CellType[][] {
  return layout.map((row) => row.map((cell) => C[cell]));
}

// ==========================================
// MAP 1: SHADOW CANYON — winding S-path
// ==========================================
const CANYON = {
  grid: [
    [2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0],
  ],
  path: [
    {col:2,row:0},{col:2,row:1},{col:2,row:2},{col:2,row:3},
    {col:3,row:3},{col:4,row:3},{col:5,row:3},{col:6,row:3},
    {col:7,row:3},{col:7,row:4},{col:7,row:5},{col:7,row:6},
    {col:6,row:6},{col:5,row:6},{col:4,row:6},{col:4,row:7},
    {col:4,row:8},{col:5,row:8},{col:6,row:8},{col:7,row:8},
    {col:8,row:8},{col:9,row:8},{col:10,row:8},{col:11,row:8},
    {col:12,row:8},{col:12,row:9},
  ],
};

// ==========================================
// MAP 2: THE CROSSROADS — loop around center
// ==========================================
const CROSSROADS = {
  grid: [
    [2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0],
  ],
  path: [
    {col:7,row:0},{col:7,row:1},{col:7,row:2},{col:7,row:3},
    {col:6,row:3},{col:5,row:3},{col:4,row:3},{col:3,row:3},
    {col:2,row:3},{col:2,row:4},{col:2,row:5},{col:2,row:6},
    {col:2,row:7},{col:3,row:7},{col:4,row:7},{col:5,row:7},
    {col:6,row:7},{col:7,row:7},{col:8,row:7},{col:9,row:7},
    {col:10,row:7},{col:11,row:7},{col:12,row:7},{col:12,row:6},
    {col:12,row:5},{col:12,row:4},{col:12,row:3},{col:11,row:3},
    {col:10,row:3},{col:9,row:3},{col:8,row:3},{col:7,row:3},
    {col:7,row:4},{col:7,row:5},{col:7,row:6},{col:7,row:7},
    {col:7,row:8},{col:7,row:9},
  ],
};

// ==========================================
// MAP 3: IRON FORTRESS — short direct path
// ==========================================
const FORTRESS = {
  grid: [
    [3, 1, 1, 1, 1, 2, 0, 0, 0, 2, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 1, 2, 0, 0, 0, 2, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
    [2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2],
  ],
  path: [
    {col:0,row:0},{col:1,row:0},{col:2,row:0},{col:3,row:0},
    {col:4,row:0},{col:4,row:1},{col:4,row:2},{col:4,row:3},
    {col:4,row:4},{col:5,row:4},{col:6,row:4},{col:7,row:4},
    {col:7,row:5},{col:7,row:6},{col:7,row:7},{col:7,row:8},
    {col:7,row:9},
  ],
};

// ==========================================
// MAP 4: SPIRAL — clockwise spiral inward
// ==========================================
const SPIRAL = {
  grid: [
    [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 2],
    [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 2],
    [0, 1, 0, 1, 0, 0, 0, 4, 0, 1, 0, 1, 0, 1, 2],
    [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 2],
    [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 2],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 2],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2],
  ],
  path: [
    // Top edge right
    {col:0,row:0},{col:1,row:0},{col:2,row:0},{col:3,row:0},{col:4,row:0},
    {col:5,row:0},{col:6,row:0},{col:7,row:0},{col:8,row:0},{col:9,row:0},
    {col:10,row:0},{col:11,row:0},{col:12,row:0},{col:13,row:0},
    // Right edge down
    {col:13,row:1},{col:13,row:2},{col:13,row:3},{col:13,row:4},
    {col:13,row:5},{col:13,row:6},{col:13,row:7},{col:13,row:8},{col:13,row:9},
    // Bottom inner left
    {col:12,row:9},{col:11,row:9},{col:10,row:9},{col:9,row:9},{col:8,row:9},
    {col:7,row:9},{col:6,row:9},{col:5,row:9},{col:4,row:9},{col:3,row:9},
    {col:2,row:9},{col:1,row:9},
    // Left inner up
    {col:1,row:8},{col:1,row:7},{col:1,row:6},{col:1,row:5},{col:1,row:4},
    {col:1,row:3},{col:1,row:2},
    // Inner top right
    {col:2,row:2},{col:3,row:2},{col:4,row:2},{col:5,row:2},{col:6,row:2},
    {col:7,row:2},{col:8,row:2},{col:9,row:2},{col:10,row:2},{col:11,row:2},
    // Inner right down
    {col:11,row:3},{col:11,row:4},{col:11,row:5},{col:11,row:6},{col:11,row:7},
    // Inner bottom left
    {col:10,row:7},{col:9,row:7},{col:8,row:7},{col:7,row:7},{col:6,row:7},
    {col:5,row:7},{col:4,row:7},{col:3,row:7},
    // Inner left up
    {col:3,row:6},{col:3,row:5},{col:3,row:4},
    // Center right
    {col:4,row:4},{col:5,row:4},{col:6,row:4},{col:7,row:4},
    {col:8,row:4},{col:9,row:4},
    // Center down
    {col:9,row:5},
    // To base
    {col:8,row:5},{col:7,row:5},
  ],
};

// ==========================================
// MAP 5: THE GAUNTLET — long straight with choke points
// ==========================================
const GAUNTLET = {
  grid: [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [3, 1, 1, 1, 2, 0, 0, 0, 0, 0, 2, 1, 1, 1, 4],
    [2, 0, 0, 1, 2, 0, 0, 0, 0, 0, 2, 1, 0, 0, 2],
    [2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2],
    [2, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
    [2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2],
    [2, 0, 0, 1, 2, 0, 0, 0, 0, 0, 2, 1, 0, 0, 2],
    [2, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
  ],
  path: [
    {col:0,row:1},{col:1,row:1},{col:2,row:1},{col:3,row:1},
    {col:3,row:2},{col:3,row:3},{col:3,row:4},
    {col:4,row:4},{col:5,row:4},{col:6,row:4},{col:7,row:4},
    {col:8,row:4},{col:9,row:4},{col:10,row:4},{col:11,row:4},
    {col:11,row:3},{col:11,row:2},{col:11,row:1},
    {col:12,row:1},{col:13,row:1},{col:14,row:1},
  ],
};

// ==========================================
// EXPORTS
// ==========================================
export const MAPS: Record<MapId, GameMap> = {
  canyon: {
    id: 'canyon', name: 'Shadow Canyon', width: 15, height: 10, cellSize: CELL_SIZE,
    grid: parseGrid(CANYON.grid), path: CANYON.path,
  },
  crossroads: {
    id: 'crossroads', name: 'The Crossroads', width: 15, height: 10, cellSize: CELL_SIZE,
    grid: parseGrid(CROSSROADS.grid), path: CROSSROADS.path,
  },
  fortress: {
    id: 'fortress', name: 'Iron Fortress', width: 15, height: 10, cellSize: CELL_SIZE,
    grid: parseGrid(FORTRESS.grid), path: FORTRESS.path,
  },
  spiral: {
    id: 'spiral', name: 'Death Spiral', width: 15, height: 10, cellSize: CELL_SIZE,
    grid: parseGrid(SPIRAL.grid), path: SPIRAL.path,
  },
  gauntlet: {
    id: 'gauntlet', name: 'The Gauntlet', width: 15, height: 10, cellSize: CELL_SIZE,
    grid: parseGrid(GAUNTLET.grid), path: GAUNTLET.path,
  },
};

export function getMap(id: MapId): GameMap {
  return MAPS[id];
}

export const MAP_LIST: { id: MapId; name: string; difficulty: string }[] = [
  { id: 'canyon', name: 'Shadow Canyon', difficulty: 'Normal' },
  { id: 'crossroads', name: 'The Crossroads', difficulty: 'Hard' },
  { id: 'fortress', name: 'Iron Fortress', difficulty: 'Expert' },
  { id: 'spiral', name: 'Death Spiral', difficulty: 'Insane' },
  { id: 'gauntlet', name: 'The Gauntlet', difficulty: 'Nightmare' },
];
