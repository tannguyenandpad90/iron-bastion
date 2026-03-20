import { GameCanvas } from './ui/components/GameCanvas';
import { HUD } from './ui/components/HUD';
import { TowerShop } from './ui/panels/TowerShop';
import { TowerInfo } from './ui/panels/TowerInfo';
import { SkillBar } from './ui/panels/SkillBar';
import { WaveAnnounce } from './ui/panels/WaveAnnounce';
import { PauseMenu } from './ui/panels/PauseMenu';
import { GameOverScreen } from './ui/panels/GameOverScreen';
import { useGameStore } from './stores/gameStore';

export default function App() {
  const selectedTowerId = useGameStore((s) => s.selectedTowerId);

  return (
    <div style={styles.root}>
      <HUD />
      <div style={styles.main}>
        <div style={styles.gameArea}>
          <div style={styles.canvasWrapper}>
            <GameCanvas />
            <WaveAnnounce />
            <PauseMenu />
            <GameOverScreen />
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
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0a0a1a',
    overflow: 'hidden',
    userSelect: 'none',
  },
  main: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  canvasWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  sidebar: {
    flexShrink: 0,
  },
};
