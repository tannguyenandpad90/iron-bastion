import type { Wave, WaveSegment } from '../../types';
import { WAVES } from '../../config/waves';

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
  let cumDelay = 500; // initial delay

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
  return waveNumber % 5 === 0;
}

export function getTotalWaves(): number {
  return WAVES.length;
}
