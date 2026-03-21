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
export type TowerType = 'cannon' | 'laser' | 'aoe' | 'sniper' | 'tesla';
export type TargetingMode = 'first' | 'strongest' | 'closest';

export interface TowerStats {
  damage: number;
  range: number;
  fireRate: number;
  cost: number;
  upgradeCost: number;
  projectileSpeed: number;
  statusOnHit?: { type: StatusEffect; duration: number; intensity: number };
}

export interface SynergyBuff {
  bonusType: string;
  value: number;
  pairedWith: string;
}

export interface Tower extends Entity {
  type: 'tower';
  towerType: TowerType;
  level: number;
  stats: TowerStats;
  target: string | null;
  cooldown: number;
  gridPos: GridPosition;
  targetingMode: TargetingMode;
  synergyBuffs: SynergyBuff[];
}

// --- Enemy ---
export type EnemyType = 'fast' | 'tank' | 'swarm' | 'boss' | 'healer' | 'flyer';
export type EnemyTrait = 'shield' | 'stealth' | 'regen' | 'flying';
export type StatusEffect = 'slow' | 'burn' | 'stun' | 'chain';

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

export interface BossPhase {
  hpThreshold: number;
  type: 'shield' | 'enrage' | 'spawn';
  active: boolean;
  duration: number;
  remaining: number;
}

export interface Enemy extends Entity {
  type: 'enemy';
  enemyType: EnemyType;
  stats: EnemyStats;
  hp: number;
  pathIndex: number;
  pathProgress: number;
  traits: EnemyTrait[];
  statusEffects: ActiveStatusEffect[];
  isBoss: boolean;
  bossPhases?: BossPhase[];
  healCooldown?: number;
}

// --- Projectile ---
export interface Projectile extends Entity {
  type: 'projectile';
  damage: number;
  speed: number;
  targetId: string;
  sourceId: string;
  aoeRadius?: number;
  statusOnHit?: { type: StatusEffect; duration: number; intensity: number };
  critApplied?: boolean;
  chainCount?: number;
}

// --- Wave ---
export interface WaveSegment {
  enemyType: EnemyType;
  count: number;
  interval: number;
  traits?: EnemyTrait[];
}

export interface Wave {
  segments: WaveSegment[];
  reward: number;
  isBoss?: boolean;
  mapId?: MapId;
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
export type GameSpeed = 1 | 1.5 | 2 | 3;
export type MapId = 'canyon' | 'crossroads' | 'fortress';

export interface GameState {
  phase: GamePhase;
  level: number;
  wave: number;
  gold: number;
  lives: number;
  energy: number;
  maxEnergy: number;
  score: number;
  gameSpeed: GameSpeed;
  mapId: MapId;
}

// --- Map ---
export type CellType = 'path' | 'buildable' | 'blocked' | 'spawn' | 'base';

export interface GameMap {
  id: MapId;
  name: string;
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
