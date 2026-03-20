import type { GameSystem, Projectile, Tower, Enemy } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { createProjectile } from '../../game/towers/factory';
import { calcDamage } from '../../game/damage/calculator';

const HIT_DISTANCE = 10;
const HIT_DISTANCE_SQ = HIT_DISTANCE * HIT_DISTANCE;

export class CombatSystem implements GameSystem {
  readonly name = 'combatSystem';

  update(dt: number) {
    const store = useGameStore.getState();

    if (store.phase !== 'wave') return;

    // --- Tower firing ---
    this.processTowerFiring(store.towers, store.enemies, dt);

    // --- Projectile movement + collision ---
    this.processProjectiles(dt);
  }

  private processTowerFiring(towers: Tower[], enemies: Enemy[], dt: number) {
    let towersChanged = false;

    const updatedTowers = towers.map((tower) => {
      // Reduce cooldown
      if (tower.cooldown > 0) {
        towersChanged = true;
        const newCooldown = Math.max(0, tower.cooldown - dt);
        if (newCooldown > 0) {
          return { ...tower, cooldown: newCooldown };
        }
        tower = { ...tower, cooldown: 0 };
      }

      if (!tower.target || tower.cooldown > 0) return tower;

      // Find target
      const target = enemies.find((e) => e.id === tower.target);
      if (!target) return tower;

      // Fire!
      towersChanged = true;
      const cooldownTime = 1 / tower.stats.fireRate;
      const proj = createProjectile(tower, target);
      useGameStore.getState().addProjectile(proj);

      return { ...tower, cooldown: cooldownTime };
    });

    if (towersChanged) {
      useGameStore.setState({ towers: updatedTowers });
    }
  }

  private processProjectiles(dt: number) {
    const store = useGameStore.getState();
    if (store.projectiles.length === 0) return;

    const survivingProjectiles: Projectile[] = [];
    const enemyDamageMap = new Map<string, number>();
    const killedEnemyIds = new Set<string>();

    for (const proj of store.projectiles) {
      const target = store.enemies.find((e) => e.id === proj.targetId);

      if (!target || killedEnemyIds.has(target.id)) {
        // Target gone, remove projectile
        continue;
      }

      // Move toward target
      const dx = target.position.x - proj.position.x;
      const dy = target.position.y - proj.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < HIT_DISTANCE_SQ) {
        // Hit!
        const damage = calcDamage(proj.damage, target);
        const currentDamage = enemyDamageMap.get(target.id) ?? 0;
        enemyDamageMap.set(target.id, currentDamage + damage);

        // Check if this kills the enemy
        const totalDamage = currentDamage + damage;
        if (target.hp - totalDamage <= 0) {
          killedEnemyIds.add(target.id);
        }

        // AoE splash
        if (proj.aoeRadius && proj.aoeRadius > 0) {
          const aoeRadiusSq = proj.aoeRadius * proj.aoeRadius;
          for (const other of store.enemies) {
            if (other.id === target.id || killedEnemyIds.has(other.id)) continue;
            const adx = other.position.x - target.position.x;
            const ady = other.position.y - target.position.y;
            if (adx * adx + ady * ady <= aoeRadiusSq) {
              const aoeDmg = calcDamage(Math.floor(proj.damage * 0.5), other);
              const prev = enemyDamageMap.get(other.id) ?? 0;
              enemyDamageMap.set(other.id, prev + aoeDmg);
              if (other.hp - (prev + aoeDmg) <= 0) {
                killedEnemyIds.add(other.id);
              }
            }
          }
        }
      } else {
        // Move projectile
        const dist = Math.sqrt(distSq);
        const speed = proj.speed * dt;
        const nx = dx / dist;
        const ny = dy / dist;

        survivingProjectiles.push({
          ...proj,
          position: {
            x: proj.position.x + nx * speed,
            y: proj.position.y + ny * speed,
          },
        });
      }
    }

    // Apply damage + remove killed enemies
    let goldEarned = 0;
    let scoreEarned = 0;

    const updatedEnemies = store.enemies
      .map((enemy) => {
        const damage = enemyDamageMap.get(enemy.id);
        if (damage) {
          const newHp = enemy.hp - damage;
          if (newHp <= 0) {
            goldEarned += enemy.stats.reward;
            scoreEarned += enemy.stats.reward * 10;
            return null; // dead
          }
          return { ...enemy, hp: newHp };
        }
        return enemy;
      })
      .filter((e): e is Enemy => e !== null);

    // Batch state update
    store.setProjectiles(survivingProjectiles);
    store.setEnemies(updatedEnemies);
    if (goldEarned > 0) store.addGold(goldEarned);
    if (scoreEarned > 0) store.addScore(scoreEarned);
  }
}
