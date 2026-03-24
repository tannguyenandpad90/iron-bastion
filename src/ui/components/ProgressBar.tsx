import { useGameStore } from '../../stores/gameStore';
import { CAMPAIGN } from '../../config/campaign';

export function ProgressBar() {
  const { mapIndex, stage, stagesPerMap } = useGameStore();

  const completedStages = CAMPAIGN.slice(0, mapIndex).reduce((s, m) => s + m.stages, 0) + stage;
  const totalStages = CAMPAIGN.reduce((s, m) => s + m.stages, 0);
  const percent = (completedStages / totalStages) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.bar}>
        <div style={{ ...styles.fill, width: `${percent}%` }} />
        {/* Map markers */}
        {CAMPAIGN.reduce<{ pos: number; name: string }[]>((acc, m, i) => {
          const stagesBefore = CAMPAIGN.slice(0, i).reduce((s, cm) => s + cm.stages, 0);
          acc.push({ pos: (stagesBefore / totalStages) * 100, name: m.name });
          return acc;
        }, []).map((marker, i) => (
          <div
            key={i}
            style={{
              ...styles.marker,
              left: `${marker.pos}%`,
              background: i <= mapIndex ? '#00F5A0' : '#1E2D42',
            }}
            title={marker.name}
          />
        ))}
      </div>
      <div style={styles.label}>
        {completedStages}/{totalStages} stages — {Math.floor(percent)}%
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '0 20px',
    fontFamily: "'Exo 2', monospace",
  },
  bar: {
    position: 'relative', width: '100%', height: 3,
    background: '#0D1220', borderRadius: 2, overflow: 'visible',
  },
  fill: {
    height: '100%', background: 'linear-gradient(90deg, #00F5A0, #00FFCC)',
    borderRadius: 2, transition: 'width 0.5s ease',
  },
  marker: {
    position: 'absolute', top: -2, width: 3, height: 7,
    borderRadius: 1, transform: 'translateX(-50%)',
  },
  label: { fontSize: 8, color: '#2A3A55', letterSpacing: 1 },
};
