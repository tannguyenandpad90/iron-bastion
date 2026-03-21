import type { Wave, WaveSegment } from '../../types';
import { WAVES } from '../../config/waves';
import { MAPS } from '../../config/maps';

export function getWave(waveNumber: number): Wave | null {
  const index = waveNumber - 1;
  if (index < 0 || index >= WAVES.length) return null;
  return WAVES[index];
}

export function getTotalEnemies(wave: Wave): number {
  return wave.segments.reduce((sum, seg) => sum + seg.count, 0);
}

export function getSpawnSchedule(wave: Wave): { segment: WaveSegment; delay: number }[] {
  const schedule: { segment: WaveSegment; delay: number }[] = [];
  let cumDelay = 500;

  for (const segment of wave.segments) {
    for (let i = 0; i < segment.count; i++) {
      schedule.push({
        segment,
        delay: i === 0 ? cumDelay : segment.interval,
      });
      cumDelay = segment.interval;
    }
  }

  return schedule;
}

export function isBossWave(waveNumber: number): boolean {
  const wave = getWave(waveNumber);
  return wave?.isBoss ?? false;
}

export function getTotalWaves(): number {
  return WAVES.length;
}

export function getWaveMapName(waveNumber: number): string | null {
  const wave = getWave(waveNumber);
  if (!wave?.mapId) return null;
  const map = MAPS[wave.mapId];
  return map?.name ?? null;
}

export function getWaveEnemyPreview(waveNumber: number): { type: string; count: number; traits: string }[] | null {
  const wave = getWave(waveNumber);
  if (!wave) return null;

  return wave.segments.map((seg) => ({
    type: seg.enemyType,
    count: seg.count,
    traits: seg.traits?.join(', ') ?? '',
  }));
}
