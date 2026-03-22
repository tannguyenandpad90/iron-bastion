import { create } from 'zustand';
import type {
  GameState, GamePhase, Tower, Enemy, Projectile, Skill,
  TowerType, SkillType, GameSpeed, MapId,
} from '../types';
import { INITIAL_GAME_STATE } from '../config/game';
import { CAMPAIGN } from '../config/campaign';

interface GameStore extends GameState {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  skills: Skill[];
  activeSkill: SkillType | null;
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;

  // Game State
  setPhase: (phase: GamePhase) => void;
  nextWave: () => void;
  nextStage: () => void;
  advanceToNextMap: () => boolean; // returns false if no more maps (victory)
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  loseLives: (amount: number) => void;
  addScore: (amount: number) => void;
  resetGame: () => void;
  setGameSpeed: (speed: GameSpeed) => void;
  setMapId: (mapId: MapId) => void;

  // Entities
  addTower: (tower: Tower) => void;
  removeTower: (id: string) => void;
  updateTower: (id: string, updates: Partial<Tower>) => void;
  setTowers: (towers: Tower[]) => void;
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  updateEnemy: (id: string, updates: Partial<Enemy>) => void;
  setEnemies: (enemies: Enemy[]) => void;
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (id: string) => void;
  setProjectiles: (projectiles: Projectile[]) => void;
  clearEnemies: () => void;
  clearProjectiles: () => void;

  // UI
  selectTowerType: (type: TowerType | null) => void;
  selectTower: (id: string | null) => void;
  setActiveSkill: (skill: SkillType | null) => void;

  // Energy
  useEnergy: (amount: number) => boolean;
  regenEnergy: (amount: number) => void;
}

const INITIAL_SKILLS: Skill[] = [
  { type: 'emp', cooldown: 15000, currentCooldown: 0, energyCost: 30 },
  { type: 'airstrike', cooldown: 20000, currentCooldown: 0, energyCost: 50 },
  { type: 'freeze', cooldown: 12000, currentCooldown: 0, energyCost: 25 },
];

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_GAME_STATE,
  towers: [],
  enemies: [],
  projectiles: [],
  skills: INITIAL_SKILLS.map((s) => ({ ...s })),
  activeSkill: null,
  selectedTowerType: null,
  selectedTowerId: null,

  setPhase: (phase) => set({ phase }),
  nextWave: () => set((s) => ({ wave: s.wave + 1 })),
  nextStage: () => set((s) => ({ stage: s.stage + 1, wave: s.wave + 1 })),
  advanceToNextMap: () => {
    const { mapIndex } = get();
    const nextIdx = mapIndex + 1;
    if (nextIdx >= CAMPAIGN.length) return false; // victory

    const nextCampaign = CAMPAIGN[nextIdx];
    set({
      mapIndex: nextIdx,
      stage: 0,
      stagesPerMap: nextCampaign.stages,
      mapId: nextCampaign.mapId,
      towers: [],
      projectiles: [],
      enemies: [],
    });
    // Bonus gold for new map
    if (nextCampaign.startGoldBonus > 0) {
      get().addGold(nextCampaign.startGoldBonus);
    }
    return true;
  },
  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
  spendGold: (amount) => {
    const { gold } = get();
    if (gold >= amount) { set({ gold: gold - amount }); return true; }
    return false;
  },
  loseLives: (amount) => {
    const newLives = Math.max(0, get().lives - amount);
    set({ lives: newLives });
    if (newLives <= 0) set({ phase: 'gameover' });
  },
  addScore: (amount) => set((s) => ({ score: s.score + amount })),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  setMapId: (mapId) => set({ mapId }),
  resetGame: () =>
    set({
      ...INITIAL_GAME_STATE,
      towers: [],
      enemies: [],
      projectiles: [],
      skills: INITIAL_SKILLS.map((s) => ({ ...s })),
      activeSkill: null,
      selectedTowerType: null,
      selectedTowerId: null,
    }),

  addTower: (tower) => set((s) => ({ towers: [...s.towers, tower] })),
  removeTower: (id) => set((s) => ({ towers: s.towers.filter((t) => t.id !== id) })),
  updateTower: (id, updates) =>
    set((s) => ({ towers: s.towers.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  setTowers: (towers) => set({ towers }),
  addEnemy: (enemy) => set((s) => ({ enemies: [...s.enemies, enemy] })),
  removeEnemy: (id) => set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) })),
  updateEnemy: (id, updates) =>
    set((s) => ({ enemies: s.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
  setEnemies: (enemies) => set({ enemies }),
  addProjectile: (p) => set((s) => ({ projectiles: [...s.projectiles, p] })),
  removeProjectile: (id) =>
    set((s) => ({ projectiles: s.projectiles.filter((p) => p.id !== id) })),
  setProjectiles: (projectiles) => set({ projectiles }),
  clearEnemies: () => set({ enemies: [] }),
  clearProjectiles: () => set({ projectiles: [] }),

  selectTowerType: (type) =>
    set({ selectedTowerType: type, selectedTowerId: null, activeSkill: null }),
  selectTower: (id) =>
    set({ selectedTowerId: id, selectedTowerType: null, activeSkill: null }),
  setActiveSkill: (skill) =>
    set({ activeSkill: skill, selectedTowerType: null, selectedTowerId: null }),

  useEnergy: (amount) => {
    const { energy } = get();
    if (energy >= amount) { set({ energy: energy - amount }); return true; }
    return false;
  },
  regenEnergy: (amount) =>
    set((s) => ({ energy: Math.min(s.maxEnergy, s.energy + amount) })),
}));
