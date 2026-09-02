import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const CONFIG = {
  storageKey: "the-last-frequency-claimed-v1",
  audioUrl:
    "https://github.com/byTheshadow/song/raw/refs/heads/main/M500002bff4Z2rtysY.mp3"
};

const TRACKS = [
  {
    id: "TRACK-01",
    code: "FREQ-01-OVERDRIVE",
    title: "失真纪元",
    english: "OVERDRIVE",
    subtitle: "UNRESTRICTED FREQUENCY",
    clues: [
      "监测到一段高阶声轨。它没有固定形状，却能填满漫长黑夜的全部空隙。",
      "内部没有可触碰的重量，却储存着一整座不受限制的声音档案。",
      "当纯黑纹路开始转动，所有被隔绝的旋律都会为你重新亮起。"
    ],
    manifestTitle: "UNRESTRICTED FREQUENCY",
    text: `给耳朵一处永远开放的避难所。

当现实的噪声开始过载，
你可以随时切换到另一种波长。

这里没有被截断的回声，
没有被关闭的房间，
也没有必须按顺序播放的人生。

只要戴上耳机，
让世界退到身后。

频率已经为你解除限制。`
  },
  {
    id: "TRACK-02",
    code: "MATTER-02-BITTERSWEET",
    title: "纯黑回声",
    english: "VINYL",
    subtitle: "CRYOGENIC DARK MATTER",
    clues: [
      "检测到低温晶格。内部结构轻盈、疏松，并保留着冻结后的短促回响。",
      "表面接近黑曜石，但在接触之后，会迅速失去原本的坚硬。",
      "它的第一层回声偏暗，第二层回声开始变甜，最后在舌尖留下短暂而明亮的余震。"
    ],
    manifestTitle: "CRYOGENIC DARK MATTER",
    text: `有些快乐不需要被解释。

它只需要在某个疲惫的下午，
被轻轻拆开，
然后在一声清脆的崩裂里，
让沉闷的空气重新获得重量。

愿这枚黑色物质，
替你暂时关闭过度思考的频道。

今天不必保持清醒。
只需要享受这一小段失重。`
  },
  {
    id: "TRACK-03",
    code: "NODE-03-SIGNAL",
    title: "异界频率",
    english: "FEEDBACK",
    subtitle: "ANOMALOUS CUSHION NODE",
    clues: [
      "检测到一种会记住形状的柔性介质。它在受到挤压后，仍会慢慢回到原来的位置。",
      "重量很轻，但似乎专门用来承受那些没有被说出口的情绪。",
      "靠近它的核心，某段只对你开放的短波就会被唤醒。"
    ],
    manifestTitle: "ANOMALOUS CUSHION NODE",
    text: `当情绪发生轻微坠落，
请把它握在手里。

它不能替你回答所有问题，
但可以先替你接住一部分重量。

靠近它，
让隐藏的信号短暂显形。

如果今天的世界太硬，
就把它带在身边。

你不需要时时刻刻表现得没有事。`
  },
  {
    id: "TRACK-04",
    code: "FLUID-04-NOISEWALL",
    title: "音墙余烬",
    english: "NOISE WALL",
    subtitle: "LIQUID RESONANCE",
    clues: [
      "检测到高密度液态介质，内部存在持续运动的微型晶体。",
      "它可以在寒冷与温热之间切换，并对低气压情绪产生短暂的抵抗作用。",
      "当封印被刺穿，一整段柔软的甜味声场将开始流动。"
    ],
    manifestTitle: "LIQUID RESONANCE",
    text: `当今天的噪音堆得太高，
不必急着把它们全部处理完。

先暂停一会儿。

让一段温柔、浓郁、带着微小冰晶回声的液态旋律，
从掌心流向身体。

这是一次短暂的离场许可。

无需解释，
无需证明，
无需把坏情绪整理成漂亮的句子。

今天先让自己被好好照顾。`
  }
];

const $ = (selector) => document.querySelector(selector);

const sceneContainer = $("#scene");
const introScreen = $("#introScreen");
const vaultScreen = $("#vaultScreen");
const boxScreen = $("#boxScreen");
const claimedScreen = $("#claimedScreen");
const openingLayer = $("#openingLayer");

const audio = $("#backgroundAudio");
audio.src = CONFIG.audioUrl;

let scene;
let camera;
let renderer;
let controls;
let clock;
let analyser;
let audioContext;
let frequencyData;

let currentMode = "intro";
let selectedTrack = null;
let selectedGroup = null;
let selectedBox = null;
let shakeAmount = 0;
let clueCount = 0;
let lastMotionTime = 0;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

initThree();
createIntroWave();
createTrackButtons();
checkClaimed();
animate();

$("#enterButton").addEventListener("click", async () => {
  await startAudio();
  await requestMotionPermission();

  introScreen.classList.add("hidden");
  vaultScreen.classList.remove("hidden");
  currentMode = "vault";
  $("#statusText").textContent = "SYSTEM / RESONANCE ACTIVE";
});

$("#shakeButton").addEventListener("click", () => {
  registerShake(1);
});

$("#changeButton").addEventListener("click", () => {
  closeBox();
});

$("#openButton").addEventListener("click", () => {
  if (clueCount >= 3) {
    claimSelectedTrack();
  }
});

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("deviceorientation", onOrientation);
window.addEventListener("devicemotion", onMotion);

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.035);

  camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 1.5, 9);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  sceneContainer.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 13;
  controls.enabled = false;

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xffffff, 4, 20);
  rimLight.position.set(-4, 1, 2);
  scene.add(rimLight);

  clock = new THREE.Clock();

  window.addEventListener("resize", onResize);
}

function createIntroWave() {
  const group = new THREE.Group();
  group.name = "introWave";

  const lines = [];

  for (let layer = 0; layer < 5; layer++) {
    const points = [];

    for (let i = 0; i < 180; i++) {
      const x = (i / 179 - 0.5) * 13;
      const y = Math.sin(i * 0.17 + layer * 0.35) * 0.22;
      const z = (layer - 2) * 0.12;

      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: layer === 2 ? 0xffffff : 0x777777,
      transparent: true,
      opacity: layer === 2 ? 0.9 : 0.28
    });

    const line = new THREE.Line(geometry, material);
    line.userData.basePoints = points;
    line.userData.layer = layer;

    group.add(line);
    lines.push(line);
  }

  scene.add(group);
  scene.userData.introWave = group;
  scene.userData.waveLines = lines;
}

function createTrackButtons() {
  const list = $("#trackList");

  TRACKS.forEach((track, index) => {
    const button = document.createElement("button");
    button.className = "track-item";
    button.innerHTML = `
      TRACK ${String(index + 1).padStart(2, "0")} /
      ${track.english}
    `;

    button.addEventListener("click", () => {
      openTrack(track, index);
    });

    list.appendChild(button);
  });
}

function createVault() {
  if (scene.userData.vaultGroup) {
    scene.remove(scene.userData.vaultGroup);
  }

  const group = new THREE.Group();
  group.name = "vault";

  createStave(group);

  TRACKS.forEach((track, index) => {
    const box = createBox(track, index);
    group.add(box);
  });

  scene.add(group);
  scene.userData.vaultGroup = group;
}

function createStave(group) {
  for (let row = 0; row < 5; row++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, row * 0.22 - 0.45, 0),
      new THREE.Vector3(-3.5, row * 0.22 - 0.45, -0.3),
      new THREE.Vector3(0, row * 0.22 - 0.45, 0.3),
      new THREE.Vector3(3.5, row * 0.22 - 0.45, -0.2),
      new THREE.Vector3(7, row * 0.22 - 0.45, 0)
    ]);

    const geometry = new THREE.TubeGeometry(curve, 100, 0.012, 5, false);
    const material = new THREE.MeshBasicMaterial({
      color: row === 2 ? 0xffffff : 0x777777,
      transparent: true,
      opacity: row === 2 ? 0.95 : 0.5
    });

    group.add(new THREE.Mesh(geometry, material));
  }
}

function createBox(track, index) {
  const group = new THREE.Group();
  group.userData.track = track;
  group.userData.index = index;

  const geometry = new THREE.BoxGeometry(1.15, 1.15, 1.15, 2, 2, 2);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x151515,
    roughness: 0.22,
    metalness: 0.85,
    clearcoat: 0.6,
    emissive: 0x050505
  });

  const mesh = new THREE.Mesh(geometry, material);

  const edgeGeometry = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4
  });

  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  group.add(mesh, edges);

  const angle = (index / TRACKS.length) * Math.PI * 2;
  group.position.set(
    Math.cos(angle) * 3.2,
    Math.sin(angle * 1.5) * 0.55,
    Math.sin(angle) * 1.5
  );

  group.rotation.set(
    Math.random() * 0.4,
    angle,
    Math.random() * 0.3
  );

  group.userData.mesh = mesh;
  group.userData.basePosition = group.position.clone();
  group.userData.baseRotation = group.rotation.clone();

  return group;
}

function openTrack(track, index) {
  selectedTrack = track;

  if (!scene.userData.vaultGroup) {
    createVault();
  }

  selectedGroup = scene.userData.vaultGroup.children.find(
    (child) => child.userData?.track?.id === track.id
  );

  if (!selectedGroup) return;

  selectedBox = selectedGroup.userData.mesh;
  shakeAmount = 0;
  clueCount = 0;

  $("#boxEyebrow").textContent =
    `TRACK ${String(index + 1).padStart(2, "0")} / ${track.english}`;

  $("#boxTitle").textContent = track.title;
  $("#boxSubtitle").textContent = track.subtitle;
  $("#shakeCount").textContent = "00 / 03";
  $("#progressBar").style.width = "0%";
  $("#clueArea").innerHTML = `
    <p class="clue-placeholder">
      SHAKE THE OBJECT TO REVEAL ITS ECHO
    </p>
  `;

  $("#openButton").classList.add("hidden");

  vaultScreen.classList.add("hidden");
  boxScreen.classList.remove("hidden");

  currentMode = "box";
  controls.enabled = false;

  animateCameraTo(selectedGroup.position);
}

function closeBox() {
  boxScreen.classList.add("hidden");
  vaultScreen.classList.remove("hidden");

  currentMode = "vault";
  selectedTrack = null;
  selectedGroup = null;
  selectedBox = null;

  animateCameraTo(new THREE.Vector3(0, 1.5, 9));
}

function registerShake(intensity = 1) {
  if (currentMode !== "box" || !selectedGroup) return;

  const now = performance.now();

  if (now - lastMotionTime < 180) return;
  lastMotionTime = now;

  shakeAmount = Math.min(shakeAmount + intensity, 3);

  if (clueCount < 3) {
    const clue = selectedTrack.clues[clueCount];

    const clueElement = document.createElement("p");
    clueElement.className = "clue";
    clueElement.innerHTML = `
      <span class="clue-label">
        CLUE 0${clueCount + 1} / ${getClueType(clueCount)}
      </span>
      ${clue}
    `;

    if (clueCount === 0) {
      $("#clueArea").innerHTML = "";
    }

    $("#clueArea").appendChild(clueElement);

    clueCount++;

    $("#shakeCount").textContent =
      `${String(clueCount).padStart(2, "0")} / 03`;

    $("#progressBar").style.width = `${(clueCount / 3) * 100}%`;

    if (clueCount >= 3) {
      $("#openButton").classList.remove("hidden");
    }
  }

  selectedGroup.userData.shakeVelocity = intensity * 0.7;
}

function getClueType(index) {
  return ["FREQUENCY", "MATERIAL", "ECHO"][index];
}

function claimSelectedTrack() {
  if (!selectedTrack || clueCount < 3) return;

  const record = {
    trackId: selectedTrack.id,
    code: selectedTrack.code,
    claimedAt: new Date().toISOString()
  };

  localStorage.setItem(CONFIG.storageKey, JSON.stringify(record));

  openingLayer.classList.remove("hidden");

  setTimeout(() => {
    openingLayer.classList.add("hidden");
    showClaimedPage(record);
  }, 1800);
}

function checkClaimed() {
  const saved = localStorage.getItem(CONFIG.storageKey);

  if (!saved) {
    createVault();
    return;
  }

  try {
    const record = JSON.parse(saved);
    showClaimedPage(record);
  } catch {
    localStorage.removeItem(CONFIG.storageKey);
    createVault();
  }
}

function showClaimedPage(record) {
  const track = TRACKS.find((item) => item.id === record.trackId);

  if (!track) return;

  introScreen.classList.add("hidden");
  vaultScreen.classList.add("hidden");
  boxScreen.classList.add("hidden");
  claimedScreen.classList.remove("hidden");

  $("#statusText").textContent = "SYSTEM / CLAIMED";

  $("#claimedTitle").textContent = track.title;
  $("#claimedCode").textContent = record.code;
  $("#claimedManifestTitle").textContent = track.manifestTitle;
  $("#claimedText").textContent = track.text;

  const date = new Date(record.claimedAt);

  $("#claimedDate").textContent =
    `CLAIMED / ${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} / ${record.trackId}`;
}

async function startAudio() {
  try {
    audio.volume = 0.62;

    audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.86;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    frequencyData = new Uint8Array(analyser.frequencyBinCount);

    await audioContext.resume();
    await audio.play();

    $("#audioNote").textContent = "AUDIO CHANNEL / CONNECTED";
  } catch (error) {
    $("#audioNote").textContent =
      "AUDIO CHANNEL / TAP AGAIN TO CONNECT";
  }
}

async function requestMotionPermission() {
  try {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      const permission = await DeviceMotionEvent.requestPermission();

      if (permission !== "granted") {
        $("#statusText").textContent = "MOTION / MANUAL MODE";
      }
    }
  } catch {
    $("#statusText").textContent = "MOTION / MANUAL MODE";
  }
}

function onMotion(event) {
  if (currentMode !== "box") return;

  const acceleration = event.accelerationIncludingGravity;

  if (!acceleration) return;

  const x = acceleration.x || 0;
  const y = acceleration.y || 0;
  const z = acceleration.z || 0;

  const force = Math.sqrt(x * x + y * y + z * z);

  if (force > 20) {
    registerShake(Math.min(force / 16, 1.8));
  }
}

function onOrientation(event) {
  if (!selectedGroup || currentMode !== "box") return;

  const gamma = event.gamma || 0;
  const beta = event.beta || 0;

  selectedGroup.rotation.z += gamma * 0.0002;
  selectedGroup.rotation.x += beta * 0.00008;
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
  if (currentMode !== "vault") return;

  raycaster.setFromCamera(pointer, camera);

  const vault = scene.userData.vaultGroup;
  if (!vault) return;

  const meshes = [];

  vault.children.forEach((child) => {
    if (child.userData?.mesh) {
      meshes.push(child.userData.mesh);
    }
  });

  const intersections = raycaster.intersectObjects(meshes, false);

  if (intersections.length > 0) {
    const object = intersections[0].object;
    const group = object.parent;

    openTrack(group.userData.track, group.userData.index);
  }
}

function animateCameraTo(position) {
  const start = camera.position.clone();
  const target = new THREE.Vector3(
    position.x * 0.25,
    position.y + 0.6,
    position.z + 5
  );

  const startTime = performance.now();
  const duration = 900;

  function move() {
    const progress = Math.min(
      (performance.now() - startTime) / duration,
      1
    );

    const eased = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(start, target, eased);
    camera.lookAt(position);

    if (progress < 1) {
      requestAnimationFrame(move);
    }
  }

  move();
}

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  let low = 0;
  let mid = 0;
  let high = 0;

  if (analyser && frequencyData) {
    analyser.getByteFrequencyData(frequencyData);

    low = getFrequencyAverage(0, 12) / 255;
    mid = getFrequencyAverage(12, 80) / 255;
    high = getFrequencyAverage(80, 180) / 255;
  }

  animateIntroWave(time, low, mid, high);
  animateVault(time, low, mid, high);
  animateSelectedBox(time);

  controls.update();
  renderer.render(scene, camera);
}

function animateIntroWave(time, low, mid, high) {
  const lines = scene.userData.waveLines || [];

  lines.forEach((line, lineIndex) => {
    const positions = line.geometry.attributes.position.array;
    const basePoints = line.userData.basePoints;

    for (let i = 0; i < basePoints.length; i++) {
      const point = basePoints[i];
      const distance = Math.abs(point.x);

      const wave =
        Math.sin(point.x * 2.1 + time * 2.4 + lineIndex) *
        (0.16 + low * 0.85);

      positions[i * 3] = point.x;
      positions[i * 3 + 1] =
        point.y + wave * (1 - distance / 14) + mid * 0.08;
      positions[i * 3 + 2] =
        point.z + Math.cos(point.x * 1.7 + time) * high * 0.12;
    }

    line.geometry.attributes.position.needsUpdate = true;
  });
}

function animateVault(time, low, mid, high) {
  const group = scene.userData.vaultGroup;

  if (!group) return;

  group.rotation.y = Math.sin(time * 0.12) * 0.13;

  group.children.forEach((child, index) => {
    if (!child.userData?.track) return;

    const base = child.userData.basePosition;
    const velocity = child.userData.shakeVelocity || 0;

    child.position.y =
      base.y + Math.sin(time * 1.2 + index) * (0.08 + low * 0.15);

    child.rotation.y += 0.002 + mid * 0.003;

    if (velocity > 0) {
      child.rotation.z += velocity * 0.08;
      child.rotation.x += velocity * 0.05;
      child.userData.shakeVelocity *= 0.9;

      if (child.userData.shakeVelocity < 0.01) {
        child.userData.shakeVelocity = 0;
      }
    }

    const mesh = child.userData.mesh;
    mesh.material.emissiveIntensity = 0.1 + high * 0.9;
  });
}

function animateSelectedBox(time) {
  if (!selectedGroup || currentMode !== "box") return;

  const velocity = selectedGroup.userData.shakeVelocity || 0;

  selectedGroup.position.x += Math.sin(time * 30) * velocity * 0.018;
  selectedGroup.position.z += Math.cos(time * 34) * velocity * 0.012;

  selectedGroup.userData.shakeVelocity *= 0.91;
}

function getFrequencyAverage(start, end) {
  if (!frequencyData) return 0;

  let total = 0;
  let count = 0;

  for (let i = start; i < end && i < frequencyData.length; i++) {
    total += frequencyData[i];
    count++;
  }

  return count ? total / count : 0;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
