import type { MapId, EnemyType, EnemyTrait, WaveSegment } from '../types';

export interface CampaignMap {
  mapId: MapId;
  name: string;
  stages: number;        // 5-15 stages
  startGoldBonus: number; // bonus gold when entering this map
  enemyPool: EnemyType[];
  traitPool: EnemyTrait[];
}

export const CAMPAIGN: CampaignMap[] = [
  {
    mapId: 'canyon',
    name: 'Shadow Canyon',
    stages: 8,
    startGoldBonus: 0,
    enemyPool: ['swarm', 'fast', 'tank'],
    traitPool: [],
  },
  {
    mapId: 'crossroads',
    name: 'The Crossroads',
    stages: 10,
    startGoldBonus: 50,
    enemyPool: ['swarm', 'fast', 'tank', 'flyer'],
    traitPool: ['flying', 'shield'],
  },
  {
    mapId: 'fortress',
    name: 'Iron Fortress',
    stages: 10,
    startGoldBonus: 75,
    enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],
    traitPool: ['flying', 'shield', 'regen'],
  },
  {
    mapId: 'spiral',
    name: 'Death Spiral',
    stages: 12,
    startGoldBonus: 100,
    enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],
    traitPool: ['flying', 'shield', 'regen', 'stealth'],
  },
  {
    mapId: 'gauntlet',
    name: 'The Gauntlet',
    stages: 15,
    startGoldBonus: 150,
    enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],
    traitPool: ['flying', 'shield', 'regen', 'stealth'],
  },
];

export const TOTAL_MAPS = CAMPAIGN.length;

export function getTotalStages(): number {
  return CAMPAIGN.reduce((sum, m) => sum + m.stages, 0);
}

/** Generate wave segments for a given map + stage */
export function generateStage(mapIndex: number, stage: number, globalWave: number): {
  segments: WaveSegment[];
  reward: number;
  isBoss: boolean;
} {
  const map = CAMPAIGN[mapIndex];
  const isFinalStage = stage === map.stages;
  const isMidBoss = stage === Math.ceil(map.stages / 2);
  const isBoss = isFinalStage || isMidBoss;

  // Difficulty scaling
  const mapDifficulty = 1 + mapIndex * 0.3;     // maps get harder
  const stageDifficulty = 1 + (stage - 1) * 0.15; // stages get harder
  const totalScale = mapDifficulty * stageDifficulty;

  const segments: WaveSegment[] = [];

  // Base enemy count scales with stage
  const baseCount = Math.floor(5 + stage * 2 + mapIndex * 3);

  // Pick enemies from pool based on stage progression
  const availableEnemies = map.enemyPool.slice(0, Math.min(map.enemyPool.length, 1 + Math.floor(stage / 2)));

  // Assign traits starting from later stages
  const traitsStart = Math.floor(map.stages * 0.4);
  const availableTraits = stage >= traitsStart ? map.traitPool.slice(0, Math.min(map.traitPool.length, Math.floor((stage - traitsStart) / 2) + 1)) : [];

  // Build segments — mix of enemy types
  for (const enemyType of availableEnemies) {
    let count: number;
    let interval: number;
    const traits: EnemyTrait[] = [];

    switch (enemyType) {
      case 'swarm':
        count = Math.floor(baseCount * 1.5);
        interval = Math.max(200, 500 - stage * 15);
        break;
      case 'fast':
        count = Math.floor(baseCount * 0.6);
        interval = Math.max(300, 600 - stage * 20);
        if (availableTraits.includes('stealth') && stage > map.stages * 0.6) {
          traits.push('stealth');
        }
        break;
      case 'tank':
        count = Math.floor(baseCount * 0.3);
        interval = Math.max(600, 1200 - stage * 30);
        if (availableTraits.includes('shield') && stage > map.stages * 0.3) {
          traits.push('shield');
        }
        if (availableTraits.includes('regen') && stage > map.stages * 0.7) {
          traits.push('regen');
        }
        break;
      case 'flyer':
        count = Math.floor(baseCount * 0.4);
        interval = Math.max(300, 500 - stage * 15);
        traits.push('flying');
        if (availableTraits.includes('stealth') && stage > map.stages * 0.8) {
          traits.push('stealth');
        }
        break;
      case 'healer':
        count = Math.min(4, 1 + Math.floor(stage / 3));
        interval = 1500;
        break;
      default:
        count = Math.floor(baseCount * 0.5);
        interval = 500;
    }

    if (count > 0) {
      segments.push({
        enemyType,
        count,
        interval,
        traits: traits.length > 0 ? traits : undefined,
      });
    }
  }

  // Boss stages: add boss enemy
  if (isBoss) {
    // Add escort before boss
    segments.push({
      enemyType: 'fast',
      count: Math.floor(3 + mapIndex * 2),
      interval: 400,
      traits: availableTraits.includes('stealth') ? ['stealth'] : undefined,
    });

    segments.push({
      enemyType: 'boss',
      count: isFinalStage ? 1 + Math.floor(mapIndex / 2) : 1,
      interval: 3000,
    });

    // Post-boss support
    if (isFinalStage && mapIndex >= 2) {
      segments.push({
        enemyType: 'healer',
        count: Math.min(3, 1 + mapIndex),
        interval: 1500,
      });
    }
  }

  // Reward scales with difficulty
  const baseReward = isBoss ? 200 : 50;
  const reward = Math.floor(baseReward * totalScale);

  return { segments, reward, isBoss };
}
