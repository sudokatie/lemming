import { GameState, GameStatus, Ability, AbilityCount, Hitbox } from './types';
import { Level, getLevel, getTotalLevels } from './levels';
import { Terrain } from './Terrain';
import { Lemming } from './Lemming';
import { Sound } from './Sound';
import { getDailyLevelIds, DailyLeaderboard, todayString, generateShareCode } from './Daily';
import { Replay, ReplayData, ReplayFrame } from './Replay';

export class Game {
  private state: GameState;
  private terrain: Terrain | null;
  private lemmings: Lemming[];
  private level: Level | null;
  private framesSinceSpawn: number;
  private lastFrameTime: number;

  // Daily challenge state
  private dailyMode: boolean = false;
  private dailyLevels: number[] = [];
  private dailyLevelIndex: number = 0;
  private dailyTotalSaved: number = 0;
  private dailyTotalRequired: number = 0;
  private dailyStartTime: number = 0;

  // Replay state
  private replay: Replay = new Replay();
  private replayMode: boolean = false;
  private replayData: ReplayData | null = null;

  // Callbacks
  onDailyComplete?: (result: {
    totalSaved: number;
    totalRequired: number;
    levelsCompleted: number;
    timeSeconds: number;
    shareCode: string;
  }) => void;
  onGameOver?: (replayData: ReplayData) => void;

  constructor() {
    this.state = this.createInitialState();
    this.terrain = null;
    this.lemmings = [];
    this.level = null;
    this.framesSinceSpawn = 0;
    this.lastFrameTime = 0;
  }

  private createInitialState(): GameState {
    return {
      status: 'title',
      currentLevel: 1,
      lemmingsOut: 0,
      lemmingsSaved: 0,
      lemmingsLost: 0,
      timeRemaining: 0,
      abilities: { blocker: 0, builder: 0, digger: 0 },
      selectedAbility: null,
      selectedLemming: null,
      dailyMode: false,
    };
  }

  getState(): GameState {
    const state = { ...this.state };
    state.dailyMode = this.dailyMode;
    
    if (this.dailyMode) {
      state.dailyProgress = {
        current: this.dailyLevelIndex + 1,
        total: this.dailyLevels.length,
        totalSaved: this.dailyTotalSaved + this.state.lemmingsSaved,
        totalRequired: this.dailyTotalRequired,
      };
    }
    
    return state;
  }

  getTerrain(): Terrain | null {
    return this.terrain;
  }

  getLemmings(): Lemming[] {
    return this.lemmings;
  }

  getLevel(): Level | null {
    return this.level;
  }

  loadLevel(levelId: number): void {
    const level = getLevel(levelId);
    if (!level) {
      throw new Error(`Level ${levelId} not found`);
    }

    this.level = level;
    this.terrain = new Terrain(level.width, level.height, level.terrainData);
    this.lemmings = [];
    this.framesSinceSpawn = 0;

    this.state = {
      status: 'playing',
      currentLevel: levelId,
      lemmingsOut: 0,
      lemmingsSaved: 0,
      lemmingsLost: 0,
      timeRemaining: level.timeLimit,
      abilities: { ...level.abilities },
      selectedAbility: null,
      selectedLemming: null,
      dailyMode: this.dailyMode,
    };

    // Start recording if not in replay mode
    if (!this.replayMode) {
      this.replay.startRecording(levelId, this.dailyMode);
    }
  }

  update(deltaTime: number): void {
    if (this.state.status !== 'playing' || !this.level || !this.terrain) {
      return;
    }

    // Spawn lemmings
    this.handleSpawning();

    // Update each lemming
    this.updateLemmings();

    // Check for exits
    this.checkExits();

    // Update timer
    this.updateTimer(deltaTime);

    // Check win/lose
    this.checkGameEnd();

    // Clean up dead/saved lemmings
    this.cleanupLemmings();
  }

  private handleSpawning(): void {
    if (!this.level) return;
    if (this.state.lemmingsOut >= this.level.totalLemmings) return;

    this.framesSinceSpawn++;
    if (this.framesSinceSpawn >= this.level.spawnRate) {
      const lemming = new Lemming(
        this.state.lemmingsOut,
        this.level.spawnX,
        this.level.spawnY
      );
      this.lemmings.push(lemming);
      this.state.lemmingsOut++;
      this.framesSinceSpawn = 0;
      Sound.play('spawn');
    }
  }

  private updateLemmings(): void {
    if (!this.terrain) return;

    for (const lemming of this.lemmings) {
      if (!lemming.isAlive()) continue;

      // Check blocker collisions before updating
      this.checkBlockerCollision(lemming);

      // Update lemming state
      lemming.update(this.terrain);
    }
  }

  private checkBlockerCollision(lemming: Lemming): void {
    // Blockers don't get affected by other blockers
    if (lemming.getState() === 'blocking') return;
    
    // Only walking lemmings can be turned by blockers
    if (lemming.getState() !== 'walking') return;

    const hitbox = lemming.getHitbox();

    for (const other of this.lemmings) {
      if (other.getState() !== 'blocking') continue;
      if (other.getId() === lemming.getId()) continue;

      const blockerHitbox = other.getHitbox();

      if (this.hitboxesOverlap(hitbox, blockerHitbox)) {
        lemming.turnAround();
        break;
      }
    }
  }

  private hitboxesOverlap(a: Hitbox, b: Hitbox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private checkExits(): void {
    if (!this.level) return;

    for (const lemming of this.lemmings) {
      if (lemming.getState() !== 'walking') continue;

      const pos = lemming.getPosition();
      const dist = Math.hypot(
        pos.x - this.level.exitX,
        pos.y - this.level.exitY
      );

      if (dist < 15) {
        lemming.reachExit();
        Sound.play('saved');
      }
    }
  }

  private updateTimer(deltaTime: number): void {
    this.state.timeRemaining -= deltaTime;
    if (this.state.timeRemaining < 0) {
      this.state.timeRemaining = 0;
    }
  }

  private checkGameEnd(): void {
    if (!this.level) return;

    // Count states
    let activeCount = 0;
    let savedCount = 0;
    let lostCount = 0;

    for (const lemming of this.lemmings) {
      if (lemming.isSaved()) {
        savedCount++;
      } else if (lemming.isDead()) {
        lostCount++;
      } else {
        activeCount++;
      }
    }

    this.state.lemmingsSaved = savedCount;
    this.state.lemmingsLost = lostCount;

    const allDone = activeCount === 0 && this.state.lemmingsOut >= this.level.totalLemmings;
    const timerExpired = this.state.timeRemaining <= 0;

    if (allDone || timerExpired) {
      const percentage = (savedCount / this.level.totalLemmings) * 100;
      const won = percentage >= this.level.requiredSaved;
      this.state.status = won ? 'won' : 'lost';
      Sound.play(won ? 'levelWin' : 'levelLose');
      
      // Stop recording and emit replay data
      if (!this.replayMode && !this.dailyMode && this.replay.isRecording) {
        const replayData = this.replay.stopRecording(savedCount, won ? 1 : 0);
        this.onGameOver?.(replayData);
      }
      return;
    }

    // Check if mathematically impossible
    const remaining = this.level.totalLemmings - this.state.lemmingsOut;
    const possible = savedCount + activeCount + remaining;
    const maxPercentage = (possible / this.level.totalLemmings) * 100;

    if (maxPercentage < this.level.requiredSaved) {
      this.state.status = 'lost';
      Sound.play('levelLose');
      
      // Stop recording and emit replay data
      if (!this.replayMode && !this.dailyMode && this.replay.isRecording) {
        const replayData = this.replay.stopRecording(savedCount, 0);
        this.onGameOver?.(replayData);
      }
    }
  }

  private cleanupLemmings(): void {
    // Remove lemmings that have completed their death/save animations
    this.lemmings = this.lemmings.filter(lemming => {
      if (lemming.isSaved()) return false;
      if (lemming.isDead()) return false;
      return true;
    });
  }

  // Actions
  selectAbility(ability: Ability): void {
    if (this.state.abilities[ability] <= 0) return;
    if (this.replayMode) return; // Ignore during replay
    
    this.state.selectedAbility = ability;
    
    // Record for replay
    if (this.replay.isRecording) {
      this.replay.recordAbilitySelect(ability);
    }
  }

  clearSelection(): void {
    this.state.selectedAbility = null;
    this.state.selectedLemming = null;
  }

  clickLemming(lemmingId: number): boolean {
    if (!this.state.selectedAbility) return false;
    if (this.replayMode) return false; // Ignore during replay

    const lemming = this.lemmings.find(l => l.getId() === lemmingId);
    if (!lemming) return false;

    if (lemming.assignAbility(this.state.selectedAbility)) {
      // Record for replay
      if (this.replay.isRecording) {
        this.replay.recordLemmingClick(lemmingId);
      }
      
      this.state.abilities[this.state.selectedAbility]--;
      this.state.selectedAbility = null;
      Sound.play('abilityAssign');
      return true;
    }
    return false;
  }

  getLemmingAt(x: number, y: number): Lemming | null {
    // Find lemming whose hitbox contains point
    for (const lemming of this.lemmings) {
      if (!lemming.isAlive()) continue;
      const hitbox = lemming.getHitbox();
      if (
        x >= hitbox.x &&
        x <= hitbox.x + hitbox.width &&
        y >= hitbox.y &&
        y <= hitbox.y + hitbox.height
      ) {
        return lemming;
      }
    }
    return null;
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
    }
  }

  restart(): void {
    if (this.level) {
      this.loadLevel(this.level.id);
    }
  }

  nextLevel(): void {
    if (this.dailyMode) {
      // In daily mode, advance to next daily level
      this.dailyTotalSaved += this.state.lemmingsSaved;
      if (this.level) {
        this.dailyTotalRequired += this.level.requiredSaved;
      }
      this.dailyLevelIndex++;
      
      if (this.dailyLevelIndex < this.dailyLevels.length) {
        this.loadLevel(this.dailyLevels[this.dailyLevelIndex]);
      } else {
        // Daily complete
        const timeSeconds = Math.floor((Date.now() - this.dailyStartTime) / 1000);
        const shareCode = generateShareCode(todayString(), this.dailyTotalSaved, this.dailyLevels.length);
        
        this.onDailyComplete?.({
          totalSaved: this.dailyTotalSaved,
          totalRequired: this.dailyTotalRequired,
          levelsCompleted: this.dailyLevels.length,
          timeSeconds,
          shareCode,
        });
      }
    } else {
      const next = this.state.currentLevel + 1;
      if (next <= getTotalLevels()) {
        this.loadLevel(next);
      }
    }
  }

  /** Start a daily challenge */
  startDaily(): void {
    this.dailyMode = true;
    this.dailyLevels = getDailyLevelIds(getTotalLevels());
    this.dailyLevelIndex = 0;
    this.dailyTotalSaved = 0;
    this.dailyTotalRequired = 0;
    this.dailyStartTime = Date.now();
    
    this.loadLevel(this.dailyLevels[0]);
  }

  /** Exit daily mode */
  exitDaily(): void {
    this.dailyMode = false;
    this.dailyLevels = [];
    this.dailyLevelIndex = 0;
    this.dailyTotalSaved = 0;
    this.dailyTotalRequired = 0;
    
    this.state = this.createInitialState();
  }

  /** Submit daily score */
  submitDailyScore(name: string): number | null {
    const timeSeconds = Math.floor((Date.now() - this.dailyStartTime) / 1000);
    return DailyLeaderboard.recordScore(
      name,
      this.dailyTotalSaved,
      this.dailyTotalRequired,
      this.dailyLevels.length,
      timeSeconds
    );
  }

  /** Check if in daily mode */
  isDailyMode(): boolean {
    return this.dailyMode;
  }

  prevLevel(): void {
    const prev = this.state.currentLevel - 1;
    if (prev >= 1) {
      this.loadLevel(prev);
    }
  }

  isGameOver(): boolean {
    return this.state.status === 'won' || this.state.status === 'lost';
  }

  hasWon(): boolean {
    return this.state.status === 'won';
  }

  hasLost(): boolean {
    return this.state.status === 'lost';
  }

  // Replay methods

  /** Start playing a replay */
  startReplay(data: ReplayData): void {
    this.replayMode = true;
    this.replayData = data;
    this.loadLevel(data.levelIndex);
    this.replay.startPlayback(data);
  }

  /** Stop replay playback */
  stopReplay(): void {
    this.replay.stopPlayback();
    this.replayMode = false;
    this.replayData = null;
  }

  /** Check if in replay mode */
  isReplayMode(): boolean {
    return this.replayMode;
  }

  /** Get replay playback progress (0-1) */
  getReplayProgress(): number {
    return this.replay.playbackProgress;
  }

  /** Process replay action (call each frame during replay) */
  processReplayAction(): void {
    if (!this.replayMode || !this.replay.isPlaying) return;
    
    const action = this.replay.getNextAction();
    if (action) {
      if (action.type === 'selectAbility' && action.ability) {
        // Directly set ability without recording
        if (this.state.abilities[action.ability] > 0) {
          this.state.selectedAbility = action.ability;
        }
      } else if (action.type === 'clickLemming' && action.lemmingId !== undefined) {
        // Apply ability directly
        const lemming = this.lemmings.find(l => l.getId() === action.lemmingId);
        if (lemming && this.state.selectedAbility) {
          if (lemming.assignAbility(this.state.selectedAbility)) {
            this.state.abilities[this.state.selectedAbility]--;
            this.state.selectedAbility = null;
            Sound.play('abilityAssign');
          }
        }
      }
    }
  }

  /** Check if replay playback is complete */
  isReplayComplete(): boolean {
    return this.replay.isPlaybackComplete;
  }
}
