import type { GameState, GameMap, CellType } from '../types';

export const INITIAL_GAME_STATE: GameState = {
  phase: 'prep',
  level: 1,
  wave: 0,
  gold: 200,
  lives: 20,
  energy: 100,
  maxEnergy: 100,
  score: 0,
};

export const CELL_SIZE = 64;
export const MAP_COLS = 15;
export const MAP_ROWS = 10;

// Legend: 0=buildable, 1=path, 2=blocked, 3=spawn, 4=base
const MAP_LAYOUT: number[][] = [
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

const CELL_MAP: Record<number, CellType> = {
  0: 'buildable',
  1: 'path',
  2: 'blocked',
  3: 'spawn',
  4: 'base',
};

export const GAME_MAP: GameMap = {
  width: MAP_COLS,
  height: MAP_ROWS,
  cellSize: CELL_SIZE,
  grid: MAP_LAYOUT.map((row) => row.map((cell) => CELL_MAP[cell])),
  // Pre-defined path from spawn to base
  path: [
    { col: 2, row: 0 },
    { col: 2, row: 1 },
    { col: 2, row: 2 },
    { col: 2, row: 3 },
    { col: 3, row: 3 },
    { col: 4, row: 3 },
    { col: 5, row: 3 },
    { col: 6, row: 3 },
    { col: 7, row: 3 },
    { col: 7, row: 4 },
    { col: 7, row: 5 },
    { col: 7, row: 6 },
    { col: 6, row: 6 },
    { col: 5, row: 6 },
    { col: 4, row: 6 },
    { col: 4, row: 7 },
    { col: 4, row: 8 },
    { col: 5, row: 8 },
    { col: 6, row: 8 },
    { col: 7, row: 8 },
    { col: 8, row: 8 },
    { col: 9, row: 8 },
    { col: 10, row: 8 },
    { col: 11, row: 8 },
    { col: 12, row: 8 },
    { col: 12, row: 9 },
  ],
};
