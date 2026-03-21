import { useEffect, useRef } from 'react';
import { GameEngine } from '../../engine/GameEngine';

let engineInstance: GameEngine | null = null;

export function getEngine(): GameEngine | null {
  return engineInstance;
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new GameEngine();
    engineInstance = engine;

    let destroyed = false;

    engine.init(container).then(() => {
      if (!destroyed) {
        engine.start();
      }
    }).catch((err) => {
      console.error('GameEngine init failed:', err);
    });

    return () => {
      destroyed = true;
      engine.destroy();
      engineInstance = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ display: 'block', lineHeight: 0 }}
    />
  );
}
