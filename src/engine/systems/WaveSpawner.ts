import type { GameSystem, GameMap, EnemyType, EnemyTrait } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { generateStage, CAMPAIGN } from '../../config/campaign';
import { createEnemy } from '../../game/enemies/factory';
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
  private lastGlobalWave = -1;
  private allSpawned = false;

  constructor(map: GameMap) {
    this.map = map;
  }

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

    // Start new stage
    if (!this.waveActive || store.wave !== this.lastGlobalWave) {
      this.startStage(store);
    }

    // Spawn enemies
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

    // Stage complete
    if (this.allSpawned && store.enemies.length === 0) {
      this.onStageComplete();
    }
  }

  private startStage(store: ReturnType<typeof useGameStore.getState>) {
    const { mapIndex, stage, wave } = store;

    // Generate stage from campaign config
    const stageData = generateStage(mapIndex, stage, wave);

    this.spawnQueue = [];
    this.currentSpawnIndex = 0;
    this.spawnTimer = 0;
    this.waveActive = true;
    this.allSpawned = false;
    this.lastGlobalWave = wave;

    audio.play('wave_start');

    // Flatten segments into spawn queue
    let isFirst = true;
    for (const segment of stageData.segments) {
      for (let i = 0; i < segment.count; i++) {
        this.spawnQueue.push({
          enemyType: segment.enemyType,
          traits: (segment.traits as EnemyTrait[]) ?? [],
          delay: isFirst ? 500 : segment.interval,
        });
        isFirst = false;
      }
    }
  }

  private spawnOneEnemy(entry: SpawnEntry, globalWave: number) {
    const store = useGameStore.getState();
    const spawnCell = this.map.path[0];

    const enemy = createEnemy(
      entry.enemyType,
      spawnCell,
      this.map.cellSize,
      globalWave,
      entry.traits,
    );
    store.addEnemy(enemy);
  }

  private onStageComplete() {
    const store = useGameStore.getState();
    const { mapIndex, stage } = store;
    const campaign = CAMPAIGN[mapIndex];
    const stageData = generateStage(mapIndex, stage, store.wave);

    // Award reward
    store.addGold(stageData.reward);
    store.addScore(stageData.reward * 2);

    audio.play('wave_clear');

    this.waveActive = false;
    this.allSpawned = false;

    // Check if map is complete
    if (stage >= campaign.stages) {
      // Try advance to next map
      if (!store.advanceToNextMap()) {
        // No more maps — victory!
        store.setPhase('victory');
        audio.play('victory');
      } else {
        // New map — prep phase
        store.setPhase('prep');
      }
    } else {
      // Next stage in same map
      store.setPhase('prep');
    }
  }
}
