import { GameState, GameStatus, Ability, AbilityCount, Hitbox } from './types';
import { Level, getLevel, getTotalLevels } from './levels';
import { Terrain } from './Terrain';
import { Lemming } from './Lemming';

export class Game {
  private state: GameState;
  private terrain: Terrain | null;
  private lemmings: Lemming[];
  private level: Level | null;
  private framesSinceSpawn: number;
  private lastFrameTime: number;

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
    };
  }

  getState(): GameState {
    return this.state;
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
    };
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
      this.state.status = percentage >= this.level.requiredSaved ? 'won' : 'lost';
      return;
    }

    // Check if mathematically impossible
    const remaining = this.level.totalLemmings - this.state.lemmingsOut;
    const possible = savedCount + activeCount + remaining;
    const maxPercentage = (possible / this.level.totalLemmings) * 100;

    if (maxPercentage < this.level.requiredSaved) {
      this.state.status = 'lost';
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
    this.state.selectedAbility = ability;
  }

  clearSelection(): void {
    this.state.selectedAbility = null;
    this.state.selectedLemming = null;
  }

  clickLemming(lemmingId: number): boolean {
    if (!this.state.selectedAbility) return false;

    const lemming = this.lemmings.find(l => l.getId() === lemmingId);
    if (!lemming) return false;

    if (lemming.assignAbility(this.state.selectedAbility)) {
      this.state.abilities[this.state.selectedAbility]--;
      this.state.selectedAbility = null;
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
    const next = this.state.currentLevel + 1;
    if (next <= getTotalLevels()) {
      this.loadLevel(next);
    }
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
}
