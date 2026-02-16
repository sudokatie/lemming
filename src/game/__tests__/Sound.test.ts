import { Sound } from '../Sound';

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  type: 'sine',
  frequency: {
    value: 0,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
};

const mockGain = {
  connect: jest.fn(),
  gain: {
    value: 0,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
};

const mockBufferSource = {
  buffer: null,
  connect: jest.fn(),
  start: jest.fn(),
};

const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  sampleRate: 44100,
  resume: jest.fn().mockResolvedValue(undefined),
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGain })),
  createBufferSource: jest.fn(() => ({ ...mockBufferSource })),
  createBuffer: jest.fn((channels, length, sampleRate) => ({
    getChannelData: jest.fn(() => new Float32Array(length)),
  })),
  destination: {},
};

// Mock window.AudioContext
(global as any).window = {
  AudioContext: jest.fn(() => mockAudioContext),
};

describe('Sound System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Sound.setEnabled(true);
    Sound.setVolume(0.3);
  });

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = Sound;
      const instance2 = Sound;
      expect(instance1).toBe(instance2);
    });
  });

  describe('enabled state', () => {
    it('can be enabled and disabled', () => {
      Sound.setEnabled(false);
      expect(Sound.isEnabled()).toBe(false);
      
      Sound.setEnabled(true);
      expect(Sound.isEnabled()).toBe(true);
    });

    it('does not play sounds when disabled', () => {
      Sound.setEnabled(false);
      Sound.play('spawn');
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('volume control', () => {
    it('can set and get volume', () => {
      Sound.setVolume(0.5);
      expect(Sound.getVolume()).toBe(0.5);
    });

    it('clamps volume to 0-1 range', () => {
      Sound.setVolume(-0.5);
      expect(Sound.getVolume()).toBe(0);
      
      Sound.setVolume(1.5);
      expect(Sound.getVolume()).toBe(1);
    });
  });

  describe('sound playback', () => {
    it('plays spawn sound', () => {
      Sound.play('spawn');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays abilityAssign sound', () => {
      Sound.play('abilityAssign');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays death sound', () => {
      Sound.play('death');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays saved sound', () => {
      Sound.play('saved');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays levelWin sound', () => {
      Sound.play('levelWin');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays levelLose sound', () => {
      Sound.play('levelLose');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays digging sound', () => {
      Sound.play('digging');
      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });

    it('plays building sound', () => {
      Sound.play('building');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });
});
