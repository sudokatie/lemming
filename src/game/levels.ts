import { Level } from './types';
import { TERRAIN_EMPTY, TERRAIN_DIRT, TERRAIN_STEEL } from './constants';

// Helper to create terrain filled with a value
function createTerrain(width: number, height: number, fill: number = TERRAIN_EMPTY): number[][] {
  return Array.from({ length: height }, () => Array(width).fill(fill));
}

// Helper to draw a horizontal line
function drawLine(terrain: number[][], y: number, x1: number, x2: number, value: number): void {
  for (let x = x1; x <= x2; x++) {
    if (terrain[y]) terrain[y][x] = value;
  }
}

// Helper to draw a filled rectangle
function drawRect(terrain: number[][], x1: number, y1: number, x2: number, y2: number, value: number): void {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (terrain[y]) terrain[y][x] = value;
    }
  }
}

// Level 1: Just Walk - Flat ground, direct path to exit
function createLevel1(): Level {
  const width = 200;
  const height = 100;
  const terrain = createTerrain(width, height);
  
  // Ground at y=80
  drawRect(terrain, 0, 80, width - 1, height - 1, TERRAIN_DIRT);
  
  return {
    id: 1,
    name: 'Just Walk',
    width,
    height,
    terrainData: terrain,
    totalLemmings: 10,
    requiredSaved: 100,
    timeLimit: 120,
    spawnRate: 40,
    spawnX: 30,
    spawnY: 60,
    exitX: 170,
    exitY: 70,
    abilities: { blocker: 0, builder: 0, digger: 0 },
  };
}

// Level 2: Turn Around - Cliff ahead, use blocker to redirect
function createLevel2(): Level {
  const width = 200;
  const height = 100;
  const terrain = createTerrain(width, height);
  
  // Ground platform
  drawRect(terrain, 0, 80, 100, height - 1, TERRAIN_DIRT);
  
  // Second platform with exit (lemmings walk left into cliff without blocker)
  drawRect(terrain, 0, 80, 50, height - 1, TERRAIN_DIRT);
  
  // Cliff/gap from 100-120
  // Platform on left side where exit is
  drawRect(terrain, 0, 80, 40, height - 1, TERRAIN_DIRT);
  
  // Main platform
  drawRect(terrain, 60, 80, 150, height - 1, TERRAIN_DIRT);
  
  return {
    id: 2,
    name: 'Turn Around',
    width,
    height,
    terrainData: terrain,
    totalLemmings: 10,
    requiredSaved: 80,
    timeLimit: 120,
    spawnRate: 40,
    spawnX: 120,
    spawnY: 60,
    exitX: 20,
    exitY: 70,
    abilities: { blocker: 2, builder: 0, digger: 0 },
  };
}

// Level 3: Build a Bridge - Gap requires builder
function createLevel3(): Level {
  const width = 200;
  const height = 100;
  const terrain = createTerrain(width, height);
  
  // Left platform
  drawRect(terrain, 0, 70, 80, height - 1, TERRAIN_DIRT);
  
  // Right platform (lower)
  drawRect(terrain, 120, 80, width - 1, height - 1, TERRAIN_DIRT);
  
  // Gap from 80-120
  
  return {
    id: 3,
    name: 'Build a Bridge',
    width,
    height,
    terrainData: terrain,
    totalLemmings: 10,
    requiredSaved: 80,
    timeLimit: 180,
    spawnRate: 50,
    spawnX: 30,
    spawnY: 50,
    exitX: 170,
    exitY: 70,
    abilities: { blocker: 1, builder: 5, digger: 0 },
  };
}

// Level 4: Dig Down - Wall blocking, dig under it
function createLevel4(): Level {
  const width = 200;
  const height = 100;
  const terrain = createTerrain(width, height);
  
  // Ground level
  drawRect(terrain, 0, 60, width - 1, height - 1, TERRAIN_DIRT);
  
  // Wall blocking the path (steel on top so can't bash through)
  drawRect(terrain, 90, 30, 100, 59, TERRAIN_DIRT);
  drawRect(terrain, 90, 30, 100, 40, TERRAIN_STEEL);
  
  // Hollow under the wall for lemmings to walk through after digging
  drawRect(terrain, 85, 75, 110, 79, TERRAIN_EMPTY);
  
  return {
    id: 4,
    name: 'Dig Down',
    width,
    height,
    terrainData: terrain,
    totalLemmings: 10,
    requiredSaved: 80,
    timeLimit: 180,
    spawnRate: 50,
    spawnX: 30,
    spawnY: 40,
    exitX: 170,
    exitY: 50,
    abilities: { blocker: 1, builder: 0, digger: 3 },
  };
}

// Level 5: Combination - Uses all three abilities
function createLevel5(): Level {
  const width = 250;
  const height = 120;
  const terrain = createTerrain(width, height);
  
  // Start platform (high)
  drawRect(terrain, 0, 50, 60, height - 1, TERRAIN_DIRT);
  
  // Middle platform (need to build to reach, then dig through)
  drawRect(terrain, 90, 60, 150, height - 1, TERRAIN_DIRT);
  
  // End platform with exit
  drawRect(terrain, 180, 80, width - 1, height - 1, TERRAIN_DIRT);
  
  // Wall on middle platform (need to dig)
  drawRect(terrain, 130, 40, 140, 59, TERRAIN_DIRT);
  
  return {
    id: 5,
    name: 'The Gauntlet',
    width,
    height,
    terrainData: terrain,
    totalLemmings: 15,
    requiredSaved: 70,
    timeLimit: 240,
    spawnRate: 45,
    spawnX: 30,
    spawnY: 30,
    exitX: 220,
    exitY: 70,
    abilities: { blocker: 2, builder: 8, digger: 2 },
  };
}

export const LEVELS: Level[] = [
  createLevel1(),
  createLevel2(),
  createLevel3(),
  createLevel4(),
  createLevel5(),
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find(level => level.id === id);
}

export function getTotalLevels(): number {
  return LEVELS.length;
}
