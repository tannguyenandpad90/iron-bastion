import type { GameSystem, GameMap, EnemyType, EnemyTrait } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { WAVES } from '../../config/waves';
import { createEnemy } from '../../game/enemies/factory';
import { getMap } from '../../config/maps';
import { audio } from '../AudioManager';

interface SpawnEntry {
  enemyType: EnemyType;
  traits: EnemyTrait[];
  delay: number;
}

export class WaveSpawner implements GameSystem {
  readonly name = 'waveSpawner';

  private map: GameMap;
  private spawnQueue: SpawnEntry[] = [];
  private spawnTimer = 0;
  private currentSpawnIndex = 0;
  private waveActive = false;
  private lastWaveNumber = 0;
  private allSpawned = false;

  constructor(map: GameMap) {
    this.map = map;
  }

  /** Called by GameScene when map changes */
  setMap(map: GameMap) {
    this.map = map;
  }

  update(dt: number) {
    const store = useGameStore.getState();

    if (store.phase !== 'wave') {
      if (store.phase === 'prep' && this.waveActive) {
        this.waveActive = false;
        this.allSpawned = false;
      }
      return;
    }

    if (!this.waveActive || store.wave !== this.lastWaveNumber) {
      this.startWave(store.wave);
    }

    if (this.currentSpawnIndex < this.spawnQueue.length) {
      this.spawnTimer += dt * 1000;

      while (
        this.currentSpawnIndex < this.spawnQueue.length &&
        this.spawnTimer >= this.spawnQueue[this.currentSpawnIndex].delay
      ) {
        const entry = this.spawnQueue[this.currentSpawnIndex];
        this.spawnTimer -= entry.delay;
        this.spawnOneEnemy(entry, store.wave);
        this.currentSpawnIndex++;
      }

      if (this.currentSpawnIndex >= this.spawnQueue.length) {
        this.allSpawned = true;
      }
    }

    if (this.allSpawned && store.enemies.length === 0) {
      this.onWaveComplete();
    }
  }

  private startWave(waveNumber: number) {
    const waveIndex = Math.min(waveNumber - 1, WAVES.length - 1);
    const wave = WAVES[waveIndex];
    if (!wave) return;

    // Switch map if wave specifies a different one
    if (wave.mapId) {
      const store = useGameStore.getState();
      if (wave.mapId !== store.mapId) {
        store.setMapId(wave.mapId);
        this.map = getMap(wave.mapId);
      }
    }

    this.spawnQueue = [];
    this.currentSpawnIndex = 0;
    this.spawnTimer = 0;
    this.waveActive = true;
    this.allSpawned = false;
    this.lastWaveNumber = waveNumber;

    audio.play('wave_start');

    let isFirst = true;
    for (const segment of wave.segments) {
      for (let i = 0; i < segment.count; i++) {
        this.spawnQueue.push({
          enemyType: segment.enemyType,
          traits: (segment.traits as EnemyTrait[]) ?? [],
          delay: isFirst ? 300 : segment.interval,
        });
        isFirst = false;
      }
    }
  }

  private spawnOneEnemy(entry: SpawnEntry, waveNumber: number) {
    const store = useGameStore.getState();
    const spawnCell = this.map.path[0];

    const enemy = createEnemy(
      entry.enemyType,
      spawnCell,
      this.map.cellSize,
      waveNumber,
      entry.traits,
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

    audio.play('wave_clear');

    this.waveActive = false;
    this.allSpawned = false;

    if (store.wave >= WAVES.length) {
      store.setPhase('victory');
      audio.play('victory');
    } else {
      store.setPhase('prep');
    }
  }
}
