import { useState, useCallback } from 'react';
import { GameCanvas } from './ui/components/GameCanvas';
import { HUD } from './ui/components/HUD';
import { ProgressBar } from './ui/components/ProgressBar';
import { BossHealthBar } from './ui/components/BossHealthBar';
import { TowerShop } from './ui/panels/TowerShop';
import { TowerInfo } from './ui/panels/TowerInfo';
import { SkillBar } from './ui/panels/SkillBar';
import { WaveAnnounce } from './ui/panels/WaveAnnounce';
import { PauseMenu } from './ui/panels/PauseMenu';
import { GameOverScreen } from './ui/panels/GameOverScreen';
import { MapSelector } from './ui/panels/MapSelector';
import { Tutorial } from './ui/panels/Tutorial';
import { useGameStore } from './stores/gameStore';

export default function App() {
  const selectedTowerId = useGameStore((s) => s.selectedTowerId);
  const [screen, setScreen] = useState<'menu' | 'tutorial' | 'game'>('menu');

  const handleQuit = useCallback(() => setScreen('menu'), []);
  const handleStart = useCallback(() => {
    // Check if first time (no localStorage flag)
    const played = localStorage.getItem('ib-played');
    if (!played) {
      localStorage.setItem('ib-played', '1');
      setScreen('tutorial');
    } else {
      setScreen('game');
    }
  }, []);

  if (screen === 'menu') {
    return (
      <div style={styles.root}>
        <MapSelector onStart={handleStart} />
      </div>
    );
  }

  if (screen === 'tutorial') {
    return (
      <div style={styles.root}>
        <Tutorial onDone={() => setScreen('game')} />
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <HUD />
      <ProgressBar />
      <div style={styles.main}>
        <div style={styles.gameArea}>
          <div style={styles.canvasWrapper}>
            <GameCanvas key={useGameStore.getState().mapId} />
            <BossHealthBar />
            <WaveAnnounce />
            <PauseMenu onQuit={handleQuit} />
            <GameOverScreen onQuit={handleQuit} />
          </div>
          <SkillBar />
        </div>
        <div style={styles.sidebar}>
          {selectedTowerId ? <TowerInfo /> : <TowerShop />}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#0B0F1A', overflow: 'hidden', userSelect: 'none',
    fontFamily: "'Exo 2', monospace",
  },
  main: { display: 'flex', flex: 1, minHeight: 0 },
  gameArea: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', minWidth: 0,
  },
  canvasWrapper: { position: 'relative', display: 'inline-block' },
  sidebar: { flexShrink: 0 },
};
