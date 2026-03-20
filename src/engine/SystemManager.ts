import type { GameSystem } from '../types';

export class SystemManager {
  private systems: GameSystem[] = [];

  register(system: GameSystem) {
    this.systems.push(system);
    system.init?.();
  }

  update(dt: number) {
    for (const system of this.systems) {
      system.update(dt);
    }
  }

  get<T extends GameSystem>(name: string): T | undefined {
    return this.systems.find((s) => s.name === name) as T | undefined;
  }

  destroy() {
    for (const system of this.systems) {
      system.destroy?.();
    }
    this.systems = [];
  }
}
