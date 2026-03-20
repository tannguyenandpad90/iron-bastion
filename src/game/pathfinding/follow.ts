import type { Enemy, GridPosition, WorldPosition } from '../../types';

export interface MoveResult {
  position: WorldPosition;
  pathIndex: number;
  pathProgress: number;
  reachedEnd: boolean;
}

export function getNextPosition(
  enemy: Enemy,
  path: GridPosition[],
  cellSize: number,
  dt: number,
  speedMultiplier = 1,
): MoveResult {
  let pathIndex = enemy.pathIndex;
  let pathProgress = enemy.pathProgress;
  const speed = enemy.stats.speed * cellSize * speedMultiplier; // cells/sec * pixels/cell
  let remaining = speed * dt;

  while (remaining > 0 && pathIndex < path.length - 1) {
    const current = path[pathIndex];
    const next = path[pathIndex + 1];

    const fromX = current.col * cellSize + cellSize / 2;
    const fromY = current.row * cellSize + cellSize / 2;
    const toX = next.col * cellSize + cellSize / 2;
    const toY = next.row * cellSize + cellSize / 2;

    const segDx = toX - fromX;
    const segDy = toY - fromY;
    const segLen = Math.sqrt(segDx * segDx + segDy * segDy);

    const distLeft = segLen * (1 - pathProgress);

    if (remaining >= distLeft) {
      // Move to next segment
      remaining -= distLeft;
      pathIndex++;
      pathProgress = 0;
    } else {
      // Partial move within segment
      pathProgress += remaining / segLen;
      remaining = 0;
    }
  }

  // Reached end of path
  if (pathIndex >= path.length - 1) {
    const lastCell = path[path.length - 1];
    return {
      position: {
        x: lastCell.col * cellSize + cellSize / 2,
        y: lastCell.row * cellSize + cellSize / 2,
      },
      pathIndex: path.length - 1,
      pathProgress: 1,
      reachedEnd: true,
    };
  }

  // Interpolate position within current segment
  const current = path[pathIndex];
  const next = path[pathIndex + 1];

  const fromX = current.col * cellSize + cellSize / 2;
  const fromY = current.row * cellSize + cellSize / 2;
  const toX = next.col * cellSize + cellSize / 2;
  const toY = next.row * cellSize + cellSize / 2;

  return {
    position: {
      x: fromX + (toX - fromX) * pathProgress,
      y: fromY + (toY - fromY) * pathProgress,
    },
    pathIndex,
    pathProgress,
    reachedEnd: false,
  };
}
