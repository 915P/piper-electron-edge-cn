// Global test setup

// Mock Electron modules
const mockElectron = {
  app: {
    getPath: jest.fn(() => '/mock/path'),
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn()
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    getBounds: jest.fn(() => ({ width: 800, height: 600, x: 0, y: 0 }))
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn()
  },
  contextBridge: {
    exposeInMainWorld: jest.fn()
  },
  ipcRenderer: {
    invoke: jest.fn()
  }
};

// Mock Node.js modules
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  lstatSync: jest.fn(() => ({ isFile: () => true })),
  accessSync: jest.fn(),
  constants: { X_OK: 1 },
  readdirSync: jest.fn(() => []),
  statSync: jest.fn(() => ({ size: 1024 })),
  createReadStream: jest.fn()
};

const mockPath = {
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn((filePath) => {
    const parts = filePath.split('.');
    return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
  })
};

const mockChildProcess = {
  spawn: jest.fn()
};

// Mock electron-store
const mockStore = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn()
}));

// Set up global mocks
global.mockElectron = mockElectron;
global.mockFs = mockFs;
global.mockPath = mockPath;
global.mockChildProcess = mockChildProcess;
global.mockStore = mockStore;

// Mock require calls
jest.mock('electron', () => mockElectron);
jest.mock('fs', () => mockFs);
jest.mock('path', () => mockPath);
jest.mock('child_process', () => mockChildProcess);
jest.mock('electron-store', () => ({ default: mockStore }));

// DOM setup for renderer tests
const { JSDOM } = require('jsdom');

global.setupDOM = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <audio id="audioPlayer"></audio>
        <button id="speakButton"></button>
        <button id="previewBtn"></button>
        <select id="modelSelect">
          <option value="/path/to/model.onnx">Model 1</option>
          <option value="/voices/en_US-amy-medium.onnx">Amy</option>
        </select>
        <textarea id="textInput"></textarea>
        <div id="status"></div>
        <div id="progressContainer"></div>
        <div id="progressBar"></div>
        <div id="progressText"></div>
        <div id="durationEstimate"></div>
        <div id="audioControls"></div>
        <input id="outputPath" />
        <span id="piperPathDisplay"></span>
        <span id="modelDirDisplay"></span>
        <div id="textDropZone">
          <textarea id="textInput"></textarea>
        </div>
        <button id="loadTextFileBtn"></button>
        <button id="clearTextBtn"></button>
        <button id="choosePiperButton"></button>
        <button id="selectModelDirectoryButton"></button>
        <button id="resetToDefaultsButton"></button>
        <button id="chooseOutputButton"></button>
        <button id="playAudioButton"></button>
        <button id="pauseAudioButton"></button>
        <button id="resumeAudioButton"></button>
        <button id="stopAudioButton"></button>
      </body>
    </html>
  `, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Audio = class MockAudio {
    constructor(src) {
      this.src = src;
      this.currentTime = 0;
      this.duration = 100;
    }
    play() {
      return Promise.resolve();
    }
    pause() {}
    load() {}
  };
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
