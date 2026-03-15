import { Replay, ReplayData } from '../Replay';

describe('Replay', () => {
  let replay: Replay;

  beforeEach(() => {
    replay = new Replay();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('recording', () => {
    it('should start and stop recording', () => {
      replay.startRecording(0, false);
      expect(replay.isRecording).toBe(true);

      const data = replay.stopRecording(8, 1);
      expect(replay.isRecording).toBe(false);
      expect(data.lemmingsSaved).toBe(8);
      expect(data.levelsCompleted).toBe(1);
    });

    it('should record ability selections with timestamps', () => {
      replay.startRecording(0, false);

      replay.recordAbilitySelect('blocker');
      jest.advanceTimersByTime(100);
      replay.recordAbilitySelect('digger');

      const data = replay.stopRecording(0, 0);
      expect(data.frames).toHaveLength(2);
      expect(data.frames[0].type).toBe('selectAbility');
      expect(data.frames[0].ability).toBe('blocker');
      expect(data.frames[1].ability).toBe('digger');
    });

    it('should record lemming clicks', () => {
      replay.startRecording(0, false);

      replay.recordAbilitySelect('builder');
      jest.advanceTimersByTime(50);
      replay.recordLemmingClick(3);
      jest.advanceTimersByTime(50);
      replay.recordAbilitySelect('digger');
      jest.advanceTimersByTime(50);
      replay.recordLemmingClick(5);

      const data = replay.stopRecording(0, 0);
      expect(data.frames).toHaveLength(4);
      expect(data.frames[1].type).toBe('clickLemming');
      expect(data.frames[1].lemmingId).toBe(3);
      expect(data.frames[3].lemmingId).toBe(5);
    });

    it('should not record when not recording', () => {
      replay.recordAbilitySelect('blocker');
      replay.recordLemmingClick(1);

      replay.startRecording(0, false);
      const data = replay.stopRecording(0, 0);
      expect(data.frames).toHaveLength(0);
    });

    it('should store level index and daily mode', () => {
      replay.startRecording(5, true);
      const data = replay.stopRecording(0, 0);

      expect(data.levelIndex).toBe(5);
      expect(data.dailyMode).toBe(true);
    });
  });

  describe('playback', () => {
    const testData: ReplayData = {
      version: 1,
      levelIndex: 0,
      timestamp: Date.now(),
      duration: 500,
      frames: [
        { time: 0, type: 'selectAbility', ability: 'blocker' },
        { time: 100, type: 'clickLemming', lemmingId: 0 },
        { time: 200, type: 'selectAbility', ability: 'digger' },
        { time: 300, type: 'clickLemming', lemmingId: 2 },
      ],
      lemmingsSaved: 8,
      levelsCompleted: 1,
      dailyMode: false,
    };

    it('should start playback', () => {
      replay.startPlayback(testData);
      expect(replay.isPlaying).toBe(true);
      expect(replay.playbackProgress).toBe(0);
    });

    it('should return actions at correct times', () => {
      replay.startPlayback(testData);

      // First frame should be immediate
      const first = replay.getNextAction();
      expect(first?.type).toBe('selectAbility');
      expect(first?.ability).toBe('blocker');
      expect(replay.playbackProgress).toBe(0.25);

      // Second frame at 100ms
      expect(replay.getNextAction()).toBe(null);
      jest.advanceTimersByTime(100);
      const second = replay.getNextAction();
      expect(second?.type).toBe('clickLemming');
      expect(second?.lemmingId).toBe(0);

      // Third frame at 200ms
      jest.advanceTimersByTime(100);
      const third = replay.getNextAction();
      expect(third?.type).toBe('selectAbility');

      // Fourth frame at 300ms
      jest.advanceTimersByTime(100);
      const fourth = replay.getNextAction();
      expect(fourth?.lemmingId).toBe(2);
      expect(replay.playbackProgress).toBe(1);
    });

    it('should detect playback complete', () => {
      replay.startPlayback(testData);

      for (let i = 0; i < 4; i++) {
        jest.advanceTimersByTime(100);
        replay.getNextAction();
      }

      expect(replay.isPlaybackComplete).toBe(true);
    });

    it('should stop playback', () => {
      replay.startPlayback(testData);
      replay.stopPlayback();

      expect(replay.isPlaying).toBe(false);
      expect(replay.playbackProgress).toBe(0);
    });

    it('should expose level index and daily mode during playback', () => {
      const dailyData = { ...testData, levelIndex: 3, dailyMode: true };
      replay.startPlayback(dailyData);

      expect(replay.levelIndex).toBe(3);
      expect(replay.dailyMode).toBe(true);
    });
  });

  describe('encode/decode', () => {
    const testData: ReplayData = {
      version: 1,
      levelIndex: 2,
      timestamp: 1234567890000,
      duration: 5000,
      frames: [
        { time: 0, type: 'selectAbility', ability: 'blocker' },
        { time: 500, type: 'clickLemming', lemmingId: 1 },
        { time: 1000, type: 'selectAbility', ability: 'builder' },
        { time: 1500, type: 'clickLemming', lemmingId: 4 },
      ],
      lemmingsSaved: 10,
      levelsCompleted: 1,
      dailyMode: false,
    };

    it('should encode and decode replay data', () => {
      const encoded = Replay.encode(testData);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = Replay.decode(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.version).toBe(testData.version);
      expect(decoded!.levelIndex).toBe(testData.levelIndex);
      expect(decoded!.lemmingsSaved).toBe(testData.lemmingsSaved);
      expect(decoded!.frames).toHaveLength(testData.frames.length);
    });

    it('should preserve frame data through encode/decode', () => {
      const encoded = Replay.encode(testData);
      const decoded = Replay.decode(encoded)!;

      for (let i = 0; i < testData.frames.length; i++) {
        expect(decoded.frames[i].time).toBe(testData.frames[i].time);
        expect(decoded.frames[i].type).toBe(testData.frames[i].type);
        if (testData.frames[i].ability) {
          expect(decoded.frames[i].ability).toBe(testData.frames[i].ability);
        }
        if (testData.frames[i].lemmingId !== undefined) {
          expect(decoded.frames[i].lemmingId).toBe(testData.frames[i].lemmingId);
        }
      }
    });

    it('should handle daily mode flag', () => {
      const dailyData = { ...testData, dailyMode: true };
      const encoded = Replay.encode(dailyData);
      const decoded = Replay.decode(encoded)!;

      expect(decoded.dailyMode).toBe(true);
    });

    it('should return null for invalid encoded data', () => {
      expect(Replay.decode('invalid')).toBeNull();
      expect(Replay.decode('')).toBeNull();
      expect(Replay.decode('!!!')).toBeNull();
    });

    it('should handle empty frames', () => {
      const emptyData = { ...testData, frames: [] };
      const encoded = Replay.encode(emptyData);
      const decoded = Replay.decode(encoded)!;

      expect(decoded.frames).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should calculate action counts', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: Date.now(),
        duration: 5000,
        frames: [
          { time: 0, type: 'selectAbility', ability: 'blocker' },
          { time: 100, type: 'clickLemming', lemmingId: 0 },
          { time: 200, type: 'selectAbility', ability: 'blocker' },
          { time: 300, type: 'clickLemming', lemmingId: 1 },
          { time: 400, type: 'selectAbility', ability: 'digger' },
          { time: 500, type: 'clickLemming', lemmingId: 2 },
          { time: 600, type: 'selectAbility', ability: 'builder' },
        ],
        lemmingsSaved: 5,
        levelsCompleted: 1,
        dailyMode: false,
      };

      const stats = Replay.getStats(data);

      expect(stats.abilitySelections).toBe(4);
      expect(stats.lemmingClicks).toBe(3);
      expect(stats.blockerCount).toBe(2);
      expect(stats.diggerCount).toBe(1);
      expect(stats.builderCount).toBe(1);
      expect(stats.totalActions).toBe(7);
    });

    it('should calculate actions per second', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: Date.now(),
        duration: 2000, // 2 seconds
        frames: [
          { time: 0, type: 'selectAbility', ability: 'blocker' },
          { time: 500, type: 'clickLemming', lemmingId: 0 },
          { time: 1000, type: 'selectAbility', ability: 'digger' },
          { time: 1500, type: 'clickLemming', lemmingId: 1 },
        ],
        lemmingsSaved: 8,
        levelsCompleted: 1,
        dailyMode: false,
      };

      const stats = Replay.getStats(data);

      expect(stats.actionsPerSecond).toBe(2); // 4 actions / 2 seconds
      expect(stats.durationSeconds).toBe(2);
    });
  });

  describe('generateShareCode', () => {
    it('should generate share code for normal mode', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: new Date('2026-03-07').getTime(),
        duration: 5000,
        frames: [],
        lemmingsSaved: 8,
        levelsCompleted: 1,
        dailyMode: false,
      };

      const code = Replay.generateShareCode(data);

      expect(code).toContain('LEMMING-');
      expect(code).toContain('-S8-');
      expect(code).toContain('-L1');
    });

    it('should generate share code for daily mode', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: new Date('2026-03-07').getTime(),
        duration: 5000,
        frames: [],
        lemmingsSaved: 25,
        levelsCompleted: 3,
        dailyMode: true,
      };

      const code = Replay.generateShareCode(data);

      expect(code).toContain('LEMMING-D-');
      expect(code).toContain('-S25-');
      expect(code).toContain('-L3');
    });
  });
});
