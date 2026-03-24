import { useStatsStore } from '../../stores/statsStore';
import { CAMPAIGN } from '../../config/campaign';

export function MapSelector({ onStart }: { onStart: () => void }) {
  const stats = useStatsStore();
  const totalStages = CAMPAIGN.reduce((s, m) => s + m.stages, 0);

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.logo}>IRON BASTION</div>
        <div style={styles.subtitle}>LAST PROTOCOL</div>

        <div style={styles.info}>
          {CAMPAIGN.length} Maps — {totalStages} Stages — Defend the Core
        </div>

        <button style={styles.startBtn} onClick={onStart}>
          {stats.gamesPlayed > 0 ? 'CONTINUE MISSION' : 'BEGIN MISSION'}
        </button>

        {stats.gamesPlayed > 0 && (
          <div style={styles.stats}>
            <div style={styles.statsTitle}>COMMAND HISTORY</div>
            <div style={styles.statsGrid}>
              <StatBox label="BEST SCORE" value={stats.bestScore} color="#00E5FF" />
              <StatBox label="BEST WAVE" value={stats.bestWave} color="#00F5A0" />
              <StatBox label="MAPS CLEARED" value={stats.bestMap} color="#FFD166" />
              <StatBox label="TOTAL KILLS" value={stats.totalKills} color="#FF3D6E" />
              <StatBox label="GOLD EARNED" value={stats.totalGoldEarned} color="#FFD166" />
              <StatBox label="TOWERS BUILT" value={stats.totalTowersBuilt} color="#9B5CFF" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={styles.statBox}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color }}>{value.toLocaleString()}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: '#0B0F1A',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200,
    fontFamily: "'Exo 2', monospace",
  },
  panel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    padding: 48,
  },
  logo: {
    fontSize: 40, fontWeight: 800, color: '#00F5A0', letterSpacing: 8,
    textShadow: '0 0 30px #00F5A033, 0 0 60px #00F5A011',
  },
  subtitle: {
    fontSize: 13, color: '#4A5A7A', letterSpacing: 8, fontWeight: 600, marginTop: -8,
  },
  info: { fontSize: 11, color: '#2A3A55', letterSpacing: 2, marginTop: 4 },
  startBtn: {
    marginTop: 16, padding: '14px 44px',
    border: '2px solid #00F5A0', borderRadius: 4,
    background: 'rgba(0,245,160,0.06)', color: '#00F5A0',
    cursor: 'pointer', fontSize: 15, fontWeight: 800, letterSpacing: 5,
    boxShadow: '0 0 20px #00F5A020, inset 0 0 10px #00F5A010',
    fontFamily: "'Exo 2', monospace",
  },
  stats: {
    marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '16px 24px', background: '#0D1220',
    border: '1px solid #1E2D42', borderRadius: 6, minWidth: 340,
  },
  statsTitle: { fontSize: 10, color: '#3A4A6A', letterSpacing: 4, fontWeight: 600 },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%',
  },
  statBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '6px 4px', background: '#0B0F1A', borderRadius: 4,
    border: '1px solid #1A2333',
  },
  statLabel: { fontSize: 7, color: '#3A4A6A', letterSpacing: 1, fontWeight: 600 },
  statValue: { fontSize: 14, fontWeight: 800 },
};
