import { useEffect, useRef } from 'react';
import { GameEngine } from '../../engine/GameEngine';

// Singleton engine reference accessible from outside React
let engineInstance: GameEngine | null = null;

export function getEngine(): GameEngine | null {
  return engineInstance;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine();
    engineInstance = engine;

    engine.init(canvasRef.current).then(() => {
      engine.start();
    });

    return () => {
      engine.destroy();
      engineInstance = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
}
