import type { Ability } from './types';

/**
 * Types of replay actions
 */
export type ReplayActionType = 'selectAbility' | 'clickLemming';

/**
 * A single recorded action with timestamp
 */
export interface ReplayFrame {
  time: number;      // ms since replay start
  type: ReplayActionType;
  ability?: Ability;      // for selectAbility
  lemmingId?: number;     // for clickLemming
}

/**
 * Complete replay data for a game session
 */
export interface ReplayData {
  version: number;
  levelIndex: number;    // Starting level
  timestamp: number;     // Unix timestamp when recorded
  duration: number;      // Total replay duration in ms
  frames: ReplayFrame[];
  lemmingsSaved: number;
  levelsCompleted: number;
  dailyMode: boolean;
}

/**
 * Encodes an ability to a single character
 */
function encodeAbility(ability: Ability): string {
  switch (ability) {
    case 'blocker': return 'B';
    case 'builder': return 'U';
    case 'digger': return 'D';
  }
}

/**
 * Decodes a single character back to Ability
 */
function decodeAbility(char: string): Ability | null {
  switch (char) {
    case 'B': return 'blocker';
    case 'U': return 'builder';
    case 'D': return 'digger';
    default: return null;
  }
}

/**
 * Replay recorder and player for Lemming
 */
export class Replay {
  private _frames: ReplayFrame[] = [];
  private _startTime: number = 0;
  private _isRecording: boolean = false;
  private _isPlaying: boolean = false;
  private _playbackIndex: number = 0;
  private _playbackStartTime: number = 0;
  private _levelIndex: number = 0;
  private _dailyMode: boolean = false;

  /**
   * Start recording actions
   */
  startRecording(levelIndex: number = 0, dailyMode: boolean = false): void {
    this._frames = [];
    this._startTime = Date.now();
    this._isRecording = true;
    this._isPlaying = false;
    this._levelIndex = levelIndex;
    this._dailyMode = dailyMode;
  }

  /**
   * Record an ability selection
   */
  recordAbilitySelect(ability: Ability): void {
    if (!this._isRecording) return;
    
    this._frames.push({
      time: Date.now() - this._startTime,
      type: 'selectAbility',
      ability,
    });
  }

  /**
   * Record a lemming click
   */
  recordLemmingClick(lemmingId: number): void {
    if (!this._isRecording) return;
    
    this._frames.push({
      time: Date.now() - this._startTime,
      type: 'clickLemming',
      lemmingId,
    });
  }

  /**
   * Stop recording and return the replay data
   */
  stopRecording(lemmingsSaved: number, levelsCompleted: number): ReplayData {
    this._isRecording = false;
    
    return {
      version: 1,
      levelIndex: this._levelIndex,
      timestamp: this._startTime,
      duration: Date.now() - this._startTime,
      frames: [...this._frames],
      lemmingsSaved,
      levelsCompleted,
      dailyMode: this._dailyMode,
    };
  }

  /**
   * Check if currently recording
   */
  get isRecording(): boolean {
    return this._isRecording;
  }

  /**
   * Start playback of a replay
   */
  startPlayback(data: ReplayData): void {
    this._frames = [...data.frames];
    this._playbackIndex = 0;
    this._playbackStartTime = Date.now();
    this._isPlaying = true;
    this._isRecording = false;
    this._levelIndex = data.levelIndex;
    this._dailyMode = data.dailyMode;
  }

  /**
   * Get next action if its time has come
   * Returns null if no action ready or playback complete
   */
  getNextAction(): ReplayFrame | null {
    if (!this._isPlaying || this._playbackIndex >= this._frames.length) {
      return null;
    }

    const elapsed = Date.now() - this._playbackStartTime;
    const frame = this._frames[this._playbackIndex];

    if (elapsed >= frame.time) {
      this._playbackIndex++;
      return frame;
    }

    return null;
  }

  /**
   * Check if playback is complete
   */
  get isPlaybackComplete(): boolean {
    return this._isPlaying && this._playbackIndex >= this._frames.length;
  }

  /**
   * Check if currently playing back
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Stop playback
   */
  stopPlayback(): void {
    this._isPlaying = false;
    this._playbackIndex = 0;
  }

  /**
   * Get playback progress (0-1)
   */
  get playbackProgress(): number {
    if (!this._isPlaying || this._frames.length === 0) return 0;
    return this._playbackIndex / this._frames.length;
  }

  /**
   * Get starting level for current replay
   */
  get levelIndex(): number {
    return this._levelIndex;
  }

  /**
   * Get daily mode flag for current replay
   */
  get dailyMode(): boolean {
    return this._dailyMode;
  }

  /**
   * Encode replay data to a shareable string
   * Format: version|level|timestamp|duration|saved|levels|daily|frames
   * Frames: time,type,data;...  (data = ability char or lemming id)
   */
  static encode(data: ReplayData): string {
    const framesStr = data.frames
      .map(f => {
        if (f.type === 'selectAbility') {
          return `${f.time},S,${encodeAbility(f.ability!)}`;
        } else {
          return `${f.time},C,${f.lemmingId}`;
        }
      })
      .join(';');
    
    const parts = [
      data.version,
      data.levelIndex,
      data.timestamp,
      data.duration,
      data.lemmingsSaved,
      data.levelsCompleted,
      data.dailyMode ? 1 : 0,
      framesStr,
    ];
    
    return btoa(parts.join('|'));
  }

  /**
   * Decode a replay string back to ReplayData
   */
  static decode(encoded: string): ReplayData | null {
    try {
      const decoded = atob(encoded);
      const parts = decoded.split('|');
      
      if (parts.length < 8) return null;
      
      const [version, level, timestamp, duration, saved, levels, daily, framesStr] = parts;
      
      const parsedFrames = framesStr
        .split(';')
        .filter(f => f.length > 0)
        .map((f): ReplayFrame | null => {
          const [time, type, data] = f.split(',');
          if (type === 'S') {
            const ability = decodeAbility(data);
            if (!ability) return null;
            return { time: parseInt(time, 10), type: 'selectAbility', ability };
          } else if (type === 'C') {
            return { time: parseInt(time, 10), type: 'clickLemming', lemmingId: parseInt(data, 10) };
          }
          return null;
        });
      
      const frames: ReplayFrame[] = parsedFrames.filter((f): f is ReplayFrame => f !== null);
      
      return {
        version: parseInt(version, 10),
        levelIndex: parseInt(level, 10),
        timestamp: parseInt(timestamp, 10),
        duration: parseInt(duration, 10),
        frames,
        lemmingsSaved: parseInt(saved, 10),
        levelsCompleted: parseInt(levels, 10),
        dailyMode: daily === '1',
      };
    } catch {
      return null;
    }
  }

  /**
   * Get replay statistics
   */
  static getStats(data: ReplayData): {
    totalActions: number;
    actionsPerSecond: number;
    abilitySelections: number;
    lemmingClicks: number;
    blockerCount: number;
    builderCount: number;
    diggerCount: number;
    durationSeconds: number;
  } {
    let abilitySelections = 0;
    let lemmingClicks = 0;
    let blockerCount = 0;
    let builderCount = 0;
    let diggerCount = 0;
    
    for (const frame of data.frames) {
      if (frame.type === 'selectAbility') {
        abilitySelections++;
        switch (frame.ability) {
          case 'blocker': blockerCount++; break;
          case 'builder': builderCount++; break;
          case 'digger': diggerCount++; break;
        }
      } else {
        lemmingClicks++;
      }
    }
    
    const durationSec = data.duration / 1000;
    
    return {
      totalActions: data.frames.length,
      actionsPerSecond: durationSec > 0 ? data.frames.length / durationSec : 0,
      abilitySelections,
      lemmingClicks,
      blockerCount,
      builderCount,
      diggerCount,
      durationSeconds: durationSec,
    };
  }

  /**
   * Generate share code for a replay
   */
  static generateShareCode(data: ReplayData): string {
    const dateStr = new Date(data.timestamp).toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = data.dailyMode ? 'LEMMING-D' : 'LEMMING';
    return `${prefix}-${dateStr}-S${data.lemmingsSaved}-L${data.levelsCompleted}`;
  }
}
