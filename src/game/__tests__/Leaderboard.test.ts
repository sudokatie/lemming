/**
 * @jest-environment jsdom
 */

import { Leaderboard } from '../Leaderboard';

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
    Leaderboard.resetCache();
  });

  it('should return empty data when no scores', () => {
    expect(Leaderboard.load()).toEqual({});
  });

  it('should record a level score', () => {
    const rank = Leaderboard.recordScore(0, 'Saver', 45, 120);
    expect(rank).toBe(1);
    expect(Leaderboard.getLevelScores(0)[0].saved).toBe(45);
  });

  it('should sort by saved descending then time ascending', () => {
    Leaderboard.recordScore(0, 'Fast50', 50, 60);
    Leaderboard.recordScore(0, 'Slow50', 50, 120);
    Leaderboard.recordScore(0, 'Best', 55, 90);

    const scores = Leaderboard.getLevelScores(0);
    expect(scores[0].name).toBe('Best');
    expect(scores[1].name).toBe('Fast50');
    expect(scores[2].name).toBe('Slow50');
  });

  it('should limit scores per level', () => {
    for (let i = 0; i < 10; i++) {
      Leaderboard.recordScore(0, `P${i}`, 40 + i, 100);
    }
    expect(Leaderboard.getLevelScores(0).length).toBe(5);
  });

  it('should track levels separately', () => {
    Leaderboard.recordScore(0, 'Level0', 30, 60);
    Leaderboard.recordScore(1, 'Level1', 40, 90);
    expect(Leaderboard.getLevelScores(0)[0].name).toBe('Level0');
    expect(Leaderboard.getLevelScores(1)[0].name).toBe('Level1');
  });

  it('should persist to localStorage', () => {
    Leaderboard.recordScore(0, 'Saved', 35, 80);
    const stored = JSON.parse(localStorage.getItem('lemming_leaderboard')!);
    expect(stored[0][0].name).toBe('Saved');
  });

  it('should return best score for level', () => {
    Leaderboard.recordScore(0, 'Second', 40, 100);
    Leaderboard.recordScore(0, 'First', 50, 80);
    expect(Leaderboard.getBest(0)?.name).toBe('First');
  });

  it('should count completed levels', () => {
    Leaderboard.recordScore(0, 'A', 30, 60);
    Leaderboard.recordScore(2, 'B', 35, 70);
    Leaderboard.recordScore(5, 'C', 40, 80);
    expect(Leaderboard.getTotalLevelsCompleted()).toBe(3);
  });

  it('should clear all data', () => {
    Leaderboard.recordScore(0, 'Gone', 30, 60);
    Leaderboard.clear();
    expect(Leaderboard.getLevelScores(0).length).toBe(0);
  });
});
