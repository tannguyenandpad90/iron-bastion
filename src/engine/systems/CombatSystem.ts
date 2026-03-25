import type { GameSystem, Projectile, Tower, Enemy, ActiveStatusEffect } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { createProjectile } from '../../game/towers/factory';
import { calcDamage } from '../../game/damage/calculator';
import { evaluateSynergies } from '../../game/synergy/evaluate';
import { audio } from '../AudioManager';
import { vfxBridge } from '../VfxBridge';

const HIT_DISTANCE_SQ = 100;
const CHAIN_RANGE_SQ = (3 * 64) * (3 * 64); // 3 cells

export class CombatSystem implements GameSystem {
  readonly name = 'combatSystem';

  private synergyTimer = 0;
  private readonly SYNERGY_INTERVAL = 0.5;
  private shootThrottle = new Map<string, number>(); // tower id → audio cooldown

  update(dt: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'wave') return;

    this.synergyTimer += dt;
    if (this.synergyTimer >= this.SYNERGY_INTERVAL) {
      this.synergyTimer = 0;
      this.updateSynergies(store.towers);
    }

    // Tick audio throttle
    for (const [id, t] of this.shootThrottle) {
      if (t <= 0) this.shootThrottle.delete(id);
      else this.shootThrottle.set(id, t - dt);
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
      const oldStr = JSON.stringify(tower.synergyBuffs);
      const newStr = JSON.stringify(towerBonuses);
      if (oldStr !== newStr) {
        changed = true;
        return { ...tower, synergyBuffs: towerBonuses };
      }
      return tower;
    });
    if (changed) useGameStore.setState({ towers: updatedTowers });
  }

  private processTowerFiring(towers: Tower[], enemies: Enemy[], dt: number) {
    if (towers.length === 0 || enemies.length === 0) return;

    let towersChanged = false;
    const newProjectiles: Projectile[] = [];
    const laserDamageMap = new Map<string, { damage: number; statusEffects: ActiveStatusEffect[] }>();

    const updatedTowers = towers.map((tower) => {
      if (tower.cooldown > 0) {
        towersChanged = true;
        const newCooldown = Math.max(0, tower.cooldown - dt);
        if (newCooldown > 0) return { ...tower, cooldown: newCooldown };
        tower = { ...tower, cooldown: 0 };
      }

      if (!tower.target || tower.cooldown > 0) return tower;

      const target = enemies.find((e) => e.id === tower.target);
      if (!target) return tower;

      towersChanged = true;
      const cooldownTime = 1 / tower.stats.fireRate;

      // Play sound (throttled to avoid spam)
      if (!this.shootThrottle.has(tower.id)) {
        const soundMap: Record<string, any> = {
          cannon: 'shoot_cannon', laser: 'shoot_laser', aoe: 'shoot_aoe',
          sniper: 'shoot_sniper', tesla: 'shoot_tesla',
        };
        audio.play(soundMap[tower.towerType] ?? 'shoot_cannon');
        this.shootThrottle.set(tower.id, tower.towerType === 'laser' ? 0.3 : 0.15);
      }

      if (tower.towerType === 'laser') {
        const proj = createProjectile(tower, target);
        const damage = calcDamage(proj.damage, target);
        const existing = laserDamageMap.get(target.id) ?? { damage: 0, statusEffects: [] };
        existing.damage += damage;
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
        const proj = createProjectile(tower, target);
        newProjectiles.push(proj);
      }

      return { ...tower, cooldown: cooldownTime };
    });

    if (towersChanged) useGameStore.setState({ towers: updatedTowers });

    if (newProjectiles.length > 0) {
      const store = useGameStore.getState();
      store.setProjectiles([...store.projectiles, ...newProjectiles]);
    }

    if (laserDamageMap.size > 0) this.applyDirectDamage(laserDamageMap);
  }

  private applyDirectDamage(
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
          audio.play(enemy.isBoss ? 'boss_kill' : 'kill');
          vfxBridge.emit({ type: 'kill', pos: { ...enemy.position }, color: 0x00ff88, reward: enemy.stats.reward, isBoss: enemy.isBoss });
          return null;
        }
        vfxBridge.emit({ type: 'hit', pos: { ...enemy.position }, color: 0x00ff88, damage: entry.damage, isCrit: false });
        const mergedEffects = this.mergeStatusEffects(enemy.statusEffects, entry.statusEffects);
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

      if (!target || killedEnemyIds.has(target.id)) continue;

      const dx = target.position.x - proj.position.x;
      const dy = target.position.y - proj.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < HIT_DISTANCE_SQ) {
        // Hit primary
        const damage = calcDamage(proj.damage, target);
        this.addDamageEntry(enemyDamageMap, target.id, damage, proj.statusOnHit);
        if (target.hp - (enemyDamageMap.get(target.id)?.damage ?? 0) <= 0) {
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
              this.addDamageEntry(enemyDamageMap, other.id, aoeDmg, proj.statusOnHit, 0.5);
              if (other.hp - (enemyDamageMap.get(other.id)?.damage ?? 0) <= 0) {
                killedEnemyIds.add(other.id);
              }
            }
          }
        }

        // Tesla chain lightning
        if (proj.chainCount && proj.chainCount > 0) {
          let lastPos = target.position;
          let chainedIds = new Set([target.id]);
          let remainingChains = proj.chainCount;

          for (let c = 0; c < remainingChains; c++) {
            let closest: Enemy | null = null;
            let closestDist = CHAIN_RANGE_SQ;

            for (const other of store.enemies) {
              if (chainedIds.has(other.id) || killedEnemyIds.has(other.id)) continue;
              const cdx = other.position.x - lastPos.x;
              const cdy = other.position.y - lastPos.y;
              const cd = cdx * cdx + cdy * cdy;
              if (cd < closestDist) {
                closestDist = cd;
                closest = other;
              }
            }

            if (!closest) break;
            chainedIds.add(closest.id);

            const chainDmg = calcDamage(Math.floor(proj.damage * 0.6), closest);
            this.addDamageEntry(enemyDamageMap, closest.id, chainDmg, proj.statusOnHit, 0.3);
            if (closest.hp - (enemyDamageMap.get(closest.id)?.damage ?? 0) <= 0) {
              killedEnemyIds.add(closest.id);
            }
            lastPos = closest.position;
          }
        }

        audio.play('hit');

        // Plasma mega explosion VFX
        if (proj.aoeRadius && proj.aoeRadius > 80) {
          const tower = store.towers.find((t) => t.id === proj.sourceId);
          if (tower?.towerType === 'plasma') {
            vfxBridge.emit({ type: 'plasma_impact', pos: { ...target.position }, radius: proj.aoeRadius });
          }
        }
      } else {
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
          scoreEarned += enemy.stats.reward * (enemy.isBoss ? 50 : 10);
          audio.play(enemy.isBoss ? 'boss_kill' : 'kill');
          vfxBridge.emit({ type: 'kill', pos: { ...enemy.position }, color: 0xff6644, reward: enemy.stats.reward, isBoss: enemy.isBoss });
          return null;
        }
        vfxBridge.emit({ type: 'hit', pos: { ...enemy.position }, color: 0xffaa44, damage: entry.damage, isCrit: false });
        const mergedEffects = this.mergeStatusEffects(enemy.statusEffects, entry.statusEffects);
        return { ...enemy, hp: newHp, statusEffects: mergedEffects };
      })
      .filter((e): e is Enemy => e !== null);

    store.setProjectiles(survivingProjectiles);
    store.setEnemies(updatedEnemies);
    if (goldEarned > 0) store.addGold(goldEarned);
    if (scoreEarned > 0) store.addScore(scoreEarned);
  }

  private addDamageEntry(
    map: Map<string, { damage: number; statusEffects: ActiveStatusEffect[] }>,
    enemyId: string,
    damage: number,
    statusOnHit?: { type: any; duration: number; intensity: number },
    statusScale = 1,
  ) {
    const entry = map.get(enemyId) ?? { damage: 0, statusEffects: [] };
    entry.damage += damage;
    if (statusOnHit && statusOnHit.type !== 'chain') {
      entry.statusEffects.push({
        type: statusOnHit.type,
        duration: statusOnHit.duration * statusScale,
        remaining: statusOnHit.duration * statusScale,
        intensity: statusOnHit.intensity * statusScale,
      });
    }
    map.set(enemyId, entry);
  }

  private mergeStatusEffects(
    existing: ActiveStatusEffect[],
    newEffects: ActiveStatusEffect[],
  ): ActiveStatusEffect[] {
    const merged = [...existing];
    for (const ne of newEffects) {
      const ex = merged.find((e) => e.type === ne.type);
      if (ex) {
        ex.remaining = Math.max(ex.remaining, ne.remaining);
        ex.intensity = Math.max(ex.intensity, ne.intensity);
      } else {
        merged.push(ne);
      }
    }
    return merged;
  }
}
