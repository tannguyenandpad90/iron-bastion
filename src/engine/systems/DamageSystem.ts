import type { GameSystem } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export class DamageSystem implements GameSystem {
  readonly name = 'damageSystem';

  update(dt: number) {
    const store = useGameStore.getState();

    if (store.phase !== 'wave') return;

    // Process status effects (burn, slow, stun)
    for (const enemy of store.enemies) {
      let hpDelta = 0;
      const updatedEffects = enemy.statusEffects
        .map((effect) => {
          const remaining = effect.remaining - dt * 1000;

          // Burn does damage over time
          if (effect.type === 'burn' && remaining > 0) {
            hpDelta -= effect.intensity * dt;
          }

          return { ...effect, remaining };
        })
        .filter((effect) => effect.remaining > 0);

      // Regen trait
      if (enemy.traits.includes('regen')) {
        hpDelta += enemy.stats.maxHp * 0.02 * dt; // 2% HP/sec
      }

      if (hpDelta !== 0 || updatedEffects.length !== enemy.statusEffects.length) {
        const newHp = Math.min(enemy.stats.maxHp, Math.max(0, enemy.hp + hpDelta));

        if (newHp <= 0) {
          store.removeEnemy(enemy.id);
          store.addGold(enemy.stats.reward);
          store.addScore(enemy.stats.reward * 10);
        } else {
          store.updateEnemy(enemy.id, {
            hp: newHp,
            statusEffects: updatedEffects,
          });
        }
      }
    }
  }
}
