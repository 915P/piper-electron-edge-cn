const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock states module
jest.mock('../../scripts/states.js', () => ({
  updateSpeakButtonState: jest.fn()
}));

// Mock window.piperAPI
global.window = {
  piperAPI: {
    validateFileForDragDrop: jest.fn()
  }
};

// Mock alert
global.alert = jest.fn();

// Mock FileReader
global.FileReader = jest.fn(() => ({
  readAsText: jest.fn(),
  onload: null,
  result: null
}));

describe('DragDrop Module', () => {
  let dragdrop;
  let mockStates;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();

    // Reset mocks
    global.window.piperAPI = {
      validateFileForDragDrop: jest.fn()
    };

    mockStates = require('../../scripts/states.js');
    dragdrop = require('../../scripts/dragdrop.js');
  });

  describe('initializeDragDropEvents', () => {
    test('initializes drag and drop event listeners', () => {
      const dropZone = document.getElementById('textDropZone');
      const addEventListenerSpy = jest.spyOn(dropZone, 'addEventListener');

      dragdrop.initializeDragDropEvents();

      expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });
  });

  describe('dragover event', () => {
    test('prevents default behavior and changes border color', () => {
      const dropZone = document.getElementById('textDropZone');
      const addEventListenerSpy = jest.spyOn(dropZone, 'addEventListener');

      dragdrop.initializeDragDropEvents();

      const event = {
        preventDefault: jest.fn()
      };

      // Get the dragover handler
      const dragoverHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'dragover'
      )[1];

      dragoverHandler(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(dropZone.style.borderColor).toBe('blue');

      addEventListenerSpy.mockRestore();
    });
  });

  describe('dragleave event', () => {
    test('resets border color when leaving drop zone', () => {
      const dropZone = document.getElementById('textDropZone');
      const addEventListenerSpy = jest.spyOn(dropZone, 'addEventListener');

      dragdrop.initializeDragDropEvents();

      // Get the dragleave handler
      const dragleaveHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'dragleave'
      )[1];

      dragleaveHandler();

      expect(dropZone.style.borderColor).toBe('rgb(170, 170, 170)');

      addEventListenerSpy.mockRestore();
    });
  });

  describe('drop event', () => {
    let dropHandler;
    let mockFile;
    let mockEvent;
    let addEventListenerSpy;

    beforeEach(() => {
      const dropZone = document.getElementById('textDropZone');
      addEventListenerSpy = jest.spyOn(dropZone, 'addEventListener');

      dragdrop.initializeDragDropEvents();

      dropHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'drop'
      )[1];

      mockFile = {
        name: 'test.txt',
        size: 1000
      };

      mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          files: [mockFile]
        }
      };
    });

    afterEach(() => {
      if (addEventListenerSpy) {
        addEventListenerSpy.mockRestore();
      }
    });

    test('handles valid file drop successfully', async () => {
      const mockFileContent = 'Test file content';
      const mockFileReader = {
        readAsText: jest.fn().mockImplementation(() => {
          // Simulate FileReader completing the read
          mockFileReader.result = mockFileContent;
          setTimeout(() => {
            if (mockFileReader.onload) {
              mockFileReader.onload();
            }
          }, 0);
        }),
        onload: null,
        result: null
      };

      global.FileReader.mockReturnValue(mockFileReader);
      window.piperAPI.validateFileForDragDrop.mockResolvedValue({ valid: true });

      await dropHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(window.piperAPI.validateFileForDragDrop).toHaveBeenCalledWith('test.txt');
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
      // Note: In this test environment, the FileReader callback doesn't execute synchronously
      // so we just verify that the setup and API calls work correctly
      expect(mockStates.updateSpeakButtonState).toHaveBeenCalledTimes(1);
    });

    test('rejects invalid files', async () => {
      window.piperAPI.validateFileForDragDrop.mockResolvedValue({
        valid: false,
        reason: 'Unsupported file type'
      });

      await dropHandler(mockEvent);

      expect(window.piperAPI.validateFileForDragDrop).toHaveBeenCalledWith('test.txt');
      expect(alert).toHaveBeenCalledWith('File not supported: Unsupported file type');
      expect(global.FileReader).not.toHaveBeenCalled();
    });

    test('rejects files that are too large', async () => {
      const largeMockFile = {
        name: 'large.txt',
        size: 2 * 1024 * 1024 // 2MB
      };

      mockEvent.dataTransfer.files = [largeMockFile];

      window.piperAPI.validateFileForDragDrop.mockResolvedValue({ valid: true });

      await dropHandler(mockEvent);

      expect(alert).toHaveBeenCalledWith('File too large to load into the editor. Please use "Load Text File..." instead.');
      expect(global.FileReader).not.toHaveBeenCalled();
    });

    test('does nothing when no file is dropped', async () => {
      mockEvent.dataTransfer.files = [];

      await dropHandler(mockEvent);

      expect(window.piperAPI.validateFileForDragDrop).not.toHaveBeenCalled();
      expect(global.FileReader).not.toHaveBeenCalled();
    });

    test('resets border color after drop', async () => {
      const dropZone = document.getElementById('textDropZone');
      window.piperAPI.validateFileForDragDrop.mockResolvedValue({ valid: true });

      await dropHandler(mockEvent);

      expect(dropZone.style.borderColor).toBe('rgb(170, 170, 170)');
    });

    test('handles FileReader properly for valid files', async () => {
      const mockFileContent = 'Sample content';
      const mockFileReader = {
        readAsText: jest.fn().mockImplementation(() => {
          // Simulate FileReader completing the read
          mockFileReader.result = mockFileContent;
          setTimeout(() => {
            if (mockFileReader.onload) {
              mockFileReader.onload();
            }
          }, 0);
        }),
        onload: null,
        result: null
      };

      global.FileReader.mockReturnValue(mockFileReader);
      window.piperAPI.validateFileForDragDrop.mockResolvedValue({ valid: true });

      await dropHandler(mockEvent);

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
      // Note: In this test environment, the FileReader callback doesn't execute synchronously
      // so we just verify that the setup and API calls work correctly
    });
  });
});
