
// 音色注解（名字·性别）：中文音色用中文名，外语音色保留原名
const VOICE_ANNOS = {
  'zh_CN-xiao_ya-medium.onnx': '小雅（女）',
  'zh_CN-chaowen-medium.onnx': '超文（男）',
  'zh_CN-huayan-medium.onnx': '华彦（女）',
  'en_US-lessac-medium.onnx': 'Lessac（女）',
  'en_US-ryan-high.onnx': 'Ryan（男）',
  'en_US-amy-medium.onnx': 'Amy（女）',
  'edge:zh-CN-XiaoxiaoNeural': '晓晓（女）',
  'edge:zh-CN-XiaoyiNeural': '晓伊（女）',
  'edge:zh-CN-YunxiNeural': '云希（男）',
  'edge:zh-CN-YunyangNeural': '云扬（男·播音）',
  'edge:zh-CN-YunjianNeural': '云健（男）',
  'edge:en-US-JennyNeural': 'Jenny（女）',
  'edge:en-US-GuyNeural': 'Guy（男）',
  'edge:en-GB-SoniaNeural': 'Sonia（女）'
};

async function populateVoices() {
  const voices = await window.piperAPI.getVoiceModels();
  const select = document.getElementById('modelSelect');
  select.innerHTML = '';

  if (!voices.length) {
    const opt = document.createElement('option');
    opt.text = '未找到音库';
    opt.disabled = true;
    select.appendChild(opt);
    return;
  }

  voices.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model;
    const anno = VOICE_ANNOS[model];
    if (model.startsWith('edge:')) {
      opt.text = `☁️ ${model.slice(5)}${anno ? ' · ' + anno : ''}`;
    } else {
      const base = model.split('/').pop();
      opt.text = anno ? `${base} · ${anno}` : base;
    }
    select.appendChild(opt);
  });

  // Select previously saved model if still valid
  const last = await window.piperAPI.getLastSettings();
  if (last?.lastModel && voices.includes(last.lastModel)) {
    select.value = last.lastModel;
  }
}

async function selectModelDirectory() {
  const folder = await window.piperAPI.chooseModelDirectory();
  if (folder) {
    document.getElementById('modelDirDisplay').textContent = folder;
    await populateVoices(); // re-load voice list
  }
}

async function loadSettings() {
  const settings = await window.piperAPI.getLastSettings();

  if (settings.lastText) {
    document.getElementById('textInput').value = settings.lastText;
  }

  if (settings.lastOutput) {
    document.getElementById('outputPath').value = settings.lastOutput;
  }

  document.getElementById('status').textContent = '';

  const path = await window.piperAPI.getPiperPath();
  if (path) {
    document.getElementById('piperPathDisplay').textContent = path;
  }

  // Load saved model directory (if any)
  const modelDir = await window.piperAPI.getModelDirectory();
  if (modelDir) {
    document.getElementById('modelDirDisplay').textContent = modelDir;
    await populateVoices(); // <== this is essential
  } else {
    document.getElementById('modelDirDisplay').textContent = '未选择文件夹';
  }

  // Load last settings like text/model/output
  if (settings.lastModel) {
    const voiceSelect = document.getElementById('modelSelect');
    const option = Array.from(voiceSelect.options).find(opt => opt.value === settings.lastModel);
    if (option) {
      voiceSelect.value = settings.lastModel;
    }
  }
}

async function choosePiper() {
  const selected = await window.piperAPI.choosePiperPath();
  if (selected) {
    document.getElementById('piperPathDisplay').textContent = selected;
    updateSpeakButtonState();
  }
}

