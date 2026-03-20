import { useGameStore } from '../../stores/gameStore';
import { getSellValue } from '../towers/factory';

export function canAfford(cost: number): boolean {
  return useGameStore.getState().gold >= cost;
}

export function sellTower(towerId: string): boolean {
  const store = useGameStore.getState();
  const tower = store.towers.find((t) => t.id === towerId);
  if (!tower) return false;

  const value = getSellValue(tower);
  store.addGold(value);
  store.removeTower(towerId);
  store.selectTower(null);
  return true;
}
