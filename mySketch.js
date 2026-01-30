let vid;
let img = null;

let stitches = [];
let step = 8;
let reveal = 0;
let brightnessThreshold = 230;
let revealSpeed = 0.01;

let fileInput;
let stepSlider, brightnessSlider, speedSlider;
let resetBtn, playBtn;
let recordBtn, stopBtn;
let modeLabel;
let isVideoPlaying = true;

let mediaRecorder;
let recordedChunks = [];

const UI_WIDTH = 240;

/* ================= SETUP ================= */

function setup() {
  createCanvas(600, 600);
  pixelDensity(2);
  background(0);

  createUI();

  // default video
  vid = createVideo("Mascot_Horse_Running_Video_Generated.mp4", () => {
    vid.loop();
    vid.hide();
    modeLabel.html("Mode: Video (default)");
  });
}

/* ================= UI ================= */

function createUI() {
  let panel = createDiv();
  panel.style("position", "fixed");
  panel.style("right", "20px");
  panel.style("top", "20px");
  panel.style("width", UI_WIDTH + "px");
  panel.style("padding", "12px");
  panel.style("background", "#111");
  panel.style("border", "1px solid #333");
  panel.style("border-radius", "8px");
  panel.style("color", "#fff");
  panel.style("font-family", "monospace");

  createP("GENUARY - STICHES HORSE | HEE").parent(panel);

  fileInput = createFileInput(handleFile);
  fileInput.attribute("accept", "image/*,video/mp4");
  fileInput.parent(panel);

  modeLabel = createP("Mode:");
  modeLabel.parent(panel);

  createP("STITCH SIZE").parent(panel);
  stepSlider = createSlider(4, 20, step, 1);
  stepSlider.parent(panel);

  createP("BRIGHTNESS").parent(panel);
  brightnessSlider = createSlider(50, 255, brightnessThreshold, 1);
  brightnessSlider.parent(panel);

  createP("REVEAL SPEED (IMAGE)").parent(panel);
  speedSlider = createSlider(1, 100, 10, 1);
  speedSlider.parent(panel);

  playBtn = createButton("PLAY / PAUSE VIDEO");
  playBtn.mousePressed(toggleVideo);
  playBtn.parent(panel);

  recordBtn = createButton("▶ START RECORD");
  recordBtn.mousePressed(startRecording);
  recordBtn.parent(panel);

  stopBtn = createButton("⏹ STOP & DOWNLOAD");
  stopBtn.mousePressed(stopRecording);
  stopBtn.parent(panel);
}

/* ================= FILE HANDLER ================= */

function handleFile(file) {
  if (file.type === "image") {
    loadImage(file.data, loadedImage => {
      img = loadedImage;
      if (vid) vid.remove();
      vid = null;
      buildStitchesFromImage();
      modeLabel.html("Mode: Image");
    });
  }

  if (file.type === "video") {
    if (vid) vid.remove();

    vid = createVideo(file.data, () => {
      vid.loop();
      vid.hide();
      img = null;
      modeLabel.html("Mode: Video");
    });
  }
}

/* ================= IMAGE STITCH ================= */

function buildStitchesFromImage() {
  stitches = [];
  reveal = 0;

  img.resize(0, height);
  img.loadPixels();

  for (let y = 0; y < img.height; y += step) {
    for (let x = 0; x < img.width; x += step) {
      let idx = 4 * (y * img.width + x);
      let r = img.pixels[idx];
      let g = img.pixels[idx + 1];
      let b = img.pixels[idx + 2];
      let brightness = (r + g + b) / 3;

      if (brightness < brightnessThreshold) {
        stitches.push({ x, y, c: color(r, g, b) });
      }
    }
  }

  stitches.sort(() => random() - 0.5);
}

/* ================= DRAW ================= */

function draw() {
  background(0);

  step = stepSlider.value();
  brightnessThreshold = brightnessSlider.value();
  revealSpeed = speedSlider.value() / 1000;

  if (img) {
    push();
    translate((width - img.width) / 2, (height - img.height) / 2);
    drawImageReveal();
    pop();
  }

  if (vid) {
    drawVideoStitch();
  }
}

function drawImageReveal() {
  let count = floor(map(reveal, 0, 1, 0, stitches.length));
  for (let i = 0; i < count; i++) drawStitch(stitches[i]);
  reveal = constrain(reveal + revealSpeed, 0, 1);
}

function drawVideoStitch() {
  vid.loadPixels();
  if (!vid.pixels.length) return;

  let vw = vid.width;
  let vh = vid.height;
  let s = height / vh;

  push();
  translate((width - vw * s) / 2, 0);
  scale(s);

  for (let y = 0; y < vh; y += step) {
    for (let x = 0; x < vw; x += step) {
      let idx = 4 * (y * vw + x);
      let r = vid.pixels[idx];
      let g = vid.pixels[idx + 1];
      let b = vid.pixels[idx + 2];
      let brightness = (r + g + b) / 3;

      if (brightness < brightnessThreshold) {
        drawStitch({ x, y, c: color(r, g, b) });
      }
    }
  }
  pop();
}

/* ================= STITCH ================= */

function drawStitch(s) {
  stroke(s.c);
  strokeWeight(1.6);
  noFill();
  line(s.x, s.y, s.x + step, s.y + step);
  line(s.x + step, s.y, s.x, s.y + step);
}

/* ================= VIDEO RECORD ================= */

function startRecording() {
  recordedChunks = [];
  let stream = document.querySelector("canvas").captureStream(60);
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
  mediaRecorder.start();

  console.log("Recording started");
}

function stopRecording() {
  mediaRecorder.stop();

  mediaRecorder.onstop = () => {
    let blob = new Blob(recordedChunks, { type: "video/webm" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "stitch-export.webm";
    a.click();

    URL.revokeObjectURL(url);
  };

  console.log("Recording stopped");
}

/* ================= CONTROLS ================= */

function toggleVideo() {
  if (!vid) return;
  isVideoPlaying ? vid.pause() : vid.loop();
  isVideoPlaying = !isVideoPlaying;
}
