import { useGameStore } from '../../stores/gameStore';
import type { SkillType } from '../../types';
import { SKILL_CONFIG } from '../../config/skills';

const SKILL_INFO: Record<SkillType, { name: string; key: string; color: string }> = {
  emp: { name: 'EMP', key: 'Q', color: '#9B5CFF' },
  airstrike: { name: 'STRIKE', key: 'W', color: '#FF5C5C' },
  freeze: { name: 'FREEZE', key: 'E', color: '#00BFFF' },
};

export function SkillBar() {
  const { skills, energy, activeSkill, setActiveSkill, phase } = useGameStore();
  if (phase === 'gameover' || phase === 'victory') return null;

  return (
    <div style={styles.container}>
      <div style={styles.skills}>
        {skills.map((skill) => {
          const info = SKILL_INFO[skill.type];
          const cfg = SKILL_CONFIG[skill.type];
          const onCd = skill.currentCooldown > 0;
          const hasE = energy >= skill.energyCost;
          const ok = !onCd && hasE && phase === 'wave';
          const active = activeSkill === skill.type;
          const cdSec = Math.ceil(skill.currentCooldown / 1000);

          return (
            <button
              key={skill.type}
              onClick={() => ok && setActiveSkill(active ? null : skill.type)}
              disabled={!ok}
              style={{
                ...styles.skill,
                opacity: ok ? 1 : 0.3,
                borderColor: active ? info.color : ok ? '#1E2D42' : '#111825',
                boxShadow: active ? `0 0 10px ${info.color}40` : 'none',
              }}
            >
              <div style={{ ...styles.skillName, color: info.color }}>{info.name}</div>
              <div style={styles.skillKey}>[{info.key}]</div>
              {onCd && (
                <>
                  <div style={{ ...styles.cdOverlay, height: `${(skill.currentCooldown / cfg.cooldown) * 100}%` }} />
                  <div style={styles.cdText}>{cdSec}s</div>
                </>
              )}
              <div style={styles.energyCost}>{skill.energyCost}E</div>
            </button>
          );
        })}
      </div>
      {activeSkill && (
        <div style={{ ...styles.hint, color: SKILL_INFO[activeSkill].color }}>
          Click target on map
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '6px 12px', fontFamily: "'Exo 2', monospace" },
  skills: { display: 'flex', gap: 6, justifyContent: 'center' },
  skill: {
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '5px 12px', border: '1px solid #1E2D42',
    borderRadius: 4, overflow: 'hidden', minWidth: 65, background: '#0D1220',
    color: '#8A9ABB', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  skillName: { fontSize: 11, fontWeight: 700 },
  skillKey: { fontSize: 8, color: '#3A4A6A' },
  cdOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(0,0,0,0.6)', pointerEvents: 'none',
  },
  cdText: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 13, fontWeight: 800, color: '#fff', pointerEvents: 'none',
  },
  energyCost: { fontSize: 8, color: '#9B5CFF', marginTop: 2 },
  hint: { fontSize: 10, marginTop: 3, textAlign: 'center', fontWeight: 600 },
};
