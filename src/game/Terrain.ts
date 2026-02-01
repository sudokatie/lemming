import { Direction } from './types';
import {
  TERRAIN_EMPTY,
  TERRAIN_DIRT,
  TERRAIN_STEEL,
  LEMMING_WIDTH,
  LEMMING_HEIGHT,
} from './constants';

interface ModifiedArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Terrain {
  private data: number[][];
  private width: number;
  private height: number;
  private modifiedAreas: ModifiedArea[];

  constructor(width: number, height: number, data: number[][]) {
    this.width = width;
    this.height = height;
    // Deep copy to avoid modifying original level data
    this.data = data.map(row => [...row]);
    this.modifiedAreas = [];
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getData(): number[][] {
    return this.data;
  }

  getModifiedAreas(): ModifiedArea[] {
    return this.modifiedAreas;
  }

  clearModifiedAreas(): void {
    this.modifiedAreas = [];
  }

  private isOutOfBounds(x: number, y: number): boolean {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    return ix < 0 || ix >= this.width || iy < 0 || iy >= this.height;
  }

  private getCell(x: number, y: number): number {
    if (this.isOutOfBounds(x, y)) {
      return TERRAIN_DIRT; // Walls at edges
    }
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    return this.data[iy][ix];
  }

  isGround(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    return cell !== TERRAIN_EMPTY;
  }

  isEmpty(x: number, y: number): boolean {
    return this.getCell(x, y) === TERRAIN_EMPTY;
  }

  isSteel(x: number, y: number): boolean {
    return this.getCell(x, y) === TERRAIN_STEEL;
  }

  isDirt(x: number, y: number): boolean {
    return this.getCell(x, y) === TERRAIN_DIRT;
  }

  // Check if there's a wall in the given direction at lemming's position
  isWall(x: number, y: number, direction: Direction): boolean {
    const checkX = direction === 'right' ? x + LEMMING_WIDTH : x - 1;
    // Check 3 points vertically at mid-height
    for (let dy = 2; dy <= 6; dy++) {
      if (this.isGround(checkX, y + dy)) {
        return true;
      }
    }
    return false;
  }

  // Check if there's a ceiling above
  isCeiling(x: number, y: number): boolean {
    // Check a few points above the lemming
    for (let dx = 0; dx < LEMMING_WIDTH; dx++) {
      if (this.isGround(x + dx, y - 1)) {
        return true;
      }
    }
    return false;
  }

  // Check multiple points under lemming's feet
  checkFeet(x: number, y: number): boolean {
    const footY = y + LEMMING_HEIGHT;
    // Check 3 points: left, center, right
    return (
      this.isGround(x, footY) ||
      this.isGround(x + LEMMING_WIDTH / 2, footY) ||
      this.isGround(x + LEMMING_WIDTH, footY)
    );
  }

  // Dig terrain at position - returns false if hit steel
  dig(x: number, y: number, width: number): boolean {
    const startX = Math.floor(x);
    const startY = Math.floor(y);

    // Check for steel first
    for (let dx = 0; dx < width; dx++) {
      const checkX = startX + dx;
      if (!this.isOutOfBounds(checkX, startY)) {
        if (this.data[startY][checkX] === TERRAIN_STEEL) {
          return false;
        }
      }
    }

    // Clear dirt
    let modified = false;
    for (let dx = 0; dx < width; dx++) {
      const checkX = startX + dx;
      if (!this.isOutOfBounds(checkX, startY)) {
        if (this.data[startY][checkX] === TERRAIN_DIRT) {
          this.data[startY][checkX] = TERRAIN_EMPTY;
          modified = true;
        }
      }
    }

    if (modified) {
      this.modifiedAreas.push({ x: startX, y: startY, w: width, h: 1 });
    }
    return true;
  }

  // Build terrain at position
  build(x: number, y: number, width: number, height: number): void {
    const startX = Math.floor(x);
    const startY = Math.floor(y);

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const bx = startX + dx;
        const by = startY + dy;
        if (!this.isOutOfBounds(bx, by)) {
          if (this.data[by][bx] === TERRAIN_EMPTY) {
            this.data[by][bx] = TERRAIN_DIRT;
          }
        }
      }
    }

    this.modifiedAreas.push({ x: startX, y: startY, w: width, h: height });
  }
}
