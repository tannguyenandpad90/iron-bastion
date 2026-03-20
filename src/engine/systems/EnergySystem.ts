import type { GameSystem } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const ENERGY_REGEN_RATE = 5; // per second

export class EnergySystem implements GameSystem {
  readonly name = 'energySystem';

  update(dt: number) {
    const store = useGameStore.getState();

    if (store.phase === 'paused' || store.phase === 'gameover') return;

    // Passive energy regen
    if (store.energy < store.maxEnergy) {
      store.regenEnergy(ENERGY_REGEN_RATE * dt);
    }

    // Tick skill cooldowns
    const updatedSkills = store.skills.map((skill) => {
      if (skill.currentCooldown > 0) {
        return {
          ...skill,
          currentCooldown: Math.max(0, skill.currentCooldown - dt * 1000),
        };
      }
      return skill;
    });

    // Only update if something changed
    const changed = updatedSkills.some(
      (s, i) => s.currentCooldown !== store.skills[i].currentCooldown,
    );
    if (changed) {
      // Direct set since we don't have a setSkills action yet
      useGameStore.setState({ skills: updatedSkills });
    }
  }
}
