import type { GameSystem, GameMap } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { WAVES } from '../../config/waves';
import { createEnemy } from '../../game/enemies/factory';

export class WaveSpawner implements GameSystem {
  readonly name = 'waveSpawner';

  private map: GameMap;
  private spawnQueue: { enemyType: string; traits?: string[]; delay: number }[] = [];
  private spawnTimer = 0;
  private waveActive = false;
  private currentSpawnIndex = 0;

  constructor(map: GameMap) {
    this.map = map;
  }

  update(dt: number) {
    const store = useGameStore.getState();

    if (store.phase !== 'wave') {
      return;
    }

    // Build spawn queue when wave starts
    if (!this.waveActive) {
      this.startWave(store.wave);
    }

    // Process spawn queue
    if (this.currentSpawnIndex < this.spawnQueue.length) {
      this.spawnTimer += dt * 1000; // convert to ms

      const nextSpawn = this.spawnQueue[this.currentSpawnIndex];
      if (this.spawnTimer >= nextSpawn.delay) {
        this.spawnTimer -= nextSpawn.delay;
        this.spawnEnemy(nextSpawn);
        this.currentSpawnIndex++;
      }
    }

    // Check if wave is complete (all spawned + all dead)
    if (
      this.currentSpawnIndex >= this.spawnQueue.length &&
      store.enemies.length === 0
    ) {
      this.waveActive = false;
      this.onWaveComplete();
    }
  }

  private startWave(waveNumber: number) {
    const waveIndex = Math.min(waveNumber - 1, WAVES.length - 1);
    const wave = WAVES[waveIndex];
    if (!wave) return;

    this.spawnQueue = [];
    this.currentSpawnIndex = 0;
    this.spawnTimer = 0;
    this.waveActive = true;

    // Flatten wave segments into a timed spawn queue
    for (const segment of wave.segments) {
      for (let i = 0; i < segment.count; i++) {
        this.spawnQueue.push({
          enemyType: segment.enemyType,
          traits: segment.traits,
          delay: i === 0 && this.spawnQueue.length === 0 ? 500 : segment.interval,
        });
      }
    }
  }

  private spawnEnemy(spawn: { enemyType: string; traits?: string[] }) {
    const store = useGameStore.getState();
    const spawnCell = this.map.path[0];
    const enemy = createEnemy(
      spawn.enemyType as any,
      spawnCell,
      this.map.cellSize,
      store.wave,
      (spawn.traits as any) ?? [],
    );
    store.addEnemy(enemy);
  }

  private onWaveComplete() {
    const store = useGameStore.getState();
    const waveIndex = Math.min(store.wave - 1, WAVES.length - 1);
    const wave = WAVES[waveIndex];

    if (wave) {
      store.addGold(wave.reward);
      store.addScore(wave.reward);
    }

    // Check victory
    if (store.wave >= WAVES.length) {
      store.setPhase('victory');
    } else {
      store.setPhase('prep');
    }
  }
}
