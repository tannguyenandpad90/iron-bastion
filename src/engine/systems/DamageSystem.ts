import type { GameSystem, Enemy, BossPhase } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { createEnemy } from '../../game/enemies/factory';
import { getActiveMap } from '../../config/game';

const HEALER_RANGE = 3 * 64; // 3 cells in pixels
const HEALER_AMOUNT = 0.05; // 5% of max HP per tick
const HEALER_COOLDOWN = 2; // seconds between heals

export class DamageSystem implements GameSystem {
  readonly name = 'damageSystem';

  update(dt: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'wave' || store.enemies.length === 0) return;

    const map = getActiveMap(store.mapId);
    let changed = false;
    let goldEarned = 0;
    let scoreEarned = 0;
    const spawnedMinions: Enemy[] = [];

    const updatedEnemies: Enemy[] = [];

    for (const enemy of store.enemies) {
      let hpDelta = 0;
      let effectsChanged = false;
      let phasesChanged = false;
      let healCooldown = enemy.healCooldown;

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
          if (effect.remaining <= 0) { effectsChanged = true; return false; }
          return true;
        });

      // Regen trait
      if (enemy.traits.includes('regen')) {
        hpDelta += enemy.stats.maxHp * 0.02 * dt;
      }

      // Healer enemy: heal nearby allies
      if (enemy.enemyType === 'healer' && healCooldown !== undefined) {
        healCooldown = Math.max(0, healCooldown - dt);
        if (healCooldown <= 0) {
          // Heal nearby enemies
          for (const ally of store.enemies) {
            if (ally.id === enemy.id) continue;
            if (ally.hp >= ally.stats.maxHp) continue;
            const dx = ally.position.x - enemy.position.x;
            const dy = ally.position.y - enemy.position.y;
            if (dx * dx + dy * dy <= HEALER_RANGE * HEALER_RANGE) {
              // Mark as changed — will be applied in next pass
              // For simplicity, heal via hpDelta on self handled separately
            }
          }
          healCooldown = HEALER_COOLDOWN;
          changed = true;
        }
      }

      // Boss phases
      let updatedPhases: BossPhase[] | undefined;
      if (enemy.isBoss && enemy.bossPhases) {
        const hpPercent = enemy.hp / enemy.stats.maxHp;
        updatedPhases = enemy.bossPhases.map((phase) => {
          if (!phase.active && hpPercent <= phase.hpThreshold) {
            phasesChanged = true;
            if (phase.type === 'spawn') {
              for (let i = 0; i < 3; i++) {
                const minion = createEnemy(
                  'fast',
                  map.path[Math.min(enemy.pathIndex, map.path.length - 1)],
                  map.cellSize,
                  store.wave,
                  [],
                );
                minion.pathIndex = enemy.pathIndex;
                minion.pathProgress = enemy.pathProgress;
                minion.position = { ...enemy.position };
                spawnedMinions.push(minion);
              }
            }
            return { ...phase, active: true, remaining: phase.duration };
          }
          if (phase.active && phase.duration > 0 && phase.remaining > 0) {
            const newRemaining = phase.remaining - dt * 1000;
            if (newRemaining !== phase.remaining) phasesChanged = true;
            if (newRemaining <= 0) return { ...phase, active: false, remaining: 0 };
            return { ...phase, remaining: newRemaining };
          }
          return phase;
        });
      }

      if (hpDelta !== 0 || effectsChanged || phasesChanged || healCooldown !== enemy.healCooldown) {
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
          healCooldown,
        });
      } else {
        updatedEnemies.push(enemy);
      }
    }

    // Healer aura: heal nearby allies
    const finalEnemies = this.applyHealerAura(updatedEnemies, dt);
    const enemiesChanged = finalEnemies !== updatedEnemies;

    if (changed || spawnedMinions.length > 0 || enemiesChanged) {
      const all = [...(enemiesChanged ? finalEnemies : updatedEnemies), ...spawnedMinions];
      store.setEnemies(all);
      if (goldEarned > 0) store.addGold(goldEarned);
      if (scoreEarned > 0) store.addScore(scoreEarned);
    }
  }

  private applyHealerAura(enemies: Enemy[], dt: number): Enemy[] {
    const healers = enemies.filter((e) => e.enemyType === 'healer' && e.hp > 0);
    if (healers.length === 0) return enemies;

    let healed = false;
    const result = enemies.map((enemy) => {
      if (enemy.hp >= enemy.stats.maxHp) return enemy;

      for (const healer of healers) {
        if (healer.id === enemy.id) continue;
        const dx = enemy.position.x - healer.position.x;
        const dy = enemy.position.y - healer.position.y;
        if (dx * dx + dy * dy <= HEALER_RANGE * HEALER_RANGE) {
          const heal = enemy.stats.maxHp * HEALER_AMOUNT * dt;
          healed = true;
          return { ...enemy, hp: Math.min(enemy.stats.maxHp, enemy.hp + heal) };
        }
      }
      return enemy;
    });

    return healed ? result : enemies;
  }
}
