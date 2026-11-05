function initializeDragDropEvents() {
  const dropZone = document.getElementById('textDropZone');
  const textArea = document.getElementById('textInput');

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.style.borderColor = 'blue'; // Optional visual feedback
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#aaa';
  });

  dropZone.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropZone.style.borderColor = '#aaa';

    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    // Use backend validation instead of hardcoded .txt check
    const validation = await window.piperAPI.validateFileForDragDrop(file.name);
    if (!validation.valid) {
      alert(`不支持的文件：${validation.reason}`);
      return;
    }

    if (file.size > 1024 * 1024) { // >1MB
      alert('文件过大，无法载入编辑框，请改用「加载文本文件…」。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      textArea.value = reader.result;
    };
    reader.readAsText(file);
    updateSpeakButtonState();
  });
}