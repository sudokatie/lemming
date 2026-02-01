import { Direction, Position } from './types';

// Display
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const GAME_HEIGHT = 400;
export const UI_HEIGHT = 100;

// Lemming physics
export const LEMMING_WIDTH = 6;
export const LEMMING_HEIGHT = 10;
export const LEMMING_WALK_SPEED = 0.5;
export const LEMMING_FALL_SPEED = 2;
export const FATAL_FALL_DISTANCE = 60;
export const DEFAULT_SPAWN_RATE = 50;

// Abilities
export const BUILDER_BRICKS = 12;
export const BUILDER_BRICK_WIDTH = 6;
export const BUILDER_BRICK_HEIGHT = 2;
export const DIGGER_RATE = 3;
export const DIGGER_WIDTH = 8;

// Terrain
export const TERRAIN_EMPTY = 0;
export const TERRAIN_DIRT = 1;
export const TERRAIN_STEEL = 2;

// Animation
export const SPAWN_DURATION = 20;
export const DEATH_DURATION = 30;
export const EXIT_DURATION = 20;

// Levels
export const TOTAL_LEVELS = 5;

// Direction vectors
export const DIRECTIONS: Record<Direction, Position> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Colors
export const COLORS = {
  background: '#1a1a2e',
  terrain: '#8b4513',
  steel: '#4169e1',
  lemming: '#00ff00',
  lemmingHair: '#4a90d9',
  lemmingDying: '#ff0000',
  exit: '#ffd700',
  trapdoor: '#808080',
  water: '#1e90ff',
  selection: 'rgba(255, 255, 0, 0.5)',
  ui: {
    panel: '#2d2d44',
    button: '#3d3d5c',
    buttonHover: '#4d4d6c',
    buttonActive: '#5d5d7c',
    buttonDisabled: '#1d1d2c',
    text: '#ffffff',
    textMuted: '#888888',
    accent: '#00ff00',
    danger: '#ff4444',
  },
};
