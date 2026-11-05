let outputFilePath = null;

async function chooseOutput() {
  const selected = await window.piperAPI.chooseOutputFile();
  if (selected) {
    outputFilePath = selected;
    document.getElementById('outputPath').value = outputFilePath;
  }
}

async function speakText() {
  const text = document.getElementById('textInput').value;
  const modelPath = document.getElementById('modelSelect').value;
  const status = document.getElementById('status');
  const speakBtn = document.getElementById('speakButton');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  speakBtn.disabled = true;
  status.textContent = '合成中…';
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.ceil((words / 160) * 60);
  const durationFormatted = formatDuration(estimatedSeconds);
  document.getElementById('durationEstimate').textContent = `预计时长：~${durationFormatted}`;

  // Estimate duration based on text length
  const charsPerSecond = 15; // tweak this if needed
  const estimatedDuration = (text.length / charsPerSecond) * 1000;
  const startTime = Date.now();

  // Progress animation loop for TTS processing
  const progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const percent = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100)); // Cap at 95% until completion
    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '% (processing...)';
  }, 100);

  try {
    const savedPath = await window.piperAPI.speak(text, modelPath, outputFilePath) || outputFilePath;
    if (savedPath) {
      outputFilePath = savedPath;
      document.getElementById('outputPath').value = savedPath;
    }
    const audio = document.getElementById('audioPlayer');
    audio.src = `${savedPath}?t=${Date.now()}`;
    audio.load();
    audio.play();

    clearInterval(progressTimer);

    status.textContent = '播放中…';
    document.getElementById('audioControls').style.display = 'block';
  } catch (err) {
    clearInterval(progressTimer);

    status.textContent = '错误：' + err;
  }

  speakBtn.disabled = false;
}

