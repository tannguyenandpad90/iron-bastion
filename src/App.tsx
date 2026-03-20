import { GameCanvas } from './ui/components/GameCanvas';
import { HUD } from './ui/components/HUD';
import { TowerShop } from './ui/panels/TowerShop';

export default function App() {
  return (
    <div style={styles.root}>
      <HUD />
      <div style={styles.main}>
        <div style={styles.gameArea}>
          <GameCanvas />
        </div>
        <TowerShop />
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
  },
  main: {
    display: 'flex',
    flex: 1,
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
};
