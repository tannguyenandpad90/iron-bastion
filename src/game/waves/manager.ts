import { CAMPAIGN, getTotalStages, generateStage } from '../../config/campaign';
import { useGameStore } from '../../stores/gameStore';

export function getCurrentMapName(): string {
  const { mapIndex } = useGameStore.getState();
  return CAMPAIGN[mapIndex]?.name ?? '';
}

export function getStagesForCurrentMap(): number {
  const { mapIndex } = useGameStore.getState();
  return CAMPAIGN[mapIndex]?.stages ?? 0;
}

export function getTotalMaps(): number {
  return CAMPAIGN.length;
}

export { getTotalStages };

export function isBossStage(mapIndex: number, stage: number): boolean {
  const campaign = CAMPAIGN[mapIndex];
  if (!campaign) return false;
  return stage === campaign.stages || stage === Math.ceil(campaign.stages / 2);
}

export function isFinalBoss(mapIndex: number, stage: number): boolean {
  const campaign = CAMPAIGN[mapIndex];
  if (!campaign) return false;
  return stage === campaign.stages;
}

export function getNextStagePreview(mapIndex: number, stage: number, globalWave: number): {
  type: string; count: number; traits: string;
}[] | null {
  if (mapIndex >= CAMPAIGN.length) return null;
  const campaign = CAMPAIGN[mapIndex];
  if (stage > campaign.stages) return null;

  const data = generateStage(mapIndex, stage, globalWave);
  return data.segments.map((seg) => ({
    type: seg.enemyType,
    count: seg.count,
    traits: seg.traits?.join(', ') ?? '',
  }));
}

// Legacy compat
export function getTotalWaves(): number {
  return getTotalStages();
}

export function isBossWave(waveNumber: number): boolean {
  const { mapIndex, stage } = useGameStore.getState();
  return isBossStage(mapIndex, stage + 1);
}

export function getWaveMapName(_waveNumber: number): string | null {
  return getCurrentMapName();
}

export function getWaveEnemyPreview(_waveNumber: number): { type: string; count: number; traits: string }[] | null {
  const { mapIndex, stage, wave } = useGameStore.getState();
  return getNextStagePreview(mapIndex, stage + 1, wave + 1);
}
