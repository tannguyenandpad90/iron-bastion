import { useGameStore } from '../../stores/gameStore';
import { MAP_LIST } from '../../config/maps';
import type { MapId } from '../../types';

const DIFF_COLORS: Record<string, string> = {
  Normal: '#00d4ff',
  Hard: '#ffd700',
  Expert: '#e94560',
};

export function MapSelector({ onStart }: { onStart: () => void }) {
  const { mapId, setMapId } = useGameStore();

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.title}>IRON BASTION</div>
        <div style={styles.subtitle}>SELECT MAP</div>

        <div style={styles.maps}>
          {MAP_LIST.map((m) => (
            <button
              key={m.id}
              onClick={() => setMapId(m.id as MapId)}
              style={{
                ...styles.mapBtn,
                borderColor: mapId === m.id ? DIFF_COLORS[m.difficulty] : '#333',
                background: mapId === m.id ? `${DIFF_COLORS[m.difficulty]}15` : '#111',
              }}
            >
              <div style={styles.mapName}>{m.name}</div>
              <div style={{ ...styles.mapDiff, color: DIFF_COLORS[m.difficulty] }}>
                {m.difficulty}
              </div>
            </button>
          ))}
        </div>

        <button style={styles.startBtn} onClick={onStart}>
          DEPLOY BASTION
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    fontFamily: 'monospace',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: 40,
    background: '#1a1a2e',
    border: '2px solid #e94560',
    borderRadius: 8,
    minWidth: 320,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4ff',
    letterSpacing: 6,
    textShadow: '0 0 20px rgba(0,212,255,0.4)',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 4,
  },
  maps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  mapBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    border: '2px solid #333',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#eee',
    fontFamily: 'monospace',
  },
  mapName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapDiff: {
    fontSize: 11,
    letterSpacing: 2,
  },
  startBtn: {
    marginTop: 8,
    padding: '14px 40px',
    border: '2px solid #00d4ff',
    borderRadius: 4,
    background: 'rgba(0,212,255,0.1)',
    color: '#00d4ff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
};
