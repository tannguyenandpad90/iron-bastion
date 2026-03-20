import { create } from 'zustand';
import type { GameState, GamePhase, Tower, Enemy, Projectile, Skill, TowerType } from '../types';
import { INITIAL_GAME_STATE } from '../config/game';

interface GameStore extends GameState {
  // Entities
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];

  // Skills
  skills: Skill[];

  // UI State
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;

  // Actions - Game State
  setPhase: (phase: GamePhase) => void;
  nextWave: () => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  loseLives: (amount: number) => void;
  addScore: (amount: number) => void;
  resetGame: () => void;

  // Actions - Entities
  addTower: (tower: Tower) => void;
  removeTower: (id: string) => void;
  updateTower: (id: string, updates: Partial<Tower>) => void;
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  updateEnemy: (id: string, updates: Partial<Enemy>) => void;
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (id: string) => void;
  clearEnemies: () => void;
  clearProjectiles: () => void;

  // Actions - UI
  selectTowerType: (type: TowerType | null) => void;
  selectTower: (id: string | null) => void;

  // Actions - Energy
  useEnergy: (amount: number) => boolean;
  regenEnergy: (amount: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_GAME_STATE,

  towers: [],
  enemies: [],
  projectiles: [],
  skills: [
    { type: 'emp', cooldown: 15000, currentCooldown: 0, energyCost: 30 },
    { type: 'airstrike', cooldown: 20000, currentCooldown: 0, energyCost: 50 },
    { type: 'freeze', cooldown: 12000, currentCooldown: 0, energyCost: 25 },
  ],

  selectedTowerType: null,
  selectedTowerId: null,

  // Game State
  setPhase: (phase) => set({ phase }),
  nextWave: () => set((s) => ({ wave: s.wave + 1 })),
  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
  spendGold: (amount) => {
    const { gold } = get();
    if (gold >= amount) {
      set({ gold: gold - amount });
      return true;
    }
    return false;
  },
  loseLives: (amount) => {
    const newLives = Math.max(0, get().lives - amount);
    set({ lives: newLives });
    if (newLives <= 0) set({ phase: 'gameover' });
  },
  addScore: (amount) => set((s) => ({ score: s.score + amount })),
  resetGame: () =>
    set({
      ...INITIAL_GAME_STATE,
      towers: [],
      enemies: [],
      projectiles: [],
      selectedTowerType: null,
      selectedTowerId: null,
    }),

  // Entities
  addTower: (tower) => set((s) => ({ towers: [...s.towers, tower] })),
  removeTower: (id) => set((s) => ({ towers: s.towers.filter((t) => t.id !== id) })),
  updateTower: (id, updates) =>
    set((s) => ({
      towers: s.towers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  addEnemy: (enemy) => set((s) => ({ enemies: [...s.enemies, enemy] })),
  removeEnemy: (id) => set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) })),
  updateEnemy: (id, updates) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  addProjectile: (p) => set((s) => ({ projectiles: [...s.projectiles, p] })),
  removeProjectile: (id) =>
    set((s) => ({ projectiles: s.projectiles.filter((p) => p.id !== id) })),
  clearEnemies: () => set({ enemies: [] }),
  clearProjectiles: () => set({ projectiles: [] }),

  // UI
  selectTowerType: (type) => set({ selectedTowerType: type, selectedTowerId: null }),
  selectTower: (id) => set({ selectedTowerId: id, selectedTowerType: null }),

  // Energy
  useEnergy: (amount) => {
    const { energy } = get();
    if (energy >= amount) {
      set({ energy: energy - amount });
      return true;
    }
    return false;
  },
  regenEnergy: (amount) =>
    set((s) => ({ energy: Math.min(s.maxEnergy, s.energy + amount) })),
}));
