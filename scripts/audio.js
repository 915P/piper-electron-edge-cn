function playAudio() {
  const audio = document.getElementById('audioPlayer');
  audio.play();
}

function pauseAudio() {
  const audio = document.getElementById('audioPlayer');
  audio.pause();
}

function resumeAudio() {
  const audio = document.getElementById('audioPlayer');
  audio.play(); // resume is same as play in HTML5
}

function stopAudio() {
  const audio = document.getElementById('audioPlayer');
  audio.pause();
  audio.currentTime = 0;
}

function initializeAudioPlayerEvents() {
  const audio = document.getElementById('audioPlayer');

  audio.onloadedmetadata = () => {
    const durationFormatted = formatDuration(audio.duration);
    document.getElementById('durationEstimate').textContent = `时长：${durationFormatted}`;
  };

  audio.onplay = () => {
    document.getElementById('status').textContent = '播放中…';
    document.getElementById('audioControls').style.display = 'block';
  };

  audio.onpause = () => {
    document.getElementById('status').textContent = '已暂停';
  };

  audio.onended = () => {
    document.getElementById('status').textContent = '播放完成。';
    document.getElementById('audioControls').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('speakButton').disabled = false;
  };

  audio.ontimeupdate = () => {
    const progress = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = `${percent.toFixed(0)}%`;
    progressText.textContent = `${percent.toFixed(0)}% 播放中`;
  };
}
