window.addEventListener('DOMContentLoaded', async () => {
  // 主题选择：套用/记忆（暗色默认，亮色/跟随系统可选）
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = document.documentElement.dataset.theme || 'dark';
    themeSelect.addEventListener('change', () => {
      document.documentElement.dataset.theme = themeSelect.value;
      localStorage.setItem('piperTheme', themeSelect.value);
    });
  }
  initializeAudioPlayerEvents();
  initializeDragDropEvents();

  await loadSettings();

  document.getElementById('previewBtn').addEventListener('click', async () => {
    const modelPath = document.getElementById('modelSelect').value;
    if (!modelPath) {
      return;
    }

    try {
      const textInput = document.getElementById('textInput');
      const audioPath = await window.piperAPI.previewVoice(modelPath, textInput ? textInput.value : '');

      // Bust the cache by appending a timestamp
      const audio = new Audio(`${audioPath}?t=${Date.now()}`);
      audio.play();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Voice preview failed:', err);
      alert('试听失败，请查看控制台。');
    }
  });

  document.getElementById('loadTextFileBtn').addEventListener('click', async () => {
    const result = await window.piperAPI.readTextFile();

    if (!result) {
      return;
    }

    if (result.tooLarge) {
      if (confirm('文件较大，跳过试听直接合成？')) {
        const modelPath = document.getElementById('modelSelect').value;
        const outputPath = 'large-output.wav'; // or generate name
        await window.piperAPI.speakTextFile(result.path, modelPath, outputPath);
        new Audio(`${outputPath}?t=${Date.now()}`).play();
      }
    } else {
      document.getElementById('textInput').value = result.text;
      updateEstimatedDuration();
      updateSpeakButtonState();
    }
  });

  document.getElementById('clearTextBtn').addEventListener('click', () => {
    document.getElementById('textInput').value = '';
    updateSpeakButtonState();
  });

  document.getElementById('textInput').addEventListener('input', updateSpeakButtonState);
  document.getElementById('speakButton').addEventListener('click', speakText);
  document.getElementById('choosePiperButton').addEventListener('click', choosePiper);
  document.getElementById('selectModelDirectoryButton').addEventListener('click', selectModelDirectory);
  document.getElementById('resetToDefaultsButton').addEventListener('click', resetToDefaults);
  document.getElementById('chooseOutputButton').addEventListener('click', chooseOutput);
  document.getElementById('playAudioButton').addEventListener('click', playAudio);
  document.getElementById('pauseAudioButton').addEventListener('click', pauseAudio);
  document.getElementById('resumeAudioButton').addEventListener('click', resumeAudio);
  document.getElementById('stopAudioButton').addEventListener('click', stopAudio);

  updateSpeakButtonState();
});
