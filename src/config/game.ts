import type { GameState, MapId } from '../types';
import { getMap } from './maps';

export const INITIAL_GAME_STATE: GameState = {
  phase: 'prep',
  level: 1,
  wave: 0,
  gold: 200,
  lives: 20,
  energy: 100,
  maxEnergy: 100,
  score: 0,
  gameSpeed: 1,
  mapId: 'canyon',
};

export const CELL_SIZE = 64;
export const MAP_COLS = 15;
export const MAP_ROWS = 10;

// Current active map — re-exported for backward compat
export function getActiveMap(mapId: MapId = 'canyon') {
  return getMap(mapId);
}

// Default map export for systems that import GAME_MAP
export const GAME_MAP = getMap('canyon');
