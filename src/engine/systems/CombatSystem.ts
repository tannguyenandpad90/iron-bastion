import type { GameSystem } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { createProjectile } from '../../game/towers/factory';

export class CombatSystem implements GameSystem {
  readonly name = 'combatSystem';

  update(dt: number) {
    const store = useGameStore.getState();

    if (store.phase !== 'wave') return;

    // --- Tower firing ---
    for (const tower of store.towers) {
      if (!tower.target) continue;

      // Reduce cooldown
      const newCooldown = Math.max(0, tower.cooldown - dt);
      if (newCooldown > 0) {
        store.updateTower(tower.id, { cooldown: newCooldown });
        continue;
      }

      // Find target enemy
      const target = store.enemies.find((e) => e.id === tower.target);
      if (!target) continue;

      // Fire!
      const cooldownTime = 1 / tower.stats.fireRate;
      store.updateTower(tower.id, { cooldown: cooldownTime });

      const proj = createProjectile(tower, target);
      store.addProjectile(proj);
    }

    // --- Projectile movement ---
    for (const proj of store.projectiles) {
      const target = store.enemies.find((e) => e.id === proj.targetId);

      if (!target) {
        // Target died, remove projectile
        store.removeProjectile(proj.id);
        continue;
      }

      // Move toward target
      const dx = target.position.x - proj.position.x;
      const dy = target.position.y - proj.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8) {
        // Hit! DamageSystem will handle the rest
        // Mark for removal (DamageSystem reads projectiles)
        store.removeProjectile(proj.id);

        // Apply damage directly for now (DamageSystem will refine this)
        const newHp = target.hp - proj.damage;
        if (newHp <= 0) {
          store.removeEnemy(target.id);
          store.addGold(target.stats.reward);
          store.addScore(target.stats.reward * 10);
        } else {
          store.updateEnemy(target.id, { hp: newHp });
        }
      } else {
        // Move
        const speed = proj.speed * dt;
        const nx = dx / dist;
        const ny = dy / dist;

        store.removeProjectile(proj.id);
        store.addProjectile({
          ...proj,
          position: {
            x: proj.position.x + nx * speed,
            y: proj.position.y + ny * speed,
          },
        });
      }
    }
  }
}
