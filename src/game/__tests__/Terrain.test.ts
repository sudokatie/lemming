import { Terrain } from '../Terrain';
import { TERRAIN_EMPTY, TERRAIN_DIRT, TERRAIN_STEEL } from '../constants';

describe('Terrain', () => {
  // Helper to create simple terrain
  function createSimpleTerrain(pattern: number[][]): Terrain {
    return new Terrain(pattern[0].length, pattern.length, pattern);
  }

  describe('constructor', () => {
    it('should deep copy terrain data', () => {
      const original = [[TERRAIN_EMPTY, TERRAIN_DIRT]];
      const terrain = new Terrain(2, 1, original);
      
      // Modify original
      original[0][0] = TERRAIN_STEEL;
      
      // Terrain should be unchanged
      expect(terrain.getData()[0][0]).toBe(TERRAIN_EMPTY);
    });

    it('should store dimensions', () => {
      const terrain = new Terrain(100, 50, []);
      expect(terrain.getWidth()).toBe(100);
      expect(terrain.getHeight()).toBe(50);
    });
  });

  describe('isGround', () => {
    it('should return true for dirt', () => {
      const terrain = createSimpleTerrain([[TERRAIN_DIRT]]);
      expect(terrain.isGround(0, 0)).toBe(true);
    });

    it('should return true for steel', () => {
      const terrain = createSimpleTerrain([[TERRAIN_STEEL]]);
      expect(terrain.isGround(0, 0)).toBe(true);
    });

    it('should return false for empty', () => {
      const terrain = createSimpleTerrain([[TERRAIN_EMPTY]]);
      expect(terrain.isGround(0, 0)).toBe(false);
    });

    it('should return true for out of bounds (edge walls)', () => {
      const terrain = createSimpleTerrain([[TERRAIN_EMPTY]]);
      expect(terrain.isGround(-1, 0)).toBe(true);
      expect(terrain.isGround(10, 0)).toBe(true);
      expect(terrain.isGround(0, -1)).toBe(true);
      expect(terrain.isGround(0, 10)).toBe(true);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty cells', () => {
      const terrain = createSimpleTerrain([[TERRAIN_EMPTY]]);
      expect(terrain.isEmpty(0, 0)).toBe(true);
    });

    it('should return false for dirt', () => {
      const terrain = createSimpleTerrain([[TERRAIN_DIRT]]);
      expect(terrain.isEmpty(0, 0)).toBe(false);
    });

    it('should return false for steel', () => {
      const terrain = createSimpleTerrain([[TERRAIN_STEEL]]);
      expect(terrain.isEmpty(0, 0)).toBe(false);
    });
  });

  describe('isSteel', () => {
    it('should return true only for steel', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_EMPTY, TERRAIN_DIRT, TERRAIN_STEEL]
      ]);
      expect(terrain.isSteel(0, 0)).toBe(false);
      expect(terrain.isSteel(1, 0)).toBe(false);
      expect(terrain.isSteel(2, 0)).toBe(true);
    });
  });

  describe('checkFeet', () => {
    it('should return true when any foot point is on ground', () => {
      // 10-pixel wide terrain, ground at row 10
      const pattern = Array(11).fill(null).map(() => Array(10).fill(TERRAIN_EMPTY));
      pattern[10] = Array(10).fill(TERRAIN_DIRT);
      const terrain = createSimpleTerrain(pattern);
      
      // Lemming at y=0, feet at y=10 (LEMMING_HEIGHT=10)
      expect(terrain.checkFeet(0, 0)).toBe(true);
    });

    it('should return false when all foot points are in air', () => {
      const pattern = Array(20).fill(null).map(() => Array(10).fill(TERRAIN_EMPTY));
      const terrain = createSimpleTerrain(pattern);
      
      expect(terrain.checkFeet(0, 0)).toBe(false);
    });
  });

  describe('isWall', () => {
    it('should detect wall on right', () => {
      // Wall at column 7
      const pattern = Array(10).fill(null).map(() => {
        const row = Array(10).fill(TERRAIN_EMPTY);
        row[7] = TERRAIN_DIRT;
        return row;
      });
      const terrain = createSimpleTerrain(pattern);
      
      // Lemming at x=1, width=6, so right edge at x=7
      expect(terrain.isWall(1, 0, 'right')).toBe(true);
    });

    it('should detect wall on left', () => {
      // Wall at column 2
      const pattern = Array(10).fill(null).map(() => {
        const row = Array(10).fill(TERRAIN_EMPTY);
        row[2] = TERRAIN_DIRT;
        return row;
      });
      const terrain = createSimpleTerrain(pattern);
      
      // Lemming at x=3, checking left at x=2
      expect(terrain.isWall(3, 0, 'left')).toBe(true);
    });

    it('should return false when no wall', () => {
      const pattern = Array(10).fill(null).map(() => Array(10).fill(TERRAIN_EMPTY));
      const terrain = createSimpleTerrain(pattern);
      
      expect(terrain.isWall(3, 0, 'right')).toBe(false);
      expect(terrain.isWall(3, 0, 'left')).toBe(false);
    });
  });

  describe('dig', () => {
    it('should remove dirt and return true', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_DIRT, TERRAIN_DIRT, TERRAIN_DIRT]
      ]);
      
      const result = terrain.dig(0, 0, 2);
      
      expect(result).toBe(true);
      expect(terrain.getData()[0][0]).toBe(TERRAIN_EMPTY);
      expect(terrain.getData()[0][1]).toBe(TERRAIN_EMPTY);
      expect(terrain.getData()[0][2]).toBe(TERRAIN_DIRT);
    });

    it('should return false and not modify when hitting steel', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_DIRT, TERRAIN_STEEL, TERRAIN_DIRT]
      ]);
      
      const result = terrain.dig(0, 0, 3);
      
      expect(result).toBe(false);
      // Original data unchanged
      expect(terrain.getData()[0][0]).toBe(TERRAIN_DIRT);
      expect(terrain.getData()[0][1]).toBe(TERRAIN_STEEL);
    });

    it('should track modified areas', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_DIRT, TERRAIN_DIRT]
      ]);
      
      terrain.dig(0, 0, 2);
      
      const areas = terrain.getModifiedAreas();
      expect(areas.length).toBe(1);
      expect(areas[0]).toEqual({ x: 0, y: 0, w: 2, h: 1 });
    });

    it('should handle empty cells', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_EMPTY, TERRAIN_DIRT]
      ]);
      
      const result = terrain.dig(0, 0, 2);
      
      expect(result).toBe(true);
      expect(terrain.getData()[0][0]).toBe(TERRAIN_EMPTY);
      expect(terrain.getData()[0][1]).toBe(TERRAIN_EMPTY);
    });
  });

  describe('build', () => {
    it('should add dirt where empty', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_EMPTY, TERRAIN_EMPTY],
        [TERRAIN_EMPTY, TERRAIN_EMPTY]
      ]);
      
      terrain.build(0, 0, 2, 2);
      
      expect(terrain.getData()[0][0]).toBe(TERRAIN_DIRT);
      expect(terrain.getData()[0][1]).toBe(TERRAIN_DIRT);
      expect(terrain.getData()[1][0]).toBe(TERRAIN_DIRT);
      expect(terrain.getData()[1][1]).toBe(TERRAIN_DIRT);
    });

    it('should not overwrite existing terrain', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_STEEL, TERRAIN_EMPTY]
      ]);
      
      terrain.build(0, 0, 2, 1);
      
      expect(terrain.getData()[0][0]).toBe(TERRAIN_STEEL);
      expect(terrain.getData()[0][1]).toBe(TERRAIN_DIRT);
    });

    it('should track modified areas', () => {
      const terrain = createSimpleTerrain([
        [TERRAIN_EMPTY, TERRAIN_EMPTY]
      ]);
      
      terrain.build(0, 0, 2, 1);
      
      const areas = terrain.getModifiedAreas();
      expect(areas.length).toBe(1);
      expect(areas[0]).toEqual({ x: 0, y: 0, w: 2, h: 1 });
    });
  });

  describe('clearModifiedAreas', () => {
    it('should clear the modified areas list', () => {
      const terrain = createSimpleTerrain([[TERRAIN_DIRT]]);
      
      terrain.dig(0, 0, 1);
      expect(terrain.getModifiedAreas().length).toBe(1);
      
      terrain.clearModifiedAreas();
      expect(terrain.getModifiedAreas().length).toBe(0);
    });
  });
});
