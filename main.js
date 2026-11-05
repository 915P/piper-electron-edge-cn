const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Use dynamic import for electron-store to handle ES modules in CommonJS
let store;
let currentProcess = null;

// 默认路径：打包版看 resources/（extraResources 下的 engine 与 voices），开发版看项目根目录
const resBase = process.resourcesPath || __dirname;
const defaultPiperPath = [
  path.join(resBase, 'engine', 'piper'),
  path.join(__dirname, 'engine', 'piper'),
  path.join(__dirname, 'piper')
].find((p) => fs.existsSync(p)) || path.join(__dirname, 'piper');
const defaultModelDir = [
  path.join(resBase, 'voices'),
  path.join(__dirname, 'voices')
].find((p) => fs.existsSync(p)) || path.join(__dirname, 'voices');

// ── Edge TTS 云端音色（前缀 edge:，用引擎自带 Python 的 edge_tts 模块合成）──
const EDGE_VOICES = [
  'edge:zh-CN-XiaoxiaoNeural', // 晓晓 女
  'edge:zh-CN-XiaoyiNeural',   // 晓伊 女
  'edge:zh-CN-YunxiNeural',    // 云希 男
  'edge:zh-CN-YunyangNeural',  // 云扬 男·播音
  'edge:zh-CN-YunjianNeural',  // 云健 男·浑厚
  'edge:en-US-JennyNeural',    // Jenny 女
  'edge:en-US-GuyNeural',      // Guy 男
  'edge:en-GB-SoniaNeural'     // Sonia 女·英音
];

// 云端合成：-m edge_tts（纯网络请求，无本地模型；输出 mp3）
function synthEdge(text, modelPath, outFile) {
  const voice = modelPath.slice('edge:'.length);
  const engineDir = path.dirname(store.get('piperPath'));
  const py = path.join(engineDir, 'python', 'bin', 'python3.12');
  return new Promise((resolve, reject) => {
    const proc = spawn(py, ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', outFile], {
      env: {
        ...process.env,
        LD_LIBRARY_PATH: path.join(engineDir, 'python', 'lib'),
        PYTHONNOUSERSITE: '1'
      },
      stdio: ['ignore', 'inherit', 'inherit']
    });
    currentProcess = proc;
    proc.on('close', (code) => {
      currentProcess = null;
      if (code === 0) {
        resolve(outFile);
      } else {
        reject(new Error('Edge TTS 合成失败，退出码 ' + code));
      }
    });
  });
}

// Initialize electron-store dynamically
async function initStore() {
  const { default: Store } = await import('electron-store');
  
  store = new Store({
    defaults: {
      lastModel: '',
      lastText: '',
      windowBounds: { width: 800, height: 600, x: undefined, y: undefined },
      piperPath: ''
    }
  });

  // Set default paths if they don't exist or are invalid
  if (!store.get('piperPath') || !fs.existsSync(store.get('piperPath'))) {
    if (fs.existsSync(defaultPiperPath)) {
      store.set('piperPath', defaultPiperPath);
    }
  }

  if (!store.get('modelDirectory') || !fs.existsSync(store.get('modelDirectory'))) {
    if (fs.existsSync(defaultModelDir)) {
      store.set('modelDirectory', defaultModelDir);
    }
  }
}

function createWindow() {
  const winBounds = store.get('windowBounds', { width: 500, height: 500 });
  const win = new BrowserWindow({
    ...winBounds,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  win.loadFile('index.html');

  // Save size and position on close
  win.on('close', () => {
    store.set('windowBounds', win.getBounds());
  });
}

const knownTextExtensions = [
  '.txt', '.md', '.html', '.htm', '.js', '.ts', '.json',
  '.css', '.csv', '.xml', '.ini', '.log', '.yml', '.yaml',
  '.py', '.java', '.c', '.cpp', '.rb', '.go'
];

function isKnownTextExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return knownTextExtensions.includes(ext);
}

function isProbablyTextContent(filePath, maxBytes = 512) {
  try {
    const buffer = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
    const sample = buffer.slice(0, maxBytes);
    for (let i = 0; i < sample.length; i++) {
      const code = sample[i];
      if (code === 9 || code === 10 || code === 13) {
        continue;
      } // tab, CR, LF
      if (code < 32 || code > 126) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function isValidTextFile(filePath) {
  return isKnownTextExtension(filePath) || isProbablyTextContent(filePath);
}

// Initialize app with proper store setup
app.whenReady().then(async () => {
  // 去掉 Electron 默认菜单栏（File/Edit/View…）
  Menu.setApplicationMenu(null);
  await initStore();
  createWindow();
});

ipcMain.handle('choose-piper-path', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择 Piper 可执行文件',
    properties: ['openFile'],
    filters: process.platform === 'win32' ? [{ name: '可执行文件', extensions: ['exe'] }] : []
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    store.set('piperPath', selectedPath);
    return selectedPath;
  }

  return null;
});

ipcMain.handle('get-piper-path', () => {
  return store.get('piperPath');
});

ipcMain.handle('validate-piper-path', () => {
  const piperPath = store.get('piperPath');
  try {
    return !!(
      piperPath &&
      fs.existsSync(piperPath) &&
      fs.lstatSync(piperPath).isFile() &&
      fs.accessSync(piperPath, fs.constants.X_OK) === undefined
    );
  } catch {
    return false;
  }
});

ipcMain.handle('choose-output-file', async () => {
  const result = await dialog.showSaveDialog({
    title: '保存音频文件',
    defaultPath: 'piper-output.wav',
    filters: [{ name: 'WAV 音频', extensions: ['wav'] }]
  });

  if (!result.canceled && result.filePath) {
    store.set('lastOutput', result.filePath);
    return result.filePath;
  }
});

ipcMain.handle('run-piper', async (_event, text, modelPath, outFile) => {
  const piperPath = store.get('piperPath');
  if (!piperPath || !fs.existsSync(piperPath) || !fs.lstatSync(piperPath).isFile()) {
    throw new Error('Piper 路径未配置或无效');
  }

  // 输出路径兜底：渲染端可能传 null/空（未选保存位置），
  // 且 AppImage 挂载目录只读，必须落到可写的临时目录
  if (!outFile || typeof outFile !== 'string' || !outFile.trim()) {
    outFile = path.join(app.getPath('temp'), 'piper-output.wav');
  }

  // ✅ Save current state to store
  store.set('lastText', text);
  store.set('lastModel', modelPath);
  store.set('lastOutput', outFile);

  // 云端 Edge 音色：换扩展名为 mp3，走网络合成（输出 mp3）
  if (modelPath.startsWith('edge:')) {
    outFile = outFile.replace(/\.(wav|mp3)$/i, '') + '.mp3';
    store.set('lastOutput', outFile);
    return synthEdge(text, modelPath, outFile);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(piperPath, [
      '--model', modelPath,
      '--output_file', outFile
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    currentProcess = proc;

    proc.stdin.write(text);
    proc.stdin.end();

    proc.on('close', (code) => {
      currentProcess = null;
      if (code === 0) {
        resolve(outFile);
      } else {
        reject(new Error('Piper 合成失败，退出码 ' + code));
      }
    });
  });
});

ipcMain.handle('preview-voice', async (_event, modelPath, userText) => {
  // 试听内容：优先用户当前输入（截前 80 字），否则按音色语言给默认句
  let previewText = typeof userText === 'string' ? userText.trim().slice(0, 80) : '';
  if (!previewText) {
    previewText = /zh_CN|_zh|\/zh/i.test(modelPath)
      ? '这是一段试听，你现在听到的就是所选音色。'
      : 'This is a sample of the selected voice. This is how it sounds.';
  }
  const outputFile = path.join(app.getPath('temp'), 'piper-voice-preview.wav');

  // 云端 Edge 音色试听
  if (modelPath.startsWith('edge:')) {
    return synthEdge(previewText, modelPath, outputFile.replace(/\.wav$/i, '.mp3'));
  }

  return new Promise((resolve, reject) => {
    const piperPath = store.get('piperPath');
    if (!piperPath || !fs.existsSync(piperPath)) {
      return reject(new Error('Piper 路径未正确配置。'));
    }

    const piper = spawn(piperPath, [
      '--model', modelPath,
      '--output_file', outputFile
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    piper.stdin.write(previewText);
    piper.stdin.end();

    piper.on('exit', code => {
      if (code === 0) {
        resolve(outputFile);
      } else {
        reject(new Error(`试听失败，退出码 ${code}`));
      }
    });
  });
});

ipcMain.handle('cancel-speak', async () => {
  if (currentProcess) {
    try {
      currentProcess.kill();
      currentProcess = null;
      return true;
    } catch (err) {
      console.error('Failed to cancel process:', err);
    }
  }
  return false;
});

ipcMain.handle('get-last-settings', async () => {
  return {
    lastModel: store.get('lastModel', null),
    lastOutput: store.get('lastOutput', null),
    lastText: store.get('lastText', '')
  };
});

ipcMain.handle('reset-settings', async () => {
  store.clear();

  // Set default piper path if it exists
  if (fs.existsSync(defaultPiperPath)) {
    store.set('piperPath', defaultPiperPath);
  }

  // Set default model directory if it exists
  if (fs.existsSync(defaultModelDir)) {
    store.set('modelDirectory', defaultModelDir);
  }

  return {
    piperPath: store.get('piperPath'),
    modelDirectory: store.get('modelDirectory')
  };
});

ipcMain.handle('get-voice-models', async () => {
  const modelDir = store.get('modelDirectory');
  if (!modelDir || !fs.existsSync(modelDir)) {
    return [];
  }

  const models = fs.readdirSync(modelDir)
    .filter(name => name.endsWith('.onnx'))
    .map(name => {
      const fullPath = path.join(modelDir, name);
      const jsonPath = fullPath + '.json'; // instead of replacing extension
      return fs.existsSync(jsonPath) ? fullPath : null;
    })
    .filter(Boolean);

  return [...models, ...EDGE_VOICES];
});

ipcMain.handle('choose-model-directory', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择音库文件夹',
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folder = result.filePaths[0];
  store.set('modelDirectory', folder);
  return folder;
});

ipcMain.handle('get-model-directory', () => {
  return store.get('modelDirectory');
});

ipcMain.handle('validate-model-path', (_event, modelPath) => {
  // 云端 Edge 音色没有本地文件，直接放行
  if (typeof modelPath === 'string' && modelPath.startsWith('edge:')) {
    return true;
  }
  return fs.existsSync(modelPath);
});

ipcMain.handle('read-text-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择文本文件',
    // filters: [{ name: 'Text Files', extensions: ['txt'] }],
    filters: [{ name: '所有文件', extensions: ['*'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths[0]) {
    return null;
  }

  const filePath = filePaths[0];

  if (!isValidTextFile(filePath)) {
    return { invalid: true, path: filePath };
  }

  const stats = fs.statSync(filePath);
  if (stats.size > 1024 * 1024) {
    return { tooLarge: true, path: filePath };
  } // >1MB

  const text = fs.readFileSync(filePath, 'utf-8');
  return { text, path: filePath };
});

ipcMain.handle('speak-text-file', async (_, filePath, modelPath, outputPath) => {
  // 同 run-piper：空路径兜底到可写临时目录（AppImage 挂载只读）
  if (!outputPath || typeof outputPath !== 'string' || !outputPath.trim()) {
    outputPath = path.join(app.getPath('temp'), 'piper-output.wav');
  }

  // 云端 Edge 音色：整文件文本走网络合成
  if (modelPath.startsWith('edge:')) {
    outputPath = outputPath.replace(/\.(wav|mp3)$/i, '') + '.mp3';
    const text = fs.readFileSync(filePath, 'utf8');
    return synthEdge(text, modelPath, outputPath);
  }

  return new Promise((resolve, reject) => {
    const piperPath = store.get('piperPath');

    const child = spawn(piperPath, [
      '--model', modelPath,
      '--output_file', outputPath
    ]);

    fs.createReadStream(filePath).pipe(child.stdin);

    child.on('exit', code => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Piper 退出码 ${code}`));
      }
    });
  });
});

ipcMain.handle('validate-file-for-drag-drop', async (_, file) => {
  // Use the same validation logic as read-text-file
  if (!isValidTextFile(file)) {
    return { valid: false, reason: 'Invalid file type' };
  }

  // You could also check size here if needed
  return { valid: true };
});