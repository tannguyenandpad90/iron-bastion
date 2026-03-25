import { Howl } from 'howler';

// Synthesize sounds using Web Audio API since we have no audio files
// This creates procedural sound effects

class SoundSynth {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  play(type: SoundType) {
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') ctx.resume();

      switch (type) {
        case 'shoot_cannon': this.playTone(ctx, 200, 0.08, 'square', 0.15); break;
        case 'shoot_laser': this.playTone(ctx, 800, 0.05, 'sawtooth', 0.08); break;
        case 'shoot_aoe': this.playTone(ctx, 150, 0.12, 'triangle', 0.12); break;
        case 'shoot_sniper': this.playTone(ctx, 400, 0.15, 'square', 0.2); break;
        case 'shoot_tesla': this.playNoise(ctx, 0.06, 0.1); break;
        case 'shoot_flame': this.playNoise(ctx, 0.04, 0.08); break;
        case 'shoot_missile': this.playTone(ctx, 120, 0.15, 'sawtooth', 0.18); break;
        case 'shoot_railgun': this.playTone(ctx, 600, 0.2, 'square', 0.2, true); break;
        case 'shoot_plasma': this.playPlasmaShot(ctx); break;
        case 'plasma_boom': this.playPlasmaBoom(ctx); break;
        case 'hit': this.playTone(ctx, 300, 0.04, 'square', 0.06); break;
        case 'kill': this.playTone(ctx, 600, 0.08, 'sine', 0.1, true); break;
        case 'boss_kill': this.playBossKill(ctx); break;
        case 'wave_start': this.playWaveStart(ctx); break;
        case 'wave_clear': this.playWaveClear(ctx); break;
        case 'place_tower': this.playTone(ctx, 500, 0.06, 'sine', 0.1); break;
        case 'upgrade': this.playUpgrade(ctx); break;
        case 'sell': this.playTone(ctx, 400, 0.1, 'triangle', 0.08); break;
        case 'skill_emp': this.playNoise(ctx, 0.2, 0.15); break;
        case 'skill_airstrike': this.playAirstrike(ctx); break;
        case 'skill_freeze': this.playTone(ctx, 1200, 0.15, 'sine', 0.1); break;
        case 'life_lost': this.playTone(ctx, 100, 0.2, 'sawtooth', 0.2); break;
        case 'game_over': this.playGameOver(ctx); break;
        case 'victory': this.playVictory(ctx); break;
        case 'click': this.playTone(ctx, 700, 0.03, 'sine', 0.05); break;
      }
    } catch {
      // Audio not available — silently ignore
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    waveType: OscillatorType,
    volume: number,
    descend = false,
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (descend) {
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(ctx: AudioContext, duration: number, volume: number) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }

  private playWaveStart(ctx: AudioContext) {
    this.playTone(ctx, 400, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(ctx, 600, 0.1, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(ctx, 800, 0.15, 'sine', 0.12), 200);
  }

  private playWaveClear(ctx: AudioContext) {
    this.playTone(ctx, 600, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(ctx, 800, 0.1, 'sine', 0.1), 120);
    setTimeout(() => this.playTone(ctx, 1000, 0.2, 'sine', 0.1), 240);
  }

  private playUpgrade(ctx: AudioContext) {
    this.playTone(ctx, 500, 0.08, 'sine', 0.1);
    setTimeout(() => this.playTone(ctx, 700, 0.08, 'sine', 0.1), 80);
    setTimeout(() => this.playTone(ctx, 900, 0.12, 'sine', 0.1), 160);
  }

  private playBossKill(ctx: AudioContext) {
    this.playNoise(ctx, 0.3, 0.15);
    setTimeout(() => this.playTone(ctx, 200, 0.3, 'sawtooth', 0.12, true), 100);
    setTimeout(() => this.playTone(ctx, 800, 0.4, 'sine', 0.1), 300);
  }

  private playAirstrike(ctx: AudioContext) {
    this.playTone(ctx, 100, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.playNoise(ctx, 0.4, 0.2), 150);
  }

  private playPlasmaShot(ctx: AudioContext) {
    // Deep rumble + high whine
    this.playTone(ctx, 80, 0.3, 'sawtooth', 0.15);
    this.playTone(ctx, 600, 0.2, 'sine', 0.08);
    setTimeout(() => this.playTone(ctx, 400, 0.15, 'sine', 0.06), 50);
  }

  private playPlasmaBoom(ctx: AudioContext) {
    // Massive boom: low rumble + noise + descending tone
    this.playTone(ctx, 60, 0.5, 'sawtooth', 0.2);
    this.playNoise(ctx, 0.4, 0.25);
    setTimeout(() => this.playTone(ctx, 200, 0.4, 'square', 0.15, true), 50);
    setTimeout(() => this.playNoise(ctx, 0.3, 0.15), 150);
    setTimeout(() => this.playTone(ctx, 100, 0.3, 'sawtooth', 0.1, true), 250);
  }

  private playGameOver(ctx: AudioContext) {
    this.playTone(ctx, 400, 0.2, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(ctx, 300, 0.2, 'sawtooth', 0.15), 200);
    setTimeout(() => this.playTone(ctx, 200, 0.4, 'sawtooth', 0.15), 400);
  }

  private playVictory(ctx: AudioContext) {
    [500, 600, 700, 800, 1000].forEach((freq, i) => {
      setTimeout(() => this.playTone(ctx, freq, 0.15, 'sine', 0.1), i * 120);
    });
  }
}

export type SoundType =
  | 'shoot_cannon' | 'shoot_laser' | 'shoot_aoe' | 'shoot_sniper' | 'shoot_tesla'
  | 'shoot_flame' | 'shoot_missile' | 'shoot_railgun' | 'shoot_plasma' | 'plasma_boom'
  | 'hit' | 'kill' | 'boss_kill'
  | 'wave_start' | 'wave_clear'
  | 'place_tower' | 'upgrade' | 'sell'
  | 'skill_emp' | 'skill_airstrike' | 'skill_freeze'
  | 'life_lost' | 'game_over' | 'victory'
  | 'click';

class AudioManager {
  private synth = new SoundSynth();
  private _muted = false;
  private _volume = 0.7;

  // Background music using Howler (simple loop)
  private bgm: Howl | null = null;

  get muted() { return this._muted; }
  get volume() { return this._volume; }

  play(type: SoundType) {
    if (this._muted) return;
    this.synth.play(type);
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    if (this.bgm) {
      this.bgm.mute(muted);
    }
  }

  setVolume(vol: number) {
    this._volume = Math.max(0, Math.min(1, vol));
    Howler.volume(this._volume);
  }

  toggleMute() {
    this.setMuted(!this._muted);
  }
}

// Singleton
export const audio = new AudioManager();
