/**
 * Music system for Lemming using Web Audio API.
 * Generates retro-style chiptune background music.
 */

type MusicTrack = 'gameplay' | 'menu';

class MusicSystem {
  private static instance: MusicSystem;
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.12;
  private currentTrack: MusicTrack | null = null;
  private isPlaying: boolean = false;
  private loopTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): MusicSystem {
    if (!MusicSystem.instance) {
      MusicSystem.instance = new MusicSystem();
    }
    return MusicSystem.instance;
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
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  private noteToFreq(note: string): number {
    const notes: Record<string, number> = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
      'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
    };
    return notes[note] || 440;
  }

  private playNote(freq: number, startTime: number, duration: number, vol: number = 1): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; // Softer tone for puzzle game
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(this.volume * vol * 0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.95);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Gameplay track - calm, contemplative
  private getGameplayNotes(): { frequency: number; duration: number }[] {
    const bpm = 90;
    const beat = 60 / bpm;
    const quarter = beat;
    const eighth = beat / 2;
    const half = beat * 2;
    
    // Gentle, thoughtful melody
    const melody = [
      { note: 'C4', dur: quarter },
      { note: 'E4', dur: eighth },
      { note: 'G4', dur: eighth },
      { note: 'E4', dur: quarter },
      { note: 'D4', dur: half },
      
      { note: 'E4', dur: quarter },
      { note: 'G4', dur: eighth },
      { note: 'A4', dur: eighth },
      { note: 'G4', dur: quarter },
      { note: 'E4', dur: half },
      
      { note: 'F4', dur: quarter },
      { note: 'A4', dur: eighth },
      { note: 'G4', dur: eighth },
      { note: 'F4', dur: quarter },
      { note: 'E4', dur: quarter },
      { note: 'D4', dur: quarter },
      
      { note: 'C4', dur: quarter },
      { note: 'E4', dur: quarter },
      { note: 'D4', dur: quarter },
      { note: 'C4', dur: half },
    ];
    
    return melody.map(n => ({
      frequency: this.noteToFreq(n.note),
      duration: n.dur,
    }));
  }

  private scheduleTrack(notes: { frequency: number; duration: number }[]): number {
    const ctx = this.getContext();
    if (!ctx) return 0;

    let time = ctx.currentTime + 0.1;
    let totalDuration = 0;

    for (const note of notes) {
      this.playNote(note.frequency, time, note.duration);
      time += note.duration;
      totalDuration += note.duration;
    }

    return totalDuration;
  }

  play(track: MusicTrack = 'gameplay'): void {
    if (!this.enabled) return;
    
    if (this.isPlaying && this.currentTrack !== track) {
      this.stop();
    }
    
    if (this.isPlaying) return;
    
    this.currentTrack = track;
    this.isPlaying = true;
    
    this.loopTrack();
  }

  private loopTrack(): void {
    if (!this.isPlaying || !this.enabled) return;

    const notes = this.getGameplayNotes();
    const duration = this.scheduleTrack(notes);
    
    this.loopTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.loopTrack();
      }
    }, duration * 1000 - 100);
  }

  stop(): void {
    this.isPlaying = false;
    this.currentTrack = null;
    
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  toggle(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const Music = MusicSystem.getInstance();
