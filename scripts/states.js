async function updateSpeakButtonState() {
  const speakButton = document.getElementById('speakButton');
  const previewBtn = document.getElementById('previewBtn');
  const modelSelect = document.getElementById('modelSelect');
  const textArea = document.getElementById('textInput');

  const isValidPiper = await window.piperAPI.validatePiperPath();
  const modelPath = modelSelect.value;
  const isModelValid = modelPath && await window.piperAPI.validateModelPath(modelPath);
  const hasText = textArea && textArea.value.trim().length > 0;

  previewBtn.disabled = !isModelValid;
  speakButton.disabled = !(isValidPiper && isModelValid && hasText);
}

async function resetToDefaults() {
  const confirmed = confirm('确定要把所有设置恢复为默认值吗？');
  if (!confirmed) {
    return;
  }

  document.getElementById('durationEstimate').textContent = '预计时长：—';

  await window.piperAPI.resetSettings();
  location.reload(); // reloads the app with default state
}

