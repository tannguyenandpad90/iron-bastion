import type { GameMap, CellType, MapId } from '../types';

const CELL_SIZE = 64;

// Legend: 0=buildable, 1=path, 2=blocked, 3=spawn, 4=base
const C: Record<number, CellType> = {
  0: 'buildable', 1: 'path', 2: 'blocked', 3: 'spawn', 4: 'base',
};

function parseGrid(layout: number[][]): CellType[][] {
  return layout.map((row) => row.map((cell) => C[cell]));
}

// ==========================================
// MAP 1: CANYON (original map — winding S-path)
// ==========================================
const CANYON_LAYOUT = [
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
];

const CANYON_PATH = [
  { col: 2, row: 0 }, { col: 2, row: 1 }, { col: 2, row: 2 }, { col: 2, row: 3 },
  { col: 3, row: 3 }, { col: 4, row: 3 }, { col: 5, row: 3 }, { col: 6, row: 3 },
  { col: 7, row: 3 }, { col: 7, row: 4 }, { col: 7, row: 5 }, { col: 7, row: 6 },
  { col: 6, row: 6 }, { col: 5, row: 6 }, { col: 4, row: 6 }, { col: 4, row: 7 },
  { col: 4, row: 8 }, { col: 5, row: 8 }, { col: 6, row: 8 }, { col: 7, row: 8 },
  { col: 8, row: 8 }, { col: 9, row: 8 }, { col: 10, row: 8 }, { col: 11, row: 8 },
  { col: 12, row: 8 }, { col: 12, row: 9 },
];

// ==========================================
// MAP 2: CROSSROADS (central crossroads, longer path)
// ==========================================
const CROSSROADS_LAYOUT = [
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
];

const CROSSROADS_PATH = [
  { col: 7, row: 0 }, { col: 7, row: 1 }, { col: 7, row: 2 }, { col: 7, row: 3 },
  { col: 6, row: 3 }, { col: 5, row: 3 }, { col: 4, row: 3 }, { col: 3, row: 3 },
  { col: 2, row: 3 }, { col: 2, row: 4 }, { col: 2, row: 5 }, { col: 2, row: 6 },
  { col: 2, row: 7 }, { col: 3, row: 7 }, { col: 4, row: 7 }, { col: 5, row: 7 },
  { col: 6, row: 7 }, { col: 7, row: 7 }, { col: 8, row: 7 }, { col: 9, row: 7 },
  { col: 10, row: 7 }, { col: 11, row: 7 }, { col: 12, row: 7 }, { col: 12, row: 6 },
  { col: 12, row: 5 }, { col: 12, row: 4 }, { col: 12, row: 3 }, { col: 11, row: 3 },
  { col: 10, row: 3 }, { col: 9, row: 3 }, { col: 8, row: 3 }, { col: 7, row: 3 },
  { col: 7, row: 4 }, { col: 7, row: 5 }, { col: 7, row: 6 }, { col: 7, row: 7 },
  { col: 7, row: 8 }, { col: 7, row: 9 },
];

// ==========================================
// MAP 3: FORTRESS (maze-like, many build spots)
// ==========================================
const FORTRESS_LAYOUT = [
  [3, 1, 1, 1, 1, 2, 0, 0, 0, 2, 1, 1, 1, 1, 2],
  [2, 0, 0, 0, 1, 2, 0, 0, 0, 2, 1, 0, 0, 0, 2],
  [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2],
  [2, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 2],
  [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2],
];

const FORTRESS_PATH = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },
  { col: 4, row: 0 }, { col: 4, row: 1 }, { col: 4, row: 2 }, { col: 4, row: 3 },
  { col: 4, row: 4 }, { col: 5, row: 4 }, { col: 6, row: 4 }, { col: 7, row: 4 },
  { col: 8, row: 4 }, { col: 9, row: 4 }, { col: 10, row: 4 }, { col: 10, row: 3 },
  { col: 10, row: 2 }, { col: 10, row: 1 }, { col: 10, row: 0 }, { col: 11, row: 0 },
  { col: 12, row: 0 }, { col: 13, row: 0 },
  // loops back down
  // simplified: goes through center
  { col: 7, row: 4 }, { col: 7, row: 5 }, { col: 7, row: 6 },
  { col: 7, row: 7 }, { col: 7, row: 8 }, { col: 7, row: 9 },
];

// Actually let me fix fortress path to be a clean one
const FORTRESS_PATH_FIXED = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },
  { col: 4, row: 0 }, { col: 4, row: 1 }, { col: 4, row: 2 }, { col: 4, row: 3 },
  { col: 4, row: 4 }, { col: 5, row: 4 }, { col: 6, row: 4 }, { col: 7, row: 4 },
  { col: 8, row: 4 }, { col: 9, row: 4 }, { col: 10, row: 4 }, { col: 10, row: 3 },
  { col: 10, row: 2 }, { col: 10, row: 1 }, { col: 10, row: 0 }, { col: 11, row: 0 },
  { col: 12, row: 0 }, { col: 13, row: 0 },
  // Can't go further right — needs reroute. Let's use the center column
  // Rethink: just go 10,0 → down to 10,4 already done. Let's use mid path
];

// Better fortress: simple U shape with center descent
const FORTRESS_PATH_V2 = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },
  { col: 4, row: 0 }, { col: 4, row: 1 }, { col: 4, row: 2 }, { col: 4, row: 3 },
  { col: 4, row: 4 }, { col: 5, row: 4 }, { col: 6, row: 4 }, { col: 7, row: 4 },
  { col: 7, row: 5 }, { col: 7, row: 6 }, { col: 7, row: 7 }, { col: 7, row: 8 },
  { col: 7, row: 9 },
];

// ==========================================
// EXPORTS
// ==========================================
export const MAPS: Record<MapId, GameMap> = {
  canyon: {
    id: 'canyon',
    name: 'Shadow Canyon',
    width: 15,
    height: 10,
    cellSize: CELL_SIZE,
    grid: parseGrid(CANYON_LAYOUT),
    path: CANYON_PATH,
  },
  crossroads: {
    id: 'crossroads',
    name: 'The Crossroads',
    width: 15,
    height: 10,
    cellSize: CELL_SIZE,
    grid: parseGrid(CROSSROADS_LAYOUT),
    path: CROSSROADS_PATH,
  },
  fortress: {
    id: 'fortress',
    name: 'Iron Fortress',
    width: 15,
    height: 10,
    cellSize: CELL_SIZE,
    grid: parseGrid(FORTRESS_LAYOUT),
    path: FORTRESS_PATH_V2,
  },
};

export function getMap(id: MapId): GameMap {
  return MAPS[id];
}

export const MAP_LIST: { id: MapId; name: string; difficulty: string }[] = [
  { id: 'canyon', name: 'Shadow Canyon', difficulty: 'Normal' },
  { id: 'crossroads', name: 'The Crossroads', difficulty: 'Hard' },
  { id: 'fortress', name: 'Iron Fortress', difficulty: 'Expert' },
];
