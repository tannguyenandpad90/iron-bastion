import type { WorldPosition, SkillType, Enemy } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { SKILL_CONFIG } from '../../config/skills';
import { CELL_SIZE } from '../../config/game';

export function executeSkill(skillType: SkillType, targetPos: WorldPosition): boolean {
  const store = useGameStore.getState();
  const skill = store.skills.find((s) => s.type === skillType);
  if (!skill) return false;
  if (skill.currentCooldown > 0) return false;
  if (!store.useEnergy(skill.energyCost)) return false;

  const config = SKILL_CONFIG[skillType];
  const radiusInPixels = config.radius * CELL_SIZE;
  const radiusSq = radiusInPixels * radiusInPixels;

  // Batch process all enemies
  let goldEarned = 0;
  let scoreEarned = 0;

  const updatedEnemies: Enemy[] = [];

  for (const enemy of store.enemies) {
    const dx = enemy.position.x - targetPos.x;
    const dy = enemy.position.y - targetPos.y;
    const inRange = (dx * dx + dy * dy) <= radiusSq;

    // Freeze is global (infinite range)
    const affected = skillType === 'freeze' || inRange;

    if (!affected) {
      updatedEnemies.push(enemy);
      continue;
    }

    let updated = { ...enemy };

    switch (skillType) {
      case 'emp':
        updated.statusEffects = [
          ...updated.statusEffects,
          { type: 'stun', duration: config.duration, remaining: config.duration, intensity: 1 },
        ];
        break;

      case 'airstrike': {
        // Distance-based falloff: full damage at center, 50% at edge
        const dist = Math.sqrt(dx * dx + dy * dy);
        const falloff = 1 - (dist / radiusInPixels) * 0.5;
        const damage = Math.floor(config.damage * falloff);
        updated.hp -= damage;

        if (updated.hp <= 0) {
          goldEarned += enemy.stats.reward;
          scoreEarned += enemy.stats.reward * 10;
          continue; // skip dead enemy
        }
        break;
      }

      case 'freeze':
        updated.statusEffects = [
          ...updated.statusEffects,
          { type: 'slow', duration: config.duration, remaining: config.duration, intensity: 0.5 },
        ];
        break;
    }

    updatedEnemies.push(updated);
  }

  // Batch update
  store.setEnemies(updatedEnemies);
  if (goldEarned > 0) store.addGold(goldEarned);
  if (scoreEarned > 0) store.addScore(scoreEarned);

  // Set cooldown
  const updatedSkills = store.skills.map((s) =>
    s.type === skillType ? { ...s, currentCooldown: config.cooldown } : s,
  );
  useGameStore.setState({ skills: updatedSkills });

  return true;
}
