import { useGameStore } from '../../stores/gameStore';
import type { MapId } from '../../types';

export function MapSelector({ onStart }: { onStart: () => void }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.logo}>IRON BASTION</div>
        <div style={styles.subtitle}>LAST PROTOCOL</div>
        <div style={styles.tagline}>15 Maps — 300 Stages — Defend the Core</div>

        <button style={styles.startBtn} onClick={onStart}>
          DEPLOY BASTION
        </button>

        <div style={styles.info}>
          Campaign starts at Shadow Canyon. Maps auto-progress as you complete stages.
        </div>
      </div>
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
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    padding: 48,
  },
  logo: {
    fontSize: 42, fontWeight: 800, color: '#00F5A0', letterSpacing: 8,
    textShadow: '0 0 30px #00F5A033, 0 0 60px #00F5A011',
  },
  subtitle: {
    fontSize: 14, color: '#4A5A7A', letterSpacing: 8, fontWeight: 600, marginTop: -8,
  },
  tagline: {
    fontSize: 11, color: '#2A3A55', letterSpacing: 2, marginTop: 8,
  },
  startBtn: {
    marginTop: 24, padding: '16px 48px',
    border: '2px solid #00F5A0', borderRadius: 4,
    background: 'rgba(0,245,160,0.06)', color: '#00F5A0',
    cursor: 'pointer', fontFamily: "'Exo 2', monospace",
    fontSize: 16, fontWeight: 800, letterSpacing: 6,
    boxShadow: '0 0 20px #00F5A020, inset 0 0 10px #00F5A010',
    transition: 'box-shadow 0.2s',
  },
  info: {
    marginTop: 12, fontSize: 10, color: '#2A3A55', textAlign: 'center', maxWidth: 300,
  },
};
