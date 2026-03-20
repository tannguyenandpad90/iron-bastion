import type { GameSystem, Projectile, Tower, Enemy, ActiveStatusEffect } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { createProjectile } from '../../game/towers/factory';
import { calcDamage } from '../../game/damage/calculator';
import { evaluateSynergies } from '../../game/synergy/evaluate';

const HIT_DISTANCE_SQ = 100; // 10px

export class CombatSystem implements GameSystem {
  readonly name = 'combatSystem';

  private synergyTimer = 0;
  private readonly SYNERGY_INTERVAL = 0.5; // recalc every 0.5s

  update(dt: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'wave') return;

    // Periodically recalculate synergies
    this.synergyTimer += dt;
    if (this.synergyTimer >= this.SYNERGY_INTERVAL) {
      this.synergyTimer = 0;
      this.updateSynergies(store.towers);
    }

    this.processTowerFiring(store.towers, store.enemies, dt);
    this.processProjectiles(dt);
  }

  private updateSynergies(towers: Tower[]) {
    const bonuses = evaluateSynergies(towers);
    let changed = false;

    const updatedTowers = towers.map((tower) => {
      const towerBonuses = bonuses
        .filter((b) => b.towerId === tower.id)
        .map((b) => ({ bonusType: b.bonusType, value: b.value, pairedWith: b.pairedWith }));

      // Only update if bonuses changed
      const oldStr = JSON.stringify(tower.synergyBuffs);
      const newStr = JSON.stringify(towerBonuses);
      if (oldStr !== newStr) {
        changed = true;
        return { ...tower, synergyBuffs: towerBonuses };
      }
      return tower;
    });

    if (changed) {
      useGameStore.setState({ towers: updatedTowers });
    }
  }

  private processTowerFiring(towers: Tower[], enemies: Enemy[], dt: number) {
    if (towers.length === 0 || enemies.length === 0) return;

    let towersChanged = false;
    const newProjectiles: Projectile[] = [];

    // For laser beam: accumulate direct damage to enemies
    const laserDamageMap = new Map<string, { damage: number; statusEffects: ActiveStatusEffect[] }>();

    const updatedTowers = towers.map((tower) => {
      // Tick cooldown
      if (tower.cooldown > 0) {
        towersChanged = true;
        const newCooldown = Math.max(0, tower.cooldown - dt);
        if (newCooldown > 0) {
          return { ...tower, cooldown: newCooldown };
        }
        tower = { ...tower, cooldown: 0 };
      }

      if (!tower.target || tower.cooldown > 0) return tower;

      const target = enemies.find((e) => e.id === tower.target);
      if (!target) return tower;

      towersChanged = true;
      const cooldownTime = 1 / tower.stats.fireRate;

      if (tower.towerType === 'laser') {
        // Laser: instant beam damage, no projectile
        const proj = createProjectile(tower, target);
        const damage = calcDamage(proj.damage, target);

        const existing = laserDamageMap.get(target.id) ?? { damage: 0, statusEffects: [] };
        existing.damage += damage;

        // Apply status effect
        if (proj.statusOnHit) {
          existing.statusEffects.push({
            type: proj.statusOnHit.type,
            duration: proj.statusOnHit.duration,
            remaining: proj.statusOnHit.duration,
            intensity: proj.statusOnHit.intensity,
          });
        }

        laserDamageMap.set(target.id, existing);
      } else {
        // Cannon/AoE: spawn projectile
        const proj = createProjectile(tower, target);
        newProjectiles.push(proj);
      }

      return { ...tower, cooldown: cooldownTime };
    });

    if (towersChanged) {
      useGameStore.setState({ towers: updatedTowers });
    }

    // Add new projectiles
    if (newProjectiles.length > 0) {
      const store = useGameStore.getState();
      store.setProjectiles([...store.projectiles, ...newProjectiles]);
    }

    // Apply laser damage
    if (laserDamageMap.size > 0) {
      this.applyLaserDamage(laserDamageMap);
    }
  }

  private applyLaserDamage(
    damageMap: Map<string, { damage: number; statusEffects: ActiveStatusEffect[] }>,
  ) {
    const store = useGameStore.getState();
    let goldEarned = 0;
    let scoreEarned = 0;

    const updatedEnemies = store.enemies
      .map((enemy) => {
        const entry = damageMap.get(enemy.id);
        if (!entry) return enemy;

        const newHp = enemy.hp - entry.damage;
        if (newHp <= 0) {
          goldEarned += enemy.stats.reward;
          scoreEarned += enemy.stats.reward * 10;
          return null;
        }

        // Merge status effects (don't stack same type, refresh duration)
        const mergedEffects = [...enemy.statusEffects];
        for (const newEffect of entry.statusEffects) {
          const existing = mergedEffects.find((e) => e.type === newEffect.type);
          if (existing) {
            existing.remaining = Math.max(existing.remaining, newEffect.remaining);
            existing.intensity = Math.max(existing.intensity, newEffect.intensity);
          } else {
            mergedEffects.push(newEffect);
          }
        }

        return { ...enemy, hp: newHp, statusEffects: mergedEffects };
      })
      .filter((e): e is Enemy => e !== null);

    store.setEnemies(updatedEnemies);
    if (goldEarned > 0) store.addGold(goldEarned);
    if (scoreEarned > 0) store.addScore(scoreEarned);
  }

  private processProjectiles(dt: number) {
    const store = useGameStore.getState();
    if (store.projectiles.length === 0) return;

    const survivingProjectiles: Projectile[] = [];
    const enemyDamageMap = new Map<string, { damage: number; statusEffects: ActiveStatusEffect[] }>();
    const killedEnemyIds = new Set<string>();

    for (const proj of store.projectiles) {
      const target = store.enemies.find((e) => e.id === proj.targetId);

      if (!target || killedEnemyIds.has(target.id)) {
        continue;
      }

      const dx = target.position.x - proj.position.x;
      const dy = target.position.y - proj.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < HIT_DISTANCE_SQ) {
        // Hit primary target
        const damage = calcDamage(proj.damage, target);
        const entry = enemyDamageMap.get(target.id) ?? { damage: 0, statusEffects: [] };
        entry.damage += damage;

        // Status effect on hit
        if (proj.statusOnHit) {
          entry.statusEffects.push({
            type: proj.statusOnHit.type,
            duration: proj.statusOnHit.duration,
            remaining: proj.statusOnHit.duration,
            intensity: proj.statusOnHit.intensity,
          });
        }

        enemyDamageMap.set(target.id, entry);

        if (target.hp - entry.damage <= 0) {
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
              const aoeEntry = enemyDamageMap.get(other.id) ?? { damage: 0, statusEffects: [] };
              aoeEntry.damage += aoeDmg;

              // AoE also applies status
              if (proj.statusOnHit) {
                aoeEntry.statusEffects.push({
                  type: proj.statusOnHit.type,
                  duration: Math.floor(proj.statusOnHit.duration * 0.5),
                  remaining: Math.floor(proj.statusOnHit.duration * 0.5),
                  intensity: proj.statusOnHit.intensity * 0.5,
                });
              }

              enemyDamageMap.set(other.id, aoeEntry);
              if (other.hp - aoeEntry.damage <= 0) {
                killedEnemyIds.add(other.id);
              }
            }
          }
        }
      } else {
        // Move projectile
        const dist = Math.sqrt(distSq);
        const speed = proj.speed * dt;

        survivingProjectiles.push({
          ...proj,
          position: {
            x: proj.position.x + (dx / dist) * speed,
            y: proj.position.y + (dy / dist) * speed,
          },
        });
      }
    }

    // Apply damage
    let goldEarned = 0;
    let scoreEarned = 0;

    const updatedEnemies = store.enemies
      .map((enemy) => {
        const entry = enemyDamageMap.get(enemy.id);
        if (!entry) return enemy;

        const newHp = enemy.hp - entry.damage;
        if (newHp <= 0) {
          goldEarned += enemy.stats.reward;
          scoreEarned += enemy.stats.reward * 10;
          return null;
        }

        // Merge status effects
        const mergedEffects = [...enemy.statusEffects];
        for (const newEffect of entry.statusEffects) {
          const existing = mergedEffects.find((e) => e.type === newEffect.type);
          if (existing) {
            existing.remaining = Math.max(existing.remaining, newEffect.remaining);
            existing.intensity = Math.max(existing.intensity, newEffect.intensity);
          } else {
            mergedEffects.push(newEffect);
          }
        }

        return { ...enemy, hp: newHp, statusEffects: mergedEffects };
      })
      .filter((e): e is Enemy => e !== null);

    store.setProjectiles(survivingProjectiles);
    store.setEnemies(updatedEnemies);
    if (goldEarned > 0) store.addGold(goldEarned);
    if (scoreEarned > 0) store.addScore(scoreEarned);
  }
}
