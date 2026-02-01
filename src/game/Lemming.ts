import { Direction, LemmingState, Ability, Position, Hitbox } from './types';
import { Terrain } from './Terrain';
import {
  LEMMING_WIDTH,
  LEMMING_HEIGHT,
  LEMMING_WALK_SPEED,
  LEMMING_FALL_SPEED,
  FATAL_FALL_DISTANCE,
  SPAWN_DURATION,
  DEATH_DURATION,
  EXIT_DURATION,
  BUILDER_BRICKS,
  BUILDER_BRICK_WIDTH,
  BUILDER_BRICK_HEIGHT,
  DIGGER_RATE,
  DIGGER_WIDTH,
} from './constants';

export class Lemming {
  private id: number;
  private x: number;
  private y: number;
  private direction: Direction;
  private state: LemmingState;
  private stateTimer: number;
  private fallDistance: number;
  private buildCount: number;
  private frameCount: number;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = 'right';
    this.state = 'spawning';
    this.stateTimer = 0;
    this.fallDistance = 0;
    this.buildCount = 0;
    this.frameCount = 0;
  }

  getId(): number {
    return this.id;
  }

  getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  getDirection(): Direction {
    return this.direction;
  }

  getState(): LemmingState {
    return this.state;
  }

  getStateTimer(): number {
    return this.stateTimer;
  }

  getFallDistance(): number {
    return this.fallDistance;
  }

  getBuildCount(): number {
    return this.buildCount;
  }

  getHitbox(): Hitbox {
    return {
      x: this.x,
      y: this.y,
      width: LEMMING_WIDTH,
      height: LEMMING_HEIGHT,
    };
  }

  isAlive(): boolean {
    return this.state !== 'dying' && this.state !== 'saved';
  }

  isSaved(): boolean {
    return this.state === 'saved';
  }

  isDead(): boolean {
    return this.state === 'dying' && this.stateTimer >= DEATH_DURATION;
  }

  isExiting(): boolean {
    return this.state === 'exiting';
  }

  getAnimationFrame(): number {
    return this.frameCount;
  }

  update(terrain: Terrain): void {
    this.stateTimer++;
    this.frameCount++;

    switch (this.state) {
      case 'spawning':
        this.handleSpawning();
        break;
      case 'walking':
        this.handleWalking(terrain);
        break;
      case 'falling':
        this.handleFalling(terrain);
        break;
      case 'blocking':
        // Just stand there
        break;
      case 'building':
        this.handleBuilding(terrain);
        break;
      case 'digging':
        this.handleDigging(terrain);
        break;
      case 'exiting':
        this.handleExiting();
        break;
      case 'dying':
        // Wait for animation to complete
        break;
      case 'saved':
        // Done
        break;
    }
  }

  private handleSpawning(): void {
    if (this.stateTimer >= SPAWN_DURATION) {
      this.state = 'walking';
      this.stateTimer = 0;
    }
  }

  private handleWalking(terrain: Terrain): void {
    // Check for ground
    if (!terrain.checkFeet(this.x, this.y)) {
      this.startFalling();
      return;
    }

    // Check for wall
    if (terrain.isWall(this.x, this.y, this.direction)) {
      this.turnAround();
      return;
    }

    // Move forward
    const dx = this.direction === 'right' ? LEMMING_WALK_SPEED : -LEMMING_WALK_SPEED;
    this.x += dx;
  }

  private handleFalling(terrain: Terrain): void {
    this.y += LEMMING_FALL_SPEED;
    this.fallDistance += LEMMING_FALL_SPEED;

    if (terrain.checkFeet(this.x, this.y)) {
      if (this.fallDistance >= FATAL_FALL_DISTANCE) {
        this.die();
      } else {
        this.land();
      }
    }
  }

  private handleBuilding(terrain: Terrain): void {
    // Every 10 frames, place a brick
    if (this.stateTimer % 10 === 0 && this.buildCount < BUILDER_BRICKS) {
      const brickX = this.direction === 'right'
        ? this.x + LEMMING_WIDTH
        : this.x - BUILDER_BRICK_WIDTH;
      const brickY = this.y + LEMMING_HEIGHT - 2 - this.buildCount * BUILDER_BRICK_HEIGHT;

      // Check for ceiling
      if (terrain.isCeiling(this.x, this.y - BUILDER_BRICK_HEIGHT)) {
        this.finishBuilding();
        return;
      }

      terrain.build(brickX, brickY, BUILDER_BRICK_WIDTH, BUILDER_BRICK_HEIGHT);
      this.buildCount++;

      // Move up and forward with stairs
      this.y -= BUILDER_BRICK_HEIGHT;
      this.x += this.direction === 'right' ? 2 : -2;
    }

    if (this.buildCount >= BUILDER_BRICKS) {
      this.finishBuilding();
    }
  }

  private finishBuilding(): void {
    this.state = 'walking';
    this.stateTimer = 0;
    this.buildCount = 0;
  }

  private handleDigging(terrain: Terrain): void {
    if (this.stateTimer % DIGGER_RATE === 0) {
      const digX = this.x - 1;
      const digY = this.y + LEMMING_HEIGHT;

      const success = terrain.dig(digX, digY, DIGGER_WIDTH);
      if (!success) {
        // Hit steel
        this.state = 'walking';
        this.stateTimer = 0;
        return;
      }

      // Move down with dig
      this.y += 1;

      // Check if we dug into empty space
      if (!terrain.checkFeet(this.x, this.y)) {
        this.startFalling();
      }
    }
  }

  private handleExiting(): void {
    if (this.stateTimer >= EXIT_DURATION) {
      this.state = 'saved';
    }
  }

  // Public state transitions
  turnAround(): void {
    this.direction = this.direction === 'right' ? 'left' : 'right';
  }

  startFalling(): void {
    this.state = 'falling';
    this.stateTimer = 0;
    this.fallDistance = 0;
  }

  land(): void {
    this.state = 'walking';
    this.stateTimer = 0;
    this.fallDistance = 0;
  }

  die(): void {
    this.state = 'dying';
    this.stateTimer = 0;
  }

  reachExit(): void {
    this.state = 'exiting';
    this.stateTimer = 0;
  }

  assignAbility(ability: Ability): boolean {
    if (this.state !== 'walking') {
      return false;
    }

    switch (ability) {
      case 'blocker':
        this.state = 'blocking';
        break;
      case 'builder':
        this.state = 'building';
        this.buildCount = 0;
        break;
      case 'digger':
        this.state = 'digging';
        break;
    }
    this.stateTimer = 0;
    return true;
  }
}
