const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock window.piperAPI
global.window = {
  piperAPI: {
    speak: jest.fn(),
    chooseOutputFile: jest.fn()
  }
};

describe('TSS Module', () => {
  let tss;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();

    // Reset window.piperAPI mocks
    global.window.piperAPI = {
      speak: jest.fn(),
      chooseOutputFile: jest.fn()
    };

    // Import tss module after DOM setup
    tss = require('../../scripts/tss.js');
  });

  describe('chooseOutput', () => {
    test('updates output path when file is selected', async () => {
      const selectedPath = '/path/to/output.wav';
      window.piperAPI.chooseOutputFile.mockResolvedValue(selectedPath);

      await tss.chooseOutput();

      expect(window.piperAPI.chooseOutputFile).toHaveBeenCalledTimes(1);
      expect(document.getElementById('outputPath').value).toBe(selectedPath);
    });

    test('does nothing when no file is selected', async () => {
      window.piperAPI.chooseOutputFile.mockResolvedValue(null);

      await tss.chooseOutput();

      expect(window.piperAPI.chooseOutputFile).toHaveBeenCalledTimes(1);
      expect(document.getElementById('outputPath').value).toBe('');
    });
  });

  describe('speakText', () => {
    beforeEach(() => {
      // Set up DOM elements for TTS
      document.getElementById('textInput').value = 'Hello world test';
      document.getElementById('modelSelect').value = '/path/to/model.onnx';
      document.getElementById('speakButton').disabled = false;
      document.getElementById('status').textContent = '';
      document.getElementById('progressContainer').style.display = 'none';
      document.getElementById('progressBar').style.width = '0%';
      document.getElementById('progressText').textContent = '';
      document.getElementById('durationEstimate').textContent = '';
      document.getElementById('audioControls').style.display = 'none';
    });

    test('processes text to speech successfully', async () => {
      window.piperAPI.speak.mockResolvedValue();

      // Mock the audio element methods directly on the DOM element
      const audioElement = document.getElementById('audioPlayer');
      audioElement.load = jest.fn();
      audioElement.play = jest.fn(() => Promise.resolve());

      await tss.speakText();

      expect(document.getElementById('speakButton').disabled).toBe(false);
      expect(document.getElementById('status').textContent).toBe('Playing...');
      expect(document.getElementById('audioControls').style.display).toBe('block');
    });

    test('handles TTS errors gracefully', async () => {
      window.piperAPI.speak.mockRejectedValue(new Error('TTS failed'));

      await tss.speakText();

      expect(document.getElementById('speakButton').disabled).toBe(false);
      expect(document.getElementById('status').textContent).toBe('Error: Error: TTS failed');
    });

    test('shows progress during processing', async () => {
      // Slow down the TTS to test progress
      window.piperAPI.speak.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const speakPromise = tss.speakText();

      // Check that progress is shown
      expect(document.getElementById('progressContainer').style.display).toBe('block');
      expect(document.getElementById('speakButton').disabled).toBe(true);

      await speakPromise;
    });

    test('calculates duration estimate correctly', async () => {
      document.getElementById('textInput').value = Array(160).fill('word').join(' '); // 160 words
      window.piperAPI.speak.mockResolvedValue();

      await tss.speakText();

      const durationText = document.getElementById('durationEstimate').textContent;
      expect(durationText).toContain('Estimated Duration:');
      expect(durationText).toContain('1:00'); // 160 words at 160 WPM = 1 minute
    });
  });
});
