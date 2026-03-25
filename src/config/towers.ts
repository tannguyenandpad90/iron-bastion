import type { TowerType, TowerStats } from '../types';

export const TOWER_CONFIG: Record<TowerType, TowerStats> = {
  cannon: {
    damage: 30, range: 3, fireRate: 1.2, cost: 50, upgradeCost: 35,
    projectileSpeed: 450,
  },
  laser: {
    damage: 6, range: 4.5, fireRate: 10, cost: 75, upgradeCost: 50,
    projectileSpeed: 0,
    statusOnHit: { type: 'burn', duration: 2000, intensity: 4 },
  },
  aoe: {
    damage: 18, range: 2.5, fireRate: 0.6, cost: 100, upgradeCost: 70,
    projectileSpeed: 300,
    statusOnHit: { type: 'slow', duration: 1500, intensity: 0.3 },
  },
  sniper: {
    damage: 120, range: 7, fireRate: 0.3, cost: 150, upgradeCost: 100,
    projectileSpeed: 900,
  },
  tesla: {
    damage: 15, range: 3, fireRate: 2, cost: 125, upgradeCost: 85,
    projectileSpeed: 600,
    statusOnHit: { type: 'chain', duration: 0, intensity: 3 },
  },
  flame: {
    damage: 8, range: 2, fireRate: 8, cost: 90, upgradeCost: 60,
    projectileSpeed: 0, // instant cone
    statusOnHit: { type: 'burn', duration: 3000, intensity: 6 },
  },
  missile: {
    damage: 60, range: 5, fireRate: 0.4, cost: 175, upgradeCost: 120,
    projectileSpeed: 250,
    statusOnHit: { type: 'stun', duration: 800, intensity: 1 },
  },
  railgun: {
    damage: 200, range: 10, fireRate: 0.15, cost: 250, upgradeCost: 180,
    projectileSpeed: 1500,
  },
  plasma: {
    damage: 300, range: 6, fireRate: 0.1, cost: 400, upgradeCost: 250,
    projectileSpeed: 150, // very slow orb
    statusOnHit: { type: 'burn', duration: 4000, intensity: 12 },
  },
};

export const TOWER_UPGRADE_MULTIPLIER = 1.2;
export const MAX_TOWER_LEVEL = 10;

// Milestone upgrades — unlock at specific levels
export interface MilestoneBonus {
  level: number;
  name: string;
  effect: string;
}

export const TOWER_MILESTONES: Record<TowerType, MilestoneBonus[]> = {
  cannon: [
    { level: 3, name: 'Heavy Shell', effect: '+50% damage' },
    { level: 6, name: 'Armor Piercing', effect: 'Ignores 30% armor' },
    { level: 9, name: 'Double Shot', effect: 'Fires 2 projectiles' },
  ],
  laser: [
    { level: 3, name: 'Focused Beam', effect: '+25% range' },
    { level: 6, name: 'Plasma Burn', effect: 'Burn intensity x2' },
    { level: 9, name: 'Beam Split', effect: 'Hits 2 targets' },
  ],
  aoe: [
    { level: 3, name: 'Wider Blast', effect: '+40% splash radius' },
    { level: 6, name: 'Concussion', effect: 'Stun 0.5s on hit' },
    { level: 9, name: 'Napalm', effect: 'Leaves burn zone 3s' },
  ],
  sniper: [
    { level: 3, name: 'Marksman', effect: '+20% crit chance' },
    { level: 6, name: 'Penetrator', effect: 'Pierces through enemies' },
    { level: 9, name: 'Killshot', effect: '3x damage to enemies <25% HP' },
  ],
  tesla: [
    { level: 3, name: 'Surge', effect: '+2 chain targets' },
    { level: 6, name: 'Overload', effect: 'Chain stuns 0.3s' },
    { level: 9, name: 'Storm', effect: 'Chain hits all in range' },
  ],
  flame: [
    { level: 3, name: 'Napalm Tips', effect: 'Burn duration +50%' },
    { level: 6, name: 'Inferno', effect: 'Cone width x2' },
    { level: 9, name: 'Hellfire', effect: 'Enemies explode on death' },
  ],
  missile: [
    { level: 3, name: 'Cluster', effect: 'Splits into 3 mini missiles' },
    { level: 6, name: 'Seeker', effect: 'Never misses, +50% speed' },
    { level: 9, name: 'Thermobaric', effect: '2x blast radius + stun 2s' },
  ],
  railgun: [
    { level: 3, name: 'Overcharge', effect: '+100% damage, slower fire' },
    { level: 6, name: 'Pierce All', effect: 'Hits all enemies in line' },
    { level: 9, name: 'Orbital', effect: 'Instant hit + screen shake' },
  ],
  plasma: [
    { level: 3, name: 'Plasma Core', effect: '+50% blast radius' },
    { level: 6, name: 'Singularity', effect: 'Pulls enemies inward' },
    { level: 9, name: 'Nova Burst', effect: '3x explosion + devastate' },
  ],
};

export const TOWER_DESCRIPTIONS: Record<TowerType, { name: string; desc: string; color: string; key: string }> = {
  cannon:  { name: 'Cannon',     desc: 'Reliable single-target',    color: '#00F5A0', key: '1' },
  laser:   { name: 'Laser',      desc: 'Continuous beam + burn',    color: '#00E5FF', key: '2' },
  aoe:     { name: 'AoE',        desc: 'Splash damage + slow',      color: '#FF3D6E', key: '3' },
  sniper:  { name: 'Sniper',     desc: 'Extreme range, huge DMG',   color: '#FFD166', key: '4' },
  tesla:   { name: 'Tesla',      desc: 'Chain lightning x3',        color: '#9B5CFF', key: '5' },
  flame:   { name: 'Flamethrower', desc: 'Close range burn cone',   color: '#FF8C00', key: '6' },
  missile: { name: 'Missile',    desc: 'Heavy AoE + stun',          color: '#FF4444', key: '7' },
  railgun: { name: 'Railgun',    desc: 'Maximum damage, slow fire', color: '#44DDFF', key: '8' },
  plasma:  { name: 'Plasma Cannon', desc: 'Devastating orb + mega explosion', color: '#FF00FF', key: '9' },
};
