const playlist = [
  {
    title: "Flying Buzzers",
    artist: "manaman-z",
    url: "music/FlyingBuzzers.mp3",
  },
  {
    title: "Defy The Virus",
    artist: "manaman-z",
    url: "music/DefyTheVirus.mp3",
  },
  { title: "Fennec", artist: "manaman-z", url: "music/Fennec.mp3" },
];
const sizes = [128, 256, 512, 1024, 2048, 4096, 8192, 16384];
let currentSizeIndex = 4;
let currentTrackIndex = 0;
let isPlaying = false;
const audio = document.getElementById("audio-player");
const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");
const btnPlayPause = document.getElementById("btn-play-pause");
const labelPlay = document.getElementById("label-play");
const labelPause = document.getElementById("label-pause");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnSize = document.getElementById("fftSize");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const totalDurationEl = document.getElementById("total-duration");
const infoBtn = document.getElementById("infoBtn");
const infoTab = document.getElementById("infoTab");
const canvas = document.getElementById("visualizer");
const canvasCtx = canvas.getContext("2d");
const lightColor = "#721cb8";
let audioCtx, analyser, source, dataArray, bufferLength;
function initVisualizer() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = sizes[currentSizeIndex];
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  resizeCanvas();
  drawVisualizer();
}
function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (isPlaying && !audio.paused) {
    analyser.getByteTimeDomainData(dataArray);
  }
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.beginPath();
  canvasCtx.strokeStyle = lightColor;
  canvasCtx.lineWidth = 2.5;
  canvasCtx.lineJoin = "round";
  canvasCtx.lineCap = "round";
  const sliceWidth = canvas.width / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;
    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  canvasCtx.stroke();
}
function loadTrack(track) {
  audio.src = track.url;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  progressBar.style.width = "0%";
}
function togglePlay() {
  initVisualizer();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  if (isPlaying) {
    audio.pause();
    labelPause.classList.add("hidden");
    labelPlay.classList.remove("hidden");
  } else {
    audio
      .play()
      .catch((err) => console.log("Playback interaction blocked:", err));
    labelPlay.classList.add("hidden");
    labelPause.classList.remove("hidden");
  }
  isPlaying = !isPlaying;
}
function changeTrack(direction) {
  if (direction === "next") {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  } else {
    currentTrackIndex =
      (currentTrackIndex - 1 + playlist.length) % playlist.length;
  }
  loadTrack(playlist[currentTrackIndex]);
  if (isPlaying) {
    audio.play().catch((err) => console.log(err));
  }
}
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
function updateProgress() {
  const { duration, currentTime } = audio;
  if (!duration) return;
  progressBar.style.width = `${(currentTime / duration) * 100}%`;
  currentTimeEl.textContent = formatTime(currentTime);
}
function seekTimeline(e) {
  if (audio.duration) {
    audio.currentTime =
      (e.offsetX / progressContainer.clientWidth) * audio.duration;
  }
}
function changeSize() {
  currentSizeIndex = (currentSizeIndex + 1) % sizes.length;
  const newSize = sizes[currentSizeIndex];
  btnSize.textContent = `Size ${currentSizeIndex + 1}`;
  if (analyser) {
    analyser.fftSize = newSize;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }
}
function resizeCanvas() {
  if (canvas) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    if (dataArray && (!isPlaying || audio.paused)) {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
let timerId = null;
function infoPopUp() {
  if (timerId) {
    clearTimeout(timerId);
  }
  infoTab.classList.remove("opacity-0", "pointer-events-none");
  infoTab.classList.add("opacity-100");
  infoBtn.classList.remove("opacity-100");
  infoBtn.classList.add("opacity-0");
  timerId = setTimeout(() => {
    infoTab.classList.remove("opacity-100");
    infoTab.classList.add("opacity-0", "pointer-events-none");
    infoBtn.classList.remove("opacity-0");
    infoBtn.classList.add("opacity-100");
    timerId = null;
  }, 10000);
}
btnPlayPause.addEventListener("click", togglePlay);
btnNext.addEventListener("click", () => changeTrack("next"));
btnPrev.addEventListener("click", () => changeTrack("prev"));
btnSize.addEventListener("click", changeSize);
infoBtn.addEventListener("click", infoPopUp);
progressContainer.addEventListener("click", seekTimeline);
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("ended", () => changeTrack("next"));
audio.addEventListener(
  "loadedmetadata",
  () => (totalDurationEl.textContent = formatTime(audio.duration))
);
window.addEventListener("resize", resizeCanvas);
loadTrack(playlist[currentTrackIndex]);
