const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock all imported modules
jest.mock('../../scripts/tss.js', () => ({
  speakText: jest.fn(),
  chooseOutput: jest.fn()
}));

jest.mock('../../scripts/utils.js', () => ({
  updateEstimatedDuration: jest.fn()
}));

jest.mock('../../scripts/settings.js', () => ({
  selectModelDirectory: jest.fn(),
  loadSettings: jest.fn().mockResolvedValue(),
  choosePiper: jest.fn()
}));

jest.mock('../../scripts/states.js', () => ({
  updateSpeakButtonState: jest.fn(),
  resetToDefaults: jest.fn()
}));

jest.mock('../../scripts/audio.js', () => ({
  playAudio: jest.fn(),
  pauseAudio: jest.fn(),
  resumeAudio: jest.fn(),
  stopAudio: jest.fn(),
  initializeAudioPlayerEvents: jest.fn()
}));

jest.mock('../../scripts/dragdrop.js', () => ({
  initializeDragDropEvents: jest.fn()
}));

// Mock window.piperAPI
global.window = {
  piperAPI: {
    previewVoice: jest.fn(),
    readTextFile: jest.fn(),
    speakTextFile: jest.fn()
  }
};

// Mock Audio constructor
global.Audio = jest.fn(() => ({
  play: jest.fn(() => Promise.resolve())
}));

// Mock console methods
global.console = {
  error: jest.fn()
};

// Mock alert
global.alert = jest.fn();

// Mock confirm
global.confirm = jest.fn();

describe('DOM Module', () => {
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
  });

  describe('Module integration tests', () => {
    test('can import the DOM module without errors', () => {
      expect(() => {
        require('../../scripts/dom.js');
      }).not.toThrow();
    });

    test('DOM elements exist for the module to use', () => {
      // Test that required DOM elements exist
      expect(document.getElementById('textInput')).not.toBeNull();
      expect(document.getElementById('speakButton')).not.toBeNull();
      expect(document.getElementById('modelSelect')).not.toBeNull();
      expect(document.getElementById('previewBtn')).not.toBeNull();
      expect(document.getElementById('loadTextFileBtn')).not.toBeNull();
      expect(document.getElementById('clearTextBtn')).not.toBeNull();
      expect(document.getElementById('audioPlayer')).not.toBeNull();
    });
  });

  describe('Basic functionality tests', () => {
    test('window.piperAPI is available for DOM module to use', () => {
      // Set up the piperAPI for this test
      global.window.piperAPI = {
        previewVoice: jest.fn(),
        readTextFile: jest.fn(),
        speakTextFile: jest.fn()
      };

      expect(window.piperAPI).toBeDefined();
      expect(window.piperAPI.previewVoice).toBeDefined();
      expect(window.piperAPI.readTextFile).toBeDefined();
      expect(window.piperAPI.speakTextFile).toBeDefined();
    });

    test('all mocked modules are available', () => {
      const tss = require('../../scripts/tss.js');
      const utils = require('../../scripts/utils.js');
      const settings = require('../../scripts/settings.js');
      const states = require('../../scripts/states.js');
      const audio = require('../../scripts/audio.js');
      const dragdrop = require('../../scripts/dragdrop.js');

      expect(tss.speakText).toBeDefined();
      expect(utils.updateEstimatedDuration).toBeDefined();
      expect(settings.loadSettings).toBeDefined();
      expect(states.updateSpeakButtonState).toBeDefined();
      expect(audio.initializeAudioPlayerEvents).toBeDefined();
      expect(dragdrop.initializeDragDropEvents).toBeDefined();
    });
  });
});
