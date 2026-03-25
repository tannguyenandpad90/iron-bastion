import type { WorldPosition } from '../types';

type VfxEvent =
  | { type: 'hit'; pos: WorldPosition; color: number; damage: number; isCrit: boolean }
  | { type: 'kill'; pos: WorldPosition; color: number; reward: number; isBoss: boolean }
  | { type: 'muzzle'; pos: WorldPosition; color: number; dirX: number; dirY: number }
  | { type: 'aoe_hit'; pos: WorldPosition; radius: number; color: number }
  | { type: 'skill'; pos: WorldPosition; radius: number; skillType: string }
  | { type: 'plasma_impact'; pos: WorldPosition; radius: number };

class VfxBridge {
  private queue: VfxEvent[] = [];

  emit(event: VfxEvent) {
    this.queue.push(event);
  }

  flush(): VfxEvent[] {
    const events = this.queue;
    this.queue = [];
    return events;
  }
}

export const vfxBridge = new VfxBridge();
export type { VfxEvent };
