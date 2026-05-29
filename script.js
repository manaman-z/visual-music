if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: '/visual-music/' })
      .then((reg) =>
        console.log("Service Worker Registered Successfully!", reg)
      )
      .catch((err) => console.log("Error Service Worker:", err));
  });
}

const bgCanvas = document.getElementById("bg-grid");
const bgCtx = bgCanvas.getContext("2d");
bgCtx.imageSmoothingEnabled = false;

const icons = [];

const iconSize = 48;
const spacing = 96;
const speed = 0.2;

const iconSources = [
  "images/i1.png",
  "images/i2.png",
  "images/i3.png",
  "images/i4.png",
  "images/i5.png",
  "images/i6.png",
  "images/i7.png",
  "images/i8.png",
  "images/i9.png",
];

const iconImages = iconSources.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

function createGrid() {
  icons.length = 0;

  for (let y = 0; y < bgCanvas.height + spacing; y += spacing) {
    for (let x = 0; x < bgCanvas.width + spacing; x += spacing) {
      const imgIndex = Math.floor(Math.random() * iconImages.length);

      icons.push({
        x,
        y,
        imgIndex,
      });
    }
  }
}

function animateGrid() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  for (const icon of icons) {
    bgCtx.drawImage(
      iconImages[icon.imgIndex],
      icon.x,
      icon.y,
      iconSize,
      iconSize
    );

    icon.x += speed;

    if (icon.x > bgCanvas.width + spacing) {
      icon.x = -spacing;
    }
  }

  requestAnimationFrame(animateGrid);
}

window.addEventListener("resize", () => {
  resizeBgCanvas();
  createGrid();
});

let loadedCount = 0;

iconImages.forEach((img) => {
  img.onload = () => {
    loadedCount++;

    if (loadedCount === iconImages.length) {
      resizeBgCanvas();
      createGrid();
      animateGrid();
    }
  };
});

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
  {
    title: "Fennec",
    artist: "manaman-z",
    url: "music/Fennec.mp3",
  },
];

const sizes = [512, 1024, 2048, 4096, 8192];

let currentSizeIndex = 2;
let currentTrackIndex = 0;
let timerId = null;
let animationId = null;

let audioCtx;
let analyser;
let source;
let dataArray;
let bufferLength;

const lightColor = "#721cb8";

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

const sounds = {
  hover: new Audio("AudioFX/Hover.wav"),
  click: new Audio("AudioFX/Click.wav"),
};

sounds.hover.volume = 0.5;
sounds.click.volume = 0.5;

function initVisualizer() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  analyser = audioCtx.createAnalyser();

  source = audioCtx.createMediaElementSource(audio);

  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  updateAnalyserSize();
  resizeCanvas();
}

function updateAnalyserSize() {
  if (!analyser) return;

  analyser.fftSize = sizes[currentSizeIndex];

  bufferLength = analyser.frequencyBinCount;

  dataArray = new Uint8Array(bufferLength);

  btnSize.textContent = `FFT ${sizes[currentSizeIndex]}`;
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  canvasCtx.setTransform(1, 0, 0, 1, 0, 0);

  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  canvasCtx.scale(dpr, dpr);
}

function startVisualizer() {
  if (!animationId) {
    drawVisualizer();
  }
}

function stopVisualizer() {
  cancelAnimationFrame(animationId);
  animationId = null;
}

function drawVisualizer() {
  animationId = requestAnimationFrame(drawVisualizer);

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvasCtx.fillStyle = "rgba(35, 35, 35, 0.35)";
  canvasCtx.fillRect(0, 0, width, height);

  if (!audio.paused && analyser) {
    analyser.getByteTimeDomainData(dataArray);
  }

  if (!dataArray) return;

  canvasCtx.beginPath();

  canvasCtx.strokeStyle = lightColor;
  canvasCtx.lineWidth = 3;
  canvasCtx.lineJoin = "round";
  canvasCtx.lineCap = "round";

  const sliceWidth = width / bufferLength;

  let x = 0;

  for (let i = 0; i < bufferLength; i += 2) {
    const v = dataArray[i] / 128.0;

    const y = (v * height) / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth * 2;
  }

  canvasCtx.stroke();
}

function loadTrack(track) {
  audio.src = track.url;

  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;

  progressBar.style.width = "0%";
}

function updatePlayButton() {
  const isPlaying = !audio.paused;

  labelPause.classList.toggle("hidden", !isPlaying);
  labelPlay.classList.toggle("hidden", isPlaying);
}

async function togglePlay() {
  initVisualizer();

  if (audioCtx?.state === "suspended") {
    await audioCtx.resume();
  }

  if (audio.paused) {
    try {
      await audio.play();

      startVisualizer();
    } catch (err) {
      console.log("Playback blocked:", err);
    }
  } else {
    audio.pause();

    stopVisualizer();
  }

  updatePlayButton();
}

async function changeTrack(direction) {
  const step = direction === "next" ? 1 : -1;

  currentTrackIndex =
    (currentTrackIndex + step + playlist.length) % playlist.length;

  const wasPlaying = !audio.paused;

  loadTrack(playlist[currentTrackIndex]);

  if (wasPlaying) {
    try {
      await audio.play();
    } catch (err) {
      console.log(err);
    }
  }

  updatePlayButton();
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function updateProgress() {
  if (!audio.duration) return;

  progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;

  currentTimeEl.textContent = formatTime(audio.currentTime);
}

function seekTimeline(e) {
  if (!audio.duration) return;

  const rect = progressContainer.getBoundingClientRect();

  const clickX = e.clientX - rect.left;

  audio.currentTime = (clickX / progressContainer.clientWidth) * audio.duration;
}

function changeSize() {
  currentSizeIndex = (currentSizeIndex + 1) % sizes.length;

  updateAnalyserSize();
}

function infoPopUp() {
  clearTimeout(timerId);

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

function playInterfaceSound(type) {
  const sound = sounds[type];

  if (!sound) return;

  sound.pause();
  sound.currentTime = 0;

  sound.play().catch(() => {});
}

document.addEventListener("mouseover", (e) => {
  if (e.target.matches("button")) {
    playInterfaceSound("hover");
  }
});

document.addEventListener("click", (e) => {
  if (e.target.matches("button")) {
    playInterfaceSound("click");
  }
});

btnPlayPause.addEventListener("click", togglePlay);

btnNext.addEventListener("click", () => {
  changeTrack("next");
});

btnPrev.addEventListener("click", () => {
  changeTrack("prev");
});

btnSize.addEventListener("click", changeSize);

infoBtn.addEventListener("click", infoPopUp);

progressContainer.addEventListener("click", seekTimeline);

audio.addEventListener("timeupdate", updateProgress);

audio.addEventListener("ended", () => {
  changeTrack("next");
});

audio.addEventListener("play", updatePlayButton);

audio.addEventListener("pause", updatePlayButton);

audio.addEventListener("loadedmetadata", () => {
  totalDurationEl.textContent = formatTime(audio.duration);
});

window.addEventListener("resize", resizeCanvas);

loadTrack(playlist[currentTrackIndex]);

updateAnalyserSize();
