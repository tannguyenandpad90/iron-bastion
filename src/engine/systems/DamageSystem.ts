import type { GameSystem, Enemy } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export class DamageSystem implements GameSystem {
  readonly name = 'damageSystem';

  update(dt: number) {
    const store = useGameStore.getState();

    if (store.phase !== 'wave') return;
    if (store.enemies.length === 0) return;

    let changed = false;
    let goldEarned = 0;
    let scoreEarned = 0;

    const updatedEnemies: Enemy[] = [];

    for (const enemy of store.enemies) {
      let hpDelta = 0;
      let effectsChanged = false;

      // Tick status effects
      const updatedEffects = enemy.statusEffects
        .map((effect) => {
          const remaining = effect.remaining - dt * 1000;

          if (effect.type === 'burn' && remaining > 0) {
            hpDelta -= effect.intensity * dt;
          }

          if (remaining !== effect.remaining) effectsChanged = true;
          return { ...effect, remaining };
        })
        .filter((effect) => {
          if (effect.remaining <= 0) {
            effectsChanged = true;
            return false;
          }
          return true;
        });

      // Regen trait
      if (enemy.traits.includes('regen')) {
        hpDelta += enemy.stats.maxHp * 0.02 * dt;
      }

      if (hpDelta !== 0 || effectsChanged) {
        changed = true;
        const newHp = Math.min(enemy.stats.maxHp, Math.max(0, enemy.hp + hpDelta));

        if (newHp <= 0) {
          goldEarned += enemy.stats.reward;
          scoreEarned += enemy.stats.reward * 10;
          continue; // skip — enemy dead
        }

        updatedEnemies.push({
          ...enemy,
          hp: newHp,
          statusEffects: updatedEffects,
        });
      } else {
        updatedEnemies.push(enemy);
      }
    }

    if (changed) {
      store.setEnemies(updatedEnemies);
      if (goldEarned > 0) store.addGold(goldEarned);
      if (scoreEarned > 0) store.addScore(scoreEarned);
    }
  }
}
