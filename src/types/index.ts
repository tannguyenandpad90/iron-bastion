// ============================================
// Iron Bastion: Last Protocol - Core Types
// ============================================

// --- Grid & Position ---
export interface GridPosition {
  col: number;
  row: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

// --- Entity ---
export interface Entity {
  id: string;
  type: EntityType;
  position: WorldPosition;
  active: boolean;
}

export type EntityType = 'tower' | 'enemy' | 'projectile' | 'effect';

// --- Tower ---
export type TowerType = 'cannon' | 'laser' | 'aoe';

export interface TowerStats {
  damage: number;
  range: number;
  fireRate: number; // shots per second
  cost: number;
  upgradeCost: number;
}

export interface Tower extends Entity {
  type: 'tower';
  towerType: TowerType;
  level: number;
  stats: TowerStats;
  target: string | null; // enemy id
  cooldown: number;
  gridPos: GridPosition;
}

// --- Enemy ---
export type EnemyType = 'fast' | 'tank' | 'swarm';
export type EnemyTrait = 'shield' | 'stealth' | 'regen';
export type StatusEffect = 'slow' | 'burn' | 'stun';

export interface EnemyStats {
  maxHp: number;
  speed: number;
  armor: number;
  reward: number;
}

export interface ActiveStatusEffect {
  type: StatusEffect;
  duration: number;
  remaining: number;
  intensity: number;
}

export interface Enemy extends Entity {
  type: 'enemy';
  enemyType: EnemyType;
  stats: EnemyStats;
  hp: number;
  pathIndex: number;
  pathProgress: number; // 0-1 interpolation between current and next waypoint
  traits: EnemyTrait[];
  statusEffects: ActiveStatusEffect[];
}

// --- Projectile ---
export interface Projectile extends Entity {
  type: 'projectile';
  damage: number;
  speed: number;
  targetId: string;
  sourceId: string;
  aoeRadius?: number;
}

// --- Wave ---
export interface WaveSegment {
  enemyType: EnemyType;
  count: number;
  interval: number; // ms between spawns
  traits?: EnemyTrait[];
}

export interface Wave {
  segments: WaveSegment[];
  reward: number;
}

// --- Skill ---
export type SkillType = 'emp' | 'airstrike' | 'freeze';

export interface Skill {
  type: SkillType;
  cooldown: number;
  currentCooldown: number;
  energyCost: number;
}

// --- Game State ---
export type GamePhase = 'prep' | 'wave' | 'paused' | 'gameover' | 'victory';

export interface GameState {
  phase: GamePhase;
  level: number;
  wave: number;
  gold: number;
  lives: number;
  energy: number;
  maxEnergy: number;
  score: number;
}

// --- Map ---
export type CellType = 'path' | 'buildable' | 'blocked' | 'spawn' | 'base';

export interface GameMap {
  width: number;
  height: number;
  cellSize: number;
  grid: CellType[][];
  path: GridPosition[];
}

// --- Scene System ---
export interface Scene {
  name: string;
  init(): void;
  update(dt: number): void;
  destroy(): void;
}

// --- Game System (ECS-lite) ---
export interface GameSystem {
  name: string;
  init?(): void;
  update(dt: number): void;
  destroy?(): void;
}

// --- Input ---
export interface GridClickEvent {
  gridPos: GridPosition;
  worldPos: WorldPosition;
  cellType: CellType;
  button: 'left' | 'right';
}

export interface HoverEvent {
  gridPos: GridPosition | null;
  worldPos: WorldPosition;
}
