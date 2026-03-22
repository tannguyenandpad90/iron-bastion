import type { GameState, MapId } from '../types';
import { getMap } from './maps';
import { CAMPAIGN } from './campaign';

export const INITIAL_GAME_STATE: GameState = {
  phase: 'prep',
  level: 1,
  wave: 0,
  mapIndex: 0,
  stage: 0,
  stagesPerMap: CAMPAIGN[0].stages,
  gold: 200,
  lives: 20,
  energy: 100,
  maxEnergy: 100,
  score: 0,
  gameSpeed: 1,
  mapId: CAMPAIGN[0].mapId,
};

export const CELL_SIZE = 64;
export const MAP_COLS = 15;
export const MAP_ROWS = 10;

export function getActiveMap(mapId: MapId = 'canyon') {
  return getMap(mapId);
}

export const GAME_MAP = getMap('canyon');
