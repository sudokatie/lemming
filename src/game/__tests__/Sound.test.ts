import { Sound } from '../Sound';

let mockAudioContext: any;

describe('Sound System', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mock AudioContext for each test
    mockAudioContext = {
      currentTime: 0,
      state: 'running',
      sampleRate: 44100,
      resume: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn(() => ({
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
      })),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: {
          value: 0,
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
        },
      })),
      createBufferSource: jest.fn(() => ({
        buffer: null,
        connect: jest.fn(),
        start: jest.fn(),
      })),
      createBuffer: jest.fn((channels: number, length: number, sampleRate: number) => ({
        getChannelData: jest.fn(() => new Float32Array(length)),
      })),
      destination: {},
    };
    
    // Mock AudioContext on the actual window object (jsdom provides window)
    (window as any).AudioContext = jest.fn(() => mockAudioContext);
    (window as any).webkitAudioContext = jest.fn(() => mockAudioContext);
    
    // Reset Sound's cached context so it picks up our mock
    Sound.resetContext();
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
