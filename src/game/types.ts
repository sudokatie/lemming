// Position in pixels
export interface Position {
  x: number;
  y: number;
}

// Direction lemming is facing
export type Direction = 'left' | 'right';

// Lemming state machine states
export type LemmingState =
  | 'spawning'
  | 'walking'
  | 'falling'
  | 'blocking'
  | 'building'
  | 'digging'
  | 'dying'
  | 'exiting'
  | 'saved';

// Assignable abilities
export type Ability = 'blocker' | 'builder' | 'digger';

// Game status
export type GameStatus = 'title' | 'playing' | 'paused' | 'won' | 'lost';

// Lemming entity data
export interface LemmingData {
  id: number;
  x: number;
  y: number;
  direction: Direction;
  state: LemmingState;
  stateTimer: number;
  fallDistance: number;
  buildCount: number;
  isPermanentAbility: boolean;
}

// Ability inventory
export interface AbilityCount {
  blocker: number;
  builder: number;
  digger: number;
}

// Level definition
export interface Level {
  id: number;
  name: string;
  width: number;
  height: number;
  terrainData: number[][];
  totalLemmings: number;
  requiredSaved: number;
  timeLimit: number;
  spawnRate: number;
  spawnX: number;
  spawnY: number;
  exitX: number;
  exitY: number;
  abilities: AbilityCount;
}

// Full game state
export interface GameState {
  status: GameStatus;
  currentLevel: number;
  lemmingsOut: number;
  lemmingsSaved: number;
  lemmingsLost: number;
  timeRemaining: number;
  abilities: AbilityCount;
  selectedAbility: Ability | null;
  selectedLemming: number | null;
  // Daily challenge
  dailyMode: boolean;
  dailyProgress?: {
    current: number;
    total: number;
    totalSaved: number;
    totalRequired: number;
  };
}

// Hitbox rectangle
export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Input callbacks
export interface InputCallbacks {
  onLemmingClick: (x: number, y: number) => void;
  onAbilitySelect: (ability: Ability) => void;
  onPause: () => void;
  onRestart: () => void;
  onCancel: () => void;
}
