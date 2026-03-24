import { useState } from 'react';

const STEPS = [
  {
    title: 'PLACE TOWERS',
    desc: 'Select a tower from the right panel [1-5] and click a dark cell to build. Towers auto-attack enemies in range.',
    key: 'Place',
  },
  {
    title: 'DEFEND THE CORE',
    desc: 'Enemies follow the glowing path toward your CORE. If they reach it, you lose lives. Reach 0 lives = game over.',
    key: 'Defend',
  },
  {
    title: 'USE SKILLS & UPGRADE',
    desc: 'Press [Q/W/E] for skills (EMP, Airstrike, Freeze). Click a tower to upgrade or change targeting. Synergy bonus when towers are adjacent!',
    key: 'Skills',
  },
  {
    title: 'CAMPAIGN',
    desc: '15 maps, 20 stages each. Boss at stage 5, 10, 15, 20. Towers reset when moving to a new map. Good luck, Commander.',
    key: 'Campaign',
  },
];

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.stepIndicator}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ ...styles.dot, background: i <= step ? '#00F5A0' : '#1E2D42' }} />
          ))}
        </div>

        <div style={styles.title}>{current.title}</div>
        <div style={styles.desc}>{current.desc}</div>

        <div style={styles.buttons}>
          {step > 0 && (
            <button style={styles.backBtn} onClick={() => setStep(step - 1)}>
              BACK
            </button>
          )}
          <button style={styles.nextBtn} onClick={() => isLast ? onDone() : setStep(step + 1)}>
            {isLast ? 'START GAME' : 'NEXT'}
          </button>
        </div>

        <button style={styles.skipBtn} onClick={onDone}>
          Skip tutorial
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(11,15,26,0.92)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 300,
    fontFamily: "'Exo 2', monospace",
  },
  panel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    padding: '36px 44px', background: '#0D1220', border: '1px solid #1E2D42',
    borderRadius: 8, maxWidth: 400, boxShadow: '0 0 40px rgba(0,0,0,0.5)',
  },
  stepIndicator: { display: 'flex', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%', transition: 'background 0.2s' },
  title: {
    fontSize: 20, fontWeight: 800, color: '#00F5A0', letterSpacing: 4,
    textShadow: '0 0 12px #00F5A044',
  },
  desc: {
    fontSize: 12, color: '#8A9ABB', lineHeight: '1.6', textAlign: 'center',
  },
  buttons: { display: 'flex', gap: 12, marginTop: 4 },
  backBtn: {
    padding: '8px 20px', border: '1px solid #1E2D42', borderRadius: 4,
    background: '#0B0F1A', color: '#4A5A7A', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, letterSpacing: 2,
  },
  nextBtn: {
    padding: '8px 28px', border: '1px solid #00F5A0', borderRadius: 4,
    background: 'rgba(0,245,160,0.08)', color: '#00F5A0', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, letterSpacing: 2,
  },
  skipBtn: {
    padding: '4px 12px', border: 'none', background: 'none',
    color: '#2A3A55', cursor: 'pointer', fontSize: 10, marginTop: 4,
  },
};
