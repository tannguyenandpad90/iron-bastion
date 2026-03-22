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
  // --- ZONE 1: EASY ---
  { mapId: 'canyon',     name: 'Shadow Canyon',   stages: 20, startGoldBonus: 0,   enemyPool: ['swarm', 'fast'],                              traitPool: [] },
  { mapId: 'crossroads', name: 'The Crossroads',  stages: 20, startGoldBonus: 50,  enemyPool: ['swarm', 'fast', 'tank'],                      traitPool: [] },
  // --- ZONE 2: NORMAL ---
  { mapId: 'fortress',   name: 'Iron Fortress',   stages: 20, startGoldBonus: 75,  enemyPool: ['swarm', 'fast', 'tank', 'flyer'],             traitPool: ['flying'] },
  { mapId: 'spiral',     name: 'Death Spiral',    stages: 20, startGoldBonus: 100, enemyPool: ['swarm', 'fast', 'tank', 'flyer'],             traitPool: ['flying', 'shield'] },
  { mapId: 'gauntlet',   name: 'The Gauntlet',    stages: 20, startGoldBonus: 125, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield'] },
  // --- ZONE 3: HARD ---
  { mapId: 'tundra',     name: 'Frozen Tundra',   stages: 20, startGoldBonus: 150, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen'] },
  { mapId: 'volcano',    name: 'Volcano Core',    stages: 20, startGoldBonus: 175, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen'] },
  { mapId: 'swamp',      name: 'Dark Swamp',      stages: 20, startGoldBonus: 200, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  // --- ZONE 4: EXPERT ---
  { mapId: 'desert',     name: 'Scorched Desert', stages: 20, startGoldBonus: 225, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'neon_city',  name: 'Neon City',       stages: 20, startGoldBonus: 250, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'skybridge',  name: 'Skybridge',       stages: 20, startGoldBonus: 275, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  // --- ZONE 5: INSANE ---
  { mapId: 'catacombs',  name: 'Catacombs',       stages: 20, startGoldBonus: 300, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'reactor',    name: 'Reactor Core',    stages: 20, startGoldBonus: 325, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  // --- ZONE 6: NIGHTMARE ---
  { mapId: 'void_rift',  name: 'Void Rift',       stages: 20, startGoldBonus: 350, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
  { mapId: 'last_stand', name: 'Last Stand',      stages: 20, startGoldBonus: 400, enemyPool: ['swarm', 'fast', 'tank', 'flyer', 'healer'],   traitPool: ['flying', 'shield', 'regen', 'stealth'] },
];

export const TOTAL_MAPS = CAMPAIGN.length;

export function getTotalStages(): number {
  return CAMPAIGN.reduce((sum, m) => sum + m.stages, 0);
}

/**
 * Boss schedule per 20 stages:
 *  Stage 5:  mini-boss
 *  Stage 10: mid-boss
 *  Stage 15: elite-boss
 *  Stage 20: final-boss (harder, multi-boss on later maps)
 */
function getBossType(stage: number, totalStages: number): 'none' | 'mini' | 'mid' | 'elite' | 'final' {
  if (stage === totalStages) return 'final';
  if (stage === Math.ceil(totalStages * 0.75)) return 'elite';
  if (stage === Math.ceil(totalStages * 0.5)) return 'mid';
  if (stage === Math.ceil(totalStages * 0.25)) return 'mini';
  return 'none';
}

export function generateStage(mapIndex: number, stage: number, globalWave: number): {
  segments: WaveSegment[];
  reward: number;
  isBoss: boolean;
} {
  const map = CAMPAIGN[mapIndex];
  const bossType = getBossType(stage, map.stages);
  const isBoss = bossType !== 'none';

  // Difficulty curves
  const mapDifficulty = 1 + mapIndex * 0.2;                    // 1.0 → 3.8
  const stageDifficulty = 1 + (stage - 1) * 0.08;              // 1.0 → 2.52
  const globalDifficulty = 1 + globalWave * 0.01;              // slow global ramp
  const totalScale = mapDifficulty * stageDifficulty * globalDifficulty;

  const segments: WaveSegment[] = [];

  // Base enemy count: grows with stage AND map
  const baseCount = Math.floor(3 + stage * 1.5 + mapIndex * 1.5);

  // Unlock enemies gradually within each map
  const enemyUnlockRate = Math.min(map.enemyPool.length, 1 + Math.floor(stage / 4));
  const availableEnemies = map.enemyPool.slice(0, enemyUnlockRate);

  // Traits unlock in second half of map
  const traitsStart = Math.ceil(map.stages * 0.3);
  const traitUnlockRate = stage >= traitsStart
    ? Math.min(map.traitPool.length, 1 + Math.floor((stage - traitsStart) / 3))
    : 0;
  const availableTraits = map.traitPool.slice(0, traitUnlockRate);

  // Spawn interval gets faster as stages progress
  const speedFactor = Math.max(0.4, 1 - stage * 0.025);

  for (const enemyType of availableEnemies) {
    let count: number;
    let interval: number;
    const traits: EnemyTrait[] = [];

    switch (enemyType) {
      case 'swarm':
        count = Math.floor(baseCount * 1.8);
        interval = Math.floor(Math.max(150, 450 * speedFactor));
        break;
      case 'fast':
        count = Math.floor(baseCount * 0.7);
        interval = Math.floor(Math.max(200, 550 * speedFactor));
        if (availableTraits.includes('stealth') && stage > map.stages * 0.6) traits.push('stealth');
        break;
      case 'tank':
        count = Math.floor(baseCount * 0.35);
        interval = Math.floor(Math.max(400, 1000 * speedFactor));
        if (availableTraits.includes('shield') && stage > map.stages * 0.3) traits.push('shield');
        if (availableTraits.includes('regen') && stage > map.stages * 0.7) traits.push('regen');
        break;
      case 'flyer':
        count = Math.floor(baseCount * 0.5);
        interval = Math.floor(Math.max(200, 450 * speedFactor));
        traits.push('flying');
        if (availableTraits.includes('stealth') && stage > map.stages * 0.8) traits.push('stealth');
        break;
      case 'healer':
        count = Math.min(6, 1 + Math.floor(stage / 4));
        interval = Math.floor(Math.max(800, 1400 * speedFactor));
        break;
      default:
        count = Math.floor(baseCount * 0.5);
        interval = 400;
    }

    if (count > 0) {
      segments.push({ enemyType, count, interval, traits: traits.length > 0 ? traits : undefined });
    }
  }

  // Boss stages
  if (isBoss) {
    // Escort wave
    const escortCount = Math.floor(2 + mapIndex * 0.8 + (bossType === 'final' ? 5 : bossType === 'elite' ? 3 : 1));
    segments.push({
      enemyType: 'fast',
      count: escortCount,
      interval: 300,
      traits: availableTraits.includes('stealth') ? ['stealth'] : undefined,
    });

    // Boss count scales with boss tier and map
    let bossCount = 1;
    if (bossType === 'final') bossCount = 1 + Math.floor(mapIndex / 3);
    else if (bossType === 'elite') bossCount = 1 + Math.floor(mapIndex / 5);

    segments.push({
      enemyType: 'boss',
      count: bossCount,
      interval: 2500,
    });

    // Healer support for harder bosses
    if ((bossType === 'final' || bossType === 'elite') && mapIndex >= 3) {
      segments.push({
        enemyType: 'healer',
        count: Math.min(5, 1 + Math.floor(mapIndex / 3)),
        interval: 1200,
      });
    }

    // Post-boss swarm on final boss
    if (bossType === 'final' && mapIndex >= 6) {
      segments.push({
        enemyType: 'swarm',
        count: Math.floor(10 + mapIndex * 2),
        interval: 200,
      });
    }
  }

  // Reward
  const bossMultiplier = bossType === 'final' ? 4 : bossType === 'elite' ? 3 : bossType === 'mid' ? 2.5 : bossType === 'mini' ? 2 : 1;
  const baseReward = 30;
  const reward = Math.floor(baseReward * totalScale * bossMultiplier);

  return { segments, reward, isBoss };
}
