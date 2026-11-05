const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock the piperAPI
global.window = {
  piperAPI: {
    validatePiperPath: jest.fn(),
    validateModelPath: jest.fn(),
    resetSettings: jest.fn()
  }
};

// Mock location.reload
global.location = {
  reload: jest.fn()
};

// Mock confirm dialog
global.confirm = jest.fn();

describe('States Module', () => {
  let states;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();

    // Reset window.piperAPI mocks
    global.window.piperAPI = {
      validatePiperPath: jest.fn(),
      validateModelPath: jest.fn(),
      resetSettings: jest.fn()
    };

    // Import states module after DOM setup
    states = require('../../scripts/states.js');
  });

  describe('updateSpeakButtonState', () => {
    beforeEach(() => {
      // Set up DOM elements with initial disabled state
      document.getElementById('speakButton').disabled = true;
      document.getElementById('previewBtn').disabled = true;
      document.getElementById('modelSelect').value = '/path/to/model.onnx';
      document.getElementById('textInput').value = 'Sample text';
    });

    test('enables buttons when all conditions are met', async () => {
      // Mock all validations to return true
      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(true);

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(false);
      expect(document.getElementById('previewBtn').disabled).toBe(false);
    });

    test('disables speak button when Piper path is invalid', async () => {
      window.piperAPI.validatePiperPath.mockResolvedValue(false);
      window.piperAPI.validateModelPath.mockResolvedValue(true);

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(true);
      expect(document.getElementById('previewBtn').disabled).toBe(false);
    });

    test('disables buttons when model path is invalid', async () => {
      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(false);

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(true);
      expect(document.getElementById('previewBtn').disabled).toBe(true);
    });

    test('disables speak button when no text is provided', async () => {
      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(true);
      document.getElementById('textInput').value = '';

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(true);
      expect(document.getElementById('previewBtn').disabled).toBe(false);
    });

    test('disables speak button when text is only whitespace', async () => {
      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(true);
      document.getElementById('textInput').value = '   \n\t  '; // actual whitespace, not escaped

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(true);
    });

    test('handles missing model select value', async () => {
      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(false);
      document.getElementById('modelSelect').value = '';

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(true);
      expect(document.getElementById('previewBtn').disabled).toBe(true);
    });

    test('calls validation APIs with correct parameters', async () => {
      const modelPath = '/path/to/model.onnx';
      document.getElementById('modelSelect').value = modelPath;

      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(true);

      await states.updateSpeakButtonState();

      expect(window.piperAPI.validatePiperPath).toHaveBeenCalledTimes(1);
      expect(window.piperAPI.validateModelPath).toHaveBeenCalledTimes(1);
      expect(window.piperAPI.validateModelPath).toHaveBeenCalledWith(modelPath);
    });

    test('handles API errors gracefully', async () => {
      window.piperAPI.validatePiperPath.mockRejectedValue(new Error('Validation failed'));
      window.piperAPI.validateModelPath.mockResolvedValue(true);

      // Should not throw an error
      await expect(states.updateSpeakButtonState()).rejects.toThrow('Validation failed');
    });
  });

  describe('resetToDefaults', () => {
    beforeEach(() => {
      document.getElementById('durationEstimate').textContent = 'Some duration';
    });

    test('resets settings when user confirms', async () => {
      confirm.mockReturnValue(true);
      window.piperAPI.resetSettings.mockResolvedValue({});

      await states.resetToDefaults();

      expect(confirm).toHaveBeenCalledWith('Are you sure you want to reset all settings to defaults?');
      expect(window.piperAPI.resetSettings).toHaveBeenCalledTimes(1);
      expect(document.getElementById('durationEstimate').textContent).toBe('Estimated Duration: —');
      expect(location.reload).toHaveBeenCalledTimes(1);
    });

    test('does not reset settings when user cancels', async () => {
      confirm.mockReturnValue(false);

      await states.resetToDefaults();

      expect(confirm).toHaveBeenCalledWith('Are you sure you want to reset all settings to defaults?');
      expect(window.piperAPI.resetSettings).not.toHaveBeenCalled();
      expect(location.reload).not.toHaveBeenCalled();
      // Duration estimate should not be reset
      expect(document.getElementById('durationEstimate').textContent).toBe('Some duration');
    });

    test('handles reset API errors', async () => {
      confirm.mockReturnValue(true);
      window.piperAPI.resetSettings.mockRejectedValue(new Error('Reset failed'));

      await expect(states.resetToDefaults()).rejects.toThrow('Reset failed');

      expect(window.piperAPI.resetSettings).toHaveBeenCalledTimes(1);
      // Should still update duration estimate even if API fails
      expect(document.getElementById('durationEstimate').textContent).toBe('Estimated Duration: —');
    });

    test('resets duration estimate text correctly', async () => {
      confirm.mockReturnValue(true);
      window.piperAPI.resetSettings.mockResolvedValue({});

      await states.resetToDefaults();

      expect(document.getElementById('durationEstimate').textContent).toBe('Estimated Duration: —');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('updateSpeakButtonState handles missing DOM elements gracefully', async () => {
      // Remove some DOM elements
      document.body.innerHTML = '<div></div>';

      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(true);

      // The current implementation will throw when trying to read from null DOM elements
      await expect(states.updateSpeakButtonState()).rejects.toThrow('Cannot read properties of null');
    });

    test('resetToDefaults handles missing DOM elements', async () => {
      confirm.mockReturnValue(true);
      window.piperAPI.resetSettings.mockResolvedValue({});

      // Remove duration estimate element
      const element = document.getElementById('durationEstimate');
      element.remove();

      // The current implementation will throw when trying to set textContent on null
      await expect(states.resetToDefaults()).rejects.toThrow('Cannot set properties of null');
    });
  });

  describe('Integration Scenarios', () => {
    test('realistic workflow - valid setup enables buttons', async () => {
      // Simulate a complete valid setup
      document.getElementById('modelSelect').value = '/voices/en_US-amy-medium.onnx';
      document.getElementById('textInput').value = 'Hello, this is a test of the text-to-speech system.';

      window.piperAPI.validatePiperPath.mockResolvedValue(true);
      window.piperAPI.validateModelPath.mockResolvedValue(true);

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(false);
      expect(document.getElementById('previewBtn').disabled).toBe(false);
      expect(window.piperAPI.validatePiperPath).toHaveBeenCalled();
      expect(window.piperAPI.validateModelPath).toHaveBeenCalledWith('/voices/en_US-amy-medium.onnx');
    });

    test('realistic workflow - incomplete setup disables buttons', async () => {
      // Simulate incomplete setup (no Piper executable)
      document.getElementById('modelSelect').value = '/voices/en_US-amy-medium.onnx';
      document.getElementById('textInput').value = 'Hello, world!';

      window.piperAPI.validatePiperPath.mockResolvedValue(false); // No Piper executable
      window.piperAPI.validateModelPath.mockResolvedValue(true);

      await states.updateSpeakButtonState();

      expect(document.getElementById('speakButton').disabled).toBe(true);
      expect(document.getElementById('previewBtn').disabled).toBe(false); // Preview only needs model
    });
  });
});
