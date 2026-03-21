import { useEffect, useRef } from 'react';
import { GameEngine } from '../../engine/GameEngine';

// Singleton engine reference accessible from outside React
let engineInstance: GameEngine | null = null;

export function getEngine(): GameEngine | null {
  return engineInstance;
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double-init from StrictMode
    if (engineRef.current) return;

    const container = containerRef.current;
    const engine = new GameEngine();
    engineRef.current = engine;
    engineInstance = engine;

    engine.init(container).then(() => {
      engine.start();
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
      engineInstance = null;
      // Clean up any leftover canvas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'block',
        lineHeight: 0,
      }}
    />
  );
}
