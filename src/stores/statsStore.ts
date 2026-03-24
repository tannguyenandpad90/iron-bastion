import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StatsStore {
  bestScore: number;
  bestWave: number;
  bestMap: number;
  totalKills: number;
  totalGoldEarned: number;
  totalTowersBuilt: number;
  gamesPlayed: number;

  recordScore: (score: number) => void;
  recordWave: (wave: number) => void;
  recordMap: (mapIndex: number) => void;
  addKills: (count: number) => void;
  addGold: (amount: number) => void;
  addTowerBuilt: () => void;
  addGamePlayed: () => void;
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      bestScore: 0,
      bestWave: 0,
      bestMap: 0,
      totalKills: 0,
      totalGoldEarned: 0,
      totalTowersBuilt: 0,
      gamesPlayed: 0,

      recordScore: (score) => set({ bestScore: Math.max(get().bestScore, score) }),
      recordWave: (wave) => set({ bestWave: Math.max(get().bestWave, wave) }),
      recordMap: (mapIndex) => set({ bestMap: Math.max(get().bestMap, mapIndex) }),
      addKills: (count) => set((s) => ({ totalKills: s.totalKills + count })),
      addGold: (amount) => set((s) => ({ totalGoldEarned: s.totalGoldEarned + amount })),
      addTowerBuilt: () => set((s) => ({ totalTowersBuilt: s.totalTowersBuilt + 1 })),
      addGamePlayed: () => set((s) => ({ gamesPlayed: s.gamesPlayed + 1 })),
    }),
    { name: 'iron-bastion-stats' },
  ),
);
