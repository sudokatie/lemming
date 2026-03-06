import {
  SeededRNG,
  todayString,
  seedForDate,
  todaySeed,
  DailyLeaderboard,
  generateShareCode,
  parseShareCode,
  getDailyLevelIds,
} from '../Daily';

describe('SeededRNG', () => {
  it('produces deterministic sequence', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(12345);
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(54321);
    expect(rng1.next()).not.toBe(rng2.next());
  });

  it('nextInt returns values in range', () => {
    const rng = new SeededRNG(42);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    }
  });

  it('shuffle shuffles array deterministically', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);
    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];
    rng1.shuffle(arr1);
    rng2.shuffle(arr2);
    expect(arr1).toEqual(arr2);
  });
});

describe('Date functions', () => {
  it('todayString returns YYYY-MM-DD format', () => {
    const result = todayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('seedForDate produces consistent seed', () => {
    expect(seedForDate('2026-03-06')).toBe(seedForDate('2026-03-06'));
    expect(seedForDate('2026-03-06')).not.toBe(seedForDate('2026-03-07'));
  });

  it('todaySeed uses today date', () => {
    const expected = seedForDate(todayString());
    expect(todaySeed()).toBe(expected);
  });
});

describe('Share codes', () => {
  it('generateShareCode creates correct format', () => {
    const code = generateShareCode('2026-03-06', 15, 3);
    expect(code).toBe('LEMMING-20260306-3L-15S');
  });

  it('parseShareCode extracts data', () => {
    const result = parseShareCode('LEMMING-20260306-3L-15S');
    expect(result).toEqual({ date: '2026-03-06', saved: 15, levels: 3 });
  });

  it('parseShareCode returns null for invalid codes', () => {
    expect(parseShareCode('INVALID')).toBeNull();
    expect(parseShareCode('CRATES-20260306-3L-42M')).toBeNull();
    expect(parseShareCode('LEMMING-123-3L-15S')).toBeNull();
  });

  it('roundtrips share code', () => {
    const date = '2026-03-06';
    const saved = 25;
    const levels = 3;
    const code = generateShareCode(date, saved, levels);
    const parsed = parseShareCode(code);
    expect(parsed).toEqual({ date, saved, levels });
  });
});

describe('getDailyLevelIds', () => {
  it('returns correct number of levels', () => {
    const levels = getDailyLevelIds(7);
    expect(levels.length).toBe(3);
  });

  it('returns all levels if fewer than 3 available', () => {
    const levels = getDailyLevelIds(2);
    expect(levels.length).toBe(2);
  });

  it('returns deterministic levels for same day', () => {
    const levels1 = getDailyLevelIds(7);
    const levels2 = getDailyLevelIds(7);
    expect(levels1).toEqual(levels2);
  });

  it('returns valid level indices (1-indexed)', () => {
    const levels = getDailyLevelIds(7);
    for (const level of levels) {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(7);
    }
  });
});

describe('DailyLeaderboard', () => {
  beforeEach(() => {
    DailyLeaderboard.resetCache();
  });

  it('getToday returns empty array initially', () => {
    expect(DailyLeaderboard.getToday()).toEqual([]);
  });

  it('getBest returns null when empty', () => {
    expect(DailyLeaderboard.getBest()).toBeNull();
  });

  it('wouldRank returns true when board empty', () => {
    expect(DailyLeaderboard.wouldRank(3, 15)).toBe(true);
  });
});
