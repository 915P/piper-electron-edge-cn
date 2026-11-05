const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock states module
jest.mock('../../scripts/states.js', () => ({
  updateSpeakButtonState: jest.fn()
}));

// Mock window.piperAPI
global.window = {
  piperAPI: {
    chooseModelDirectory: jest.fn(),
    getLastSettings: jest.fn(),
    getPiperPath: jest.fn(),
    getModelDirectory: jest.fn(),
    getVoiceModels: jest.fn(),
    choosePiperPath: jest.fn()
  }
};

describe('Settings Module', () => {
  let settings;
  let mockStates;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();

    // Reset window.piperAPI
    global.window.piperAPI = {
      chooseModelDirectory: jest.fn(),
      getLastSettings: jest.fn(),
      getPiperPath: jest.fn(),
      getModelDirectory: jest.fn(),
      getVoiceModels: jest.fn(),
      choosePiperPath: jest.fn()
    };

    mockStates = require('../../scripts/states.js');
    settings = require('../../scripts/settings.js');
  });

  describe('selectModelDirectory', () => {
    test('updates display and repopulates voices when directory is selected', async () => {
      const mockFolder = '/path/to/models';
      window.piperAPI.chooseModelDirectory.mockResolvedValue(mockFolder);
      window.piperAPI.getVoiceModels.mockResolvedValue(['model1.onnx', 'model2.onnx']);
      window.piperAPI.getLastSettings.mockResolvedValue({});

      await settings.selectModelDirectory();

      expect(window.piperAPI.chooseModelDirectory).toHaveBeenCalledTimes(1);
      expect(document.getElementById('modelDirDisplay').textContent).toBe(mockFolder);
      expect(window.piperAPI.getVoiceModels).toHaveBeenCalledTimes(1);
    });

    test('does nothing when no directory is selected', async () => {
      window.piperAPI.chooseModelDirectory.mockResolvedValue(null);

      await settings.selectModelDirectory();

      expect(window.piperAPI.chooseModelDirectory).toHaveBeenCalledTimes(1);
      expect(document.getElementById('modelDirDisplay').textContent).toBe('');
      expect(window.piperAPI.getVoiceModels).not.toHaveBeenCalled();
    });
  });

  describe('loadSettings', () => {
    test('loads all settings successfully', async () => {
      const mockSettings = {
        lastText: 'Previous text content',
        lastOutput: '/path/to/output.wav',
        lastModel: '/path/to/model.onnx'
      };

      window.piperAPI.getLastSettings.mockResolvedValue(mockSettings);
      window.piperAPI.getPiperPath.mockResolvedValue('/path/to/piper');
      window.piperAPI.getModelDirectory.mockResolvedValue('/path/to/models');
      window.piperAPI.getVoiceModels.mockResolvedValue(['/path/to/model.onnx']);

      await settings.loadSettings();

      expect(document.getElementById('textInput').value).toBe('Previous text content');
      expect(document.getElementById('outputPath').value).toBe('/path/to/output.wav');
      expect(document.getElementById('status').textContent).toBe('');
      expect(document.getElementById('piperPathDisplay').textContent).toBe('/path/to/piper');
      expect(document.getElementById('modelDirDisplay').textContent).toBe('/path/to/models');
    });

    test('handles missing settings gracefully', async () => {
      window.piperAPI.getLastSettings.mockResolvedValue({});
      window.piperAPI.getPiperPath.mockResolvedValue(null);
      window.piperAPI.getModelDirectory.mockResolvedValue(null);
      window.piperAPI.getVoiceModels.mockResolvedValue([]);

      await settings.loadSettings();

      expect(document.getElementById('textInput').value).toBe('');
      expect(document.getElementById('outputPath').value).toBe('');
      expect(document.getElementById('piperPathDisplay').textContent).toBe('');
      expect(document.getElementById('modelDirDisplay').textContent).toBe('No directory selected');
    });

    test('restores last selected model when available', async () => {
      const mockSettings = {
        lastModel: '/path/to/model.onnx'
      };

      window.piperAPI.getLastSettings.mockResolvedValue(mockSettings);
      window.piperAPI.getPiperPath.mockResolvedValue('/path/to/piper');
      window.piperAPI.getModelDirectory.mockResolvedValue('/path/to/models');
      window.piperAPI.getVoiceModels.mockResolvedValue(['/path/to/model.onnx', '/path/to/other.onnx']);

      await settings.loadSettings();

      const modelSelect = document.getElementById('modelSelect');
      expect(modelSelect.value).toBe('/path/to/model.onnx');
    });
  });

  describe('populateVoices', () => {
    test('populates voice options when models are available', async () => {
      const mockModels = ['/path/to/model1.onnx', '/path/to/model2.onnx'];
      window.piperAPI.getVoiceModels.mockResolvedValue(mockModels);
      window.piperAPI.getLastSettings.mockResolvedValue({});

      await settings.populateVoices();

      const modelSelect = document.getElementById('modelSelect');
      expect(modelSelect.children.length).toBe(2);
      expect(modelSelect.children[0].value).toBe('/path/to/model1.onnx');
      expect(modelSelect.children[0].text).toBe('model1.onnx');
      expect(modelSelect.children[1].value).toBe('/path/to/model2.onnx');
      expect(modelSelect.children[1].text).toBe('model2.onnx');
    });

    test('shows "No models found" when no models are available', async () => {
      window.piperAPI.getVoiceModels.mockResolvedValue([]);
      window.piperAPI.getLastSettings.mockResolvedValue({});

      await settings.populateVoices();

      const modelSelect = document.getElementById('modelSelect');
      expect(modelSelect.children.length).toBe(1);
      expect(modelSelect.children[0].text).toBe('No models found');
      expect(modelSelect.children[0].disabled).toBe(true);
    });

    test('restores previously selected model', async () => {
      const mockModels = ['/path/to/model1.onnx', '/path/to/model2.onnx'];
      const mockSettings = {
        lastModel: '/path/to/model2.onnx'
      };

      window.piperAPI.getVoiceModels.mockResolvedValue(mockModels);
      window.piperAPI.getLastSettings.mockResolvedValue(mockSettings);

      await settings.populateVoices();

      const modelSelect = document.getElementById('modelSelect');
      expect(modelSelect.value).toBe('/path/to/model2.onnx');
    });

    test('does not restore invalid previously selected model', async () => {
      const mockModels = ['/path/to/model1.onnx'];
      const mockSettings = {
        lastModel: '/path/to/nonexistent.onnx'
      };

      window.piperAPI.getVoiceModels.mockResolvedValue(mockModels);
      window.piperAPI.getLastSettings.mockResolvedValue(mockSettings);

      // Clear the select before populating
      const modelSelect = document.getElementById('modelSelect');
      modelSelect.innerHTML = '';

      await settings.populateVoices();

      // The value will be the first available model since there are default options
      expect(modelSelect.value).toBe('/path/to/model1.onnx');
    });
  });

  describe('choosePiper', () => {
    test('updates piper path display and button state when path is selected', async () => {
      const mockPath = '/usr/local/bin/piper';
      window.piperAPI.choosePiperPath.mockResolvedValue(mockPath);

      await settings.choosePiper();

      expect(window.piperAPI.choosePiperPath).toHaveBeenCalledTimes(1);
      expect(document.getElementById('piperPathDisplay').textContent).toBe(mockPath);
      expect(mockStates.updateSpeakButtonState).toHaveBeenCalledTimes(1);
    });

    test('does nothing when no path is selected', async () => {
      window.piperAPI.choosePiperPath.mockResolvedValue(null);

      await settings.choosePiper();

      expect(window.piperAPI.choosePiperPath).toHaveBeenCalledTimes(1);
      expect(document.getElementById('piperPathDisplay').textContent).toBe('');
      expect(mockStates.updateSpeakButtonState).not.toHaveBeenCalled();
    });
  });
});
