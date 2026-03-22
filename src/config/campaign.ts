import type { MapId, EnemyType, EnemyTrait, WaveSegment } from '../types';

export interface CampaignMap {
  mapId: MapId;
  name: string;
  stages: number;
  startGoldBonus: number;
  enemyPool: EnemyType[];
  traitPool: EnemyTrait[];
}

export const CAMPAIGN: CampaignMap[] = [
  // --- ZONE 1: EASY (maps 1-2) ---
  { mapId: 'canyon',     name: 'Shadow Canyon',   stages: 5,  startGoldBonus: 0,   enemyPool: ['swarm', 'fast'],                     traitPool: [] },
  { mapId: 'crossroads', name: 'The Crossroads',  stages: 6,  startGoldBonus: 30,  enemyPool: ['swarm', 'fast', 'tank'],             traitPool: [] },
  // --- ZONE 2: NORMAL (maps 3-5) ---
  { mapId: 'fortress',   name: 'Iron Fortress',   stages: 6,  startGoldBonus: 40,  enemyPool: ['swarm', 'fast', 'tank', 'flyer'],    traitPool: ['flying'] },
  { mapId: 'spiral',     name: 'Death Spiral',    stages: 7,  startGoldBonus: 50,  enemyPool: ['swarm', 'fast', 'tank', 'flyer'],    traitPool: ['flying', 'shield'] },
  { mapId: 'gauntlet',   name: 'The Gauntlet',    stages: 7,  startGoldBonus: 60,  enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield'] },
  // --- ZONE 3: HARD (maps 6-8) ---
  { mapId: 'tundra',     name: 'Frozen Tundra',   stages: 8,  startGoldBonus: 75,  enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen'] },
  { mapId: 'volcano',    name: 'Volcano Core',    stages: 8,  startGoldBonus: 80,  enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen'] },
  { mapId: 'swamp',      name: 'Dark Swamp',      stages: 8,  startGoldBonus: 90,  enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  // --- ZONE 4: EXPERT (maps 9-11) ---
  { mapId: 'desert',     name: 'Scorched Desert', stages: 9,  startGoldBonus: 100, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'neon_city',  name: 'Neon City',       stages: 9,  startGoldBonus: 110, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'skybridge',  name: 'Skybridge',       stages: 10, startGoldBonus: 120, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  // --- ZONE 5: INSANE (maps 12-13) ---
  { mapId: 'catacombs',  name: 'Catacombs',       stages: 10, startGoldBonus: 130, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'reactor',    name: 'Reactor Core',    stages: 12, startGoldBonus: 150, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  // --- ZONE 6: NIGHTMARE (maps 14-15) ---
  { mapId: 'void_rift',  name: 'Void Rift',       stages: 12, startGoldBonus: 175, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'last_stand', name: 'Last Stand',      stages: 15, startGoldBonus: 200, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'], traitPool: ['flying', 'shield', 'regen', 'stealth'] },
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

  const mapDifficulty = 1 + mapIndex * 0.25;
  const stageDifficulty = 1 + (stage - 1) * 0.12;
  const totalScale = mapDifficulty * stageDifficulty;

  const segments: WaveSegment[] = [];
  const baseCount = Math.floor(4 + stage * 2 + mapIndex * 2);
  const availableEnemies = map.enemyPool.slice(0, Math.min(map.enemyPool.length, 1 + Math.floor(stage / 2)));
  const traitsStart = Math.floor(map.stages * 0.35);
  const availableTraits = stage >= traitsStart
    ? map.traitPool.slice(0, Math.min(map.traitPool.length, Math.floor((stage - traitsStart) / 2) + 1))
    : [];

  for (const enemyType of availableEnemies) {
    let count: number;
    let interval: number;
    const traits: EnemyTrait[] = [];

    switch (enemyType) {
      case 'swarm':
        count = Math.floor(baseCount * 1.5);
        interval = Math.max(180, 500 - stage * 15 - mapIndex * 5);
        break;
      case 'fast':
        count = Math.floor(baseCount * 0.6);
        interval = Math.max(250, 600 - stage * 20);
        if (availableTraits.includes('stealth') && stage > map.stages * 0.6) traits.push('stealth');
        break;
      case 'tank':
        count = Math.floor(baseCount * 0.3);
        interval = Math.max(500, 1200 - stage * 30);
        if (availableTraits.includes('shield') && stage > map.stages * 0.3) traits.push('shield');
        if (availableTraits.includes('regen') && stage > map.stages * 0.7) traits.push('regen');
        break;
      case 'flyer':
        count = Math.floor(baseCount * 0.4);
        interval = Math.max(250, 500 - stage * 12);
        traits.push('flying');
        if (availableTraits.includes('stealth') && stage > map.stages * 0.8) traits.push('stealth');
        break;
      case 'healer':
        count = Math.min(5, 1 + Math.floor(stage / 3));
        interval = 1500;
        break;
      default:
        count = Math.floor(baseCount * 0.5);
        interval = 500;
    }

    if (count > 0) {
      segments.push({ enemyType, count, interval, traits: traits.length > 0 ? traits : undefined });
    }
  }

  if (isBoss) {
    segments.push({
      enemyType: 'fast',
      count: Math.floor(3 + mapIndex),
      interval: 350,
      traits: availableTraits.includes('stealth') ? ['stealth'] : undefined,
    });
    segments.push({
      enemyType: 'boss',
      count: isFinalStage ? 1 + Math.floor(mapIndex / 4) : 1,
      interval: 3000,
    });
    if (isFinalStage && mapIndex >= 4) {
      segments.push({ enemyType: 'healer', count: Math.min(4, 1 + Math.floor(mapIndex / 3)), interval: 1500 });
    }
  }

  const baseReward = isBoss ? 150 : 40;
  const reward = Math.floor(baseReward * totalScale);

  return { segments, reward, isBoss };
}
