import { useGameStore } from '../../stores/gameStore';
import { upgradeTower, getUpgradeCost, canUpgrade } from '../towers/factory';

export function tryUpgradeTower(towerId: string): boolean {
  const store = useGameStore.getState();
  const tower = store.towers.find((t) => t.id === towerId);
  if (!tower) return false;

  if (!canUpgrade(tower)) return false;

  const cost = getUpgradeCost(tower);
  if (!store.spendGold(cost)) return false;

  const upgraded = upgradeTower(tower);
  store.updateTower(towerId, {
    level: upgraded.level,
    stats: upgraded.stats,
  });

  return true;
}
