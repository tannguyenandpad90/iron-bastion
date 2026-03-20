import type { WorldPosition, SkillType } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { SKILL_CONFIG } from '../../config/skills';
import { CELL_SIZE } from '../../config/game';

export function executeSkill(skillType: SkillType, targetPos: WorldPosition): boolean {
  const store = useGameStore.getState();
  const skill = store.skills.find((s) => s.type === skillType);
  if (!skill) return false;

  // Check cooldown
  if (skill.currentCooldown > 0) return false;

  // Check energy
  if (!store.useEnergy(skill.energyCost)) return false;

  const config = SKILL_CONFIG[skillType];
  const radiusInPixels = config.radius * CELL_SIZE;

  // Apply effect to enemies in range
  const enemies = store.enemies;
  for (const enemy of enemies) {
    const dx = enemy.position.x - targetPos.x;
    const dy = enemy.position.y - targetPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= radiusInPixels) {
      switch (skillType) {
        case 'emp':
          store.updateEnemy(enemy.id, {
            statusEffects: [
              ...enemy.statusEffects,
              { type: 'stun', duration: config.duration, remaining: config.duration, intensity: 1 },
            ],
          });
          break;

        case 'airstrike': {
          const newHp = enemy.hp - config.damage;
          if (newHp <= 0) {
            store.removeEnemy(enemy.id);
            store.addGold(enemy.stats.reward);
            store.addScore(enemy.stats.reward * 10);
          } else {
            store.updateEnemy(enemy.id, { hp: newHp });
          }
          break;
        }

        case 'freeze':
          store.updateEnemy(enemy.id, {
            statusEffects: [
              ...enemy.statusEffects,
              { type: 'slow', duration: config.duration, remaining: config.duration, intensity: 0.5 },
            ],
          });
          break;
      }
    }
  }

  // Set cooldown
  const updatedSkills = store.skills.map((s) =>
    s.type === skillType ? { ...s, currentCooldown: config.cooldown } : s,
  );
  useGameStore.setState({ skills: updatedSkills });

  return true;
}
