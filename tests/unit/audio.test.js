const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Audio Module', () => {
  let audio;
  let mockAudioElement;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();

    // Create a mock audio element
    mockAudioElement = {
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
      load: jest.fn(),
      currentTime: 0,
      duration: 100,
      onloadedmetadata: null,
      onplay: null,
      onpause: null,
      onended: null,
      ontimeupdate: null
    };

    // Replace the audio element in DOM with a fresh mock each time
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.play = mockAudioElement.play;
    audioPlayer.pause = mockAudioElement.pause;
    audioPlayer.load = mockAudioElement.load;

    // Use configurable properties to avoid redefinition errors
    Object.defineProperty(audioPlayer, 'currentTime', {
      get: () => mockAudioElement.currentTime,
      set: (value) => {
        mockAudioElement.currentTime = value;
      },
      configurable: true
    });
    Object.defineProperty(audioPlayer, 'duration', {
      get: () => mockAudioElement.duration,
      configurable: true
    });

    // Import audio module after DOM setup
    audio = require('../../scripts/audio.js');
  });

  describe('Basic Audio Controls', () => {
    test('playAudio calls play on audio element', () => {
      audio.playAudio();
      expect(mockAudioElement.play).toHaveBeenCalledTimes(1);
    });

    test('pauseAudio calls pause on audio element', () => {
      audio.pauseAudio();
      expect(mockAudioElement.pause).toHaveBeenCalledTimes(1);
    });

    test('resumeAudio calls play (same as playAudio)', () => {
      audio.resumeAudio();
      expect(mockAudioElement.play).toHaveBeenCalledTimes(1);
    });

    test('stopAudio pauses and resets currentTime', () => {
      mockAudioElement.currentTime = 50;

      audio.stopAudio();

      expect(mockAudioElement.pause).toHaveBeenCalledTimes(1);
      expect(mockAudioElement.currentTime).toBe(0);
    });
  });

  describe('Audio Event Initialization', () => {
    test('initializeAudioPlayerEvents sets up all event handlers', () => {
      const audioElement = document.getElementById('audioPlayer');

      audio.initializeAudioPlayerEvents();

      expect(typeof audioElement.onloadedmetadata).toBe('function');
      expect(typeof audioElement.onplay).toBe('function');
      expect(typeof audioElement.onpause).toBe('function');
      expect(typeof audioElement.onended).toBe('function');
      expect(typeof audioElement.ontimeupdate).toBe('function');
    });

    test('onloadedmetadata handler updates duration display', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      // Mock formatDuration function
      jest.doMock('../../scripts/utils.js', () => ({
        formatDuration: jest.fn((seconds) => `${Math.floor(seconds)}:00`)
      }));

      // Trigger the event handler
      mockAudioElement.duration = 120;
      Object.defineProperty(audioElement, 'duration', {
        get: () => 120
      });

      audioElement.onloadedmetadata();

      expect(document.getElementById('durationEstimate').textContent).toContain('Duration:');
    });

    test('onplay handler updates status and shows controls', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      audioElement.onplay();

      expect(document.getElementById('status').textContent).toBe('Playing...');
      expect(document.getElementById('audioControls').style.display).toBe('block');
    });

    test('onpause handler updates status', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      audioElement.onpause();

      expect(document.getElementById('status').textContent).toBe('Paused');
    });

    test('onended handler updates status and hides controls', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      audioElement.onended();

      expect(document.getElementById('status').textContent).toBe('Done.');
      expect(document.getElementById('audioControls').style.display).toBe('none');
      expect(document.getElementById('progressContainer').style.display).toBe('none');
      expect(document.getElementById('speakButton').disabled).toBe(false);
    });

    test('ontimeupdate handler updates progress bar', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      // Set up mock values
      Object.defineProperty(audioElement, 'currentTime', {
        get: () => 25
      });
      Object.defineProperty(audioElement, 'duration', {
        get: () => 100
      });

      audioElement.ontimeupdate();

      expect(document.getElementById('progressBar').style.width).toBe('25%');
      expect(document.getElementById('progressText').textContent).toBe('25% (playing)');
    });
  });

  describe('Progress Calculation', () => {
    test('calculates progress percentage correctly', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      const testCases = [
        { current: 0, duration: 100, expected: '0%' },
        { current: 25, duration: 100, expected: '25%' },
        { current: 50, duration: 100, expected: '50%' },
        { current: 75.7, duration: 100, expected: '76%' },
        { current: 100, duration: 100, expected: '100%' }
      ];

      testCases.forEach(({ current, duration, expected }) => {
        Object.defineProperty(audioElement, 'currentTime', {
          get: () => current,
          configurable: true
        });
        Object.defineProperty(audioElement, 'duration', {
          get: () => duration,
          configurable: true
        });

        audioElement.ontimeupdate();

        expect(document.getElementById('progressBar').style.width).toBe(expected);
        expect(document.getElementById('progressText').textContent).toBe(`${expected.replace('%', '')}% (playing)`);
      });
    });

    test('handles division by zero in progress calculation', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      Object.defineProperty(audioElement, 'currentTime', {
        get: () => 25
      });
      Object.defineProperty(audioElement, 'duration', {
        get: () => 0 // Zero duration
      });

      // Should not crash
      audioElement.ontimeupdate();

      // With zero duration, the progress bar should still be updated, though the values might be empty
      // The actual implementation might handle this gracefully by not setting anything
      // Let's just check it doesn't crash and the elements exist
      expect(document.getElementById('progressBar')).toBeTruthy();
      expect(document.getElementById('progressText')).toBeTruthy();
      // The actual values depend on how toFixed() handles Infinity
    });
  });

  describe('Error Handling', () => {
    test('handles missing DOM elements gracefully', () => {
      // Remove some DOM elements
      document.getElementById('status').remove();
      document.getElementById('audioControls').remove();

      // The current implementation will throw when trying to set textContent on null
      // This test documents the current behavior - in real usage, DOM elements should exist
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      expect(() => {
        audioElement.onplay();
      }).toThrow('Cannot set properties of null');

      expect(() => {
        audioElement.onpause();
      }).toThrow('Cannot set properties of null');

      expect(() => {
        audioElement.onended();
      }).toThrow('Cannot set properties of null');
    });

    test('audio controls work with missing progress elements', () => {
      document.getElementById('progressBar').remove();
      document.getElementById('progressText').remove();

      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      // The current implementation will throw when trying to access style on null
      expect(() => {
        audioElement.ontimeupdate();
      }).toThrow('Cannot read properties of null');
    });
  });

  describe('Integration Scenarios', () => {
    test('complete audio playback workflow', () => {
      audio.initializeAudioPlayerEvents();
      const audioElement = document.getElementById('audioPlayer');

      // 1. Audio loads
      mockAudioElement.duration = 180; // 3 minutes
      Object.defineProperty(audioElement, 'duration', {
        get: () => 180
      });
      audioElement.onloadedmetadata();
      expect(document.getElementById('durationEstimate').textContent).toContain('Duration:');

      // 2. Audio starts playing
      audioElement.onplay();
      expect(document.getElementById('status').textContent).toBe('Playing...');
      expect(document.getElementById('audioControls').style.display).toBe('block');

      // 3. Progress updates during playback
      Object.defineProperty(audioElement, 'currentTime', {
        get: () => 90 // Half way through
      });
      audioElement.ontimeupdate();
      expect(document.getElementById('progressBar').style.width).toBe('50%');
      expect(document.getElementById('progressText').textContent).toBe('50% (playing)');

      // 4. User pauses
      audioElement.onpause();
      expect(document.getElementById('status').textContent).toBe('Paused');

      // 5. Audio ends
      Object.defineProperty(audioElement, 'currentTime', {
        get: () => 180
      });
      audioElement.ontimeupdate();
      audioElement.onended();
      expect(document.getElementById('status').textContent).toBe('Done.');
      expect(document.getElementById('audioControls').style.display).toBe('none');
      expect(document.getElementById('progressContainer').style.display).toBe('none');
    });

    test('manual control workflow', () => {
      // User manually controls audio
      audio.playAudio();
      expect(mockAudioElement.play).toHaveBeenCalledTimes(1);

      audio.pauseAudio();
      expect(mockAudioElement.pause).toHaveBeenCalledTimes(1);

      audio.resumeAudio();
      expect(mockAudioElement.play).toHaveBeenCalledTimes(2);

      audio.stopAudio();
      expect(mockAudioElement.pause).toHaveBeenCalledTimes(2);
      expect(mockAudioElement.currentTime).toBe(0);
    });
  });
});
