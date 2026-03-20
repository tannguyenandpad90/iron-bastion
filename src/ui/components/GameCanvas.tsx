import { useEffect, useRef } from 'react';
import { GameEngine } from '../../engine/GameEngine';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine();
    engineRef.current = engine;

    engine.init(canvasRef.current).then(() => {
      engine.start();
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
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
