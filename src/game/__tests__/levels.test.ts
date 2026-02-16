import { LEVELS, getLevel, getTotalLevels } from '../levels';
import { TERRAIN_EMPTY, TERRAIN_DIRT, TERRAIN_STEEL } from '../constants';

describe('Levels', () => {
  describe('getLevel', () => {
    it('returns level by id', () => {
      const level = getLevel(1);
      expect(level).toBeDefined();
      expect(level?.id).toBe(1);
    });

    it('returns undefined for invalid id', () => {
      expect(getLevel(0)).toBeUndefined();
      expect(getLevel(999)).toBeUndefined();
    });
  });

  describe('getTotalLevels', () => {
    it('returns 7 levels', () => {
      expect(getTotalLevels()).toBe(7);
    });
  });

  describe('all levels parse correctly', () => {
    LEVELS.forEach((level) => {
      describe(`Level ${level.id}: ${level.name}`, () => {
        it('has valid id and name', () => {
          expect(level.id).toBeGreaterThan(0);
          expect(level.name).toBeTruthy();
          expect(typeof level.name).toBe('string');
        });

        it('has spawn position', () => {
          expect(level.spawnX).toBeGreaterThanOrEqual(0);
          expect(level.spawnY).toBeGreaterThanOrEqual(0);
          expect(level.spawnX).toBeLessThan(level.width);
          expect(level.spawnY).toBeLessThan(level.height);
        });

        it('has exit position', () => {
          expect(level.exitX).toBeGreaterThanOrEqual(0);
          expect(level.exitY).toBeGreaterThanOrEqual(0);
          expect(level.exitX).toBeLessThan(level.width);
          expect(level.exitY).toBeLessThan(level.height);
        });

        it('has valid terrain dimensions', () => {
          expect(level.width).toBeGreaterThan(0);
          expect(level.height).toBeGreaterThan(0);
          expect(level.terrainData.length).toBe(level.height);
          level.terrainData.forEach((row) => {
            expect(row.length).toBe(level.width);
          });
        });

        it('terrain contains only valid values', () => {
          const validValues = [TERRAIN_EMPTY, TERRAIN_DIRT, TERRAIN_STEEL];
          level.terrainData.forEach((row, y) => {
            row.forEach((cell, x) => {
              expect(validValues).toContain(cell);
            });
          });
        });

        it('has required saved percentage less than or equal to 100', () => {
          expect(level.requiredSaved).toBeGreaterThan(0);
          expect(level.requiredSaved).toBeLessThanOrEqual(100);
        });

        it('has positive total lemmings', () => {
          expect(level.totalLemmings).toBeGreaterThan(0);
        });

        it('has positive time limit', () => {
          expect(level.timeLimit).toBeGreaterThan(0);
        });

        it('has positive spawn rate', () => {
          expect(level.spawnRate).toBeGreaterThan(0);
        });

        it('has non-negative ability counts', () => {
          expect(level.abilities.blocker).toBeGreaterThanOrEqual(0);
          expect(level.abilities.builder).toBeGreaterThanOrEqual(0);
          expect(level.abilities.digger).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('level progression', () => {
    it('levels are numbered sequentially from 1', () => {
      LEVELS.forEach((level, index) => {
        expect(level.id).toBe(index + 1);
      });
    });

    it('each level has a unique name', () => {
      const names = LEVELS.map((l) => l.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });
});
