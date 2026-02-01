import { Game } from '../Game';
import { SPAWN_DURATION } from '../constants';

describe('Game', () => {
  describe('loadLevel', () => {
    it('should load level and set status to playing', () => {
      const game = new Game();
      game.loadLevel(1);

      expect(game.getState().status).toBe('playing');
      expect(game.getState().currentLevel).toBe(1);
    });

    it('should initialize terrain', () => {
      const game = new Game();
      game.loadLevel(1);

      expect(game.getTerrain()).not.toBeNull();
    });

    it('should set abilities from level', () => {
      const game = new Game();
      game.loadLevel(1);

      const level = game.getLevel();
      const state = game.getState();

      expect(state.abilities.blocker).toBe(level!.abilities.blocker);
      expect(state.abilities.builder).toBe(level!.abilities.builder);
      expect(state.abilities.digger).toBe(level!.abilities.digger);
    });

    it('should set time limit from level', () => {
      const game = new Game();
      game.loadLevel(1);

      const level = game.getLevel();
      expect(game.getState().timeRemaining).toBe(level!.timeLimit);
    });

    it('should throw for invalid level', () => {
      const game = new Game();
      expect(() => game.loadLevel(999)).toThrow();
    });
  });

  describe('spawning', () => {
    it('should spawn lemmings at spawn rate', () => {
      const game = new Game();
      game.loadLevel(1);

      const level = game.getLevel()!;
      
      // Update until first spawn
      for (let i = 0; i < level.spawnRate; i++) {
        game.update(0);
      }

      expect(game.getState().lemmingsOut).toBe(1);
      expect(game.getLemmings().length).toBe(1);
    });

    it('should not exceed total lemmings', () => {
      const game = new Game();
      game.loadLevel(1);

      const level = game.getLevel()!;
      
      // Update many times
      for (let i = 0; i < level.totalLemmings * level.spawnRate + 100; i++) {
        game.update(0);
      }

      // Should spawn all lemmings OR game ended early (lost)
      expect(game.getState().lemmingsOut).toBeLessThanOrEqual(level.totalLemmings);
    });

    it('should spawn at correct position', () => {
      const game = new Game();
      game.loadLevel(1);

      const level = game.getLevel()!;
      
      // Spawn first lemming
      for (let i = 0; i < level.spawnRate; i++) {
        game.update(0);
      }

      const lemming = game.getLemmings()[0];
      const pos = lemming.getPosition();

      expect(pos.x).toBe(level.spawnX);
      expect(pos.y).toBe(level.spawnY);
    });
  });

  describe('ability selection', () => {
    it('should select ability when count > 0', () => {
      const game = new Game();
      game.loadLevel(2); // Level 2 has blockers

      game.selectAbility('blocker');
      expect(game.getState().selectedAbility).toBe('blocker');
    });

    it('should not select ability when count is 0', () => {
      const game = new Game();
      game.loadLevel(1); // Level 1 has no abilities

      game.selectAbility('blocker');
      expect(game.getState().selectedAbility).toBeNull();
    });

    it('should clear selection', () => {
      const game = new Game();
      game.loadLevel(2);

      game.selectAbility('blocker');
      game.clearSelection();

      expect(game.getState().selectedAbility).toBeNull();
    });
  });

  describe('ability assignment', () => {
    it('should assign ability to lemming and decrement count', () => {
      const game = new Game();
      game.loadLevel(2);

      const initialCount = game.getState().abilities.blocker;
      const level = game.getLevel()!;

      // Spawn lemming and wait for it to spawn, fall, and land (walking)
      for (let i = 0; i < level.spawnRate + SPAWN_DURATION + 50; i++) {
        game.update(0);
      }

      const lemming = game.getLemmings()[0];
      // Wait until lemming is walking
      while (lemming.getState() !== 'walking' && lemming.isAlive()) {
        game.update(0);
      }

      expect(lemming.getState()).toBe('walking');

      game.selectAbility('blocker');
      const result = game.clickLemming(lemming.getId());

      expect(result).toBe(true);
      expect(lemming.getState()).toBe('blocking');
      expect(game.getState().abilities.blocker).toBe(initialCount - 1);
    });

    it('should clear selection after assignment', () => {
      const game = new Game();
      game.loadLevel(2);

      const level = game.getLevel()!;

      // Spawn and wait for walking
      for (let i = 0; i < level.spawnRate + SPAWN_DURATION + 50; i++) {
        game.update(0);
      }

      const lemming = game.getLemmings()[0];
      while (lemming.getState() !== 'walking' && lemming.isAlive()) {
        game.update(0);
      }

      game.selectAbility('blocker');
      game.clickLemming(lemming.getId());

      expect(game.getState().selectedAbility).toBeNull();
    });

    it('should return false when no ability selected', () => {
      const game = new Game();
      game.loadLevel(2);

      const level = game.getLevel()!;

      for (let i = 0; i < level.spawnRate + SPAWN_DURATION + 50; i++) {
        game.update(0);
      }

      const lemming = game.getLemmings()[0];
      while (lemming.getState() !== 'walking' && lemming.isAlive()) {
        game.update(0);
      }

      const result = game.clickLemming(lemming.getId());

      expect(result).toBe(false);
    });
  });

  describe('blocker collision', () => {
    it('should turn walking lemmings when they hit a blocker', () => {
      const game = new Game();
      game.loadLevel(2);

      const level = game.getLevel()!;

      // Spawn two lemmings
      for (let i = 0; i < level.spawnRate * 2; i++) {
        game.update(0);
      }

      // Wait for both to be walking
      for (let i = 0; i < SPAWN_DURATION + 5; i++) {
        game.update(0);
      }

      // Make first lemming a blocker
      game.selectAbility('blocker');
      const blocker = game.getLemmings()[0];
      game.clickLemming(blocker.getId());

      // Second lemming should eventually turn when hitting blocker
      const walker = game.getLemmings()[1];
      const initialDir = walker.getDirection();

      // Update until they collide or timeout
      for (let i = 0; i < 200; i++) {
        game.update(0);
        if (walker.getDirection() !== initialDir) break;
      }

      // Walker should have turned (or died, but in level 2 they should turn)
      expect(walker.getDirection() !== initialDir || !walker.isAlive()).toBe(true);
    });
  });

  describe('timer', () => {
    it('should decrease time remaining', () => {
      const game = new Game();
      game.loadLevel(1);

      const initialTime = game.getState().timeRemaining;
      game.update(1); // 1 second delta

      expect(game.getState().timeRemaining).toBe(initialTime - 1);
    });

    it('should not go below zero', () => {
      const game = new Game();
      game.loadLevel(1);

      game.update(1000); // Huge delta

      expect(game.getState().timeRemaining).toBe(0);
    });
  });

  describe('pause/resume', () => {
    it('should pause game', () => {
      const game = new Game();
      game.loadLevel(1);

      game.pause();
      expect(game.getState().status).toBe('paused');
    });

    it('should resume game', () => {
      const game = new Game();
      game.loadLevel(1);

      game.pause();
      game.resume();

      expect(game.getState().status).toBe('playing');
    });

    it('should not update when paused', () => {
      const game = new Game();
      game.loadLevel(1);

      game.pause();
      const level = game.getLevel()!;

      for (let i = 0; i < level.spawnRate + 10; i++) {
        game.update(0);
      }

      expect(game.getLemmings().length).toBe(0);
    });
  });

  describe('restart', () => {
    it('should reset level state', () => {
      const game = new Game();
      game.loadLevel(1);

      const level = game.getLevel()!;

      // Spawn some lemmings
      for (let i = 0; i < level.spawnRate * 3; i++) {
        game.update(0);
      }

      expect(game.getLemmings().length).toBeGreaterThan(0);

      game.restart();

      expect(game.getLemmings().length).toBe(0);
      expect(game.getState().lemmingsOut).toBe(0);
    });
  });

  describe('level navigation', () => {
    it('should go to next level', () => {
      const game = new Game();
      game.loadLevel(1);

      game.nextLevel();

      expect(game.getState().currentLevel).toBe(2);
    });

    it('should go to previous level', () => {
      const game = new Game();
      game.loadLevel(2);

      game.prevLevel();

      expect(game.getState().currentLevel).toBe(1);
    });

    it('should not go below level 1', () => {
      const game = new Game();
      game.loadLevel(1);

      game.prevLevel();

      expect(game.getState().currentLevel).toBe(1);
    });
  });

  describe('getLemmingAt', () => {
    it('should find lemming at position', () => {
      const game = new Game();
      game.loadLevel(1);

      const level = game.getLevel()!;

      // Spawn lemming
      for (let i = 0; i < level.spawnRate; i++) {
        game.update(0);
      }

      const lemming = game.getLemmings()[0];
      const pos = lemming.getPosition();

      const found = game.getLemmingAt(pos.x + 3, pos.y + 5);
      expect(found).toBe(lemming);
    });

    it('should return null when no lemming at position', () => {
      const game = new Game();
      game.loadLevel(1);

      const found = game.getLemmingAt(500, 500);
      expect(found).toBeNull();
    });
  });

  describe('game status helpers', () => {
    it('should report game over correctly', () => {
      const game = new Game();
      game.loadLevel(1);

      expect(game.isGameOver()).toBe(false);
      expect(game.hasWon()).toBe(false);
      expect(game.hasLost()).toBe(false);
    });
  });
});
