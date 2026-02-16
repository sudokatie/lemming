/**
 * Sound system for Lemming using Web Audio API.
 * Generates retro-style synthesized sounds.
 */

type SoundType =
  | 'spawn'
  | 'abilityAssign'
  | 'death'
  | 'saved'
  | 'levelWin'
  | 'levelLose'
  | 'digging'
  | 'building';

class SoundSystem {
  private static instance: SoundSystem;
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  private constructor() {}

  static getInstance(): SoundSystem {
    if (!SoundSystem.instance) {
      SoundSystem.instance = new SoundSystem();
    }
    return SoundSystem.instance;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (!this.context) {
      try {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    return this.context;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  play(sound: SoundType): void {
    if (!this.enabled) return;
    
    const ctx = this.getContext();
    if (!ctx) return;

    switch (sound) {
      case 'spawn':
        this.playSpawn(ctx);
        break;
      case 'abilityAssign':
        this.playAbilityAssign(ctx);
        break;
      case 'death':
        this.playDeath(ctx);
        break;
      case 'saved':
        this.playSaved(ctx);
        break;
      case 'levelWin':
        this.playLevelWin(ctx);
        break;
      case 'levelLose':
        this.playLevelLose(ctx);
        break;
      case 'digging':
        this.playDigging(ctx);
        break;
      case 'building':
        this.playBuilding(ctx);
        break;
    }
  }

  private playSpawn(ctx: AudioContext): void {
    // Short "pop" for lemming appearing
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  private playAbilityAssign(ctx: AudioContext): void {
    // Positive chirp for ability assignment
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  private playDeath(ctx: AudioContext): void {
    // Sad descending tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  private playSaved(ctx: AudioContext): void {
    // Happy ascending note
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(this.volume * 0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  private playLevelWin(ctx: AudioContext): void {
    // Victory fanfare
    const melody = [
      { freq: 523.25, time: 0, dur: 0.12 },      // C5
      { freq: 659.25, time: 0.12, dur: 0.12 },   // E5
      { freq: 783.99, time: 0.24, dur: 0.12 },   // G5
      { freq: 1046.50, time: 0.36, dur: 0.25 },  // C6
    ];
    
    melody.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.02);
      gain.gain.setValueAtTime(this.volume * 0.3, startTime + dur - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);
      
      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  private playLevelLose(ctx: AudioContext): void {
    // Sad descending melody
    const melody = [
      { freq: 392, time: 0, dur: 0.2 },       // G4
      { freq: 349.23, time: 0.2, dur: 0.2 },  // F4
      { freq: 293.66, time: 0.4, dur: 0.3 },  // D4
    ];
    
    melody.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.02);
      gain.gain.setValueAtTime(this.volume * 0.35, startTime + dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);
      
      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  private playDigging(ctx: AudioContext): void {
    // Scratchy digging noise
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * Math.sin(t * 80);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
    
    noise.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
  }

  private playBuilding(ctx: AudioContext): void {
    // Click/clack for placing a step
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }
}

export const Sound = SoundSystem.getInstance();
