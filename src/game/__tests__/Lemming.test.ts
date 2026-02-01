import { Lemming } from '../Lemming';
import { Terrain } from '../Terrain';
import {
  TERRAIN_EMPTY,
  TERRAIN_DIRT,
  SPAWN_DURATION,
  DEATH_DURATION,
  LEMMING_WALK_SPEED,
  FATAL_FALL_DISTANCE,
  BUILDER_BRICKS,
} from '../constants';

describe('Lemming', () => {
  // Helper to create terrain with ground at specific y
  function createGroundTerrain(groundY: number = 80): Terrain {
    const pattern = Array(100).fill(null).map((_, y) => {
      return Array(100).fill(y >= groundY ? TERRAIN_DIRT : TERRAIN_EMPTY);
    });
    return new Terrain(100, 100, pattern);
  }

  // Helper to create empty terrain (no ground)
  function createEmptyTerrain(): Terrain {
    const pattern = Array(100).fill(null).map(() => Array(100).fill(TERRAIN_EMPTY));
    return new Terrain(100, 100, pattern);
  }

  describe('constructor', () => {
    it('should initialize with spawning state', () => {
      const lemming = new Lemming(1, 50, 50);
      expect(lemming.getState()).toBe('spawning');
    });

    it('should initialize with correct position', () => {
      const lemming = new Lemming(1, 50, 60);
      const pos = lemming.getPosition();
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(60);
    });

    it('should initialize facing right', () => {
      const lemming = new Lemming(1, 50, 50);
      expect(lemming.getDirection()).toBe('right');
    });

    it('should store id', () => {
      const lemming = new Lemming(42, 0, 0);
      expect(lemming.getId()).toBe(42);
    });
  });

  describe('spawning state', () => {
    it('should transition to walking after spawn duration', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Update until spawn complete
      for (let i = 0; i < SPAWN_DURATION; i++) {
        expect(lemming.getState()).toBe('spawning');
        lemming.update(terrain);
      }

      expect(lemming.getState()).toBe('walking');
    });
  });

  describe('walking state', () => {
    it('should move right when facing right', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      const startX = lemming.getPosition().x;
      lemming.update(terrain);
      const endX = lemming.getPosition().x;

      expect(endX).toBeGreaterThan(startX);
      expect(endX - startX).toBeCloseTo(LEMMING_WALK_SPEED);
    });

    it('should turn around when hitting a wall', () => {
      const lemming = new Lemming(1, 50, 50);
      // Create terrain with wall at x=57 (just past lemming width of 6)
      const pattern = Array(100).fill(null).map((_, y) => {
        const row = Array(100).fill(y >= 60 ? TERRAIN_DIRT : TERRAIN_EMPTY);
        // Wall from y=52 to y=58
        if (y >= 52 && y <= 58) row[57] = TERRAIN_DIRT;
        return row;
      });
      const terrain = new Terrain(100, 100, pattern);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getDirection()).toBe('right');

      // Walk until hitting wall
      for (let i = 0; i < 20; i++) {
        lemming.update(terrain);
        if (lemming.getDirection() === 'left') break;
      }

      expect(lemming.getDirection()).toBe('left');
    });

    it('should start falling when no ground', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createEmptyTerrain();

      // Skip spawning
      for (let i = 0; i <= SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getState()).toBe('falling');
    });
  });

  describe('falling state', () => {
    it('should accumulate fall distance', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createEmptyTerrain();

      // Skip spawning and trigger first walking update (which starts falling)
      for (let i = 0; i <= SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getState()).toBe('falling');

      const distBefore = lemming.getFallDistance();
      lemming.update(terrain);
      expect(lemming.getFallDistance()).toBeGreaterThan(distBefore);
    });

    it('should land safely when fall distance under fatal', () => {
      const lemming = new Lemming(1, 50, 50);
      // Ground close enough for safe landing
      const terrain = createGroundTerrain(70);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      // Fall until landing
      while (lemming.getState() === 'falling') {
        lemming.update(terrain);
      }

      expect(lemming.getState()).toBe('walking');
      expect(lemming.isAlive()).toBe(true);
    });

    it('should die when fall distance exceeds fatal', () => {
      const lemming = new Lemming(1, 50, 10);
      // Ground far enough for fatal fall (need > 60px)
      const terrain = createGroundTerrain(80);

      // Skip spawning and trigger first walking update
      for (let i = 0; i <= SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      // Should be falling now
      expect(lemming.getState()).toBe('falling');

      // Fall until landing
      for (let i = 0; i < 100 && lemming.getState() === 'falling'; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getState()).toBe('dying');
    });
  });

  describe('ability assignment', () => {
    it('should only work in walking state', () => {
      const lemming = new Lemming(1, 50, 50);
      
      // Try during spawning
      expect(lemming.assignAbility('blocker')).toBe(false);
      expect(lemming.getState()).toBe('spawning');
    });

    it('should assign blocker ability', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      expect(lemming.assignAbility('blocker')).toBe(true);
      expect(lemming.getState()).toBe('blocking');
    });

    it('should assign builder ability', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      expect(lemming.assignAbility('builder')).toBe(true);
      expect(lemming.getState()).toBe('building');
    });

    it('should assign digger ability', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      expect(lemming.assignAbility('digger')).toBe(true);
      expect(lemming.getState()).toBe('digging');
    });
  });

  describe('blocking state', () => {
    it('should stay in blocking state', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      lemming.assignAbility('blocker');
      const startX = lemming.getPosition().x;

      // Update many times
      for (let i = 0; i < 100; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getState()).toBe('blocking');
      expect(lemming.getPosition().x).toBe(startX);
    });
  });

  describe('building state', () => {
    it('should place bricks and move up', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      const startY = lemming.getPosition().y;
      lemming.assignAbility('builder');

      // Update until some bricks placed
      for (let i = 0; i < 50; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getBuildCount()).toBeGreaterThan(0);
      expect(lemming.getPosition().y).toBeLessThan(startY);
    });

    it('should return to walking after 12 bricks', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(100);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      lemming.assignAbility('builder');

      // Update until done building
      for (let i = 0; i < 200; i++) {
        lemming.update(terrain);
        if (lemming.getState() === 'walking') break;
      }

      expect(lemming.getState()).toBe('walking');
    });
  });

  describe('digging state', () => {
    it('should dig down through terrain', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      // Skip spawning
      for (let i = 0; i < SPAWN_DURATION; i++) {
        lemming.update(terrain);
      }

      const startY = lemming.getPosition().y;
      lemming.assignAbility('digger');

      // Update until moved down
      for (let i = 0; i < 20; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getPosition().y).toBeGreaterThan(startY);
    });
  });

  describe('death state', () => {
    it('should report dead after death duration', () => {
      const lemming = new Lemming(1, 50, 50);
      lemming.die();

      expect(lemming.isDead()).toBe(false);

      const terrain = createEmptyTerrain();
      for (let i = 0; i < DEATH_DURATION; i++) {
        lemming.update(terrain);
      }

      expect(lemming.isDead()).toBe(true);
    });

    it('should not be alive when dying', () => {
      const lemming = new Lemming(1, 50, 50);
      lemming.die();

      expect(lemming.isAlive()).toBe(false);
    });
  });

  describe('exit state', () => {
    it('should transition to saved after exit duration', () => {
      const lemming = new Lemming(1, 50, 50);
      const terrain = createGroundTerrain(60);

      lemming.reachExit();
      expect(lemming.getState()).toBe('exiting');

      for (let i = 0; i < 30; i++) {
        lemming.update(terrain);
      }

      expect(lemming.getState()).toBe('saved');
      expect(lemming.isSaved()).toBe(true);
    });
  });

  describe('hitbox', () => {
    it('should return correct hitbox', () => {
      const lemming = new Lemming(1, 50, 60);
      const hitbox = lemming.getHitbox();

      expect(hitbox.x).toBe(50);
      expect(hitbox.y).toBe(60);
      expect(hitbox.width).toBe(6);
      expect(hitbox.height).toBe(10);
    });
  });

  describe('turnAround', () => {
    it('should change direction from right to left', () => {
      const lemming = new Lemming(1, 50, 50);
      expect(lemming.getDirection()).toBe('right');

      lemming.turnAround();
      expect(lemming.getDirection()).toBe('left');
    });

    it('should change direction from left to right', () => {
      const lemming = new Lemming(1, 50, 50);
      lemming.turnAround(); // now left
      lemming.turnAround(); // now right

      expect(lemming.getDirection()).toBe('right');
    });
  });
});
