import { useGameStore } from '../../stores/gameStore';
import type { SkillType } from '../../types';
import { SKILL_CONFIG } from '../../config/skills';

const SKILL_INFO: Record<SkillType, { name: string; key: string; color: string }> = {
  emp: { name: 'EMP', key: 'Q', color: '#4488ff' },
  airstrike: { name: 'Airstrike', key: 'W', color: '#ff4444' },
  freeze: { name: 'Freeze', key: 'E', color: '#44ddff' },
};

export function SkillBar() {
  const { skills, energy, activeSkill, setActiveSkill, phase } = useGameStore();

  if (phase === 'gameover' || phase === 'victory') return null;

  return (
    <div style={styles.container}>
      <div style={styles.title}>SKILLS</div>
      <div style={styles.skills}>
        {skills.map((skill) => {
          const info = SKILL_INFO[skill.type];
          const config = SKILL_CONFIG[skill.type];
          const onCooldown = skill.currentCooldown > 0;
          const hasEnergy = energy >= skill.energyCost;
          const available = !onCooldown && hasEnergy && phase === 'wave';
          const isActive = activeSkill === skill.type;
          const cooldownSec = Math.ceil(skill.currentCooldown / 1000);

          return (
            <button
              key={skill.type}
              onClick={() => {
                if (available) setActiveSkill(isActive ? null : skill.type);
              }}
              disabled={!available}
              style={{
                ...styles.skill,
                opacity: available ? 1 : 0.35,
                borderColor: isActive ? info.color : available ? '#555' : '#333',
                background: isActive ? `${info.color}20` : '#111',
                cursor: available ? 'pointer' : 'default',
              }}
            >
              <div style={{ ...styles.skillName, color: info.color }}>{info.name}</div>
              <div style={styles.skillDesc}>{config.description}</div>
              <div style={styles.skillKey}>[{info.key}]</div>
              {onCooldown && (
                <>
                  <div
                    style={{
                      ...styles.cooldownOverlay,
                      height: `${(skill.currentCooldown / config.cooldown) * 100}%`,
                    }}
                  />
                  <div style={styles.cooldownText}>{cooldownSec}s</div>
                </>
              )}
              <div style={styles.energyCost}>{skill.energyCost}E</div>
            </button>
          );
        })}
      </div>
      {activeSkill && (
        <div style={styles.hint}>Click on the map to use {SKILL_INFO[activeSkill].name}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 12px',
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 10,
    color: '#7b68ee',
    letterSpacing: 2,
    marginBottom: 6,
  },
  skills: {
    display: 'flex',
    gap: 8,
  },
  skill: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '6px 10px',
    border: '1px solid #333',
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: 72,
    color: '#eee',
  },
  skillName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  skillDesc: {
    fontSize: 8,
    color: '#777',
    textAlign: 'center',
  },
  skillKey: {
    fontSize: 9,
    color: '#555',
    marginTop: 2,
  },
  cooldownOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0,0,0,0.6)',
    pointerEvents: 'none',
  },
  cooldownText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    pointerEvents: 'none',
  },
  energyCost: {
    fontSize: 9,
    color: '#7b68ee',
    marginTop: 2,
  },
  hint: {
    fontSize: 10,
    color: '#ff4444',
    marginTop: 4,
    textAlign: 'center',
  },
};
