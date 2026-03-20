import type { GameSystem, Enemy, BossPhase } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { createEnemy } from '../../game/enemies/factory';
import { GAME_MAP } from '../../config/game';

export class DamageSystem implements GameSystem {
  readonly name = 'damageSystem';

  update(dt: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'wave' || store.enemies.length === 0) return;

    let changed = false;
    let goldEarned = 0;
    let scoreEarned = 0;
    const spawnedMinions: Enemy[] = [];

    const updatedEnemies: Enemy[] = [];

    for (const enemy of store.enemies) {
      let hpDelta = 0;
      let effectsChanged = false;
      let phasesChanged = false;

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

      // Regen trait: 2% HP/sec
      if (enemy.traits.includes('regen')) {
        hpDelta += enemy.stats.maxHp * 0.02 * dt;
      }

      // Boss phase management
      let updatedPhases: BossPhase[] | undefined;
      if (enemy.isBoss && enemy.bossPhases) {
        const hpPercent = enemy.hp / enemy.stats.maxHp;
        updatedPhases = enemy.bossPhases.map((phase) => {
          // Activate phase when HP drops below threshold
          if (!phase.active && hpPercent <= phase.hpThreshold) {
            phasesChanged = true;

            if (phase.type === 'spawn') {
              // Spawn 3 fast minions at boss position
              for (let i = 0; i < 3; i++) {
                const minion = createEnemy(
                  'fast',
                  GAME_MAP.path[Math.min(enemy.pathIndex, GAME_MAP.path.length - 1)],
                  GAME_MAP.cellSize,
                  store.wave,
                  [],
                );
                // Start minion at boss's path position
                minion.pathIndex = enemy.pathIndex;
                minion.pathProgress = enemy.pathProgress;
                minion.position = { ...enemy.position };
                spawnedMinions.push(minion);
              }
            }

            return { ...phase, active: true, remaining: phase.duration };
          }

          // Tick active timed phases
          if (phase.active && phase.duration > 0 && phase.remaining > 0) {
            const newRemaining = phase.remaining - dt * 1000;
            if (newRemaining !== phase.remaining) phasesChanged = true;
            if (newRemaining <= 0) {
              return { ...phase, active: false, remaining: 0 };
            }
            return { ...phase, remaining: newRemaining };
          }

          return phase;
        });
      }

      if (hpDelta !== 0 || effectsChanged || phasesChanged) {
        changed = true;
        const newHp = Math.min(enemy.stats.maxHp, Math.max(0, enemy.hp + hpDelta));

        if (newHp <= 0) {
          goldEarned += enemy.stats.reward;
          scoreEarned += enemy.stats.reward * (enemy.isBoss ? 50 : 10);
          continue;
        }

        updatedEnemies.push({
          ...enemy,
          hp: newHp,
          statusEffects: updatedEffects,
          bossPhases: updatedPhases ?? enemy.bossPhases,
        });
      } else {
        updatedEnemies.push(enemy);
      }
    }

    if (changed || spawnedMinions.length > 0) {
      const allEnemies = [...updatedEnemies, ...spawnedMinions];
      store.setEnemies(allEnemies);
      if (goldEarned > 0) store.addGold(goldEarned);
      if (scoreEarned > 0) store.addScore(scoreEarned);
    }
  }
}
