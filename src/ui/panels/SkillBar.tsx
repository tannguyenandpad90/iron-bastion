import { useGameStore } from '../../stores/gameStore';
import type { SkillType } from '../../types';
import { SKILL_CONFIG } from '../../config/skills';

const SKILL_INFO: Record<SkillType, { name: string; icon: string; key: string }> = {
  emp: { name: 'EMP', icon: 'E', key: 'Q' },
  airstrike: { name: 'Airstrike', icon: 'A', key: 'W' },
  freeze: { name: 'Freeze', icon: 'F', key: 'E' },
};

export function SkillBar() {
  const { skills, energy } = useGameStore();

  return (
    <div style={styles.container}>
      <div style={styles.title}>SKILLS</div>
      <div style={styles.skills}>
        {skills.map((skill) => {
          const info = SKILL_INFO[skill.type];
          const config = SKILL_CONFIG[skill.type];
          const onCooldown = skill.currentCooldown > 0;
          const hasEnergy = energy >= skill.energyCost;
          const available = !onCooldown && hasEnergy;
          const cooldownPercent = onCooldown
            ? skill.currentCooldown / config.cooldown
            : 0;

          return (
            <div
              key={skill.type}
              style={{
                ...styles.skill,
                opacity: available ? 1 : 0.4,
                borderColor: available ? '#7b68ee' : '#333',
              }}
            >
              <div style={styles.skillIcon}>{info.icon}</div>
              <div style={styles.skillName}>{info.name}</div>
              <div style={styles.skillKey}>[{info.key}]</div>
              {onCooldown && (
                <div
                  style={{
                    ...styles.cooldownOverlay,
                    height: `${cooldownPercent * 100}%`,
                  }}
                />
              )}
              <div style={styles.energyCost}>{skill.energyCost}E</div>
            </div>
          );
        })}
      </div>
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
    background: '#111',
    cursor: 'pointer',
    overflow: 'hidden',
    minWidth: 60,
  },
  skillIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7b68ee',
  },
  skillName: {
    fontSize: 9,
    color: '#aaa',
  },
  skillKey: {
    fontSize: 9,
    color: '#555',
  },
  cooldownOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0,0,0,0.6)',
    pointerEvents: 'none',
  },
  energyCost: {
    fontSize: 9,
    color: '#7b68ee',
    marginTop: 2,
  },
};
